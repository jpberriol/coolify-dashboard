import Docker from "dockerode";

const docker = new Docker({ socketPath: "/var/run/docker.sock" });

/**
 * Coolify's own REST API never exposes a resource's internal numeric id
 * (confirmed: ApplicationsController.php only serializes uuid), only the
 * uuid - so matching by coolify.applicationId/serviceId/databaseId (which
 * uses that numeric id) is a dead end from the frontend.
 *
 * Every container Coolify deploys - whether a plain Dockerfile app or a
 * full docker-compose stack - runs under a Compose project named after the
 * resource's uuid (confirmed via `docker inspect` on real containers:
 * com.docker.compose.project=<uuid>, identical across every container that
 * belongs to the same resource, e.g. Keycloak + its Postgres). That's a
 * more reliable match than the coolify.* labels.
 */
const PROJECT_LABEL = "com.docker.compose.project";

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
 * A resource can be backed by more than one container (e.g. an app plus
 * its database in the same compose stack), so this always returns an
 * array, even when there's only one match.
 */
export const getResourceStats = async (resourceUuid) => {
  const containers = await docker.listContainers({
    all: false,
    filters: JSON.stringify({ label: [`${PROJECT_LABEL}=${resourceUuid}`] }),
  });

  return Promise.all(containers.map(readContainerStats));
};
