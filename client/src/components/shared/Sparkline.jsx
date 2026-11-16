import { useId } from "react";

/**
 * Tiny dependency-free SVG area/line chart.
 * `data` is an array of numbers; `max` fixes the y-scale (e.g. 100 for %).
 */
const Sparkline = ({
  data,
  max,
  color = "#34d399",
  height = 36,
  className = "",
}) => {
  const id = useId();
  const width = 120;

  if (!data || data.length < 2) {
    return <div className={className} style={{ height }} aria-hidden="true" />;
  }

  const top = max ?? Math.max(...data, 1);
  const step = width / (data.length - 1);
  const points = data.map((v, i) => {
    const y = height - 2 - (Math.min(v, top) / top) * (height - 4);
    return [i * step, y];
  });
  const line = points
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `0,${height} ${line} ${width},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={`w-full ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Sparkline;
