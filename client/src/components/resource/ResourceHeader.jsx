import {
  ChevronUpIcon,
  ChevronDownIcon,
  ClockIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { formatDate, getTimeAgo } from "../../utils/dateUtils";

const ResourceHeader = ({
  name,
  type,
  sourceInfo,
  tag,
  statusColor,
  isExpanded,
  hasDetails,
  TypeIcon: ResourceTypeIcon, // eslint-disable-line no-unused-vars
  createdAt,
  updatedAt,
  healthBadge,
}) => {
  return (
    <>
      <div className="lg:hidden">
        <div className="flex items-start gap-3">
          {hasDetails ? (
            <div className="w-4 h-4 flex items-center justify-center mt-1">
              {isExpanded ? (
                <ChevronUpIcon
                  className="w-4 h-4 text-slate-200 flex-shrink-0"
                  strokeWidth={3}
                />
              ) : (
                <ChevronDownIcon
                  className="w-4 h-4 text-slate-200 flex-shrink-0"
                  strokeWidth={3}
                />
              )}
            </div>
          ) : (
            <div className="w-4" />
          )}

          <span
            className={`w-3 h-3 rounded-full ${statusColor} flex-shrink-0 mt-1.5`}
          ></span>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-white truncate">
                  {name}
                </h3>
                {sourceInfo && (
                  <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-1">
                    <span>{sourceInfo.icon}</span>
                    <span className="truncate">
                      {sourceInfo.value
                        .replace(/^https?:\/\//, "")
                        .replace("github.com/", "")}
                    </span>
                  </p>
                )}
              </div>
              {healthBadge}
            </div>

            {tag && (
              <span className="hidden lg:inline-block mt-2 text-xs px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                {tag}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="hidden lg:grid grid-cols-11 gap-4 items-center">
        <div className="col-span-1 flex justify-center">
          {hasDetails ? (
            <div className="w-4 h-4 flex items-center justify-center">
              {isExpanded ? (
                <ChevronUpIcon
                  className="w-4 h-4 text-slate-200 flex-shrink-0"
                  strokeWidth={3}
                />
              ) : (
                <ChevronDownIcon
                  className="w-4 h-4 text-slate-200 flex-shrink-0"
                  strokeWidth={3}
                />
              )}
            </div>
          ) : (
            <div className="w-4" />
          )}
        </div>

        <div className="col-span-1 flex justify-center">
          <span className={`w-3 h-3 rounded-full ${statusColor}`}></span>
        </div>

        <div className="col-span-2 flex justify-center">
          <div className="flex flex-col gap-1 items-center w-full px-2">
            <span className="text-white font-medium truncate block text-sm w-full text-center">
              {name}
            </span>
            {healthBadge}
            {sourceInfo && (
              <span className="text-xs text-slate-400 truncate flex items-center gap-1">
                <span>{sourceInfo.icon}</span>
                <span className="truncate">
                  {sourceInfo.value
                    .replace(/^https?:\/\//, "")
                    .replace("github.com/", "")}
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="col-span-2 flex justify-center">
          {createdAt && (
            <div className="flex flex-col gap-0.5 items-center">
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700/50 rounded-md text-xs text-slate-300 border border-slate-600/30">
                <ClockIcon className="w-3 h-3" />
                <span>{formatDate(createdAt)}</span>
              </div>
              <span className="text-xs text-slate-300 italic">
                {getTimeAgo(createdAt)}
              </span>
            </div>
          )}
        </div>

        <div className="col-span-2 flex justify-center">
          {updatedAt && (
            <div className="flex flex-col gap-0.5 items-center">
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700/50 rounded-md text-xs text-slate-300 border border-slate-600/30">
                <ArrowPathIcon className="w-3 h-3" />
                <span>{formatDate(updatedAt)}</span>
              </div>
              <span className="text-xs text-slate-300 italic">
                {getTimeAgo(updatedAt)}
              </span>
            </div>
          )}
        </div>

        <div className="col-span-3 flex justify-center">
          <div className="flex flex-col gap-1.5 items-center">
            <div className="flex items-center gap-2">
              <ResourceTypeIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-300 text-sm">{type}</span>
            </div>
            {tag && (
              <span className="inline-block min-w-32 truncate text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30 text-center">
                {tag}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ResourceHeader;
