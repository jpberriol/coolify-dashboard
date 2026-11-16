import { useEffect, useId, useRef, useState } from "react";
import { buildTicks, tickLabel } from "../../utils/timeTicks";

const niceMax = (value) => {
  if (value <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const n = value / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
};

const useWidth = () => {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setWidth(el.clientWidth);
    update();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
};

/**
 * Line/area chart with a real time axis. X positions follow the timestamps
 * between `from` and `to`, so gaps in the data stay visible, and the tick
 * labels adapt to the selected range.
 *
 * data: [{ t, v }]   max: fixed y max (e.g. 100), otherwise auto-scaled
 * format: value formatter used for the axis max and the hover readout
 */
const TimeChart = ({
  data,
  from,
  to,
  max,
  color = "#34d399",
  height = 96,
  format = (v) => String(v),
  emptyText = "No data for this period",
}) => {
  const id = useId();
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);

  const axisH = 18;
  const plotH = height - axisH;
  const span = Math.max(1, to - from);
  const top = max ?? niceMax(Math.max(0, ...data.map((d) => d.v)));
  const x = (t) => ((t - from) / span) * width;
  const y = (v) =>
    plotH - 2 - (Math.min(Math.max(v, 0), top) / top) * (plotH - 6);

  // Break the line where samples are far apart (downtime / missing data).
  const gaps = data
    .slice(1)
    .map((d, i) => d.t - data[i].t)
    .sort((a, b) => a - b);
  const typical = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 0;
  const segments = [];
  data.forEach((d, i) => {
    if (i === 0 || d.t - data[i - 1].t > Math.max(typical * 6, 90000)) {
      segments.push([]);
    }
    segments[segments.length - 1].push(d);
  });

  const { ticks, step } = buildTicks(from, to);

  const onMove = (e) => {
    if (!data.length || !width) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const t = from + ((e.clientX - rect.left) / rect.width) * span;
    const nearest = data.reduce((a, d) =>
      Math.abs(d.t - t) < Math.abs(a.t - t) ? d : a
    );
    setHover(nearest);
  };

  return (
    <div ref={ref} className="w-full select-none">
      {width > 0 && (
        <svg width={width} height={height} className="block">
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* grid + x ticks */}
          {ticks.map((t) => {
            const tx = x(t);
            const anchor =
              tx < 22 ? "start" : tx > width - 22 ? "end" : "middle";
            return (
              <g key={t}>
                <line
                  x1={tx}
                  x2={tx}
                  y1={0}
                  y2={plotH}
                  stroke="#1e293b"
                  strokeWidth="1"
                />
                <text
                  x={tx}
                  y={height - 4}
                  textAnchor={anchor}
                  fontSize="10"
                  fill="#64748b"
                >
                  {tickLabel(t, step, span)}
                </text>
              </g>
            );
          })}
          <line x1={0} x2={width} y1={plotH} y2={plotH} stroke="#334155" />
          <line
            x1={0}
            x2={width}
            y1={y(top)}
            y2={y(top)}
            stroke="#1e293b"
            strokeDasharray="3 3"
          />

          {/* y max label */}
          <text x={4} y={11} fontSize="10" fill="#64748b">
            {format(top)}
          </text>

          {!data.length && (
            <text
              x={width / 2}
              y={plotH / 2 + 4}
              textAnchor="middle"
              fontSize="11"
              fill="#64748b"
            >
              {emptyText}
            </text>
          )}

          {/* series */}
          {segments.map((seg, i) => {
            if (seg.length === 1) {
              return (
                <circle
                  key={i}
                  cx={x(seg[0].t)}
                  cy={y(seg[0].v)}
                  r="1.5"
                  fill={color}
                />
              );
            }
            const pts = seg
              .map((d) => `${x(d.t).toFixed(1)},${y(d.v).toFixed(1)}`)
              .join(" ");
            const area = `${x(seg[0].t).toFixed(1)},${plotH} ${pts} ${x(seg[seg.length - 1].t).toFixed(1)},${plotH}`;
            return (
              <g key={i}>
                <polygon points={area} fill={`url(#${id})`} />
                <polyline
                  points={pts}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* hover */}
          {hover && (
            <g pointerEvents="none">
              <line
                x1={x(hover.t)}
                x2={x(hover.t)}
                y1={0}
                y2={plotH}
                stroke="#94a3b8"
                strokeDasharray="2 2"
              />
              <circle cx={x(hover.t)} cy={y(hover.v)} r="3" fill={color} />
            </g>
          )}

          <rect
            x={0}
            y={0}
            width={width}
            height={plotH}
            fill="transparent"
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
          />
        </svg>
      )}
      <div className="h-4 -mt-1 text-[11px] font-mono text-slate-400 text-right">
        {hover
          ? `${new Date(hover.t).toLocaleString("en-GB", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })} · ${format(hover.v)}`
          : ""}
      </div>
    </div>
  );
};

export default TimeChart;
