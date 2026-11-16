import { useTranslation } from "react-i18next";
import ResourceCard from "../../../components/ResourceCard";
import { useSoundEffects } from "../../../hooks/useSoundEffects";
import { SOUND_TYPES } from "../../../utils/soundUtils";
import { CubeIcon, XMarkIcon } from "@heroicons/react/24/outline";

const ResourceList = ({
  resources,
  sortBy,
  sortOrder,
  onSort,
  activeView,
  totalResourcesByType,
  searchTerm,
  onClearSearch,
}) => {
  const { t } = useTranslation();
  const { playSound } = useSoundEffects();

  const handleClearSearch = () => {
    playSound(SOUND_TYPES.CLICK);
    onClearSearch();
  };

  // Empty state
  if (resources.length === 0) {
    const totalCount = totalResourcesByType[activeView] || 0;
    const viewLabel =
      activeView === "applications"
        ? t("dashboard.applications")
        : activeView === "services"
          ? t("dashboard.services")
          : t("dashboard.databases");

    return (
      <div className="text-center py-12 md:py-16">
        <CubeIcon className="w-24 h-24 mx-auto mb-4 text-slate-700" />
        <p className="text-slate-200 text-lg">
          {totalCount === 0
            ? `${viewLabel} ${t("dashboard.noResources")}`
            : t("dashboard.noResources")}
        </p>
        {searchTerm && (
          <button
            onClick={handleClearSearch}
            className="cursor-pointer mt-5 inline-flex items-center justify-center gap-1.5 px-4 py-2
           bg-blue-600 hover:bg-blue-500 active:bg-blue-700
           text-white text-sm font-semibold rounded-lg transition-colors
           disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XMarkIcon className="w-4 h-4" />
            <span>{t("common.search")}</span>
          </button>
        )}
      </div>
    );
  }

  const columns = [
    { key: "detail", label: t("common.detail"), sortable: false, span: 1 },
    { key: "status", label: t("common.status"), sortable: true, span: 1 },
    { key: "name", label: t("common.name"), sortable: true, span: 2 },
    {
      key: "created_at",
      label: t("common.created"),
      sortable: true,
      span: 2,
      hideOnMobile: true,
    },
    {
      key: "updated_at",
      label: t("common.updated"),
      sortable: true,
      span: 2,
      hideOnMobile: true,
    },
    {
      key: "usage",
      label: t("monitor.usage"),
      sortable: false,
      span: 2,
      hideOnMobile: true,
    },
    {
      key: "type",
      label: t("common.type"),
      sortable: false,
      span: 2,
      hideOnMobile: true,
    },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="hidden lg:block bg-slate-900 border-b text-center border-slate-800 px-6 py-3">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-300 uppercase tracking-wider">
          {columns.map((column) => (
            <div
              key={column.key}
              className={`col-span-${column.span} ${
                column.hideOnMobile ? "hidden md:block" : ""
              } ${column.sortable ? "cursor-pointer hover:text-slate-200 transition" : "text-center"}`}
              onClick={column.sortable ? () => onSort(column.key) : undefined}
            >
              {column.label}{" "}
              {column.sortable &&
                sortBy === column.key &&
                (sortOrder === "asc" ? "↑" : "↓")}
            </div>
          ))}
        </div>
      </div>

      {/* Resource Cards */}
      {resources.map((resource, index) => (
        <ResourceCard
          key={resource.uuid || resource.id || index}
          resource={resource}
        />
      ))}
    </div>
  );
};

export default ResourceList;
