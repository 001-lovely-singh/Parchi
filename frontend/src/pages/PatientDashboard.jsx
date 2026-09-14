import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ReportsList from '../components/ReportsList';
import UploadReportModal from '../components/UploadReportModal';
import { Upload, FileBarChart, ArrowRight } from 'lucide-react';
import { reportService } from '../api/reports';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      setReports(await reportService.list());
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    setDeletingId(reportId);
    try {
      await reportService.remove(reportId);
      setReports((prev) => prev.filter((r) => r._id !== reportId));
    } catch (err) {
      alert('Could not delete report: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-light border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-text-main">Your Reports</h1>
            <p className="text-sm text-text-muted">Upload lab reports and keep your history clean and accurate.</p>
          </div>
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            <Upload size={16} />
            Upload Report
          </button>
        </div>

        {reports.length > 0 && (
          <button
            onClick={() => navigate('/patient-dashboard/summary')}
            className="w-full mb-6 flex items-center justify-between gap-4 px-6 py-4 bg-primary-light/40 border border-primary-light rounded-xl hover:bg-primary-light/60 transition-colors group"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary">
                <FileBarChart size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-main">View your health summary</p>
                <p className="text-xs text-text-muted">
                  Trends, doctor-visit guidance, and everyday habits based on {reports.length} report
                  {reports.length === 1 ? '' : 's'}.
                </p>
              </div>
            </div>
            <ArrowRight size={18} className="text-primary shrink-0 transition-transform group-hover:translate-x-0.5" />
          </button>
        )}

        <ReportsList reports={reports} onDelete={handleDeleteReport} deletingId={deletingId} />
      </main>

      <UploadReportModal open={uploadOpen} onClose={() => setUploadOpen(false)} onComplete={fetchReports} />
    </div>
  );
};

export default PatientDashboard;
