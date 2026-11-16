import { useState, useEffect } from "react";
import { ChevronUpIcon } from "@heroicons/react/24/outline";
import { useSoundEffects } from "../hooks/useSoundEffects";
import { SOUND_TYPES } from "../utils/soundUtils";

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { playSound } = useSoundEffects();

  useEffect(() => {
    const handleScroll = () => {
      // Show button when user scrolls down 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    playSound(SOUND_TYPES.CLICK);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 shadow-lg border border-slate-700 transition-colors duration-200 cursor-pointer group opacity-70 hover:opacity-100"
      aria-label="Back to top"
      title="Back to top"
    >
      <ChevronUpIcon className="h-5 w-5 text-white " />
    </button>
  );
};

export default BackToTop;
