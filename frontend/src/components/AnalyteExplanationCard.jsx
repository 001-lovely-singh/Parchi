import React from 'react';
import { TrendingUp, AlertTriangle, MessageCircleQuestion } from 'lucide-react';
import TierBadge from './TierBadge';

const AnalyteExplanationCard = ({ insight }) => {
  if (!insight) return null;

  const {
    label,
    unit,
    latestValue,
    latestDate,
    reference,
    tier,
    whyFlagged,
    whenToSeeDoctor,
    questionsToAsk,
    consequenceIfContinues,
    timeToThreshold,
    alreadyCrossed
  } = insight;

  return (
    <div className="bg-white border border-border-hairline rounded-xl p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h4 className="font-heading text-base font-semibold text-text-main">{label}</h4>
          {latestValue !== null && latestValue !== undefined && (
            <p className="text-sm text-text-muted mt-0.5">
              Latest:{' '}
              <span className="font-mono font-medium text-text-main">
                {latestValue} {unit}
              </span>
              {latestDate && <span className="ml-2 text-xs">({latestDate})</span>}
            </p>
          )}
        </div>
        <TierBadge tier={tier?.tier} />
      </div>

      {reference && (
        <div className="mb-4 text-sm text-text-secondary leading-relaxed">
          <p>{reference.function}</p>
          <p className="mt-2 text-xs text-text-muted">
            Normal range: {reference.normalRangeText}{' '}
            <span className="italic">(Source: {reference.source})</span>
          </p>
        </div>
      )}

      {(timeToThreshold || alreadyCrossed) && (
        <div
          className={`mb-4 flex items-start gap-3 rounded-lg border-l-4 p-4 ${
            alreadyCrossed
              ? 'bg-danger-light border-danger'
              : 'bg-warning-light border-warning'
          }`}
        >
          {alreadyCrossed ? (
            <AlertTriangle size={18} className="text-danger shrink-0 mt-0.5" />
          ) : (
            <TrendingUp size={18} className="text-warning shrink-0 mt-0.5" />
          )}
          <div>
            <span
              className={`block text-[11px] font-semibold uppercase tracking-wide mb-0.5 ${
                alreadyCrossed ? 'text-danger' : 'text-warning'
              }`}
            >
              {alreadyCrossed ? 'Already past the threshold' : 'Projected to reach threshold'}
            </span>
            <p className="text-sm font-semibold text-text-main">
              {alreadyCrossed
                ? `Your latest ${label} is at or beyond the reference threshold.`
                : `At the current rate, in about ${timeToThreshold.text}.`}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="bg-bg-main rounded-lg p-3">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">
            Why this is flagged
          </span>
          <p className="text-sm text-text-main">{whyFlagged}</p>
        </div>
        <div className="bg-bg-main rounded-lg p-3">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">
            When to see a doctor
          </span>
          <p className="text-sm text-text-main">{whenToSeeDoctor}</p>
        </div>
      </div>

      <div className="mt-3 bg-bg-main rounded-lg p-3">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">
          If this trend continues
        </span>
        <p className="text-sm text-text-main">{consequenceIfContinues}</p>
      </div>

      {questionsToAsk?.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-1.5 mb-2">
            <MessageCircleQuestion size={14} className="text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              What to ask your doctor
            </span>
          </div>
          <div className="space-y-2">
            {questionsToAsk.map((q, i) => (
              <div
                key={i}
                className="flex gap-2.5 rounded-lg border border-primary-light bg-primary-light/20 px-3 py-2.5"
              >
                <span className="font-mono text-[11px] font-semibold text-primary shrink-0 mt-0.5">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="text-sm text-text-main">{q}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyteExplanationCard;
