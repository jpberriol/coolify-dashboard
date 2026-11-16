import ResourceDetails from "../../resource/ResourceDetails";
import DatabaseInfo from "../../resource/DatabaseInfo";
import ComponentsList from "../../resource/ComponentsList";
import ResourceStats from "../../resource/ResourceStats";
import ResourceMonitoring from "../../resource/ResourceMonitoring";
import ResourceDeployments from "../../resource/ResourceDeployments";
import { RESOURCE_TYPES } from "../../../constants/resourceTypes";

const ResourceCardBody = ({ resource }) => {
  return (
    <div className="bg-slate-950/60 border-t border-slate-800 px-3 md:px-8 py-4 md:py-6">
      {/* Common resource details */}
      <ResourceDetails resource={resource} />

      {/* Live CPU/RAM usage, polled every 5s */}
      <div className="mt-4">
        <ResourceStats resourceUuid={resource.uuid} />
      </div>

      {/* History, availability, SSL, restarts */}
      <div className="mt-4">
        <ResourceMonitoring resourceUuid={resource.uuid} />
      </div>

      {/* Recent deployments (applications only) */}
      {resource.type === RESOURCE_TYPES.APPLICATION && (
        <div className="mt-4">
          <ResourceDeployments resourceUuid={resource.uuid} />
        </div>
      )}

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
