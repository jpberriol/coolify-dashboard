import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getResourceLogs } from "../../api/coolify";
import { useSoundEffects } from "../../hooks/useSoundEffects";
import { SOUND_TYPES } from "../../utils/soundUtils";

const highlightLog = (log) => {
  const parts = [];
  let lastIndex = 0;

  const patterns = [
    {
      regex: /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g,
      className: "text-cyan-400 font-bold",
    },
    {
      regex: /\b([1-5]\d{2})\b/g,
      className: (match) => {
        const code = parseInt(match);
        if (code >= 500) return "text-red-400 font-bold";
        if (code >= 400) return "text-yellow-400 font-bold";
        if (code >= 300) return "text-blue-400 font-bold";
        return "text-green-400 font-bold";
      },
    },
    {
      regex: /(https?:\/\/[^\s]+)/g,
      className: "text-blue-400 font-semibold underline",
    },
    {
      regex: /\b(ERROR|FATAL|CRITICAL)\b/gi,
      className: "text-red-500 font-bold bg-red-500/10 px-1 rounded",
    },
    {
      regex: /\b(WARN|WARNING)\b/gi,
      className: "text-yellow-500 font-bold bg-yellow-500/10 px-1 rounded",
    },
    {
      regex: /\b(INFO|INFORMATION)\b/gi,
      className: "text-blue-400 font-bold bg-blue-500/10 px-1 rounded",
    },
    {
      regex: /\b(DEBUG|TRACE)\b/gi,
      className: "text-slate-400 font-bold bg-slate-500/10 px-1 rounded",
    },
    {
      regex: /\b(SUCCESS|OK)\b/gi,
      className: "text-green-400 font-bold bg-green-500/10 px-1 rounded",
    },
    {
      regex:
        /\b(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)\b/g,
      className: "text-slate-400 font-mono",
    },
    {
      regex: /\b(\d{2}:\d{2}:\d{2}(?:\.\d+)?)\b/g,
      className: "text-slate-400 font-mono",
    },
    {
      regex: /([/\\][\w\-./\\]+\.\w+)/g,
      className: "text-blue-400 font-mono",
    },
    {
      regex: /\b(\d+(?:\.\d+)?(?:ms|s|MB|GB|KB|%)?)\b/g,
      className: "text-emerald-400 font-mono",
    },
  ];

  const matches = [];

  patterns.forEach((pattern) => {
    let match;
    const regex = new RegExp(pattern.regex);
    while ((match = regex.exec(log)) !== null) {
      const className =
        typeof pattern.className === "function"
          ? pattern.className(match[1])
          : pattern.className;
      matches.push({
        index: match.index,
        length: match[1].length,
        text: match[1],
        className,
      });
    }
  });

  matches.sort((a, b) => a.index - b.index);

  const filteredMatches = [];
  let lastEnd = 0;
  matches.forEach((match) => {
    if (match.index >= lastEnd) {
      filteredMatches.push(match);
      lastEnd = match.index + match.length;
    }
  });

  lastIndex = 0;
  filteredMatches.forEach((match, idx) => {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${idx}`} className="text-slate-200">
          {log.substring(lastIndex, match.index)}
        </span>
      );
    }
    parts.push(
      <span key={`match-${idx}`} className={match.className}>
        {match.text}
      </span>
    );
    lastIndex = match.index + match.length;
  });

  if (lastIndex < log.length) {
    parts.push(
      <span key="text-end" className="text-slate-200">
        {log.substring(lastIndex)}
      </span>
    );
  }

  return parts.length > 0 ? (
    parts
  ) : (
    <span className="text-slate-200">{log}</span>
  );
};

const LogsModal = ({ name, type, uuid, onClose }) => {
  const { t } = useTranslation();
  const { playSound } = useSoundEffects();
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const logsEndRef = useRef(null);

  const handleClose = () => {
    playSound(SOUND_TYPES.CLICK);
    // Remove focus from any button when closing
    if (document.activeElement) {
      document.activeElement.blur();
    }
    onClose();
  };

  const fetchLogs = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const response = await getResourceLogs(type, uuid);
      const logsText = response.logs || "";
      const logsArray = logsText
        .split("\n")
        .filter((line) => line.trim() !== "");
      setLogs(logsArray);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, uuid]);

  const handleRetry = () => {
    fetchLogs();
  };

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

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

  const filteredLogs = logs.filter((log) =>
    log.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-[#1e1a3c] rounded-xl border border-[#334155]/30 max-w-6xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#334155]/30">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">
              {t("admin.logsTitle", { name })}
            </h3>
            {isLoading && (
              <span className="flex items-center gap-1.5 text-xs text-blue-400">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                {t("common.loading")}
              </span>
            )}
            {hasError && (
              <span className="flex items-center gap-1.5 text-xs text-red-400">
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                {t("admin.logsError")}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition cursor-pointer font-bold text-xl"
          >
            &times;
          </button>
        </div>

        <div className="p-4 border-b border-[#334155]/30 flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t("admin.filterLogs")}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#020617] border border-[#334155]/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-4 h-4 accent-blue-500"
            />
            <span className="text-sm text-slate-300">
              {t("admin.autoScroll")}
            </span>
          </label>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-[#020617] font-mono text-sm">
          {hasError ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-red-400">{t("admin.logsUnavailable")}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 hover:text-blue-200 transition text-sm cursor-pointer"
              >
                {t("admin.retryConnection")}
              </button>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-slate-400 text-center py-8">
              {filter ? t("admin.noLogsMatch") : t("admin.waitingForLogs")}
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredLogs.map((log, index) => (
                <div
                  key={index}
                  className="flex hover:bg-[#1e1a3c]/50 transition-colors group"
                >
                  <span className="text-slate-500 group-hover:text-slate-400 select-none min-w-[4rem] text-right pr-3 transition-colors">
                    {index + 1}
                  </span>
                  <span className="flex-1 break-all leading-relaxed">
                    {highlightLog(log)}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>

        <div className="p-3 border-t border-[#334155]/30 text-xs text-slate-400 text-center">
          {filter
            ? t("admin.logsFiltered", { count: filteredLogs.length })
            : t("admin.logsTotal", { count: filteredLogs.length })}
        </div>
      </div>
    </div>
  );
};

export default LogsModal;
