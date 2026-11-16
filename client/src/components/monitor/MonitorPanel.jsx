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
      <IncidentsPanel incidents={data.incidents} />
      <HostPanel host={data.host} />
    </section>
  );
};

export default MonitorPanel;
