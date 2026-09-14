import React, { useState } from 'react';
import { FileText, Trash2, Building2, ChevronDown } from 'lucide-react';
import { reportService } from '../api/reports';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const ReportRow = ({ report, onDelete, deleting }) => {
  const [confirming, setConfirming] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const toggle = async () => {
    const next = !expanded;
    setExpanded(next);

    if (next && !details) {
      setLoadingDetails(true);
      try {
        setDetails(await reportService.get(report._id));
      } catch (err) {
        console.error('Could not load report values:', err);
      } finally {
        setLoadingDetails(false);
      }
    }
  };

  return (
    <div className="border-b border-border-hairline last:border-0">
      <div className="flex items-center justify-between gap-4 py-4 px-1">
        <button
          onClick={toggle}
          aria-expanded={expanded}
          className="flex items-center gap-3 min-w-0 flex-1 text-left group"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary-dark">
            <FileText size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-main group-hover:text-primary transition-colors">
              {formatDate(report.reportDate)}
            </p>
            <p className="text-xs text-text-muted flex items-center gap-1 truncate">
              <Building2 size={11} className="shrink-0" />
              {report.labName || 'Lab not specified'} · {report.analyteCount} value
              {report.analyteCount === 1 ? '' : 's'}
            </p>
          </div>
          <ChevronDown
            size={16}
            className={`shrink-0 text-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>

        {confirming ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-text-muted hidden sm:inline">Delete this report?</span>
            <button
              onClick={() => setConfirming(false)}
              className="px-2.5 py-1.5 text-xs font-medium text-text-muted hover:text-text-main rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onDelete(report._id)}
              disabled={deleting}
              className="px-2.5 py-1.5 text-xs font-medium text-white bg-danger rounded-lg hover:bg-danger/90 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Confirm delete'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            aria-label="Delete report"
            className="shrink-0 p-2 text-text-muted hover:text-danger hover:bg-danger-light rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {expanded && (
        <div className="pb-4 pl-12 pr-1">
          {loadingDetails && <p className="text-xs text-text-muted py-2">Loading values…</p>}

          {!loadingDetails && details?.records?.length === 0 && (
            <p className="text-xs text-text-muted py-2">No values were saved from this report.</p>
          )}

          {!loadingDetails && details?.records?.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border-hairline">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide text-text-muted bg-bg-main">
                    <th className="py-2 px-3 font-medium">Marker</th>
                    <th className="py-2 px-3 font-medium">Value</th>
                    <th className="py-2 px-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {details.records.map((r) => (
                    <tr key={r._id} className="border-t border-border-hairline">
                      <td className="py-2 px-3 text-xs text-text-main">
                        {r.rawLabel || r.analyteName}
                      </td>
                      <td className="py-2 px-3 text-xs font-mono text-text-main">
                        {r.value} <span className="text-text-muted">{r.unit}</span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            r.status === 'verified'
                              ? 'bg-success-light text-success'
                              : 'bg-warning-light text-warning'
                          }`}
                        >
                          {r.status === 'verified' ? 'verified' : 'unverified'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ReportsList = ({ reports, onDelete, deletingId }) => {
  if (!reports || reports.length === 0) {
    return (
      <div className="bg-white border border-border-hairline rounded-xl p-8 text-center">
        <p className="text-sm text-text-muted">No reports uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border-hairline rounded-xl px-4 shadow-soft">
      {reports.map((report) => (
        <ReportRow key={report._id} report={report} onDelete={onDelete} deleting={deletingId === report._id} />
      ))}
    </div>
  );
};

export default ReportsList;
