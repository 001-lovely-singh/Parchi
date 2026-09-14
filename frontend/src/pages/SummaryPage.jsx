import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, Download } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import Navbar from '../components/Navbar';
import UploadReportModal from '../components/UploadReportModal';
import TrendChart from '../components/TrendChart';
import InsufficientDataCard from '../components/InsufficientDataCard';
import DoctorVisitBanner from '../components/DoctorVisitBanner';
import AnalyteExplanationCard from '../components/AnalyteExplanationCard';
import KeepAnEyeCard from '../components/KeepAnEyeCard';
import RecordsTable from '../components/RecordsTable';
import HabitsCard from '../components/HabitsCard';
import { patientService } from '../api/patient';

// Blobs can't be handed to the user with <a download> inside the Android
// webview, so on native we write the file and open the share sheet instead.
const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const SummaryPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchSummary = async () => {
    try {
      const result = await patientService.getSummary();
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not load your summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const blob = await patientService.getSummaryPdf();
      const fileName = `Parchi-Summary-${new Date().toISOString().slice(0, 10)}.pdf`;

      if (Capacitor.isNativePlatform()) {
        const base64 = await blobToBase64(blob);
        const { uri } = await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Cache,
        });
        await Share.share({ title: 'Parchi health summary', url: uri });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      alert('Could not create the PDF: ' + (err.response?.data?.message || err.message));
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="w-12 h-12 border-4 border-primary-light border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-main">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-24 text-center">
          <p className="text-danger font-medium mb-4">{error}</p>
          <Link to="/patient-dashboard" className="text-primary hover:underline text-sm">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!data || data.patient.reportsCount === 0) {
    return (
      <div className="min-h-screen bg-bg-main">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-24 text-center">
          <h2 className="font-heading text-xl font-semibold text-text-main mb-2">No summary yet</h2>
          <p className="text-sm text-text-muted mb-6">
            Upload and verify your first report to see your personalized summary here.
          </p>
          <Link
            to="/patient-dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { kidney, diabetes } = data;
  const creatinineThreshold = kidney.analytes.creatinine?.threshold;
  const egfrThreshold = kidney.analytes.egfr?.threshold;
  const hba1cThreshold = diabetes.analytes.hba1c?.threshold;

  return (
    <div className="min-h-screen bg-bg-main">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Link to="/patient-dashboard" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to dashboard
        </Link>

        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-text-main">{data.patient.name}'s summary</h1>
            <p className="text-sm text-text-muted mt-1">
              Based on {data.patient.reportsCount} report{data.patient.reportsCount === 1 ? '' : 's'} from{' '}
              {data.patient.rangeStart} to {data.patient.rangeEnd}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-border-hairline text-text-main rounded-lg text-sm font-medium hover:bg-bg-main transition-colors disabled:opacity-50"
            >
              <Download size={16} />
              {downloading ? 'Preparing…' : 'Download PDF'}
            </button>
            <button
              onClick={() => setUploadOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              <Upload size={16} />
              Upload Report
            </button>
          </div>
        </div>

        <div className="mb-10">
          <DoctorVisitBanner doctorVisit={data.doctorVisit} />
        </div>

        <section className="mb-12">
          <h2 className="font-heading text-xl font-medium text-text-main mb-6">What we found</h2>

          {/* ---- Kidney ---- */}
          <div className="mb-10">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-4">Kidney</h3>

            {!kidney.hasTrend ? (
              <InsufficientDataCard uploaded={kidney.reportsUploaded} />
            ) : (
              <>
                {kidney.allNormal && (
                  <div className="mb-4 text-sm text-success bg-success-light border border-success/20 rounded-lg px-4 py-3">
                    Your kidney markers are within a stable, healthy range based on your reports.
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white border border-border-hairline rounded-xl p-6 shadow-soft">
                    <p className="text-xs font-medium text-text-muted mb-2">Creatinine</p>
                    <TrendChart
                      data={kidney.chartData}
                      series={[{ key: 'creatinine', color: '#0F766E', label: 'Creatinine' }]}
                      threshold={creatinineThreshold ? { value: creatinineThreshold.value, label: `${creatinineThreshold.value} mg/dL` } : null}
                      thresholdSource={creatinineThreshold?.source}
                    />
                  </div>
                  <div className="bg-white border border-border-hairline rounded-xl p-6 shadow-soft">
                    <p className="text-xs font-medium text-text-muted mb-2">BUN</p>
                    <TrendChart
                      data={kidney.chartData}
                      series={[{ key: 'bun', color: '#2563EB', label: 'BUN' }]}
                      threshold={kidney.analytes.bun?.threshold ? { value: kidney.analytes.bun.threshold.value, label: `${kidney.analytes.bun.threshold.value} mg/dL` } : null}
                      thresholdSource={kidney.analytes.bun?.threshold?.source}
                    />
                  </div>
                  <div className="bg-white border border-border-hairline rounded-xl p-6 shadow-soft">
                    <p className="text-xs font-medium text-text-muted mb-2">eGFR</p>
                    <TrendChart
                      data={kidney.egfrChartData}
                      series={[{ key: 'egfr', color: '#14B8A6', label: 'eGFR' }]}
                      threshold={egfrThreshold ? { value: egfrThreshold.value, label: `${egfrThreshold.value} mL/min` } : null}
                      thresholdSource={egfrThreshold?.source}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {['creatinine', 'egfr', 'bun', 'acr'].map((key) => (
                <AnalyteExplanationCard key={key} insight={kidney.analytes[key]} />
              ))}
            </div>
          </div>

          {/* ---- Diabetes ---- */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-4">Diabetes</h3>

            {!diabetes.hasTrend ? (
              <InsufficientDataCard uploaded={diabetes.reportsUploaded} />
            ) : (
              <>
                {diabetes.allNormal && (
                  <div className="mb-4 text-sm text-success bg-success-light border border-success/20 rounded-lg px-4 py-3">
                    Your HbA1c is within a stable, healthy range based on your reports.
                  </div>
                )}
                <div className="bg-white border border-border-hairline rounded-xl p-6 shadow-soft mb-6 max-w-xl">
                  <p className="text-xs font-medium text-text-muted mb-2">HbA1c</p>
                  <TrendChart
                    data={diabetes.chartData}
                    series={[{ key: 'hba1c', color: '#0F766E', label: 'HbA1c' }]}
                    threshold={hba1cThreshold ? { value: hba1cThreshold.value, label: `${hba1cThreshold.value}%` } : null}
                    thresholdSource={hba1cThreshold?.source}
                  />
                </div>
              </>
            )}

            <div className="max-w-xl">
              <AnalyteExplanationCard insight={diabetes.analytes.hba1c} />
            </div>
          </div>
        </section>

        <section className="mb-10">
          <KeepAnEyeCard items={data.keepAnEye} allNormal={data.allNormal} />
        </section>

        <section className="mb-10">
          <h2 className="font-heading text-xl font-medium text-text-main mb-4">All values</h2>
          <RecordsTable records={data.records} />
        </section>

        <section className="mb-10">
          <HabitsCard habits={data.habits} />
        </section>
      </main>

      <UploadReportModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onComplete={fetchSummary}
      />
    </div>
  );
};

export default SummaryPage;
