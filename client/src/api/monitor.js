import { ApiClient } from "../services/ApiClient";

const monitorClient = new ApiClient("/api/monitor");

export const fetchOverview = (params) =>
  monitorClient.get("/overview", { params });
export const fetchEvents = (params) =>
  monitorClient.get("/events", { params: { ...params, limit: 500 } });
export const fetchResourceDetail = (uuid, params) =>
  monitorClient.get(`/resource/${uuid}`, { params });
export const fetchDeployments = (uuid) =>
  monitorClient.get(`/deployments/${uuid}`);
