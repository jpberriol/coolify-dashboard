import { useTranslation } from "react-i18next";
import CustomDropdown from "../../../components/CustomDropdown";
import { getSortOptions } from "../../../constants/sortOptions";
import { useSoundEffects } from "../../../hooks/useSoundEffects";
import { SOUND_TYPES } from "../../../utils/soundUtils";
import {
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";

const ResourceFilters = ({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  onClearSort,
}) => {
  const { t } = useTranslation();
  const { playSound } = useSoundEffects();

  const handleSortOrderToggle = () => {
    playSound(SOUND_TYPES.CLICK);
    onSortOrderChange(sortOrder === "asc" ? "desc" : "asc");
  };

  const handleClearSort = () => {
    playSound(SOUND_TYPES.CLICK);
    onClearSort();
  };

  return (
    <div className="flex gap-2 md:gap-4 flex-col md:flex-row">
      {/* Search Input */}
      <div className="flex-1 min-w-0">
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 md:w-5 md:h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t("common.search")}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
          />
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2">
        {/* Sort By Dropdown */}
        <CustomDropdown
          value={sortBy}
          onChange={onSortChange}
          options={getSortOptions()}
          icon={ChevronUpDownIcon}
          className="min-w-0 flex-1 md:min-w-[200px]"
        />

        {/* Clear Sort Button */}
        {sortBy !== "name" && (
          <button
            onClick={handleClearSort}
            className="flex items-center px-3 md:px-4 py-2 md:py-1.5 bg-red-500/30 border border-red-500/30 rounded-lg text-white hover:bg-red-500/50 active:bg-red-500/60 transition cursor-pointer touch-manipulation"
            title={t("common.filter")}
          >
            <XMarkIcon className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        )}

        {/* Sort Order Toggle */}
        <button
          onClick={handleSortOrderToggle}
          className="flex items-center px-3 md:px-4 py-2 md:py-1.5 bg-slate-900 border border-slate-800 rounded-md text-white text-sm hover:bg-white/10 active:bg-white/20 transition cursor-pointer touch-manipulation"
          title={
            sortOrder === "asc"
              ? t("sortOptions.ascending")
              : t("sortOptions.descending")
          }
        >
          {sortOrder === "asc" ? (
            <ArrowUpIcon className="w-4 h-4 md:w-5 md:h-5" />
          ) : (
            <ArrowDownIcon className="w-4 h-4 md:w-5 md:h-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ResourceFilters;
