import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useEvents } from "../../hooks/useMonitor";
import { getTimeAgo, formatDate } from "../../utils/dateUtils";

const SEVERITY = {
  critical: {
    Icon: XCircleIcon,
    cls: "text-red-400",
    bg: "bg-red-500/10 border-red-500/30",
  },
  warning: {
    Icon: ExclamationTriangleIcon,
    cls: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
  },
  info: {
    Icon: InformationCircleIcon,
    cls: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
  },
};

const useDescribe = () => {
  const { t } = useTranslation();
  return (item) => {
    const d = item.data || {};
    switch (item.kind) {
      case "status":
      case "status_change":
        return item.kind === "status"
          ? t("monitor.msg.status", { status: d.status })
          : t("monitor.msg.statusChange", {
              from: d.from || "-",
              to: d.to || "-",
            });
      case "down":
        return t("monitor.msg.down", {
          url: d.url,
          reason: d.status || d.error || "?",
        });
      case "recovered":
        return t("monitor.msg.recovered", { url: d.url, ms: d.latencyMs });
      case "restart":
        return t("monitor.msg.restart", {
          count: d.count,
          container: d.container || "",
        });
      case "oom":
        return t("monitor.msg.oom", { container: d.container || "" });
      case "ssl_expiring":
        return d.daysLeft < 0
          ? t("monitor.msg.sslExpired", { host: d.host })
          : t("monitor.msg.sslExpiring", { host: d.host, days: d.daysLeft });
      case "host_disk":
        return t("monitor.msg.hostDisk", { percent: d.percent });
      case "host_memory":
        return t("monitor.msg.hostMemory", { percent: d.percent });
      case "high_cpu":
        return t("monitor.msg.highCpu", { percent: d.percent });
      case "high_memory":
        return t("monitor.msg.highMemory", { percent: d.percent });
      default:
        return item.kind;
    }
  };
};

const Row = ({ item, describe }) => {
  const sev = SEVERITY[item.severity] || SEVERITY.info;
  const ts = item.ts || item.since;
  return (
    <li
      className={`flex items-start gap-3 rounded-lg border px-3 py-2 ${sev.bg}`}
    >
      <sev.Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${sev.cls}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white truncate">
          <span className="font-semibold">{item.name || "-"}</span>
        </p>
        <p className="text-xs text-slate-300 break-words">{describe(item)}</p>
      </div>
      {ts && (
        <span
          className="text-xs text-slate-400 whitespace-nowrap"
          title={formatDate(new Date(ts).toISOString())}
        >
          {getTimeAgo(new Date(ts).toISOString())}
        </span>
      )}
    </li>
  );
};

const IncidentsPanel = ({ incidents = [] }) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState("active");
  const describe = useDescribe();
  const { data: events = [], isLoading } = useEvents(tab === "timeline");

  const critical = incidents.filter((i) => i.severity === "critical").length;
  const healthy = incidents.length === 0;

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 p-3 md:p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-2">
          {healthy ? (
            <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
          ) : (
            <ExclamationTriangleIcon
              className={`w-5 h-5 ${critical ? "text-red-400" : "text-amber-400"}`}
            />
          )}
          <span className="text-sm font-semibold text-white">
            {healthy
              ? t("monitor.allGood")
              : t("monitor.activeIncidents", { count: incidents.length })}
          </span>
        </div>
        <div className="flex gap-1 text-xs">
          {["active", "timeline"].map((id) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3 py-1 rounded-md border cursor-pointer transition ${
                tab === id
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {t(`monitor.tab.${id}`)}
            </button>
          ))}
        </div>
      </div>

      {tab === "active" && !healthy && (
        <ul className="space-y-2 max-h-72 overflow-y-auto">
          {incidents.map((i) => (
            <Row key={i.id} item={i} describe={describe} />
          ))}
        </ul>
      )}
      {tab === "active" && healthy && (
        <p className="text-xs text-slate-400">{t("monitor.noIncidents")}</p>
      )}

      {tab === "timeline" && (
        <>
          {isLoading && (
            <p className="text-xs text-slate-400">{t("common.loading")}</p>
          )}
          {!isLoading && events.length === 0 && (
            <p className="text-xs text-slate-400">
              {t("monitor.noEventsInRange")}
            </p>
          )}
          <ul className="space-y-2 max-h-72 overflow-y-auto">
            {events.map((e) => (
              <Row key={e.id} item={e} describe={describe} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default IncidentsPanel;
