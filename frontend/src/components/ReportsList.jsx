import React, { useState } from 'react';
import { FileText, Trash2, Building2 } from 'lucide-react';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const ReportRow = ({ report, onDelete, deleting }) => {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center justify-between gap-4 py-4 px-1 border-b border-border-hairline last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary-dark">
          <FileText size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-main">{formatDate(report.reportDate)}</p>
          <p className="text-xs text-text-muted flex items-center gap-1 truncate">
            <Building2 size={11} className="shrink-0" />
            {report.labName || 'Lab not specified'} · {report.analyteCount} value{report.analyteCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>

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
