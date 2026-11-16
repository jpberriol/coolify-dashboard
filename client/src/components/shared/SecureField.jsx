import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EyeIcon, EyeSlashIcon, ClipboardIcon } from "@heroicons/react/24/outline";
import { useSoundEffects } from "../../hooks/useSoundEffects";
import { SOUND_TYPES } from "../../utils/soundUtils";
import useAutoHide from "../../hooks/useAutoHide";

const SecureField = ({
  label,
  value,
  hideText = "••••••••",
  autoHideTimeout = 10000,
  className = "",
}) => {
  const { t } = useTranslation();
  const { playSound } = useSoundEffects();
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-hide after timeout
  useAutoHide(isVisible, setIsVisible, autoHideTimeout);
  useAutoHide(copied, setCopied, 2000);

  const handleToggleVisibility = () => {
    playSound(SOUND_TYPES.CLICK);
    setIsVisible(!isVisible);
  };

  const handleCopy = async () => {
    playSound(SOUND_TYPES.CLICK);
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      <div className="flex items-center gap-2">
        {/* Value Display */}
        <div className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-800 rounded-lg font-mono text-sm text-slate-200 break-all">
          {isVisible ? value : hideText}
        </div>

        {/* Toggle Visibility Button */}
        <button
          onClick={handleToggleVisibility}
          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 active:bg-blue-500/40 rounded-lg border border-blue-500/40 transition text-blue-200 cursor-pointer"
          title={isVisible ? t("common.hide") : t("common.show")}
        >
          {isVisible ? (
            <EyeSlashIcon className="w-5 h-5" />
          ) : (
            <EyeIcon className="w-5 h-5" />
          )}
        </button>

        {/* Copy to Clipboard Button */}
        <button
          onClick={handleCopy}
          className={`p-2 rounded-lg border transition cursor-pointer ${
            copied
              ? "bg-green-500/20 border-green-500/40 text-green-200"
              : "bg-blue-500/20 hover:bg-blue-500/30 active:bg-blue-500/40 border-blue-500/40 text-blue-200"
          }`}
          title={copied ? t("common.copied") : t("common.copy")}
        >
          <ClipboardIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SecureField;
