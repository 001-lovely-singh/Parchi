import React from 'react';
import { X } from 'lucide-react';

const VerifyTable = ({ drafts, onVerify, onValueChange, onRemove, loading }) => {
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded border border-amber-200">
              Draft — please review
            </span>
            <h3 className="font-heading text-lg font-medium text-text-main">Verify Extracted Values</h3>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs font-medium text-text-muted border-b border-border-hairline">
              <th className="py-3 px-4">Analyte</th>
              <th className="py-3 px-4">Extracted Value</th>
              <th className="py-3 px-4">Unit</th>
              <th className="py-3 px-4 text-right">Action</th>
              <th className="py-3 px-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {drafts.map((draft) => (
              <tr key={draft._id} className="border-b border-border-hairline hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 text-sm font-medium text-text-main">
                  {draft.analyteName}
                  <span className="block text-[10px] text-text-muted font-normal">{draft.rawLabel}</span>
                </td>
                <td className="py-3 px-4">
                  <input
                    type="number"
                    step="0.01"
                    value={draft.value}
                    onChange={(e) => onValueChange(draft._id, e.target.value)}
                    className="w-24 px-2 py-1 text-sm font-mono border border-border-hairline rounded focus:ring-1 focus:ring-primary outline-none"
                  />
                </td>
                <td className="py-3 px-4 text-sm text-text-muted font-mono">
                  {draft.unit}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => onValueChange(draft._id, draft.extractedValue)}
                    className="text-xs text-primary hover:underline"
                  >
                    Reset to AI
                  </button>
                </td>
                <td className="py-3 px-2 text-right">
                  <button
                    onClick={() => onRemove(draft._id)}
                    aria-label="Discard this extracted value"
                    title="Looks wrong? Remove it"
                    className="p-1 text-text-muted hover:text-danger hover:bg-danger-light rounded transition-colors"
                  >
                    <X size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end gap-3">
          <button
            disabled={loading}
            onClick={onVerify}
            className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Verify & Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyTable;
