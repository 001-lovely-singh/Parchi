import React from 'react';
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
    consequenceIfContinues
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
        <div className="mt-3">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">
            What to ask your doctor
          </span>
          <ul className="list-disc list-inside space-y-1 text-sm text-text-main">
            {questionsToAsk.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AnalyteExplanationCard;
