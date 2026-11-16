import { useTranslation } from "react-i18next";
import { useSoundEffects } from "../../../hooks/useSoundEffects";
import { SOUND_TYPES } from "../../../utils/soundUtils";
import { RESOURCE_TYPES } from "../../../constants/resourceTypes";
import {
  PlayIcon,
  StopIcon,
  RocketLaunchIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

const ResourceCardFooter = ({
  resource,
  resourceTypeId,
  urls,
  userType,
  currentAction,
  actionColor,
  ActionIcon,
  actionText,
  realtimeElapsed,
  formatElapsedTime,
  onUrlClick,
  onYamlClick,
  onLogsClick,
  onActionClick,
}) => {
  const { t } = useTranslation();
  const { playSound } = useSoundEffects();

  const handleClick = (e, callback) => {
    e.stopPropagation();
    playSound(SOUND_TYPES.CLICK);
    callback();
  };

  return (
    <div className="border-t border-slate-800 bg-slate-800/20 px-3 md:px-6 py-3 md:py-4">
      <div className="flex flex-row flex-wrap items-center justify-between gap-3">
        {/* Left Side: Go to App & View YAML */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:pl-6">
          {/* Go to App Button */}
          {urls.length > 0 && resourceTypeId !== "database" && (
            <button
              onClick={(e) => handleClick(e, () => onUrlClick(urls[0]))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-200 hover:text-blue-100 rounded-lg border border-blue-500/40 transition text-sm font-medium cursor-pointer"
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              <span className="hidden md:inline">{t("resourceCard.goToApp")}</span>
            </button>
          )}

          {/* View YAML Button */}
          {(resource.docker_compose || resource.docker_compose_raw) && (
            <button
              onClick={(e) => handleClick(e, onYamlClick)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-200 hover:text-blue-100 rounded-lg border border-blue-500/40 transition text-sm font-medium cursor-pointer"
            >
              <DocumentTextIcon className="w-4 h-4" />
              <span className="hidden md:inline">{t("resourceCard.viewYaml")}</span>
            </button>
          )}
        </div>

        {/* Right Side: Admin Controls */}
        {userType === "admin" && (
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 md:pr-6">
            {/* Action Status Indicator - Shows when action is in progress */}
            {currentAction && ActionIcon ? (
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 ${
                  actionColor === "green"
                    ? "bg-green-500/20 border-green-500/40 text-green-200"
                    : actionColor === "yellow"
                      ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-200"
                      : "bg-red-500/20 border-red-500/40 text-red-200"
                }`}
              >
                <ActionIcon className="w-4 h-4 animate-pulse flex-shrink-0" />
                <span className="text-sm font-medium hidden md:inline">
                  {actionText}
                </span>
                <div className="flex items-center gap-1">
                  <svg
                    className="w-3 h-3 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="text-xs font-bold tabular-nums">
                    {formatElapsedTime(realtimeElapsed)}
                  </span>
                </div>
              </div>
            ) : (
              <>
                {/* Start Button */}
                {resource.status &&
                  ["exited", "stopped", "dead"].includes(
                    resource.status.toLowerCase().split(":")[0]
                  ) && (
                    <button
                      onClick={(e) => handleClick(e, () => onActionClick("start"))}
                      disabled={!!currentAction}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/40 disabled:bg-green-500/10 text-green-200 disabled:text-green-400 rounded-lg border border-green-500/40 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <PlayIcon className="w-4 h-4" />
                      <span className="hidden md:inline">{t("admin.start")}</span>
                    </button>
                  )}

                {/* Stop Button */}
                {resource.status &&
                  resource.status.toLowerCase().split(":")[0] === "running" && (
                    <button
                      onClick={(e) => handleClick(e, () => onActionClick("stop"))}
                      disabled={!!currentAction}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/40 disabled:bg-yellow-500/10 text-yellow-200 disabled:text-yellow-400 rounded-lg border border-yellow-500/40 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <StopIcon className="w-4 h-4" />
                      <span className="hidden md:inline">{t("admin.stop")}</span>
                    </button>
                  )}

                {/* View Logs Button - Only for Applications */}
                {resource.type === RESOURCE_TYPES.APPLICATION && (
                  <button
                    onClick={(e) => handleClick(e, onLogsClick)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-200 hover:text-blue-100 rounded-lg border border-blue-500/40 transition text-sm font-medium cursor-pointer"
                  >
                    <DocumentTextIcon className="w-4 h-4" />
                    <span className="hidden md:inline">{t("admin.viewLogs")}</span>
                  </button>
                )}

                {/* Redeploy Button - Only for Applications */}
                {resource.type === RESOURCE_TYPES.APPLICATION && (
                  <button
                    onClick={(e) => handleClick(e, () => onActionClick("redeploy"))}
                    disabled={!!currentAction}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg border border-blue-500 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <RocketLaunchIcon className="w-4 h-4" />
                    <span className="hidden md:inline">{t("admin.redeploy")}</span>
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceCardFooter;
