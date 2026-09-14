import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Upload, FileText, Camera as CameraIcon } from 'lucide-react';
import { reportService } from '../api/reports';
import VerifyTable from './VerifyTable';

const isNative = Capacitor.isNativePlatform();

// Shared by the dashboard and the summary page so a patient can upload the next
// report from wherever they are. The report's date comes from the report itself
// during extraction, so this flow never asks for it.
const UploadReportModal = ({ open, onClose, onComplete }) => {
  const [step, setStep] = useState('upload'); // upload | processing | verify
  const [drafts, setDrafts] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (open) {
      setStep('upload');
      setDrafts([]);
    }
  }, [open]);

  if (!open) return null;

  const processFile = async (file) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Please upload a file smaller than 5MB.');
      return;
    }

    setStep('processing');
    try {
      // created only once a file is actually chosen, so abandoning the modal
      // doesn't leave an empty report behind
      const created = await reportService.upload({});
      const reportId = created.reportId || created._id;

      const result = await reportService.extract(reportId, file);
      if (result?.drafts && Array.isArray(result.drafts)) {
        setDrafts(result.drafts);
        setStep('verify');
      } else {
        throw new Error(result.message || 'The AI could not find any readable lab values in this report.');
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Extraction failed. Please try again.';
      console.error('Extraction Error Details:', err);
      alert('Extraction Error: ' + message);
      setStep('upload');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) await processFile(file);
  };

  const handleTakePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });
      const blob = await (await fetch(photo.webPath)).blob();
      const file = new File([blob], `report.${photo.format || 'jpg'}`, { type: blob.type || 'image/jpeg' });
      await processFile(file);
    } catch (err) {
      // Camera.getPhoto throws when the user backs out — nothing to handle
      console.log('Camera capture cancelled or failed:', err?.message);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      await reportService.verify(drafts);
      onComplete?.();
      onClose();
    } catch (err) {
      alert('Verification failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-soft overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-border-hairline flex justify-between items-center">
          <h3 className="font-heading font-semibold text-text-main">Upload Lab Report</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-main">✕</button>
        </div>

        <div className="p-6 overflow-y-auto">
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center text-primary-dark mb-4">
                <FileText size={32} />
              </div>
              <h4 className="font-heading font-medium text-text-main mb-2">Upload your report</h4>
              <p className="text-sm text-text-muted mb-6 max-w-sm">
                {isNative
                  ? 'Take a photo of your lab report, or pick a PDF or image from your device. The report date is read from the report itself.'
                  : 'Upload a PDF, JPG, or PNG of your lab report. The report date is read from the report itself.'}
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {isNative && (
                  <button
                    onClick={handleTakePhoto}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors flex items-center gap-2"
                  >
                    <CameraIcon size={18} />
                    Take Photo
                  </button>
                )}
                <label
                  className={`cursor-pointer px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                    isNative
                      ? 'bg-white border border-border-hairline text-text-main hover:bg-bg-main'
                      : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
                >
                  <Upload size={18} />
                  {isNative ? 'Choose File' : 'Select File'}
                  <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                </label>
              </div>
              <p className="mt-4 text-[11px] text-text-muted italic">Maximum file size: 5MB</p>
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 border-4 border-primary-light border-t-primary rounded-full animate-spin mb-6"></div>
              <h4 className="font-heading font-medium text-text-main mb-2">Reading your report…</h4>
              <p className="text-sm text-text-muted">This usually takes a few seconds.</p>
            </div>
          )}

          {step === 'verify' && (
            <VerifyTable
              drafts={drafts}
              loading={isVerifying}
              onValueChange={(id, val) => setDrafts((prev) => prev.map((d) => (d._id === id ? { ...d, value: val } : d)))}
              onRemove={(id) => setDrafts((prev) => prev.filter((d) => d._id !== id))}
              onVerify={handleVerify}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadReportModal;
