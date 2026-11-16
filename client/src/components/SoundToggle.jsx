import { SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/24/outline";
import { useSoundEffects } from "../hooks/useSoundEffects";
import { SOUND_TYPES } from "../utils/soundUtils";
import { useIsMobile } from "../hooks/useIsMobile";

const SoundToggle = () => {
  const { isSoundEnabled, toggleSound, playSound } = useSoundEffects();
  const isMobile = useIsMobile();

  if (isMobile) return null;

  const handleClick = () => {
    playSound(SOUND_TYPES.CLICK);
    toggleSound();
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 left-6 z-50 p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 shadow-lg border border-slate-700 transition-colors duration-200 cursor-pointer group opacity-70 hover:opacity-100"
      aria-label={isSoundEnabled ? "Mute sounds" : "Enable sounds"}
      title={isSoundEnabled ? "Mute sounds" : "Enable sounds"}
    >
      {isSoundEnabled ? (
        <SpeakerWaveIcon className="h-5 w-5 text-white" />
      ) : (
        <SpeakerXMarkIcon className="h-5 w-5 text-white/70" />
      )}
    </button>
  );
};

export default SoundToggle;
