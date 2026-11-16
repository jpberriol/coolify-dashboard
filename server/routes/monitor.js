import express from "express";
import { verifyToken } from "../middleware/auth.js";
import monitor from "../services/MonitorService.js";
import { getCoolifyClient } from "../services/CoolifyApiClient.js";

const router = express.Router();

const clampInt = (value, fallback, min, max) => {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
};

// Host metrics + active incidents + per-resource health badges.
router.get("/overview", verifyToken, (req, res) => {
  const minutes = clampInt(req.query.minutes, 60, 5, 120);
  res.json({
    status: monitor.getStatus(),
    host: monitor.getHost(minutes),
    incidents: monitor.getActiveIncidents(),
    health: monitor.getHealthSummary(),
  });
});

// Incident timeline (state changes, downtime, restarts, OOM, SSL, disk).
router.get("/events", verifyToken, (req, res) => {
  res.json(monitor.getEvents(clampInt(req.query.limit, 100, 1, 500)));
});

// History + health + SSL + container detail for a single resource.
router.get("/resource/:uuid", verifyToken, (req, res) => {
  const minutes = clampInt(req.query.minutes, 60, 5, 120);
  res.json(monitor.getResourceDetail(req.params.uuid, minutes));
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
