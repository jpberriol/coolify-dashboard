import ResourceDetails from "../../resource/ResourceDetails";
import DatabaseInfo from "../../resource/DatabaseInfo";
import ComponentsList from "../../resource/ComponentsList";
import ResourceStats from "../../resource/ResourceStats";
import { RESOURCE_TYPES } from "../../../constants/resourceTypes";

const ResourceCardBody = ({ resource }) => {
  return (
    <div className="bg-slate-800/30 border-t border-white/10 px-3 md:px-8 py-4 md:py-6">
      {/* Common resource details */}
      <ResourceDetails resource={resource} />

      {/* Live CPU/RAM usage, polled every 5s */}
      <div className="mt-4">
        <ResourceStats resourceUuid={resource.uuid} />
      </div>

      {/* Database-specific information */}
      {resource.type === RESOURCE_TYPES.DATABASE && (
        <div className="mt-4">
          <DatabaseInfo resource={resource} />
        </div>
      )}

      {/* Components list (for services with sub-resources) */}
      <div className="mt-4">
        <ComponentsList
          applications={resource.applications}
          databases={resource.databases}
        />
      </div>
    </div>
  );
};

export default ResourceCardBody;
