import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import {
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  RocketLaunchIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useSoundEffects } from "../../hooks/useSoundEffects";
import { SOUND_TYPES } from "../../utils/soundUtils";

const ConfirmActionModal = ({ action, resourceName, onConfirm, onClose }) => {
  const { t } = useTranslation();
  const { playSound } = useSoundEffects();

  const actionConfig = {
    start: {
      icon: PlayIcon,
      iconColor: "text-green-400",
      iconBg: "bg-green-500/20",
      confirmBg: "bg-green-600 hover:bg-green-700",
      message: t("admin.confirmStart", { name: resourceName }),
    },
    stop: {
      icon: StopIcon,
      iconColor: "text-yellow-400",
      iconBg: "bg-yellow-500/20",
      confirmBg: "bg-yellow-600 hover:bg-yellow-700",
      message: t("admin.confirmStop", { name: resourceName }),
    },
    restart: {
      icon: ArrowPathIcon,
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/20",
      confirmBg: "bg-blue-600 hover:bg-blue-700",
      message: t("admin.confirmRestart", { name: resourceName }),
    },
    redeploy: {
      icon: RocketLaunchIcon,
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/20",
      confirmBg: "bg-blue-600 hover:bg-blue-500",
      message: t("admin.confirmRedeploy", { name: resourceName }),
      note: t("admin.redeployNote"),
    },
  };

  const config = actionConfig[action];
  const Icon = config.icon;

  const handleClose = () => {
    playSound(SOUND_TYPES.CLICK);
    // Remove focus from any button when closing
    if (document.activeElement) {
      document.activeElement.blur();
    }
    onClose();
  };

  const handleConfirm = () => {
    playSound(SOUND_TYPES.CLICK);
    onConfirm();
    onClose();
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-slate-900 rounded-xl border border-slate-800 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center`}
            >
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <h3 className="text-lg font-semibold text-white">
              {config.message}
            </h3>
          </div>
          {config.note && (
            <div className="flex items-start gap-2 mb-4 text-sm text-blue-200 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
              <InformationCircleIcon className="w-5 h-5 flex-shrink-0" />
              <span>{config.note}</span>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-slate-800 transition font-medium cursor-pointer text-sm"
            >
              {t("modals.cancel")}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-2.5 ${config.confirmBg} text-white rounded-lg transition font-medium cursor-pointer text-sm`}
            >
              {t(`admin.${action}`)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmActionModal;
