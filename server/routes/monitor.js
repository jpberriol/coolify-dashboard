import express from "express";
import { verifyToken } from "../middleware/auth.js";
import monitor, { RETENTION_DAYS } from "../services/MonitorService.js";
import { getCoolifyClient } from "../services/CoolifyApiClient.js";

const router = express.Router();

const clampInt = (value, fallback, min, max) => {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
};

const MAX_RANGE_MS = RETENTION_DAYS * 86400000;

/**
 * Range from the query string: either `minutes` (relative, ends now) or an
 * absolute `from`/`to` pair in epoch milliseconds. Capped to the retention
 * window (MONITOR_RETENTION_DAYS, default 90 days).
 */
const parseRange = (query) => {
  const now = Date.now();
  const from = Number(query.from);
  const to = Number(query.to);

  if (Number.isFinite(from) && Number.isFinite(to) && to > from) {
    const end = Math.min(to, now);
    return { from: Math.max(from, end - MAX_RANGE_MS), to: end };
  }
  const minutes = clampInt(query.minutes, 30, 1, MAX_RANGE_MS / 60000);
  return { from: now - minutes * 60000, to: now };
};

// Host metrics + usage per resource + active incidents + health badges.
router.get("/overview", verifyToken, (req, res) => {
  const range = parseRange(req.query);
  res.json({
    status: monitor.getStatus(),
    host: monitor.getHost(range),
    usage: monitor.getUsageSummary(range),
    incidents: monitor.getActiveIncidents(),
    health: monitor.getHealthSummary(),
  });
});

// Incident timeline (state changes, downtime, restarts, OOM, SSL, disk).
router.get("/events", verifyToken, (req, res) => {
  const hasRange = req.query.from || req.query.to || req.query.minutes;
  const range = hasRange ? parseRange(req.query) : {};
  res.json(
    monitor.getEvents({
      limit: clampInt(req.query.limit, 100, 1, 1000),
      from: range.from,
      to: range.to,
    })
  );
});

// History + health + SSL + container detail for a single resource.
router.get("/resource/:uuid", verifyToken, (req, res) => {
  res.json(monitor.getResourceDetail(req.params.uuid, parseRange(req.query)));
});

// Latest deployments of an application (Coolify API), without build logs.
router.get("/deployments/:uuid", verifyToken, async (req, res, next) => {
  try {
    const coolify = getCoolifyClient();
    const raw = await coolify.get(
      `/deployments/applications/${encodeURIComponent(req.params.uuid)}`
    );
    const list = Array.isArray(raw) ? raw : raw?.deployments || [];

    const deployments = list
      .map((d) => {
        const created = d.created_at ? new Date(d.created_at).getTime() : null;
        const updated = d.updated_at ? new Date(d.updated_at).getTime() : null;
        const finished = ["finished", "failed", "cancelled-by-user"].includes(
          d.status
        );
        return {
          uuid: d.deployment_uuid || d.uuid || String(d.id),
          status: d.status,
          commit: d.commit ? String(d.commit).slice(0, 7) : null,
          commitMessage: d.commit_message || null,
          createdAt: d.created_at || null,
          finishedAt: finished ? d.updated_at || null : null,
          durationSec:
            finished && created && updated
              ? Math.max(0, Math.round((updated - created) / 1000))
              : null,
          forceRebuild: Boolean(d.force_rebuild),
          isWebhook: Boolean(d.is_webhook),
          isApi: Boolean(d.is_api),
          pullRequestId: d.pull_request_id || null,
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    res.json(deployments);
  } catch (error) {
    next(error);
  }
});

export default router;
