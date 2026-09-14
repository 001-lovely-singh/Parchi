import React from 'react';
import TierBadge from './TierBadge';

const TrendSummaryCard = ({ analyte, trend, threshold, projection, tier, brief }) => {
  return (
    <div className="p-6 bg-white border border-border-hairline rounded-xl flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{analyte}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-mono font-semibold text-text-main">
              {trend.latestValue}
            </span>
            <span className="text-xs text-text-muted">{trend.unit || ''}</span>
          </div>
        </div>
        <TierBadge tier={tier} />
      </div>

      <div className="grid grid-cols-2 gap-4 py-4 border-y border-border-hairline">
        <div>
          <span className="text-[11px] text-text-muted block mb-1">Trend Slope</span>
          <div className={`flex items-center gap-1 text-sm font-medium ${trend.slopePerYear > 0 ? 'text-orange-600' : 'text-green-600'}`}>
            {trend.slopePerYear > 0 ? '↑' : '↓'} {Math.abs(trend.slopePerYear).toFixed(3)} / yr
          </div>
        </div>
        <div>
          <span className="text-[11px] text-text-muted block mb-1">Reference Range</span>
          <span className="text-sm font-mono font-medium text-text-main">
            {threshold.value} {threshold.unit || ''}
          </span>
        </div>
      </div>

      {projection && (
        <div className="text-sm text-text-main bg-primary-light/30 p-3 rounded-lg border border-primary-light">
          <span className="font-medium text-primary">{projection.label}</span>
        </div>
      )}

      {brief && (
        <div className="mt-2">
          <p className="text-xs leading-relaxed text-text-muted italic">
            "{brief}"
          </p>
        </div>
      )}
    </div>
  );
};

export default TrendSummaryCard;
