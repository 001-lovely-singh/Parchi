import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { clinicService } from '../api/clinic';
import TrendChart from '../components/TrendChart';
import TrendSummaryCard from '../components/TrendSummaryCard';
import InsufficientDataCard from '../components/InsufficientDataCard';
import { User, ChevronRight } from 'lucide-react';

const ClinicDashboard = () => {
  const [clinicData, setClinicData] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await clinicService.getPatients();
      setClinicData(data);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const renderPatientDetails = (patient) => {
    const { patients } = clinicData;
    const p = patients.find(pat => pat.patientId === patient.patientId);
    if (!p) return null;

    const renderAnalyteSection = (title, keys, combined = false) => {
      const analytics = keys.map(key => p.analytes?.[key]).filter(Boolean);
      if (analytics.length === 0) return null;

      const hasTrend = analytics.some(a => a.trend.status === 'trend_available');
      const reportsCount = analytics[0]?.trend.reportsUploaded || 0;

      return (
        <div className="mb-8">
          <h3 className="font-heading text-lg font-medium text-text-main mb-4 lowercase">{title}</h3>
          {!hasTrend ? (
            <InsufficientDataCard uploaded={reportsCount} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-border-hairline rounded-xl p-6 shadow-soft">
                <TrendChart
                  data={combined ? p.chartData : p.analytes?.hba1c?.chartData}
                  series={combined ? [
                    { key: 'creatinine', color: '#0F766E', label: 'Creatinine' },
                    { key: 'bun', color: '#2563EB', label: 'BUN' },
                    { key: 'acr', color: '#14B8A6', label: 'ACR' },
                  ] : [
                    { key: 'hba1c', color: '#0F766E', label: 'HbA1c' }
                  ]}
                  threshold={combined ? { value: 1.3, label: '1.3 mg/dL' } : { value: 6.5, label: '6.5%' }}
                  thresholdSource={combined ? "Standard upper reference limit" : "Standard diagnostic threshold"}
                />
              </div>
              <div className="flex flex-col gap-4">
                {keys.map(key => {
                  const data = p.analytes?.[key];
                  if (!data) return null;
                  return (
                    <TrendSummaryCard
                      key={key}
                      analyte={key.toUpperCase()}
                      trend={data.trend}
                      threshold={data.threshold}
                      projection={data.projection}
                      tier={data.tier?.tier}
                      brief={data.brief}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary-light text-primary-dark flex items-center justify-center font-bold text-lg">
            {p.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-heading font-bold text-text-main">{p.name}</h2>
            <p className="text-sm text-text-muted">{p.email}</p>
          </div>
        </div>
        {renderAnalyteSection('kidney', ['creatinine', 'bun', 'acr'], true)}
        {renderAnalyteSection('diabetes', ['hba1c'], false)}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg-main">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-text-main">Patients</h1>
          <div className="text-xs text-text-muted bg-white px-3 py-1 rounded-full border border-border-hairline">
            Clinic ID: {clinicData?.clinicId}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-2">
            {clinicData?.patients.map(p => (
              <button
                key={p.patientId}
                onClick={() => setSelectedPatient(p)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                  selectedPatient?.patientId === p.patientId
                    ? 'bg-primary text-white shadow-soft'
                    : 'bg-white text-text-main border border-border-hairline hover:border-primary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <User size={16} className={selectedPatient?.patientId === p.patientId ? 'text-white' : 'text-text-muted'} />
                  <span className="text-sm font-medium truncate max-w-[120px]">{p.name}</span>
                </div>
                <ChevronRight size={16} className={selectedPatient?.patientId === p.patientId ? 'text-white' : 'text-text-muted'} />
              </button>
            ))}
          </div>

          <div className="lg:col-span-3">
            {selectedPatient ? (
              renderPatientDetails(selectedPatient)
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 bg-white rounded-2xl border border-border-hairline border-dashed">
                <User size={48} className="text-gray-200 mb-4" />
                <p className="text-text-muted">Select a patient from the list to view their health trends.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClinicDashboard;
