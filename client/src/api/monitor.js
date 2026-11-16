import { ApiClient } from "../services/ApiClient";

const monitorClient = new ApiClient("/api/monitor");

export const fetchOverview = () => monitorClient.get("/overview");
export const fetchEvents = (limit = 100) =>
  monitorClient.get(`/events?limit=${limit}`);
export const fetchResourceDetail = (uuid) =>
  monitorClient.get(`/resource/${uuid}`);
export const fetchDeployments = (uuid) =>
  monitorClient.get(`/deployments/${uuid}`);
