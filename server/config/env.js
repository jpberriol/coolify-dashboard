import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Must be the first import of index.js: other modules read process.env while
// they are being loaded.
dotenv.config();

const REQUIRED = [
  ["ADMIN_USERNAME", "Dashboard login username"],
  ["ADMIN_PASSWORD", "Dashboard login password"],
  ["JWT_SECRET", "Secret used to sign login tokens (use `openssl rand -hex 48`)"],
  ["COOLIFY_BASE_URL", "Base URL of your Coolify, e.g. https://coolify.example.com"],
  ["COOLIFY_TOKEN", "Coolify API token (read, read:sensitive; write + deploy for admin mode)"],
];

const env = process.env;
const missing = REQUIRED.filter(([name]) => !env[name] || !env[name].trim());

if (missing.length) {
  console.error("\n[config] Missing required environment variables:");
  for (const [name, help] of missing) console.error(`  - ${name}: ${help}`);
  console.error("\nSet them in Coolify (Environment Variables) or in server/.env, then redeploy.\n");
  process.exit(1);
}

// Accept "https://coolify.example.com/", ".../api" or ".../api/v1" as base URL.
env.COOLIFY_BASE_URL = env.COOLIFY_BASE_URL.trim()
  .replace(/\/+$/, "")
  .replace(/\/api(\/v1)?$/i, "");

if (!/^https?:\/\//i.test(env.COOLIFY_BASE_URL)) {
  console.error(
    `[config] COOLIFY_BASE_URL must start with http:// or https:// (got "${env.COOLIFY_BASE_URL}")`
  );
  process.exit(1);
}

const warn = (msg) => console.warn(`[config] WARNING: ${msg}`);

if (env.JWT_SECRET.length < 32) {
  warn("JWT_SECRET is shorter than 32 characters; use a long random value.");
}
if (env.ADMIN_PASSWORD.length < 12) {
  warn("ADMIN_PASSWORD is shorter than 12 characters; this is the only protection of the dashboard.");
}

const userType = (env.DASHBOARD_USER_TYPE || "viewer").toLowerCase();
if (!["admin", "viewer"].includes(userType)) {
  warn(`DASHBOARD_USER_TYPE="${env.DASHBOARD_USER_TYPE}" is not valid; falling back to "viewer".`);
  env.DASHBOARD_USER_TYPE = "viewer";
}

// Live usage, history and host metrics all come from the Docker socket.
if (!fs.existsSync("/var/run/docker.sock")) {
  warn(
    "/var/run/docker.sock is not mounted: live CPU/RAM, history, restarts and host metrics will be empty."
  );
}

// Monitoring history and events are persisted here; without a volume they are lost on redeploy.
const dataDir =
  env.DATA_DIR ||
  path.join(path.dirname(fileURLToPath(import.meta.url)), "../data");
try {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.accessSync(dataDir, fs.constants.W_OK);
} catch {
  warn(`DATA_DIR (${dataDir}) is not writable: monitoring history will not be persisted.`);
}
