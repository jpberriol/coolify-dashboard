import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { checkAdminPermission } from "../middleware/adminCheck.js";
import { getCoolifyClient } from "../services/CoolifyApiClient.js";

/**
 * ResourceRouterFactory - Generic CRUD routes factory for Coolify resources
 *
 * SOLID Principles:
 * - Single Responsibility: only responsible for building routes
 * - Open/Closed: Yeni resource tipleri config ile eklenebilir
 * - DRY: avoids code repetition (346 lines → ~100 lines)
 *
 * @param {string} resourceType - Resource tipi (applications, services, databases)
 * @param {object} options - Route configuration options
 * @returns {express.Router} Configured express router
 */
/**
 * Database credentials are never sent to the browser: any field whose name
 * contains "password" (postgres_password, redis_password, ...) is dropped.
 */
const stripDatabaseSecrets = (list) =>
  Array.isArray(list)
    ? list.map((db) =>
        Object.fromEntries(
          Object.entries(db).filter(([key]) => !/password/i.test(key))
        )
      )
    : list;

export const createResourceRouter = (resourceType, options = {}) => {
  const router = express.Router();
  const coolify = getCoolifyClient();

  const {
    enableList = true,
    enableStart = true,
    enableStop = true,
    enableRestart = true,
    enableDelete = true,
    enableLogs = false,
  } = options;

  // GET: List all resources
  if (enableList) {
    router.get(
      `/${resourceType}`,
      verifyToken,
      async (req, res, next) => {
        try {
          const data = await coolify.get(`/${resourceType}`);
          res.json(resourceType === "databases" ? stripDatabaseSecrets(data) : data);
        } catch (error) {
          next(error);
        }
      }
    );
  }

  // POST: Start resource
  if (enableStart) {
    router.post(
      `/${resourceType}/:uuid/start`,
      verifyToken,
      checkAdminPermission,
      async (req, res, next) => {
        try {
          const { uuid } = req.params;
          const data = await coolify.post(`/${resourceType}/${uuid}/start`);
          res.json(data);
        } catch (error) {
          next(error);
        }
      }
    );
  }

  // POST: Stop resource
  if (enableStop) {
    router.post(
      `/${resourceType}/:uuid/stop`,
      verifyToken,
      checkAdminPermission,
      async (req, res, next) => {
        try {
          const { uuid } = req.params;
          const data = await coolify.post(`/${resourceType}/${uuid}/stop`);
          res.json(data);
        } catch (error) {
          next(error);
        }
      }
    );
  }

  // POST: Restart resource
  if (enableRestart) {
    router.post(
      `/${resourceType}/:uuid/restart`,
      verifyToken,
      checkAdminPermission,
      async (req, res, next) => {
        try {
          const { uuid } = req.params;
          const data = await coolify.post(`/${resourceType}/${uuid}/restart`);
          res.json(data);
        } catch (error) {
          next(error);
        }
      }
    );
  }

  // DELETE: Delete resource
  if (enableDelete) {
    router.delete(
      `/${resourceType}/:uuid`,
      verifyToken,
      checkAdminPermission,
      async (req, res, next) => {
        try {
          const { uuid } = req.params;
          const data = await coolify.delete(`/${resourceType}/${uuid}`);
          res.json(data);
        } catch (error) {
          next(error);
        }
      }
    );
  }

  // GET: Fetch logs (optional, only for some resources)
  if (enableLogs) {
    router.get(
      `/${resourceType}/:uuid/logs`,
      verifyToken,
      checkAdminPermission,
      async (req, res, next) => {
        try {
          const { uuid } = req.params;
          const data = await coolify.get(`/${resourceType}/${uuid}/logs`);
          res.json(data);
        } catch (error) {
          next(error);
        }
      }
    );
  }

  return router;
};

/**
 * Resource configuration map
 * This configuration makes adding new resource types easy (Open/Closed Principle)
 */
export const RESOURCE_CONFIGS = {
  applications: {
    enableList: true,
    enableStart: true,
    enableStop: true,
    enableRestart: true,
    enableDelete: true,
    enableLogs: true,
  },
  services: {
    enableList: true,
    enableStart: true,
    enableStop: true,
    enableRestart: true,
    enableDelete: true,
    enableLogs: false,
  },
  databases: {
    enableList: true,
    enableStart: true,
    enableStop: true,
    enableRestart: true,
    enableDelete: true,
    enableLogs: false,
  },
};
