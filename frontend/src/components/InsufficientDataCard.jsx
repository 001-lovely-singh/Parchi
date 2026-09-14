import React from 'react';

const InsufficientDataCard = ({ uploaded, needed = 4 }) => {
  const progress = (uploaded / needed) * 100;

  return (
    <div className="p-6 bg-white border border-border-hairline rounded-xl flex flex-col items-center text-center gap-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-between text-xs font-medium text-text-muted mb-2">
          <span>Progress</span>
          <span>{uploaded} of {needed} reports</span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex gap-1">
          {[...Array(needed)].map((_, i) => (
            <div
              key={i}
              className={`h-full flex-1 transition-colors duration-500 ${
                i < uploaded ? 'bg-primary' : 'bg-transparent border border-border-hairline'
              }`}
            />
          ))}
        </div>
      </div>
      <p className="text-sm text-text-muted max-w-xs">
        {uploaded} of {needed} reports uploaded — upload {needed - uploaded} more to see your trend
      </p>
    </div>
  );
};

export default InsufficientDataCard;
