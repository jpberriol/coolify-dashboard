import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import {
  docker,
  PROJECT_LABEL,
  readContainerStats,
} from "./DockerStatsService.js";
import { getCoolifyClient } from "./CoolifyApiClient.js";
import { checkHttp, checkCertificate, parseUrls } from "./HealthCheckService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const num = (name, fallback) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};

const STATS_INTERVAL_MS = num("MONITOR_STATS_INTERVAL_MS", 10000);
const RESOURCES_INTERVAL_MS = num("MONITOR_RESOURCES_INTERVAL_MS", 30000);
const HEALTH_INTERVAL_MS = num("MONITOR_HEALTH_INTERVAL_MS", 30000);
const SSL_INTERVAL_MS = 60 * 60 * 1000;
const HISTORY_POINTS = num("MONITOR_HISTORY_POINTS", 720); // 2h @ 10s
const HEALTH_HISTORY = 120;
const MAX_EVENTS = 500;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "../data");
const EVENTS_FILE = path.join(DATA_DIR, "monitor-events.json");

const SSL_WARN_DAYS = 14;
const SSL_CRIT_DAYS = 3;
const USAGE_WARN_PERCENT = 90;
const RESTART_WINDOW_MS = 15 * 60 * 1000;
const OOM_WINDOW_MS = 60 * 60 * 1000;

const mainStatus = (status) =>
  String(status || "")
    .toLowerCase()
    .split(":")[0];

const statusSeverity = (status) => {
  const s = String(status || "").toLowerCase();
  const main = mainStatus(s);
  if (/unhealthy|degraded|error|failed|dead|restarting/.test(s)) return "critical";
  if (["exited", "stopped"].includes(main)) return "warning";
  return null;
};

const isDashboardSelf = (name) => (name || "").toLowerCase().includes("dashboard");

class MonitorService {
  constructor() {
    this.timers = [];
    this.running = false;
    this.busy = { stats: false, resources: false, health: false, ssl: false };

    this.resources = new Map(); // uuid -> {uuid,name,type,status,urls}
    this.resourcesLoaded = false;
    this.containers = new Map(); // uuid -> snapshot from docker
    this.dockerOk = null;
    this.prevCounters = new Map(); // containerId -> {t, rx, tx, br, bw}
    this.containerState = new Map(); // containerId -> {restarts, oom}
    this.statsBaseline = false;

    this.history = new Map(); // uuid -> samples[]
    this.hostHistory = [];
    this.host = null;
    this.prevCpu = null;

    this.health = new Map(); // uuid -> {url, last, history[], failStreak, up}
    this.ssl = new Map(); // host -> result
    this.sslAlerted = new Map(); // host -> 'warn'|'crit'

    this.events = this._loadEvents();
    this.diskAlerted = null;
    this._saveTimer = null;
  }

  /* ----------------------------- lifecycle ----------------------------- */

  start() {
    if (this.running) return;
    this.running = true;

    const loop = (key, fn, ms) => {
      const tick = async () => {
        if (this.busy[key]) return;
        this.busy[key] = true;
        try {
          await fn.call(this);
        } catch (error) {
          console.warn(`[monitor] ${key} cycle failed:`, error.message);
        } finally {
          this.busy[key] = false;
        }
      };
      tick();
      const timer = setInterval(tick, ms);
      timer.unref?.();
      this.timers.push(timer);
    };

    loop("resources", this._refreshResources, RESOURCES_INTERVAL_MS);
    loop("stats", this._collectStats, STATS_INTERVAL_MS);
    loop("health", this._runHealthChecks, HEALTH_INTERVAL_MS);
    loop("ssl", this._runSslChecks, SSL_INTERVAL_MS);
  }

  stop() {
    this.timers.forEach(clearInterval);
    this.timers = [];
    this.running = false;
  }

  /* ------------------------------- events ------------------------------ */

  _loadEvents() {
    try {
      if (fs.existsSync(EVENTS_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(EVENTS_FILE, "utf8"));
        if (Array.isArray(parsed)) return parsed.slice(0, MAX_EVENTS);
      }
    } catch (error) {
      console.warn("[monitor] could not load events:", error.message);
    }
    return [];
  }

  _scheduleSave() {
    if (this._saveTimer) return;
    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(EVENTS_FILE, JSON.stringify(this.events));
      } catch (error) {
        console.warn("[monitor] could not persist events:", error.message);
      }
    }, 2000);
    this._saveTimer.unref?.();
  }

  _emit(kind, severity, resource, data = {}) {
    this.events.unshift({
      id: crypto.randomUUID(),
      ts: Date.now(),
      kind,
      severity,
      uuid: resource?.uuid || null,
      name: resource?.name || null,
      type: resource?.type || null,
      data,
    });
    if (this.events.length > MAX_EVENTS) this.events.length = MAX_EVENTS;
    this._scheduleSave();
  }

  /* ------------------- Coolify resources (status/urls) ------------------ */

  async _refreshResources() {
    const coolify = getCoolifyClient();
    const [apps, services, dbs] = await Promise.all([
      coolify.get("/applications").catch(() => null),
      coolify.get("/services").catch(() => null),
      coolify.get("/databases").catch(() => null),
    ]);

    const next = new Map();
    const add = (list, type, urlsOf) => {
      for (const r of list || []) {
        if (!r?.uuid || isDashboardSelf(r.name)) continue;
        next.set(r.uuid, {
          uuid: r.uuid,
          name: r.name,
          type,
          status: r.status || r.applications?.[0]?.status || "",
          urls: urlsOf(r),
        });
      }
    };

    add(apps, "application", (r) => parseUrls(r.fqdn));
    add(services, "service", (r) => {
      const urls = [];
      for (const a of r.applications || []) urls.push(...parseUrls(a.fqdn));
      urls.push(...parseUrls(r.fqdn));
      return [...new Set(urls)];
    });
    add(dbs, "database", () => []);

    // If everything failed, keep what we had instead of wiping state.
    if (!apps && !services && !dbs) return;

    if (this.resourcesLoaded) {
      for (const [uuid, r] of next) {
        const prev = this.resources.get(uuid);
        if (!prev || prev.status === r.status) continue;
        const sev = statusSeverity(r.status);
        const prevSev = statusSeverity(prev.status);
        if (sev) {
          this._emit("status_change", sev, r, { from: prev.status, to: r.status });
        } else if (prevSev) {
          this._emit("status_change", "info", r, { from: prev.status, to: r.status });
        }
      }
    }

    this.resources = next;
    this.resourcesLoaded = true;
    for (const uuid of [...this.health.keys()]) {
      if (!next.has(uuid)) this.health.delete(uuid);
    }
  }

  /* ----------------------- Docker stats + host metrics ------------------ */

  async _collectStats() {
    await this._collectHost();

    let list;
    try {
      list = await docker.listContainers({ all: true });
      this.dockerOk = true;
    } catch (error) {
      if (this.dockerOk !== false) {
        console.warn("[monitor] Docker socket unavailable:", error.message);
      }
      this.dockerOk = false;
      return;
    }

    const now = Date.now();
    const byProject = new Map();
    for (const c of list) {
      const project = c.Labels?.[PROJECT_LABEL];
      if (!project) continue;
      if (!byProject.has(project)) byProject.set(project, []);
      byProject.get(project).push(c);
    }

    const details = await Promise.all(
      [...byProject.values()].flat().map(async (c) => {
        const detail = { info: c, stats: null, inspect: null };
        try {
          detail.inspect = await docker.getContainer(c.Id).inspect();
        } catch {
          /* container vanished */
        }
        if (c.State === "running") {
          try {
            detail.stats = await readContainerStats(c);
          } catch {
            /* ignore */
          }
        }
        return [c.Id, detail];
      })
    );
    const detailById = new Map(details);

    const seenContainers = new Set();
    const nextSnapshots = new Map();

    for (const [uuid, group] of byProject) {
      const sample = {
        t: now,
        cpu: 0,
        mem: 0,
        memPct: 0,
        rx: 0,
        tx: 0,
        br: 0,
        bw: 0,
      };
      const snapshot = {
        uuid,
        containers: [],
        restarts: 0,
        oomKilled: false,
        running: 0,
        total: group.length,
        hasStats: false,
      };

      for (const c of group) {
        const d = detailById.get(c.Id);
        seenContainers.add(c.Id);
        const restarts = d?.inspect?.RestartCount ?? 0;
        const oom = Boolean(d?.inspect?.State?.OOMKilled);
        snapshot.restarts += restarts;
        snapshot.oomKilled ||= oom;
        if (c.State === "running") snapshot.running += 1;

        const resource = this.resources.get(uuid) || { uuid, name: uuid };
        const prevState = this.containerState.get(c.Id);
        if (this.statsBaseline && prevState && !isDashboardSelf(resource.name)) {
          if (restarts > prevState.restarts) {
            this._emit("restart", "warning", resource, {
              container: (c.Names?.[0] || "").replace(/^\//, ""),
              count: restarts,
              delta: restarts - prevState.restarts,
            });
          }
          if (oom && !prevState.oom) {
            this._emit("oom", "critical", resource, {
              container: (c.Names?.[0] || "").replace(/^\//, ""),
            });
          }
        }
        this.containerState.set(c.Id, { restarts, oom });

        const s = d?.stats;
        const contInfo = {
          containerId: c.Id.slice(0, 12),
          name: (c.Names?.[0] || c.Id).replace(/^\//, ""),
          state: c.State,
          health: d?.inspect?.State?.Health?.Status || null,
          restartCount: restarts,
          oomKilled: oom,
          startedAt: d?.inspect?.State?.StartedAt || null,
        };

        if (s) {
          snapshot.hasStats = true;
          Object.assign(contInfo, {
            cpuPercent: s.cpuPercent,
            memUsageBytes: s.memUsageBytes,
            memLimitBytes: s.memLimitBytes,
            memPercent: s.memPercent,
          });
          sample.cpu += s.cpuPercent;
          sample.mem += s.memUsageBytes;
          sample.memPct = Math.max(sample.memPct, s.memPercent);

          const prev = this.prevCounters.get(c.Id);
          if (prev && now > prev.t) {
            const dt = (now - prev.t) / 1000;
            const rate = (cur, old) => Math.max(0, (cur - old) / dt);
            sample.rx += rate(s.netRxBytes, prev.rx);
            sample.tx += rate(s.netTxBytes, prev.tx);
            sample.br += rate(s.blkReadBytes, prev.br);
            sample.bw += rate(s.blkWriteBytes, prev.bw);
          }
          this.prevCounters.set(c.Id, {
            t: now,
            rx: s.netRxBytes,
            tx: s.netTxBytes,
            br: s.blkReadBytes,
            bw: s.blkWriteBytes,
          });
        }
        snapshot.containers.push(contInfo);
      }

      nextSnapshots.set(uuid, snapshot);

      if (snapshot.hasStats) {
        const round = (v) => Math.round(v * 10) / 10;
        this._push(this.history, uuid, {
          ...sample,
          cpu: round(sample.cpu),
          memPct: round(sample.memPct),
          rx: Math.round(sample.rx),
          tx: Math.round(sample.tx),
          br: Math.round(sample.br),
          bw: Math.round(sample.bw),
        });
      }
    }

    // Drop bookkeeping for containers that no longer exist.
    for (const id of this.containerState.keys()) {
      if (!seenContainers.has(id)) {
        this.containerState.delete(id);
        this.prevCounters.delete(id);
      }
    }

    this.containers = nextSnapshots;
    this.statsBaseline = true;
  }

  _push(map, key, sample) {
    let arr = map.get(key);
    if (!arr) {
      arr = [];
      map.set(key, arr);
    }
    arr.push(sample);
    if (arr.length > HISTORY_POINTS) arr.splice(0, arr.length - HISTORY_POINTS);
  }

  async _collectHost() {
    const now = Date.now();

    // CPU from /proc/stat (host-wide, readable from inside a container).
    let cpuPercent = null;
    try {
      const line = fs.readFileSync("/proc/stat", "utf8").split("\n")[0];
      const parts = line.trim().split(/\s+/).slice(1).map(Number);
      const idle = (parts[3] || 0) + (parts[4] || 0);
      const total = parts.reduce((a, b) => a + b, 0);
      if (this.prevCpu) {
        const dTotal = total - this.prevCpu.total;
        const dIdle = idle - this.prevCpu.idle;
        if (dTotal > 0) cpuPercent = Math.round((1 - dIdle / dTotal) * 1000) / 10;
      }
      this.prevCpu = { total, idle };
    } catch {
      /* non-linux */
    }

    // Memory from /proc/meminfo (MemAvailable is the honest "free").
    let memTotal = os.totalmem();
    let memAvailable = os.freemem();
    try {
      const info = fs.readFileSync("/proc/meminfo", "utf8");
      const t = info.match(/MemTotal:\s+(\d+)/);
      const a = info.match(/MemAvailable:\s+(\d+)/);
      if (t) memTotal = Number(t[1]) * 1024;
      if (a) memAvailable = Number(a[1]) * 1024;
    } catch {
      /* fall back to os.* */
    }
    const memUsed = memTotal - memAvailable;

    // Disk: statfs on the path that backs Docker's data.
    let disk = null;
    try {
      const st = await fs.promises.statfs(process.env.HOST_DISK_PATH || "/");
      const total = st.blocks * st.bsize;
      const free = st.bavail * st.bsize;
      disk = {
        totalBytes: total,
        usedBytes: total - free,
        percent: total ? Math.round(((total - free) / total) * 1000) / 10 : 0,
      };
    } catch {
      /* statfs unsupported */
    }

    this.host = {
      hostname: os.hostname(),
      cpuCount: os.cpus().length,
      cpuPercent,
      load: os.loadavg(),
      uptimeSec: Math.floor(os.uptime()),
      memTotalBytes: memTotal,
      memUsedBytes: memUsed,
      memPercent: memTotal ? Math.round((memUsed / memTotal) * 1000) / 10 : 0,
      disk,
      updatedAt: now,
    };

    this.hostHistory.push({
      t: now,
      cpu: cpuPercent ?? 0,
      mem: this.host.memPercent,
      disk: disk?.percent ?? 0,
    });
    if (this.hostHistory.length > HISTORY_POINTS) {
      this.hostHistory.splice(0, this.hostHistory.length - HISTORY_POINTS);
    }

    if (disk) {
      const level = disk.percent >= 90 ? "crit" : disk.percent >= 80 ? "warn" : null;
      if (level && this.diskAlerted !== level) {
        this._emit("host_disk", level === "crit" ? "critical" : "warning", null, {
          percent: disk.percent,
        });
      }
      this.diskAlerted = level;
    }
  }

  /* ------------------------ health checks + SSL ------------------------- */

  async _runHealthChecks() {
    const targets = [...this.resources.values()].filter(
      (r) => r.urls.length > 0 && mainStatus(r.status) === "running"
    );

    // Resources that are not running have no meaningful probe result.
    for (const uuid of [...this.health.keys()]) {
      const r = this.resources.get(uuid);
      if (!r || mainStatus(r.status) !== "running") this.health.delete(uuid);
    }

    await Promise.all(
      targets.map(async (r) => {
        const url = r.urls[0];
        const result = await checkHttp(url);
        let h = this.health.get(r.uuid);
        if (!h) {
          h = { url, last: null, history: [], failStreak: 0, up: null };
          this.health.set(r.uuid, h);
        }
        h.url = url;
        h.last = result;
        h.history.push({ t: result.checkedAt, ok: result.ok, ms: result.latencyMs });
        if (h.history.length > HEALTH_HISTORY) h.history.shift();

        if (result.ok) {
          h.failStreak = 0;
          if (h.up === false) {
            this._emit("recovered", "info", r, { url, latencyMs: result.latencyMs });
          }
          h.up = true;
        } else {
          h.failStreak += 1;
          // Require two consecutive failures to avoid flapping alerts.
          if (h.failStreak >= 2 && h.up !== false) {
            this._emit("down", "critical", r, {
              url,
              status: result.status,
              error: result.error,
            });
            h.up = false;
          }
        }
      })
    );
  }

  async _runSslChecks() {
    const hosts = new Map(); // host -> resource
    for (const r of this.resources.values()) {
      for (const u of r.urls) {
        try {
          const url = new URL(u);
          if (url.protocol === "https:" && !hosts.has(url.hostname)) {
            hosts.set(url.hostname, r);
          }
        } catch {
          /* ignore */
        }
      }
    }

    await Promise.all(
      [...hosts].map(async ([host, resource]) => {
        const result = await checkCertificate(host);
        this.ssl.set(host, result);
        if (!result.ok) return;

        const level =
          result.daysLeft <= SSL_CRIT_DAYS
            ? "crit"
            : result.daysLeft <= SSL_WARN_DAYS
              ? "warn"
              : null;
        if (level && this.sslAlerted.get(host) !== level) {
          this._emit("ssl_expiring", level === "crit" ? "critical" : "warning", resource, {
            host,
            daysLeft: result.daysLeft,
          });
        }
        if (level) this.sslAlerted.set(host, level);
        else this.sslAlerted.delete(host);
      })
    );
    for (const host of [...this.ssl.keys()]) {
      if (!hosts.has(host)) this.ssl.delete(host);
    }
  }

  /* ------------------------------- queries ------------------------------ */

  _downsample(samples, maxPoints, keys) {
    if (samples.length <= maxPoints) return samples;
    const size = Math.ceil(samples.length / maxPoints);
    const out = [];
    for (let i = 0; i < samples.length; i += size) {
      const bucket = samples.slice(i, i + size);
      const avg = { t: bucket[bucket.length - 1].t };
      for (const k of keys) {
        avg[k] = Math.round((bucket.reduce((a, s) => a + s[k], 0) / bucket.length) * 10) / 10;
      }
      out.push(avg);
    }
    return out;
  }

  _slice(samples, minutes) {
    const since = Date.now() - minutes * 60000;
    return samples.filter((s) => s.t >= since);
  }

  getResourceDetail(uuid, minutes = 60) {
    const samples = this._slice(this.history.get(uuid) || [], minutes);
    const h = this.health.get(uuid);
    const resource = this.resources.get(uuid);
    const urls = resource?.urls || [];

    let uptimePercent = null;
    if (h?.history.length) {
      const ok = h.history.filter((x) => x.ok).length;
      uptimePercent = Math.round((ok / h.history.length) * 1000) / 10;
    }

    const certs = [];
    for (const u of urls) {
      try {
        const host = new URL(u).hostname;
        const c = this.ssl.get(host);
        if (c && !certs.some((x) => x.host === host)) certs.push(c);
      } catch {
        /* ignore */
      }
    }

    return {
      intervalSec: STATS_INTERVAL_MS / 1000,
      history: this._downsample(samples, 120, ["cpu", "mem", "memPct", "rx", "tx", "br", "bw"]),
      container: this.containers.get(uuid) || null,
      health: h
        ? {
            url: h.url,
            up: h.up,
            last: h.last,
            uptimePercent,
            checks: h.history.length,
            recent: h.history.slice(-30),
          }
        : null,
      ssl: certs,
    };
  }

  getHost(minutes = 60) {
    return {
      current: this.host,
      intervalSec: STATS_INTERVAL_MS / 1000,
      history: this._downsample(this._slice(this.hostHistory, minutes), 120, [
        "cpu",
        "mem",
        "disk",
      ]),
    };
  }

  getEvents(limit = 100) {
    return this.events.slice(0, limit);
  }

  getActiveIncidents() {
    const now = Date.now();
    const out = [];
    const lastEvent = (uuid, kinds) =>
      this.events.find((e) => e.uuid === uuid && kinds.includes(e.kind));

    for (const r of this.resources.values()) {
      const sev = statusSeverity(r.status);
      if (sev) {
        out.push({
          id: `status:${r.uuid}`,
          uuid: r.uuid,
          name: r.name,
          type: r.type,
          kind: "status",
          severity: sev,
          since: lastEvent(r.uuid, ["status_change"])?.ts || null,
          data: { status: r.status },
        });
      }

      const h = this.health.get(r.uuid);
      if (h?.up === false) {
        out.push({
          id: `down:${r.uuid}`,
          uuid: r.uuid,
          name: r.name,
          type: r.type,
          kind: "down",
          severity: "critical",
          since: lastEvent(r.uuid, ["down"])?.ts || null,
          data: { url: h.url, status: h.last?.status, error: h.last?.error },
        });
      }

      const recent = (this.history.get(r.uuid) || []).slice(-3);
      if (recent.length === 3) {
        const cpu = recent.reduce((a, s) => a + s.cpu, 0) / 3;
        const mem = recent.reduce((a, s) => a + s.memPct, 0) / 3;
        if (mem >= USAGE_WARN_PERCENT) {
          out.push({
            id: `mem:${r.uuid}`, uuid: r.uuid, name: r.name, type: r.type,
            kind: "high_memory", severity: "warning", since: null,
            data: { percent: Math.round(mem * 10) / 10 },
          });
        }
        const cpuLimit = (os.cpus().length || 1) * 100;
        if (cpu >= cpuLimit * (USAGE_WARN_PERCENT / 100)) {
          out.push({
            id: `cpu:${r.uuid}`, uuid: r.uuid, name: r.name, type: r.type,
            kind: "high_cpu", severity: "warning", since: null,
            data: { percent: Math.round(cpu * 10) / 10 },
          });
        }
      }

      const restart = lastEvent(r.uuid, ["restart"]);
      if (restart && now - restart.ts < RESTART_WINDOW_MS) {
        out.push({
          id: `restart:${r.uuid}`, uuid: r.uuid, name: r.name, type: r.type,
          kind: "restart", severity: "warning", since: restart.ts,
          data: restart.data,
        });
      }
      const oom = lastEvent(r.uuid, ["oom"]);
      if (oom && now - oom.ts < OOM_WINDOW_MS) {
        out.push({
          id: `oom:${r.uuid}`, uuid: r.uuid, name: r.name, type: r.type,
          kind: "oom", severity: "critical", since: oom.ts, data: oom.data,
        });
      }
    }

    for (const [host, cert] of this.ssl) {
      if (!cert.ok || cert.daysLeft > SSL_WARN_DAYS) continue;
      const resource = [...this.resources.values()].find((r) =>
        r.urls.some((u) => {
          try {
            return new URL(u).hostname === host;
          } catch {
            return false;
          }
        })
      );
      out.push({
        id: `ssl:${host}`,
        uuid: resource?.uuid || null,
        name: resource?.name || host,
        type: resource?.type || null,
        kind: "ssl_expiring",
        severity: cert.daysLeft <= SSL_CRIT_DAYS ? "critical" : "warning",
        since: null,
        data: { host, daysLeft: cert.daysLeft },
      });
    }

    const disk = this.host?.disk;
    if (disk && disk.percent >= 80) {
      out.push({
        id: "host:disk", uuid: null, name: this.host.hostname, type: "host",
        kind: "host_disk", severity: disk.percent >= 90 ? "critical" : "warning",
        since: null, data: { percent: disk.percent },
      });
    }
    if (this.host && this.host.memPercent >= USAGE_WARN_PERCENT) {
      out.push({
        id: "host:mem", uuid: null, name: this.host.hostname, type: "host",
        kind: "host_memory", severity: "warning", since: null,
        data: { percent: this.host.memPercent },
      });
    }

    const rank = { critical: 0, warning: 1, info: 2 };
    return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
  }

  /** Light summary per resource, used to badge the list without N requests. */
  getHealthSummary() {
    const summary = {};
    for (const [uuid, h] of this.health) {
      summary[uuid] = {
        up: h.up,
        status: h.last?.status ?? null,
        latencyMs: h.last?.latencyMs ?? null,
      };
    }
    return summary;
  }

  getStatus() {
    return {
      dockerAvailable: this.dockerOk,
      resourcesLoaded: this.resourcesLoaded,
      running: this.running,
    };
  }
}

export default new MonitorService();
