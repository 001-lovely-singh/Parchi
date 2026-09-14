const AnalyteRecord = require('../models/AnalyteRecord');
const Report = require('../models/Report');
const {
  calculateEGFR,
  getCkdStage,
  getHbA1cCategory,
  calculateTrendSlope,
  projectThresholdCrossing,
  getEscalationTier
} = require('../utils/clinicalMath');
const { THRESHOLDS } = require('./trendController');
const { isTypical } = require('../services/analyteNormalizer');
const {
  getAnalyteInfo,
  getQuestionsToAsk,
  CKD_STAGE_CONSEQUENCES,
  HBA1C_CATEGORY_CONSEQUENCES
} = require('../utils/clinicalReference');
const groqService = require('../services/groqService');
const { generateSummaryPdf } = require('../services/summaryPdfService');

const CORE_KEYS = ['creatinine', 'egfr', 'bun', 'acr', 'hba1c'];
const SEVERITY_ORDER = ['see_doctor_soon', 'discuss_next_visit', 'monitor'];
const STATUS_RANK = { concerning: 0, borderline: 1, normal: 2, unclassified: 3 };

const DISCLAIMER =
  "These are general lifestyle notes, not personalized medical advice. Everyone's body, allergies, and medical history are different — a food, supplement, or exercise that helps most people can be harmful for someone with kidney disease, allergies, or other restrictions. Please check with your doctor or a registered dietitian before changing your diet or exercise routine.";

function formatDate(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function formatMonthYear(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function getAgeAtDate(dob, atDate) {
  const birth = new Date(dob);
  const at = new Date(atDate);
  let age = at.getFullYear() - birth.getFullYear();
  const monthDiff = at.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && at.getDate() < birth.getDate())) age--;
  return age;
}

function tierToStatus(tierKey) {
  if (tierKey === 'see_doctor_soon') return 'concerning';
  if (tierKey === 'discuss_next_visit') return 'borderline';
  if (tierKey === 'monitor') return 'normal';
  return 'unclassified'; // unclear_trend / gathering_data — no confident read yet
}

// Self-heals already-stored duplicate readings for the same analyte on the same
// report date (a known AI-extraction artifact — see extractController.js's
// dedupeByAnalyteKey, which prevents this for NEW uploads). When duplicates
// exist, prefer the one within the analyte's typical clinical range.
function dedupeRecordsByDate(records, analyteKey) {
  const byDate = {};
  for (const r of records) {
    const dateKey = formatDate(r.date);
    if (!byDate[dateKey]) byDate[dateKey] = [];
    byDate[dateKey].push(r);
  }

  const result = [];
  for (const group of Object.values(byDate)) {
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }
    const typicalOnes = group.filter((r) => isTypical(analyteKey, r.value));
    result.push(typicalOnes.length === 1 ? typicalOnes[0] : group[0]);
  }
  return result.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function mergeChartSeries(seriesList) {
  const byDate = {};
  for (const { key, points } of seriesList) {
    for (const p of points) {
      const dateKey = formatDate(p.date);
      if (!byDate[dateKey]) byDate[dateKey] = { date: dateKey };
      byDate[dateKey][key] = p.value;
    }
  }
  return Object.values(byDate).sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Phrase a projection in whichever unit reads naturally — months under a year, years beyond.
function formatTimeToThreshold(yearsToThreshold) {
  if (yearsToThreshold === null || yearsToThreshold === undefined) return null;

  const months = Math.round(yearsToThreshold * 12);
  if (months < 1) return { months, text: 'less than a month' };
  if (months < 24) return { months, text: `${months} month${months === 1 ? '' : 's'}` };

  const years = Math.round(yearsToThreshold * 10) / 10;
  return { months, text: `${years} year${years === 1 ? '' : 's'}` };
}

// Deterministic, template-based narrative — no AI, every branch traceable to tier + projection numbers.
function buildNarrative({ tierKey, projection, threshold, latestValue, unit, label, stageText }) {
  switch (tierKey) {
    case 'gathering_data':
      return {
        whyFlagged: `Not enough verified reports yet to establish a trend for ${label}.`,
        whenToSeeDoctor: 'No trend-based suggestion yet — upload more reports to unlock this.',
        consequenceIfContinues: 'Not enough data to project forward yet.'
      };
    case 'unclear_trend':
      return {
        whyFlagged: `${label} values are fluctuating report to report, so a clear direction isn't established yet.`,
        whenToSeeDoctor: 'No urgent action suggested from the trend alone — mention the fluctuation at your next visit if it continues.',
        consequenceIfContinues: "There isn't a clear enough pattern yet to project forward."
      };
    case 'see_doctor_soon': {
      const already = `Your latest ${label} (${latestValue} ${unit}) is already at or beyond the ${threshold.source} reference threshold (${threshold.value} ${unit}).`;
      return {
        whyFlagged: already,
        whenToSeeDoctor: 'See a doctor in the next 2–3 weeks to discuss this result.',
        consequenceIfContinues: stageText || 'If this level is sustained, it is generally associated with increased risk over time.'
      };
    }
    case 'discuss_next_visit': {
      const when = formatTimeToThreshold(projection?.yearsToThreshold)?.text ?? 'some time';
      return {
        whyFlagged: `${label} is trending toward the ${threshold.source} reference threshold (${threshold.value} ${unit}) — projected to reach it in about ${when} at the current rate.`,
        whenToSeeDoctor: 'Not urgent — bring this trend up at your next scheduled doctor visit.',
        consequenceIfContinues: `${stageText ? stageText + ' ' : ''}If the current rate of change continues, ${label} may cross the reference threshold in approximately ${when}.`
      };
    }
    case 'monitor':
    default:
      return {
        whyFlagged: `${label} is within a stable, expected range based on your reports.`,
        whenToSeeDoctor: 'No urgent visit needed — continue routine monitoring.',
        consequenceIfContinues: 'Values are stable — no threshold crossing is currently projected.'
      };
  }
}

function buildAnalyteInsight({ analyteKey, label, unit, points, threshold, stageText }) {
  const trend = calculateTrendSlope(points);
  const projection =
    trend.status === 'trend_available' && threshold
      ? projectThresholdCrossing({
          slopePerYear: trend.slopePerYear,
          latestValue: trend.latestValue,
          threshold: threshold.value,
          direction: threshold.direction
        })
      : null;
  const tier = getEscalationTier({ trend, projection, rSquared: trend.rSquared ?? null });
  const narrative = buildNarrative({
    tierKey: tier.tier,
    projection,
    threshold,
    latestValue: trend.latestValue,
    unit,
    label,
    stageText
  });

  const sortedPoints = [...points].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latestPoint = sortedPoints[sortedPoints.length - 1] || null;

  return {
    analyteKey,
    label,
    unit,
    trend,
    threshold,
    projection,
    tier,
    reference: getAnalyteInfo(analyteKey),
    questionsToAsk: getQuestionsToAsk(analyteKey),
    latestValue: latestPoint ? latestPoint.value : null,
    latestDate: latestPoint ? formatDate(latestPoint.date) : null,
    // structured so the UI/PDF can surface it as a callout instead of burying it in prose
    timeToThreshold:
      projection && !projection.alreadyCrossed ? formatTimeToThreshold(projection.yearsToThreshold) : null,
    alreadyCrossed: Boolean(projection?.alreadyCrossed),
    ...narrative
  };
}

function buildDoctorVisitBanner(insights) {
  const active = insights.filter((a) => a.trend.reportsUploaded > 0);
  if (active.length === 0) {
    return {
      level: 'gathering_data',
      message: 'Upload a few reports to get a personalized doctor-visit suggestion.',
      timeframe: null
    };
  }

  for (const tierKey of SEVERITY_ORDER) {
    const match = active.find((a) => a.tier.tier === tierKey);
    if (!match) continue;

    if (tierKey === 'see_doctor_soon') {
      return {
        level: 'see_doctor_soon',
        message: `See a doctor in the next 2–3 weeks — ${match.label} is at or beyond its reference threshold.`,
        timeframe: '2-3 weeks'
      };
    }
    if (tierKey === 'discuss_next_visit') {
      return {
        level: 'discuss_next_visit',
        message: `No urgent visit needed — mention your ${match.label} trend at your next scheduled doctor visit.`,
        timeframe: 'next scheduled visit'
      };
    }
    return {
      level: 'monitor',
      message: 'No urgent visit needed based on your current trends — continue routine monitoring.',
      timeframe: null
    };
  }

  return {
    level: 'gathering_data',
    message: 'Upload a few more reports to get a clearer trend-based suggestion.',
    timeframe: null
  };
}

function buildKeepAnEye(insights) {
  const items = [];
  for (const insight of insights) {
    if (insight.trend.status !== 'trend_available' || !insight.threshold) continue;
    const tierKey = insight.tier.tier;
    const latestValue = insight.trend.latestValue;
    const thresholdValue = insight.threshold.value;
    const withinTenPercent = Math.abs(latestValue - thresholdValue) / thresholdValue <= 0.1;

    if (tierKey === 'discuss_next_visit') {
      items.push({
        analyteKey: insight.analyteKey,
        label: insight.label,
        currentValue: latestValue,
        unit: insight.unit,
        reason: `Trending toward the ${insight.threshold.source} threshold (${thresholdValue} ${insight.unit}) — projected in about ${insight.timeToThreshold?.text ?? 'some time'} at the current rate.`
      });
    } else if (tierKey === 'monitor' && withinTenPercent) {
      items.push({
        analyteKey: insight.analyteKey,
        label: insight.label,
        currentValue: latestValue,
        unit: insight.unit,
        reason: `Close to the ${insight.threshold.source} reference threshold (${thresholdValue} ${insight.unit}) — worth watching.`
      });
    }
  }
  return items;
}

function buildRecordsList(byAnalyte, insightsByKey) {
  const records = [];

  for (const key of CORE_KEYS) {
    const insight = insightsByKey[key];
    if (!insight || insight.latestValue === null) continue;
    records.push({
      analyteKey: key,
      label: insight.label,
      value: insight.latestValue,
      unit: insight.unit,
      date: insight.latestDate,
      status: tierToStatus(insight.tier.tier)
    });
  }

  for (const [analyteName, recs] of Object.entries(byAnalyte)) {
    if (CORE_KEYS.includes(analyteName)) continue; // covered above (raw 'egfr' superseded by the derived value)
    const latest = recs[recs.length - 1];
    records.push({
      analyteKey: analyteName,
      label: latest.rawLabel,
      value: latest.value,
      unit: latest.unit,
      date: formatDate(latest.date),
      status: 'unclassified'
    });
  }

  records.sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]);
  return records;
}

// Builds the whole summary payload. Shared by the JSON endpoint and the PDF export
// so both always describe the patient identically.
async function buildSummary(patient) {
  {
    const verifiedRecords = await AnalyteRecord.find({ patient: patient._id, status: 'verified' }).sort('date');

    if (verifiedRecords.length === 0) {
      return ({
        patient: { name: patient.name, reportsCount: 0, rangeStart: null, rangeEnd: null },
        doctorVisit: {
          level: 'gathering_data',
          message: 'Upload and verify your first report to get a summary.',
          timeframe: null
        },
        kidney: { chartData: [], egfrChartData: [], analytes: {}, allNormal: false, hasTrend: false, reportsUploaded: 0 },
        diabetes: { chartData: [], analytes: {}, allNormal: false, hasTrend: false, reportsUploaded: 0 },
        keepAnEye: [],
        allNormal: false,
        records: [],
        habits: { diet: [], movement: [], general: [], disclaimer: DISCLAIMER }
      });
    }

    const reportIds = [...new Set(verifiedRecords.map((r) => r.report.toString()))];
    const reports = await Report.find({ _id: { $in: reportIds } }).sort('reportDate');
    const rangeStart = reports[0]?.reportDate;
    const rangeEnd = reports[reports.length - 1]?.reportDate;

    const byAnalyte = {};
    for (const r of verifiedRecords) {
      if (!byAnalyte[r.analyteName]) byAnalyte[r.analyteName] = [];
      byAnalyte[r.analyteName].push(r);
    }
    const corePoints = (key) => dedupeRecordsByDate(byAnalyte[key] || [], key).map((r) => ({ date: r.date, value: r.value }));

    // ---- eGFR is always derived from creatinine + patient age/sex, never taken from raw AI text ----
    let egfrPoints = [];
    if (patient.dateOfBirth) {
      egfrPoints = dedupeRecordsByDate(byAnalyte.creatinine || [], 'creatinine').map((r) => {
        const age = getAgeAtDate(patient.dateOfBirth, r.date);
        const value = calculateEGFR({ creatinine: r.value, age, sex: patient.gender === 'female' ? 'female' : 'male' });
        return { date: r.date, value };
      });
    }

    let egfrStageText = null;
    let egfrStage = null;
    if (egfrPoints.length > 0) {
      egfrStage = getCkdStage(egfrPoints[egfrPoints.length - 1].value);
      egfrStageText = CKD_STAGE_CONSEQUENCES[egfrStage.stage];
    }

    let hba1cCategoryText = null;
    let hba1cCategory = null;
    const hba1cPoints = corePoints('hba1c');
    if (hba1cPoints.length > 0) {
      hba1cCategory = getHbA1cCategory(hba1cPoints[hba1cPoints.length - 1].value);
      hba1cCategoryText = HBA1C_CATEGORY_CONSEQUENCES[hba1cCategory.category];
    }

    const creatinineInsight = buildAnalyteInsight({
      analyteKey: 'creatinine',
      label: 'Creatinine',
      unit: 'mg/dL',
      points: corePoints('creatinine'),
      threshold: THRESHOLDS.creatinine
    });
    const egfrInsight = {
      ...buildAnalyteInsight({
        analyteKey: 'egfr',
        label: 'eGFR',
        unit: 'mL/min/1.73m²',
        points: egfrPoints,
        threshold: THRESHOLDS.egfr,
        stageText: egfrStageText
      }),
      ckdStage: egfrStage
    };
    const bunInsight = buildAnalyteInsight({
      analyteKey: 'bun',
      label: 'BUN',
      unit: 'mg/dL',
      points: corePoints('bun'),
      threshold: THRESHOLDS.bun
    });
    const acrInsight = buildAnalyteInsight({
      analyteKey: 'acr',
      label: 'ACR',
      unit: 'mg/g',
      points: corePoints('acr'),
      threshold: THRESHOLDS.acr
    });
    const hba1cInsight = {
      ...buildAnalyteInsight({
        analyteKey: 'hba1c',
        label: 'HbA1c',
        unit: '%',
        points: hba1cPoints,
        threshold: THRESHOLDS.hba1c,
        stageText: hba1cCategoryText
      }),
      category: hba1cCategory
    };

    const insightsByKey = {
      creatinine: creatinineInsight,
      egfr: egfrInsight,
      bun: bunInsight,
      acr: acrInsight,
      hba1c: hba1cInsight
    };

    const kidneyChartData = mergeChartSeries([
      { key: 'creatinine', points: corePoints('creatinine') },
      { key: 'bun', points: corePoints('bun') }
    ]);
    const egfrChartData = mergeChartSeries([{ key: 'egfr', points: egfrPoints }]);
    const diabetesChartData = mergeChartSeries([{ key: 'hba1c', points: hba1cPoints }]);

    const kidneyGroup = [creatinineInsight, egfrInsight, bunInsight, acrInsight];
    const kidneyHasTrend = kidneyGroup.some((a) => a.trend.status === 'trend_available');
    const kidneyReportsUploaded = Math.max(...kidneyGroup.map((a) => a.trend.reportsUploaded));
    const kidneyAllNormal = kidneyHasTrend && kidneyGroup.every((a) => a.trend.status !== 'trend_available' || a.tier.tier === 'monitor');

    const diabetesHasTrend = hba1cInsight.trend.status === 'trend_available';
    const diabetesAllNormal = diabetesHasTrend && hba1cInsight.tier.tier === 'monitor';

    const allInsights = [creatinineInsight, egfrInsight, bunInsight, acrInsight, hba1cInsight];
    const doctorVisit = buildDoctorVisitBanner(allInsights);
    const keepAnEye = buildKeepAnEye(allInsights);
    const allNormal = doctorVisit.level === 'monitor' && keepAnEye.length === 0;

    const records = buildRecordsList(byAnalyte, insightsByKey);

    const flaggedAnalytes = allInsights
      .filter((a) => a.tier.tier === 'see_doctor_soon' || a.tier.tier === 'discuss_next_visit')
      .map((a) => a.label);

    let habits;
    try {
      const generated = await groqService.generateHabits({ flaggedAnalytes });
      habits = { ...generated, disclaimer: DISCLAIMER };
    } catch (e) {
      console.error('Habits generation failed:', e);
      habits = { diet: [], movement: [], general: [], disclaimer: DISCLAIMER };
    }

    return {
      patient: {
        name: patient.name,
        reportsCount: reportIds.length,
        rangeStart: rangeStart ? formatMonthYear(rangeStart) : null,
        rangeEnd: rangeEnd ? formatMonthYear(rangeEnd) : null
      },
      doctorVisit,
      kidney: {
        chartData: kidneyChartData,
        egfrChartData,
        analytes: { creatinine: creatinineInsight, egfr: egfrInsight, bun: bunInsight, acr: acrInsight },
        allNormal: kidneyAllNormal,
        hasTrend: kidneyHasTrend,
        reportsUploaded: kidneyReportsUploaded
      },
      diabetes: {
        chartData: diabetesChartData,
        analytes: { hba1c: hba1cInsight },
        allNormal: diabetesAllNormal,
        hasTrend: diabetesHasTrend,
        reportsUploaded: hba1cInsight.trend.reportsUploaded
      },
      keepAnEye,
      allNormal,
      records,
      habits
    };
  }
}

exports.buildSummary = buildSummary;

exports.getSummary = async (req, res) => {
  try {
    res.json(await buildSummary(req.user));
  } catch (err) {
    console.error('Summary generation failed:', err);
    res.status(500).json({ message: 'Failed to generate summary', error: err.message });
  }
};

exports.getSummaryPdf = async (req, res) => {
  try {
    const summary = await buildSummary(req.user);
    const stamp = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).replace(' ', '-');
    const safeName = summary.patient.name.replace(/[^a-z0-9]+/gi, '-');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Parchi-Summary-${safeName}-${stamp}.pdf"`);

    generateSummaryPdf(summary, res);
  } catch (err) {
    console.error('Summary PDF generation failed:', err);
    res.status(500).json({ message: 'Failed to generate summary PDF', error: err.message });
  }
};
