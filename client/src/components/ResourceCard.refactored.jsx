import { useState } from "react";
import {
  ServerIcon,
  CubeIcon,
  CircleStackIcon,
} from "@heroicons/react/24/outline";
import { getStatusColor } from "../utils/statusUtils";
import { normalizeUrl } from "../utils/urlUtils";
import {
  getSourceInfo,
  getResourceTag,
  hasResourceDetails,
} from "../utils/resourceUtils";
import { RESOURCE_TYPES } from "../constants/resourceTypes";
import ResourceHeader from "./resource/ResourceHeader";
import ResourceDetails from "./resource/ResourceDetails";
import DatabaseInfo from "./resource/DatabaseInfo";
import ComponentsList from "./resource/ComponentsList";
import ConfirmUrlModal from "./modals/ConfirmUrlModal";
import YamlModal from "./modals/YamlModal";

const ResourceCard = ({ resource }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showYaml, setShowYaml] = useState(false);
  const [confirmUrl, setConfirmUrl] = useState(null);

  const statusColor = getStatusColor(resource.status);
  const urls =
    resource.fqdns && resource.fqdns.length > 0
      ? resource.fqdns.map(normalizeUrl).filter(Boolean)
      : [];

  const TypeIcon =
    resource.type === RESOURCE_TYPES.SERVICE
      ? ServerIcon
      : resource.type === RESOURCE_TYPES.DATABASE
        ? CircleStackIcon
        : CubeIcon;

  const sourceInfo = getSourceInfo(resource);
  const tag = getResourceTag(resource);
  const hasDetails = hasResourceDetails(resource);

  const resourceTypeId =
    resource.type === RESOURCE_TYPES.SERVICE
      ? "service"
      : resource.type === RESOURCE_TYPES.DATABASE
        ? "database"
        : "application";

  const handleExpandToggle = () => {
    if (hasDetails) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div
      className={`border-b border-slate-800 last:border-b-0 ${
        isExpanded ? "bg-blue-500/5 border-l-4 border-l-blue-500" : ""
      }`}
    >
      <div
        className={`hover:bg-white/5 active:bg-white/10 transition-colors duration-150 ${
          hasDetails ? "cursor-pointer" : ""
        } ${isExpanded ? "bg-white/5" : "bg-white/1"}`}
        onClick={handleExpandToggle}
      >
        <div className="px-3 md:px-6 py-3 md:py-4">
          <ResourceHeader
            name={resource.name}
            type={resource.type}
            resourceTypeId={resourceTypeId}
            sourceInfo={sourceInfo}
            urls={urls}
            tag={tag}
            statusColor={statusColor}
            isExpanded={isExpanded}
            hasDetails={hasDetails}
            TypeIcon={TypeIcon}
            onExpandToggle={handleExpandToggle}
            onUrlClick={setConfirmUrl}
            createdAt={resource.created_at}
            updatedAt={resource.updated_at}
          />
        </div>
      </div>

      {isExpanded && hasDetails && (
        <div className="bg-slate-800/30 border-t border-slate-800 px-3 md:px-8 py-4 md:py-6">
          <ResourceDetails
            resource={resource}
            onShowYaml={() => setShowYaml(true)}
          />

          {resource.type === RESOURCE_TYPES.DATABASE && (
            <div className="mt-4">
              <DatabaseInfo resource={resource} />
            </div>
          )}

          <div className="mt-4">
            <ComponentsList
              applications={resource.applications}
              databases={resource.databases}
            />
          </div>
        </div>
      )}

      {confirmUrl && (
        <ConfirmUrlModal url={confirmUrl} onClose={() => setConfirmUrl(null)} />
      )}

      {showYaml && (resource.docker_compose || resource.docker_compose_raw) && (
        <YamlModal
          name={resource.name}
          content={resource.docker_compose || resource.docker_compose_raw}
          onClose={() => setShowYaml(false)}
        />
      )}
    </div>
  );
};

export default ResourceCard;
