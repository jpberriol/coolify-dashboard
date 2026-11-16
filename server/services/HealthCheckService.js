import tls from "tls";

const HTTP_TIMEOUT_MS = 8000;
const TLS_TIMEOUT_MS = 6000;

/**
 * Splits a Coolify fqdn field ("https://a.com,https://b.com") into URLs and
 * keeps only http(s) ones.
 */
export const parseUrls = (fqdn) => {
  if (!fqdn || typeof fqdn !== "string") return [];
  return fqdn
    .split(/[,\s]+/)
    .map((u) => u.trim())
    .filter(Boolean)
    .map((u) => (/^https?:\/\//i.test(u) ? u : `https://${u}`))
    .filter((u) => {
      try {
        new URL(u);
        return true;
      } catch {
        return false;
      }
    });
};

/**
 * Probes a public URL. A resource counts as "up" when the server answers
 * with anything below 500 (a 401/403/404 still proves the app is serving),
 * so a container that is "running" but behind a 502/503/504 is flagged.
 */
export const checkHttp = async (url) => {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: { "User-Agent": "coolify-dashboard-healthcheck" },
    });
    // Drain/cancel the body so the socket is released.
    res.body?.cancel?.().catch(() => {});
    return {
      ok: res.status < 500,
      status: res.status,
      latencyMs: Date.now() - started,
      error: null,
      checkedAt: Date.now(),
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      latencyMs: Date.now() - started,
      error:
        error.name === "AbortError"
          ? "timeout"
          : error.cause?.code || error.message || "request failed",
      checkedAt: Date.now(),
    };
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Reads the TLS certificate of a host and returns days until it expires.
 */
export const checkCertificate = (host, port = 443) =>
  new Promise((resolve) => {
    let settled = false;
    const done = (value) => {
      if (settled) return;
      settled = true;
      resolve({ host, checkedAt: Date.now(), ...value });
    };

    const socket = tls.connect(
      { host, port, servername: host, rejectUnauthorized: false },
      () => {
        const cert = socket.getPeerCertificate();
        const authorized = socket.authorized;
        socket.end();
        if (!cert || !cert.valid_to) {
          done({ ok: false, error: "no certificate" });
          return;
        }
        const validTo = new Date(cert.valid_to).getTime();
        done({
          ok: true,
          validTo,
          daysLeft: Math.floor((validTo - Date.now()) / 86400000),
          issuer: cert.issuer?.O || cert.issuer?.CN || null,
          authorized,
        });
      }
    );

    socket.setTimeout(TLS_TIMEOUT_MS, () => {
      socket.destroy();
      done({ ok: false, error: "timeout" });
    });
    socket.on("error", (e) => done({ ok: false, error: e.code || e.message }));
  });
