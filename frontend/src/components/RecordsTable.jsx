import React from 'react';

const STATUS_STYLES = {
  concerning: { bg: 'bg-danger-light', text: 'text-danger', label: 'Concerning' },
  borderline: { bg: 'bg-warning-light', text: 'text-warning', label: 'Borderline' },
  normal: { bg: 'bg-success-light', text: 'text-success', label: 'Normal' },
  unclassified: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'On record' }
};

const RecordsTable = ({ records }) => {
  if (!records || records.length === 0) {
    return (
      <div className="bg-white border border-border-hairline rounded-xl p-6 text-sm text-text-muted">
        No verified values yet.
      </div>
    );
  }

  return (
    <div className="bg-white border border-border-hairline rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs font-medium text-text-muted border-b border-border-hairline bg-bg-main">
              <th className="py-3 px-4">Marker</th>
              <th className="py-3 px-4">Value</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const style = STATUS_STYLES[r.status] || STATUS_STYLES.unclassified;
              return (
                <tr key={r.analyteKey} className="border-b border-border-hairline last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-text-main">{r.label}</td>
                  <td className="py-3 px-4 text-sm font-mono text-text-main">
                    {r.value} <span className="text-text-muted">{r.unit}</span>
                  </td>
                  <td className="py-3 px-4 text-xs text-text-muted">{r.date}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecordsTable;
