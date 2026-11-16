import { extractFqdns } from "../utils/urlUtils";
import { RESOURCE_TYPES } from "../constants/resourceTypes";

const extractFromCompose = (compose, key) => {
  if (!compose || !key) return [];
  const re = new RegExp(`${key}\\s*:\\s*'?([^'\\n]+)'?`, "i");
  const m = compose.match(re);
  if (!m?.[1]) return [];
  return m[1]
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
};

const pickMinioPreferred = (urls) => {
  if (!urls?.length) return urls;
  const consoleUrls = urls.filter((u) => /console[-.]/i.test(u));
  if (consoleUrls.length) {
    const rest = urls.filter((u) => !/console[-.]/i.test(u));
    return [...consoleUrls, ...rest];
  }
  return urls;
};

export const mapApplication = (app) => ({
  ...app,
  type: RESOURCE_TYPES.APPLICATION,
  fqdns: extractFqdns(app.fqdn),
});

export const mapService = (service) => {
  let fqdns = [];

  if (service.applications?.length) {
    for (const app of service.applications) {
      if (app.fqdn) {
        fqdns.push(...extractFqdns(app.fqdn));
      }
    }
  }

  if (service.fqdn) {
    fqdns.push(...extractFqdns(service.fqdn));
  }

  const envUrls =
    service.environment?.COOLIFY_URL ||
    service.environment?.COOLIFY_FQDN ||
    null;
  if (envUrls) {
    fqdns.push(...extractFqdns(envUrls));
  } else if (service.docker_compose) {
    fqdns.push(...extractFromCompose(service.docker_compose, "COOLIFY_URL"));
    if (!fqdns.length) {
      fqdns.push(...extractFromCompose(service.docker_compose, "COOLIFY_FQDN"));
    }
  }

  const uniq = [...new Set(fqdns)];
  const serviceType = (service.service_type || service.type || "")
    .toString()
    .toLowerCase();
  const ordered = serviceType === "minio" ? pickMinioPreferred(uniq) : uniq;

  return {
    ...service,
    type: RESOURCE_TYPES.SERVICE,
    fqdns: ordered,
    status: service.status || service.applications?.[0]?.status,
  };
};

export const mapDatabase = (db) => ({
  ...db,
  type: RESOURCE_TYPES.DATABASE,
  name: db.name,
  fqdns: [],
  status: db.status,
  database_type: db.database_type,
});
