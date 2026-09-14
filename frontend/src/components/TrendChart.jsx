import React, { useId } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const formatTickDate = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.toLocaleDateString('en-US', { month: 'short' })} '${String(d.getFullYear()).slice(-2)}`;
};

const TrendChart = ({ data, series, threshold, thresholdSource }) => {
  // data: [{ date: '2023-01-01', creatinine: 1.1, bun: 15, acr: 30 }, ...]
  // series: [{ key: 'creatinine', color: '#5ea8a8', label: 'Creatinine' }, ...]
  // threshold: { value: 1.3, label: '1.3 mg/dL' }
  const uid = useId();
  const angleTicks = data.length > 4;

  return (
    <div className="w-full h-64 relative">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: angleTicks ? 24 : 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`${uid}-grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F6" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            interval={0}
            tickFormatter={formatTickDate}
            angle={angleTicks ? -35 : 0}
            textAnchor={angleTicks ? 'end' : 'middle'}
            height={angleTicks ? 40 : 30}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={36}
            tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'var(--font-mono)' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '12px',
              boxShadow: '0 4px 16px -4px rgba(15,23,42,0.12)',
            }}
            labelStyle={{ fontWeight: '500', color: '#64748b' }}
            labelFormatter={formatTickDate}
          />

          {series.map((s) => (
            <Area
              key={`area-${s.key}`}
              type="monotone"
              dataKey={s.key}
              stroke="none"
              fill={`url(#${uid}-grad-${s.key})`}
              isAnimationActive={false}
            />
          ))}
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={{ r: 4, fill: '#fff', stroke: s.color, strokeWidth: 2.5 }}
              activeDot={{ r: 6, fill: s.color, stroke: '#fff', strokeWidth: 2 }}
              name={s.label}
            />
          ))}

          {threshold && (
            <ReferenceLine
              y={threshold.value}
              stroke="#cbd5e1"
              strokeDasharray="5 5"
              label={{
                position: 'right',
                value: threshold.label,
                fill: '#94a3b8',
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
              }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      {thresholdSource && (
        <div className="absolute -bottom-6 left-0 text-[11px] text-text-muted italic">
          Reference: {thresholdSource}
        </div>
      )}
    </div>
  );
};

export default TrendChart;
