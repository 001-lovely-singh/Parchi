import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const ClinicCodeBox = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-4 p-4 bg-primary-light/20 border border-primary-light rounded-xl max-w-sm mx-auto text-center">
      <p className="text-sm text-text-main mb-3 font-medium">Your Clinic Code</p>
      <div className="flex items-center justify-center gap-2 mb-3">
        <code className="text-2xl font-mono font-bold text-primary-dark tracking-widest px-3 py-1 bg-white border border-primary-light rounded-lg">
          {code}
        </code>
        <button
          onClick={copyToClipboard}
          className="p-2 text-text-muted hover:text-primary transition-colors"
          title="Copy code"
        >
          {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
        </button>
      </div>
      <p className="text-xs text-text-muted">
        Share this code with your patients so they can link their reports to your clinic.
      </p>
    </div>
  );
};

export default ClinicCodeBox;
