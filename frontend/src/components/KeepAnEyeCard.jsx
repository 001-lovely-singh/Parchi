import React from 'react';
import { Eye, ShieldCheck } from 'lucide-react';

const KeepAnEyeCard = ({ items, allNormal }) => {
  if (allNormal) {
    return (
      <div className="flex items-center gap-3 bg-success-light border border-success/20 rounded-xl p-5">
        <ShieldCheck className="text-success shrink-0" size={22} />
        <p className="text-sm font-medium text-text-main">
          Everything looks healthy right now — all your tracked markers are within normal, expected ranges.
        </p>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-border-hairline rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="text-warning" size={18} />
        <h3 className="font-heading text-base font-semibold text-text-main">Keep an eye on</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.analyteKey} className="bg-warning-light/50 border border-warning/20 rounded-lg p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-text-main">{item.label}</span>
              <span className="font-mono text-sm text-text-main">
                {item.currentValue} {item.unit}
              </span>
            </div>
            <p className="mt-1 text-xs text-text-muted leading-relaxed">{item.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KeepAnEyeCard;
