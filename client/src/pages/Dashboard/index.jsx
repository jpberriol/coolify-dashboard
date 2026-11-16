import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { logout } from "../../api/auth";
import ResourceTabs from "./components/ResourceTabs";
import ResourceFilters from "./components/ResourceFilters";
import ResourceList from "./components/ResourceList";
import MonitorPanel from "../../components/monitor/MonitorPanel";
import useDashboardState from "./hooks/useDashboardState";
import { useSoundEffects } from "../../hooks/useSoundEffects";
import { SOUND_TYPES } from "../../utils/soundUtils";
import {
  ArrowRightStartOnRectangleIcon,
  ArrowPathIcon,
  HandRaisedIcon,
} from "@heroicons/react/24/outline";

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { playSound } = useSoundEffects();

  const {
    searchTerm,
    activeView,
    sortBy,
    sortOrder,
    isRefreshing,
    isInitialLoad,
    loading,
    error,
    filteredResources,
    resourceCounts,
    setSearchTerm,
    setActiveView,
    setSortBy,
    setSortOrder,
    handleRefresh,
    handleSort,
    handleClearSort,
  } = useDashboardState();

  const handleLogout = () => {
    playSound(SOUND_TYPES.CLICK);
    logout();

    toast.success(t("auth.logoutSuccess"), {
      icon: <HandRaisedIcon className="w-6 h-6" />,
      duration: 2000,
    });

    setTimeout(() => {
      navigate("/login");
    }, 500);
  };

  // Loading state
  if (loading && isInitialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">
            {t("dashboard.loadingResources")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-slate-950/95 border-b border-slate-800">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-base md:text-lg font-semibold tracking-tight text-white flex items-center gap-2.5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white text-sm">◈</span>
              <span className="hidden md:inline">{t("dashboard.title")}</span>
              <span className="md:hidden">Dashboard</span>
            </h1>
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-md border border-slate-700 transition-colors font-medium flex items-center gap-2 cursor-pointer text-sm touch-manipulation"
              >
                <ArrowRightStartOnRectangleIcon className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden md:inline">{t("auth.logout")}</span>
                <span className="md:hidden">{t("auth.logout")}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 flex-1">
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 md:px-6 py-3 md:py-4 rounded-xl mb-4 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="text-sm md:text-base">
              {error === "Failed to load resources"
                ? t("dashboard.failedToLoad")
                : error}
            </span>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 rounded-lg transition text-sm font-medium cursor-pointer touch-manipulation whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isRefreshing && (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              )}
              {t("common.refresh")}
            </button>
          </div>
        )}

        <MonitorPanel />

        {/* Controls Section */}
        <div className="mb-4 md:mb-6">
          {/* Tabs + Refresh Button */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3 md:gap-4">
            <ResourceTabs
              activeView={activeView}
              onViewChange={setActiveView}
              applicationsCount={resourceCounts.applications}
              servicesCount={resourceCounts.services}
              databasesCount={resourceCounts.databases}
            />
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 md:px-4 py-2 md:py-1.5 bg-blue-500/20 hover:bg-blue-500/30 active:bg-blue-500/40 text-blue-200 rounded-lg border border-blue-500/50 transition-all duration-200 font-medium flex items-center gap-1.5 md:gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap touch-manipulation"
            >
              <ArrowPathIcon
                className={`w-4 h-4 transition-transform duration-200 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden md:inline">
                {isRefreshing ? t("common.refreshing") : t("common.refresh")}
              </span>
            </button>
          </div>

          {/* Filters */}
          <ResourceFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            onClearSort={handleClearSort}
          />
        </div>

        {/* Resource List */}
        <ResourceList
          resources={filteredResources}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          activeView={activeView}
          totalResourcesByType={resourceCounts}
          searchTerm={searchTerm}
          onClearSearch={() => setSearchTerm("")}
        />
      </div>
    </div>
  );
};

export default Dashboard;
