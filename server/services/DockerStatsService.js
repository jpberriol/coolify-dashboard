import Docker from "dockerode";
import { AppError } from "../utils/errorHandler.js";

const docker = new Docker({ socketPath: "/var/run/docker.sock" });

/**
 * Coolify tags every container it manages with one of these labels,
 * set to the resource's internal numeric id (not its uuid).
 * See bootstrap/helpers/docker.php in coollabsio/coolify.
 */
const LABEL_BY_TYPE = {
  application: "coolify.applicationId",
  service: "coolify.serviceId",
  database: "coolify.databaseId",
};

const calcCpuPercent = (stats) => {
  const cpuDelta =
    stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta =
    stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
  const cpuCount =
    stats.cpu_stats.online_cpus ||
    (stats.cpu_stats.cpu_usage.percpu_usage || []).length ||
    1;

  if (systemDelta > 0 && cpuDelta > 0) {
    return (cpuDelta / systemDelta) * cpuCount * 100;
  }
  return 0;
};

const readContainerStats = async (containerInfo) => {
  const container = docker.getContainer(containerInfo.Id);
  const stats = await container.stats({ stream: false });

  const cacheBytes = stats.memory_stats.stats?.cache || 0;
  const memUsageBytes = (stats.memory_stats.usage || 0) - cacheBytes;
  const memLimitBytes = stats.memory_stats.limit || 0;

  return {
    containerId: containerInfo.Id.slice(0, 12),
    name: (containerInfo.Names?.[0] || containerInfo.Id).replace(/^\//, ""),
    cpuPercent: Number(calcCpuPercent(stats).toFixed(1)),
    memUsageBytes,
    memLimitBytes,
    memPercent: memLimitBytes
      ? Number(((memUsageBytes / memLimitBytes) * 100).toFixed(1))
      : 0,
  };
};

/**
 * Live CPU/RAM usage for every container backing a Coolify resource.
 * A "service" resource can be backed by more than one container, so this
 * always returns an array, even for applications/databases (usually length 1).
 */
export const getResourceStats = async (resourceType, resourceId) => {
  const labelKey = LABEL_BY_TYPE[resourceType];
  if (!labelKey) {
    throw new AppError(`Unknown resource type: ${resourceType}`, 400);
  }

  const containers = await docker.listContainers({
    all: false,
    filters: JSON.stringify({ label: [`${labelKey}=${resourceId}`] }),
  });

  return Promise.all(containers.map(readContainerStats));
};
