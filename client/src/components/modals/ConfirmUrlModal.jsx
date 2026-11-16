import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useSoundEffects } from "../../hooks/useSoundEffects";
import { SOUND_TYPES } from "../../utils/soundUtils";

const ConfirmUrlModal = ({ url, onClose }) => {
  const { t } = useTranslation();
  const { playSound } = useSoundEffects();

  const handleConfirm = () => {
    playSound(SOUND_TYPES.CLICK);
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  };

  const handleClose = () => {
    playSound(SOUND_TYPES.CLICK);
    // Remove focus from any button when closing
    if (document.activeElement) {
      document.activeElement.blur();
    }
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
        className="bg-[#1e1a3c] rounded-xl border border-slate-800 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#4f1e85]/20 flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              {t("modals.redirecting")}
            </h3>
          </div>
          <p className="text-sm text-slate-300 mb-4">
            {t("modals.redirectToNewTab")}
          </p>
          <div className="bg-[#334155]/20 p-3 rounded-lg mb-6 border border-slate-800">
            <p
              className="text-xs md:text-sm text-blue-200 font-mono break-all"
              style={{
                textShadow:
                  "0 0 5px #ec4899, 0 0 10px #8b5cf6, 0 0 20px #3b82f6",
              }}
            >
              {url}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-slate-800 transition font-medium cursor-pointer text-sm"
            >
              {t("modals.cancel")}
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium cursor-pointer text-sm"
            >
              {t("modals.continue")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmUrlModal;
