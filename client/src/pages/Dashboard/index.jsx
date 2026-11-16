import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { logout } from "../../api/auth";
import LanguageSelector from "../../components/LanguageSelector";
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">
            {t("dashboard.loadingResources")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-purple-400">◈</span>
              <span className="hidden md:inline">{t("dashboard.title")}</span>
              <span className="md:hidden">Dashboard</span>
            </h1>
            <div className="flex items-center gap-2 md:gap-4">
              <LanguageSelector />
              <button
                onClick={handleLogout}
                className="px-3 md:px-5 py-1.5 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 active:from-purple-500/40 active:to-indigo-500/40 text-purple-100 hover:text-white rounded-lg border border-purple-500/40 transition-all duration-300 font-medium flex items-center gap-1 md:gap-2 cursor-pointer text-sm md:text-base touch-manipulation"
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
              className="px-3 md:px-4 py-2 md:py-1.5 bg-purple-500/20 hover:bg-purple-500/30 active:bg-purple-500/40 text-purple-200 rounded-lg border border-purple-500/50 transition-all duration-200 font-medium flex items-center gap-1.5 md:gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap touch-manipulation"
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

      {/* Footer */}
      <footer className="bg-slate-900/80 backdrop-blur-xl border-t border-white/10 mt-auto">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="text-slate-300 text-sm">
              © {new Date().getFullYear()} Burak Kalaycı
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/kalayciburak"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-purple-400 transition-all duration-300 p-2 hover:bg-purple-500/10 rounded-lg group"
                aria-label="GitHub"
              >
                <svg
                  className="w-5 h-5 group-hover:scale-110 transition-transform duration-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/kalayciburak/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-indigo-400 transition-all duration-300 p-2 hover:bg-indigo-500/10 rounded-lg group"
                aria-label="LinkedIn"
              >
                <svg
                  className="w-5 h-5 group-hover:scale-110 transition-transform duration-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
