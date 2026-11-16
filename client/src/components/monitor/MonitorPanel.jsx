import { useTranslation } from "react-i18next";
import { useOverview } from "../../hooks/useMonitor";
import HostPanel from "./HostPanel";
import IncidentsPanel from "./IncidentsPanel";
import RangePicker from "./RangePicker";

const MonitorPanel = () => {
  const { t } = useTranslation();
  const { data, isError } = useOverview();
  if (isError || !data) return null;

  return (
    <section className="mb-4 md:mb-6 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          {t("monitor.title")}
        </h2>
        <RangePicker />
      </div>
      {(data.status?.storage?.mounted === false ||
        data.status?.storage?.error) && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {data.status.storage.error
            ? t("monitor.storageError", { error: data.status.storage.error })
            : t("monitor.storageNotMounted", {
                dir: data.status.storage.dir,
              })}
        </div>
      )}
      {data.status?.dockerAvailable === false && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {t("monitor.dockerMissing")}
        </div>
      )}
      <IncidentsPanel incidents={data.incidents} />
      <HostPanel host={data.host} />
    </section>
  );
};

export default MonitorPanel;
