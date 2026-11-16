import { useOverview } from "../../hooks/useMonitor";
import HostPanel from "./HostPanel";
import IncidentsPanel from "./IncidentsPanel";

const MonitorPanel = () => {
  const { data, isError } = useOverview();
  if (isError || !data) return null;

  return (
    <div className="space-y-3 mb-4 md:mb-6">
      <IncidentsPanel incidents={data.incidents} />
      <HostPanel host={data.host} />
    </div>
  );
};

export default MonitorPanel;
