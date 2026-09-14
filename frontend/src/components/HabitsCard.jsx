import React from 'react';
import { Salad, Footprints, Sparkles, AlertCircle } from 'lucide-react';

const GROUPS = [
  { key: 'diet', title: 'Diet', icon: Salad },
  { key: 'movement', title: 'Movement', icon: Footprints },
  { key: 'general', title: 'General', icon: Sparkles }
];

const HabitsCard = ({ habits }) => {
  if (!habits) return null;
  const hasAnyPoints = GROUPS.some((g) => habits[g.key]?.length > 0);

  return (
    <div className="bg-white border border-border-hairline rounded-xl p-6">
      <h3 className="font-heading text-base font-semibold text-text-main mb-4">Everyday habits</h3>

      {hasAnyPoints ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {GROUPS.map(({ key, title, icon: Icon }) => {
            const points = habits[key] || [];
            if (points.length === 0) return null;
            return (
              <div key={key} className="bg-bg-main rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={16} className="text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">{title}</span>
                </div>
                <ul className="space-y-1.5 text-sm text-text-main list-disc list-inside">
                  {points.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-text-muted">Habit suggestions will appear here once available.</p>
      )}

      <div className="mt-4 flex items-start gap-2 bg-warning-light/60 border border-warning/20 rounded-lg p-3">
        <AlertCircle size={16} className="text-warning shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary leading-relaxed">{habits.disclaimer}</p>
      </div>
    </div>
  );
};

export default HabitsCard;
