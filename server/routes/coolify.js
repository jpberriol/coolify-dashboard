import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  createResourceRouter,
  RESOURCE_CONFIGS,
} from "../factories/ResourceRouterFactory.js";
import { getResourceStats } from "../services/DockerStatsService.js";

/**
 * Coolify API Routes
 *
 * Refactored with SOLID principles:
 * - Single Responsibility: routes only handle routing
 * - Open/Closed: new resource types can be added via config
 * - DRY: factory pattern: 346 lines → 55 lines (~84% less)
 * - Dependency Inversion: CoolifyApiClient abstraction
 */

const router = express.Router();

// Mount resource routers using factory pattern
// Generic CRUD routes are generated automatically for each resource type
router.use("/", createResourceRouter("applications", RESOURCE_CONFIGS.applications));
router.use("/", createResourceRouter("services", RESOURCE_CONFIGS.services));
router.use("/", createResourceRouter("databases", RESOURCE_CONFIGS.databases));

// Live CPU/RAM usage, read straight from the Docker socket (Coolify's own
// API only exposes configured limits, never actual consumption).
router.get("/stats/:uuid", verifyToken, async (req, res, next) => {
  try {
    const data = await getResourceStats(req.params.uuid);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
