import { lazy, Suspense } from "react";
import {
  ServerIcon,
  CubeIcon,
  CircleStackIcon,
} from "@heroicons/react/24/outline";
import { getStatusColor } from "../../utils/statusUtils";
import { normalizeUrl } from "../../utils/urlUtils";
import {
  getSourceInfo,
  getResourceTag,
  hasResourceDetails,
} from "../../utils/resourceUtils";
import { RESOURCE_TYPES } from "../../constants/resourceTypes";
import ResourceHeader from "../resource/ResourceHeader";
import HealthBadge from "../monitor/HealthBadge";
import ResourceCardBody from "./components/ResourceCardBody";
import ResourceCardFooter from "./components/ResourceCardFooter";
import useResourceCardState from "./hooks/useResourceCardState";
import useResourceActions from "./hooks/useResourceActions";
import useResourceStore from "../../store/resourceStore";
import { useSoundEffects } from "../../hooks/useSoundEffects";
import { SOUND_TYPES } from "../../utils/soundUtils";
import { useTranslation } from "react-i18next";

const ConfirmUrlModal = lazy(() => import("../modals/ConfirmUrlModal"));
const YamlModal = lazy(() => import("../modals/YamlModal"));
const LogsModal = lazy(() => import("../modals/LogsModal"));
const ConfirmActionModal = lazy(() => import("../modals/ConfirmActionModal"));

const ResourceCard = ({ resource }) => {
  const { t } = useTranslation();
  const { playSound } = useSoundEffects();

  const { startResourceAction, stopResourceAction, redeployResourceAction } =
    useResourceStore();

  const {
    isExpanded,
    setIsExpanded,
    showYaml,
    setShowYaml,
    showLogs,
    setShowLogs,
    confirmUrl,
    setConfirmUrl,
    confirmAction,
    setConfirmAction,
    userType,
    currentAction,
    realtimeElapsed,
  } = useResourceCardState(resource);

  const { actionColor, ActionIcon, actionText, formatElapsedTime } =
    useResourceActions(currentAction);

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
      playSound(SOUND_TYPES.CLICK);
      setIsExpanded(!isExpanded);
    }
  };

  const handleActionConfirm = () => {
    if (confirmAction === "start") {
      startResourceAction(resource.type, resource.uuid, t);
    } else if (confirmAction === "stop") {
      stopResourceAction(resource.type, resource.uuid, t);
    } else if (confirmAction === "redeploy") {
      redeployResourceAction(resource.type, resource.uuid, t);
    }
    setConfirmAction(null);
  };

  return (
    <div
      className={`border-b border-slate-800 last:border-b-0 relative overflow-hidden transition-all duration-300 ${
        isExpanded ? "bg-slate-900/80" : ""
      }`}
    >
      <div
        className={`hover:bg-white/5 active:bg-white/10 transition-colors duration-150 ${
          hasDetails ? "cursor-pointer" : ""
        } ${isExpanded ? "bg-white/5" : "bg-white/1"}`}
        onClick={handleExpandToggle}
        title={hasDetails ? t("common.detail") : ""}
      >
        <div className="px-3 md:px-6 py-3 md:py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
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
                healthBadge={<HealthBadge uuid={resource.uuid} />}
                uuid={resource.uuid}
              />
            </div>
          </div>
        </div>
      </div>

      {isExpanded && hasDetails && <ResourceCardBody resource={resource} />}

      <ResourceCardFooter
        resource={resource}
        resourceTypeId={resourceTypeId}
        urls={urls}
        userType={userType}
        currentAction={currentAction}
        actionColor={actionColor}
        ActionIcon={ActionIcon}
        actionText={actionText}
        realtimeElapsed={realtimeElapsed}
        formatElapsedTime={formatElapsedTime}
        onUrlClick={setConfirmUrl}
        onYamlClick={() => setShowYaml(true)}
        onLogsClick={() => setShowLogs(true)}
        onActionClick={setConfirmAction}
      />

      {confirmUrl && (
        <Suspense fallback={null}>
          <ConfirmUrlModal url={confirmUrl} onClose={() => setConfirmUrl(null)} />
        </Suspense>
      )}

      {showYaml && (resource.docker_compose || resource.docker_compose_raw) && (
        <Suspense fallback={null}>
          <YamlModal
            name={resource.name}
            content={resource.docker_compose || resource.docker_compose_raw}
            onClose={() => setShowYaml(false)}
          />
        </Suspense>
      )}

      {showLogs && (
        <Suspense fallback={null}>
          <LogsModal
            name={resource.name}
            type={resource.type}
            uuid={resource.uuid}
            onClose={() => setShowLogs(false)}
          />
        </Suspense>
      )}

      {confirmAction && (
        <Suspense fallback={null}>
          <ConfirmActionModal
            action={confirmAction}
            resourceName={resource.name}
            onConfirm={handleActionConfirm}
            onClose={() => setConfirmAction(null)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default ResourceCard;
