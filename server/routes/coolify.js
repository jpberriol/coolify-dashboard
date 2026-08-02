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
 * - Single Responsibility: Routes sadece routing'den sorumlu
 * - Open/Closed: Yeni resource tipleri config ile eklenebilir
 * - DRY: Factory pattern ile 346 satır → 55 satır (~84% azalma)
 * - Dependency Inversion: CoolifyApiClient abstraksiyonu
 */

const router = express.Router();

// Mount resource routers using factory pattern
// Her resource type için generic CRUD routes otomatik oluşturuluyor
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
