import { useState, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import {
  PlayIcon,
  StopIcon,
  TrashIcon,
  DocumentMagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import useResourceStore from "../../store/resourceStore";

const ConfirmActionModal = lazy(() => import("../modals/ConfirmActionModal"));
const LogsModal = lazy(() => import("../modals/LogsModal"));

const ResourceActionButtons = ({ resource }) => {
  const { t } = useTranslation();
  const {
    startResourceAction,
    stopResourceAction,
    deleteResourceAction,
    actionLoading,
  } = useResourceStore();

  const [confirmAction, setConfirmAction] = useState(null);
  const [showLogs, setShowLogs] = useState(false);

  const actionKey = `${resource.type}-${resource.uuid}`;
  const currentAction = actionLoading[actionKey];

  const statusLower = resource.status?.toLowerCase() || "";
  const statusParts = statusLower.split(":");
  const mainStatus = statusParts[0] || "";

  const isRunning = mainStatus === "running";

  const isStopped =
    mainStatus === "stopped" ||
    mainStatus === "exited" ||
    mainStatus === "error" ||
    mainStatus === "dead" ||
    mainStatus === "degraded" ||
    mainStatus === "";

  const isTransitioning =
    mainStatus === "starting" ||
    mainStatus === "stopping" ||
    mainStatus === "restarting";

  const handleStart = () => {
    startResourceAction(resource.type, resource.uuid, t);
  };

  const handleStop = () => {
    stopResourceAction(resource.type, resource.uuid, t);
  };

  const handleDelete = () => {
    deleteResourceAction(resource.type, resource.uuid, t);
  };

  const buttonClass =
    "flex items-center gap-2 px-4 py-2.5 transition-all duration-200 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm cursor-pointer";

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => setConfirmAction("start")}
          disabled={isRunning || isTransitioning || currentAction}
          className={`${buttonClass} bg-green-500/20 hover:bg-green-500/30 border-green-500/40 hover:border-green-500/60 text-green-300 hover:text-green-100 disabled:hover:bg-green-500/20`}
        >
          {currentAction?.action === "starting" ? (
            <div className="w-4 h-4 border-2 border-green-300 border-t-transparent rounded-full animate-spin" />
          ) : (
            <PlayIcon className="w-4 h-4" />
          )}
          <span className="hidden md:inline">
            {currentAction?.action === "starting"
              ? t("admin.starting")
              : t("admin.start")}
          </span>
        </button>

        <button
          onClick={() => setConfirmAction("stop")}
          disabled={isStopped || isTransitioning || currentAction}
          className={`${buttonClass} bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-500/40 hover:border-yellow-500/60 text-yellow-300 hover:text-yellow-100 disabled:hover:bg-yellow-500/20`}
        >
          {currentAction?.action === "stopping" ? (
            <div className="w-4 h-4 border-2 border-yellow-300 border-t-transparent rounded-full animate-spin" />
          ) : (
            <StopIcon className="w-4 h-4" />
          )}
          <span className="hidden md:inline">
            {currentAction?.action === "stopping"
              ? t("admin.stopping")
              : t("admin.stop")}
          </span>
        </button>

        {resource.type === "application" && (
          <button
            onClick={() => setShowLogs(true)}
            disabled={isStopped || isTransitioning}
            className={`${buttonClass} bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/40 hover:border-cyan-500/60 text-cyan-300 hover:text-cyan-100 disabled:hover:bg-cyan-500/20`}
          >
            <DocumentMagnifyingGlassIcon className="w-4 h-4" />
            <span className="hidden md:inline">{t("admin.viewLogs")}</span>
          </button>
        )}

        <button
          onClick={() => setConfirmAction("delete")}
          disabled={isTransitioning || currentAction}
          className={`${buttonClass} bg-red-500/20 hover:bg-red-500/30 border-red-500/40 hover:border-red-500/60 text-red-300 hover:text-red-100 disabled:hover:bg-red-500/20`}
        >
          {currentAction?.action === "deleting" ? (
            <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
          ) : (
            <TrashIcon className="w-4 h-4" />
          )}
          <span className="hidden md:inline">
            {currentAction?.action === "deleting"
              ? t("admin.deleting")
              : t("admin.delete")}
          </span>
        </button>
      </div>

      {confirmAction && (
        <Suspense fallback={null}>
          <ConfirmActionModal
            action={confirmAction}
            resourceName={resource.name}
            onConfirm={() => {
              if (confirmAction === "start") handleStart();
              else if (confirmAction === "stop") handleStop();
              else if (confirmAction === "delete") handleDelete();
              setConfirmAction(null);
            }}
            onClose={() => setConfirmAction(null)}
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
    </>
  );
};

export default ResourceActionButtons;
