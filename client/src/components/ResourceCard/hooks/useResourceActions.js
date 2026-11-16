import { useTranslation } from "react-i18next";
import { PlayIcon, StopIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";

const useResourceActions = (currentAction) => {
  const { t } = useTranslation();

  const getActionColor = () => {
    if (!currentAction) return null;
    switch (currentAction.action) {
      case "starting":
        return "green";
      case "stopping":
        return "yellow";
      case "redeploying":
        return "blue";
      default:
        return null;
    }
  };

  const getActionIcon = () => {
    if (!currentAction) return null;
    switch (currentAction.action) {
      case "starting":
        return PlayIcon;
      case "stopping":
        return StopIcon;
      case "redeploying":
        return RocketLaunchIcon;
      default:
        return null;
    }
  };

  const getActionText = () => {
    if (!currentAction) return "";
    return t(`admin.${currentAction.action}`);
  };

  const formatElapsedTime = (seconds) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return {
    actionColor: getActionColor(),
    ActionIcon: getActionIcon(),
    actionText: getActionText(),
    formatElapsedTime,
  };
};

export default useResourceActions;
