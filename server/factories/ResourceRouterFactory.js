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
 * Database credentials are never sent to the browser: passwords
 * (postgres_password, redis_password, ...) and connection strings
 * (internal_db_url, external_db_url, which embed the password) are dropped.
 */
const stripDatabaseSecrets = (list) =>
  Array.isArray(list)
    ? list.map((db) =>
        Object.fromEntries(
          Object.entries(db).filter(([key]) => !/password|_db_url$/i.test(key))
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
    enableRedeploy = false,
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

  // POST: Redeploy (pull the latest code and deploy again). Applications only.
  if (enableRedeploy) {
    router.post(
      `/${resourceType}/:uuid/redeploy`,
      verifyToken,
      checkAdminPermission,
      async (req, res, next) => {
        try {
          const uuid = encodeURIComponent(req.params.uuid);
          // Coolify's deploy endpoint queues a new deployment of the resource.
          // Newer versions require POST (GET answers "endpoint has changed to
          // a POST request"); uuid/force are sent as query and body.
          const data = await coolify.post(`/deploy?uuid=${uuid}&force=false`, {
            uuid: req.params.uuid,
            force: false,
          });
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
    enableRedeploy: true,
    enableLogs: true,
  },
  services: {
    enableList: true,
    enableStart: true,
    enableStop: true,
    enableRestart: true,
    enableLogs: false,
  },
  databases: {
    enableList: true,
    enableStart: true,
    enableStop: true,
    enableRestart: true,
    enableLogs: false,
  },
};
