import { useQuery } from "@tanstack/react-query";
import {
  fetchOverview,
  fetchEvents,
  fetchResourceDetail,
  fetchDeployments,
} from "../api/monitor";

// Overview is shared by the host panel, the incidents panel and every
// resource badge: one request every 10s, deduplicated by react-query.
export const useOverview = () =>
  useQuery({
    queryKey: ["monitor-overview"],
    queryFn: fetchOverview,
    refetchInterval: 10000,
    staleTime: 5000,
  });

export const useEvents = (enabled) =>
  useQuery({
    queryKey: ["monitor-events"],
    queryFn: () => fetchEvents(100),
    refetchInterval: 15000,
    staleTime: 5000,
    enabled,
  });

export const useResourceDetail = (uuid) =>
  useQuery({
    queryKey: ["monitor-resource", uuid],
    queryFn: () => fetchResourceDetail(uuid),
    refetchInterval: 10000,
    staleTime: 5000,
    enabled: Boolean(uuid),
  });

export const useDeployments = (uuid, enabled = true) =>
  useQuery({
    queryKey: ["monitor-deployments", uuid],
    queryFn: () => fetchDeployments(uuid),
    refetchInterval: 30000,
    staleTime: 15000,
    enabled: Boolean(uuid) && enabled,
    retry: 0,
  });
