import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useRangeParams } from "../store/rangeStore";
import {
  fetchOverview,
  fetchEvents,
  fetchResourceDetail,
  fetchDeployments,
} from "../api/monitor";

// Overview is shared by the host panel, the incidents panel and every
// resource badge: one request every 10s, deduplicated by react-query.
export const useOverview = () => {
  const params = useRangeParams();
  return useQuery({
    queryKey: ["monitor-overview", params],
    queryFn: () => fetchOverview(params),
    refetchInterval: 10000,
    staleTime: 5000,
    placeholderData: keepPreviousData,
  });
};

export const useEvents = (enabled) =>
  useQuery({
    queryKey: ["monitor-events"],
    queryFn: () => fetchEvents(100),
    refetchInterval: 15000,
    staleTime: 5000,
    enabled,
  });

export const useResourceDetail = (uuid) => {
  const params = useRangeParams();
  return useQuery({
    queryKey: ["monitor-resource", uuid, params],
    queryFn: () => fetchResourceDetail(uuid, params),
    refetchInterval: 10000,
    staleTime: 5000,
    enabled: Boolean(uuid),
    placeholderData: keepPreviousData,
  });
};

export const useDeployments = (uuid, enabled = true) =>
  useQuery({
    queryKey: ["monitor-deployments", uuid],
    queryFn: () => fetchDeployments(uuid),
    refetchInterval: 30000,
    staleTime: 15000,
    enabled: Boolean(uuid) && enabled,
    retry: 0,
  });
