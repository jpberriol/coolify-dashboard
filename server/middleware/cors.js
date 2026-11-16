import cors from "cors";

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || "http://localhost:5173"
)
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const hostOf = (origin) => {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
};

/**
 * Browsers send an Origin header even on same-origin requests for assets
 * loaded with `crossorigin` (Vite's module scripts and stylesheets). The
 * previous version rejected any Origin missing from ALLOWED_ORIGINS with a
 * 500, which broke the whole UI whenever the site was opened through a URL
 * not listed there (another domain, http vs https, the sslip.io URL...).
 *
 * Same-origin requests are now always allowed; for anything else the CORS
 * headers are simply withheld, so the browser blocks it without a server
 * error.
 */
export const corsMiddleware = cors((req, callback) => {
  const origin = req.headers.origin;
  const sameOrigin = origin && hostOf(origin) === req.headers.host;
  const allowed =
    !origin || sameOrigin || allowedOrigins.includes(origin.replace(/\/+$/, ""));

  callback(null, { origin: allowed, credentials: true });
});
