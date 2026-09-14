// ============================================================
// Deterministic clinical math — NO AI involved here.
// Every constant below is cited so the source is auditable.
// ============================================================

const MIN_REPORTS_FOR_TREND = 4; // isse pehle sirf "aur reports chahiye" notice, koi alert nahi

// ---- eGFR: CKD-EPI 2021 race-free creatinine equation (Inker et al., NEJM 2021) ----
function calculateEGFR({ creatinine, age, sex }) {
  const isFemale = sex === 'female';
  const kappa = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;
  const scr = creatinine;

  const minRatio = Math.min(scr / kappa, 1);
  const maxRatio = Math.max(scr / kappa, 1);

  let egfr = 142 * Math.pow(minRatio, alpha) * Math.pow(maxRatio, -1.2) * Math.pow(0.9938, age);
  if (isFemale) egfr *= 1.012;

  return Number(egfr.toFixed(1));
}

// ---- KDIGO CKD stage boundaries (KDIGO Clinical Practice Guideline for CKD) ----
function getCkdStage(egfr) {
  if (egfr >= 90) return { stage: 'G1', label: 'Normal or high', thresholdSource: 'KDIGO' };
  if (egfr >= 60) return { stage: 'G2', label: 'Mildly decreased', thresholdSource: 'KDIGO' };
  if (egfr >= 45) return { stage: 'G3a', label: 'Mildly to moderately decreased', thresholdSource: 'KDIGO' };
  if (egfr >= 30) return { stage: 'G3b', label: 'Moderately to severely decreased', thresholdSource: 'KDIGO' };
  if (egfr >= 15) return { stage: 'G4', label: 'Severely decreased', thresholdSource: 'KDIGO' };
  return { stage: 'G5', label: 'Kidney failure', thresholdSource: 'KDIGO' };
}

// ---- HbA1c category (ADA Standards of Care in Diabetes) ----
function getHbA1cCategory(hba1c) {
  if (hba1c < 5.7) return { category: 'normal', thresholdSource: 'ADA' };
  if (hba1c < 6.5) return { category: 'prediabetes', thresholdSource: 'ADA' };
  return { category: 'diabetes_range', thresholdSource: 'ADA' };
}

// ---- Trend slope: simple linear regression over time ----
function calculateTrendSlope(points) {
  if (!points || points.length < MIN_REPORTS_FOR_TREND) {
    return {
      status: 'insufficient_data',
      reportsUploaded: points ? points.length : 0,
      reportsNeeded: MIN_REPORTS_FOR_TREND - (points ? points.length : 0),
      slopePerYear: null
    };
  }

  const sorted = [...points].sort((a, b) => new Date(a.date) - new Date(b.date));
  const t0 = new Date(sorted[0].date).getTime();
  const msPerYear = 1000 * 60 * 60 * 24 * 365;

  const x = sorted.map((p) => (new Date(p.date).getTime() - t0) / msPerYear);
  const y = sorted.map((p) => p.value);
  const n = x.length;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);

  const denom = n * sumXX - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const yMean = sumY / n;
  const ssTot = y.reduce((acc, yi) => acc + (yi - yMean) ** 2, 0);
  const ssRes = y.reduce((acc, yi, i) => acc + (yi - (slope * x[i] + intercept)) ** 2, 0);
  const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  return {
    status: 'trend_available',
    reportsUploaded: n,
    slopePerYear: Number(slope.toFixed(4)),
    rSquared: Number(rSquared.toFixed(3)),
    latestValue: y[n - 1]
  };
}

// ---- Threshold crossing projection ----
// direction 'above' (default): concerning when value RISES above threshold (creatinine, bun, acr, hba1c)
// direction 'below': concerning when value FALLS below threshold (egfr — declining kidney function)
function projectThresholdCrossing({ slopePerYear, latestValue, threshold, direction = 'above' }) {
  if (slopePerYear === null) return null;

  if (direction === 'below') {
    if (slopePerYear >= 0) return null; // not declining — no crossing to project
    if (latestValue <= threshold) return { alreadyCrossed: true };

    return {
      alreadyCrossed: false,
      yearsToThreshold: Number(((latestValue - threshold) / -slopePerYear).toFixed(1))
    };
  }

  if (slopePerYear <= 0) return null;
  if (latestValue >= threshold) return { alreadyCrossed: true };

  return {
    alreadyCrossed: false,
    yearsToThreshold: Number(((threshold - latestValue) / slopePerYear).toFixed(1))
  };
}

// ---- Escalation tier: value + rate-of-change dono dekhta hai ----
// NOTE: UI text me kabhi "diagnose"/"predict" use mat karna — sirf trend/direction.
function getEscalationTier({ trend, projection, rSquared }) {
  if (trend.status === 'insufficient_data') {
    return { tier: 'gathering_data', label: 'More reports needed' };
  }

  if (rSquared !== null && rSquared < 0.3) {
    return { tier: 'unclear_trend', label: 'Values fluctuating — trend not clear yet' };
  }

  if (!projection) return { tier: 'monitor', label: 'Stable — routine monitoring' };
  if (projection.alreadyCrossed) return { tier: 'see_doctor_soon', label: 'Already near/above reference threshold' };
  if (projection.yearsToThreshold <= 2) return { tier: 'discuss_next_visit', label: 'Trending toward threshold within ~2 years' };

  return { tier: 'monitor', label: 'Slow trend — routine monitoring' };
}

module.exports = {
  MIN_REPORTS_FOR_TREND,
  calculateEGFR,
  getCkdStage,
  getHbA1cCategory,
  calculateTrendSlope,
  projectThresholdCrossing,
  getEscalationTier
};