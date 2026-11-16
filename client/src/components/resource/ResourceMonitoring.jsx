import { useTranslation } from "react-i18next";
import {
  HeartIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";
import { useResourceDetail } from "../../hooks/useMonitor";
import TimeChart from "../shared/TimeChart";
import { formatBytes, formatRate, formatDuration } from "../../utils/byteUtils";

const Card = ({ icon: Icon, title, color = "text-emerald-400", children }) => (
  <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`w-5 h-5 ${color}`} />
      <span className="text-sm font-semibold text-white">{title}</span>
    </div>
    {children}
  </div>
);

const Chart = ({ label, value, data, range, max, color, format, empty }) => (
  <div className="bg-slate-800/60 rounded-lg p-3">
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs font-semibold text-white">{label}</span>
      <span className="text-xs font-mono text-slate-300">{value}</span>
    </div>
    <TimeChart
      data={data}
      from={range.from}
      to={range.to}
      max={max}
      color={color}
      format={format}
      emptyText={empty}
    />
  </div>
);

const sslClass = (days) =>
  days < 0 || days <= 3
    ? "text-red-300"
    : days <= 14
      ? "text-amber-300"
      : "text-emerald-300";

const ResourceMonitoring = ({ resourceUuid }) => {
  const { t } = useTranslation();
  const { data } = useResourceDetail(resourceUuid);
  if (!data) return null;

  const { history, container, health, ssl } = data;
  const last = history[history.length - 1];
  const series = (key) => history.map((s) => ({ t: s.t, v: s[key] }));
  const sumSeries = (a, b) => history.map((s) => ({ t: s.t, v: s[a] + s[b] }));
  const empty = t("monitor.noData");
  const hasHistory = history.length >= 1;
  const containers = container?.containers || [];
  const restarts = container?.restarts ?? 0;
  const oom = container?.oomKilled;

  if (!hasHistory && !health && !ssl.length && !container) return null;

  return (
    <div className="space-y-4">
      {(health || ssl.length > 0 || container) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {health && (
            <Card
              icon={HeartIcon}
              title={t("monitor.availability")}
              color="text-cyan-400"
            >
              <div className="space-y-1 text-xs font-mono text-slate-300">
                <p className={health.up ? "text-emerald-300" : "text-red-300"}>
                  {health.up ? t("monitor.up") : t("monitor.down")}
                  {health.last?.status ? ` · HTTP ${health.last.status}` : ""}
                  {health.last?.error ? ` · ${health.last.error}` : ""}
                </p>
                <p>
                  {t("monitor.latency")}: {health.last?.latencyMs ?? "-"} ms
                </p>
                <p>
                  {t("monitor.uptimeRatio")}:{" "}
                  {health.uptimePercent != null
                    ? `${health.uptimePercent}%`
                    : "-"}
                </p>
                <div className="flex gap-0.5 pt-1" title={health.url}>
                  {health.recent.map((c) => (
                    <span
                      key={c.t}
                      className={`h-4 w-1.5 rounded-sm ${c.ok ? "bg-emerald-500" : "bg-red-500"}`}
                    />
                  ))}
                </div>
              </div>
            </Card>
          )}

          {ssl.length > 0 && (
            <Card icon={ShieldCheckIcon} title="SSL" color="text-blue-400">
              <ul className="space-y-1 text-xs font-mono">
                {ssl.map((c) => (
                  <li key={c.host} className="truncate">
                    <span className="text-slate-400">{c.host}</span>{" "}
                    {c.ok ? (
                      <span className={sslClass(c.daysLeft)}>
                        {c.daysLeft < 0
                          ? t("monitor.sslExpiredShort")
                          : t("monitor.sslDays", { days: c.daysLeft })}
                      </span>
                    ) : (
                      <span className="text-red-300">{c.error}</span>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {container && (
            <Card
              icon={ArrowPathIcon}
              title={t("monitor.containers")}
              color="text-sky-400"
            >
              <div className="space-y-1 text-xs font-mono text-slate-300">
                <p>
                  {t("monitor.running")}: {container.running}/{container.total}
                </p>
                <p className={restarts > 0 ? "text-amber-300" : ""}>
                  {t("monitor.restarts")}: {restarts}
                </p>
                {oom && (
                  <p className="text-red-300">{t("monitor.oomKilled")}</p>
                )}
                {containers.some((c) => c.health) && (
                  <p>
                    {t("monitor.dockerHealth")}:{" "}
                    {[
                      ...new Set(
                        containers.map((c) => c.health).filter(Boolean)
                      ),
                    ].join(", ")}
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {(hasHistory || container) && (
        <Card
          icon={CpuChipIcon}
          title={t("monitor.history", {
            span: formatDuration((data.range.to - data.range.from) / 1000),
          })}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Chart
              label="CPU"
              value={last ? `${last.cpu}%` : "-"}
              data={series("cpu")}
              range={data.range}
              empty={empty}
              color="#34d399"
              format={(v) => `${v}%`}
            />
            <Chart
              label={t("resourceCard.memoryUsage")}
              value={last ? `${formatBytes(last.mem)} (${last.memPct}%)` : "-"}
              data={series("mem")}
              range={data.range}
              empty={empty}
              color="#60a5fa"
              format={formatBytes}
            />
            <Chart
              label={t("monitor.network")}
              value={
                last
                  ? `↓ ${formatRate(last.rx)}  ↑ ${formatRate(last.tx)}`
                  : "-"
              }
              data={sumSeries("rx", "tx")}
              range={data.range}
              empty={empty}
              color="#a78bfa"
              format={formatRate}
            />
            <Chart
              label={t("monitor.diskIo")}
              value={
                last
                  ? `R ${formatRate(last.br)}  W ${formatRate(last.bw)}`
                  : "-"
              }
              data={sumSeries("br", "bw")}
              range={data.range}
              empty={empty}
              color="#f59e0b"
              format={formatRate}
            />
          </div>
        </Card>
      )}
    </div>
  );
};

export default ResourceMonitoring;
