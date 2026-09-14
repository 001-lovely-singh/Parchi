import React from 'react';
import { AlertTriangle, Stethoscope, CheckCircle2, Info } from 'lucide-react';

const LEVEL_STYLES = {
  see_doctor_soon: { bg: 'bg-danger-light', border: 'border-danger/30', text: 'text-danger', icon: AlertTriangle, label: 'Recommended: see a doctor soon' },
  discuss_next_visit: { bg: 'bg-warning-light', border: 'border-warning/30', text: 'text-warning', icon: Stethoscope, label: 'Mention this at your next visit' },
  monitor: { bg: 'bg-success-light', border: 'border-success/30', text: 'text-success', icon: CheckCircle2, label: 'No urgent visit needed' },
  gathering_data: { bg: 'bg-secondary-light', border: 'border-secondary/30', text: 'text-secondary', icon: Info, label: 'Gathering more data' }
};

const DoctorVisitBanner = ({ doctorVisit }) => {
  const style = LEVEL_STYLES[doctorVisit?.level] || LEVEL_STYLES.gathering_data;
  const Icon = style.icon;

  return (
    <div className={`flex items-start gap-4 rounded-2xl border p-6 shadow-soft ${style.bg} ${style.border}`}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white ${style.text}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wider ${style.text}`}>{style.label}</p>
        <p className="mt-1 text-base font-medium text-text-main">{doctorVisit?.message}</p>
      </div>
    </div>
  );
};

export default DoctorVisitBanner;
