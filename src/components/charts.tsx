'use client';

import { formatFullNumber, formatNumber } from '@/lib/client';
import type { AnalyticsPoint } from '@/lib/types';

function pointsToPath(values: number[], width: number, height: number, pad: number): string {
  if (values.length === 0) return '';
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
  return values
    .map((value, index) => {
      const x = pad + index * step;
      const y = height - pad - (value / max) * (height - pad * 2);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function EngagementChart({ data }: { data: AnalyticsPoint[] }) {
  const width = 760;
  const height = 250;
  const pad = 28;
  const impressions = data.map((point) => point.impressions);
  const engagements = data.map((point) => point.likes + point.comments + point.shares);
  const impressionsPath = pointsToPath(impressions, width, height, pad);
  const engagementPath = pointsToPath(engagements, width, height, pad);
  const maxValue = Math.max(...impressions, 1);
  const step = data.length > 1 ? (width - pad * 2) / (data.length - 1) : 0;
  const labels = data.length
    ? [0, Math.floor((data.length - 1) / 2), data.length - 1].filter(
        (index, position, list) => list.indexOf(index) === position
      )
    : [];

  if (data.length === 0) {
    return <div className="flex h-[250px] items-center justify-center text-sm text-[#8b98a5]">No analytics yet.</div>;
  }

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-[#8b98a5]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#00ff88]" /> Impressions
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#8b5cf6]" /> Engagements
        </span>
        <span className="ml-auto">Peak {formatNumber(maxValue)}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[210px] w-full overflow-visible" role="img" aria-label="Engagement over time">
        <defs>
          <linearGradient id="impressionsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00ff88" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = pad + ratio * (height - pad * 2);
          return (
            <line
              key={ratio}
              x1={pad}
              x2={width - pad}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          );
        })}
        <path
          d={`${impressionsPath} L${width - pad},${height - pad} L${pad},${height - pad} Z`}
          fill="url(#impressionsFill)"
        />
        <path d={impressionsPath} fill="none" stroke="#00ff88" strokeWidth="2.4" strokeLinejoin="round" />
        <path d={engagementPath} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4 4" />
        {data.map((point, index) => {
          const x = pad + index * step;
          const y = height - pad - (point.impressions / maxValue) * (height - pad * 2);
          return index % Math.max(Math.floor(data.length / 10), 1) === 0 ? (
            <circle key={point.date} cx={x} cy={y} r="2.2" fill="#00ff88" opacity="0.85" />
          ) : null;
        })}
        {labels.map((index) => {
          const x = pad + index * step;
          return (
            <text
              key={index}
              x={x}
              y={height - 8}
              fill="#6b7785"
              fontSize="10.5"
              textAnchor={index === 0 ? 'start' : index === data.length - 1 ? 'end' : 'middle'}
            >
              {new Date(`${data[index].date}T12:00:00`).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export function BarList({
  items,
}: {
  items: Array<{ label: string; value: number; color: string; hint?: string }>;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-[#c9d3dc]">{item.label}</span>
            <span className="text-[#8b98a5]">{item.hint ?? formatFullNumber(item.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/6">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max((item.value / max) * 100, 2)}%`, background: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Sparkline({ values, color = '#00ff88' }: { values: number[]; color?: string }) {
  const width = 120;
  const height = 34;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  const path = values
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / Math.max(max - min, 1)) * height;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-8 w-full" aria-hidden="true">
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function DonutStat({
  value,
  label,
  color = '#00ff88',
}: {
  value: number;
  label: string;
  color?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative flex h-16 w-16 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(${color} ${clamped * 3.6}deg, rgba(255,255,255,0.07) 0deg)`,
        }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0c1116] text-xs font-bold text-white">
          {Math.round(value)}%
        </div>
      </div>
      <p className="text-xs text-[#8b98a5]">{label}</p>
    </div>
  );
}
