import React from 'react';

const TIER_STYLES = {
  monitor: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/20',
  },
  discuss_next_visit: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/20',
  },
  see_doctor_soon: {
    bg: 'bg-danger/10',
    text: 'text-danger',
    border: 'border-danger/20',
  },
  unclear_trend: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
  },
};

const TierBadge = ({ tier }) => {
  const style = TIER_STYLES[tier] || TIER_STYLES.unclear_trend;

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
      {tier?.replaceAll('_', ' ').toLowerCase()}
    </span>
  );
};

export default TierBadge;
