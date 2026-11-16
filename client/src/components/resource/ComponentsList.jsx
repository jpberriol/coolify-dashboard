import { useTranslation } from "react-i18next";
import { ServerIcon } from "@heroicons/react/24/outline";

const ComponentsList = ({ applications, databases }) => {
  const { t } = useTranslation();
  if (
    (!applications || applications.length === 0) &&
    (!databases || databases.length === 0)
  ) {
    return null;
  }

  return (
    <div className="bg-slate-900 rounded-lg p-5 border border-slate-800">
      <div className="flex items-center gap-2 mb-4">
        <ServerIcon className="w-5 h-5 text-green-400" />
        <span className="text-sm font-semibold text-white">
          {t("resourceCard.components")}
        </span>
      </div>
      <div className="space-y-3">
        {applications &&
          applications.map((app, idx) => (
            <div
              key={idx}
              className="bg-slate-800/50 rounded-lg p-3 border border-white/5"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <span className="text-sm font-medium text-white">
                    {app.name}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    app.status?.includes("running")
                      ? "bg-green-500/20 text-green-300 border border-green-500/30"
                      : app.status?.includes("exited")
                        ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                        : "bg-red-500/20 text-red-300 border border-red-500/30"
                  }`}
                >
                  {app.status || "unknown"}
                </span>
              </div>
              {app.image && (
                <p className="text-xs text-slate-400 font-mono">{app.image}</p>
              )}
            </div>
          ))}
        {databases &&
          databases.map((db, idx) => (
            <div
              key={idx}
              className="bg-slate-800/50 rounded-lg p-3 border border-white/5"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🗄️</span>
                  <span className="text-sm font-medium text-white">
                    {db.name}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    db.status?.includes("running")
                      ? "bg-green-500/20 text-green-300 border border-green-500/30"
                      : db.status?.includes("exited")
                        ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                        : "bg-red-500/20 text-red-300 border border-red-500/30"
                  }`}
                >
                  {db.status || "unknown"}
                </span>
              </div>
              {db.image && (
                <p className="text-xs text-slate-400 font-mono">{db.image}</p>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default ComponentsList;
