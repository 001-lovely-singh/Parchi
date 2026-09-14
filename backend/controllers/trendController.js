const AnalyteRecord = require('../models/AnalyteRecord');
const {
  calculateTrendSlope,
  projectThresholdCrossing,
  getEscalationTier
} = require('../utils/clinicalMath');

// har analyte ka reference threshold — source-cited
// direction 'above' = concerning when value rises above threshold; 'below' = concerning when it falls below
const THRESHOLDS = {
  creatinine: { value: 1.3, source: 'KDIGO (upper normal reference)', direction: 'above' },
  bun: { value: 20, source: 'standard upper reference limit', direction: 'above' },
  acr: { value: 30, source: 'KDIGO A1→A2 boundary', direction: 'above' },
  hba1c: { value: 5.7, source: 'ADA (prediabetes threshold)', direction: 'above' },
  egfr: { value: 60, source: 'KDIGO (G3 boundary — moderately decreased)', direction: 'below' }
};

async function computeTrendForAnalyte(patientId, analyteKey) {
  const records = await AnalyteRecord.find({
    patient: patientId,
    analyteName: analyteKey,
    status: 'verified' // sirf verified — extraction ke fauran baad kabhi nahi
  }).sort('date');

  const points = records.map((r) => ({ date: r.date, value: r.value }));
  const trend = calculateTrendSlope(points);

  const threshold = THRESHOLDS[analyteKey] || null;
  const projection =
    trend.status === 'trend_available' && threshold
      ? projectThresholdCrossing({
          slopePerYear: trend.slopePerYear,
          latestValue: trend.latestValue,
          threshold: threshold.value,
          direction: threshold.direction || 'above'
        })
      : null;

  const tier = getEscalationTier({ trend, projection, rSquared: trend.rSquared ?? null });

  return {
    analyteKey,
    trend,
    threshold,
    projection,
    tier,
    chartData: points
  };
}

exports.getTrendForAnalyte = async (req, res) => {
  try {
    const { analyteKey } = req.params;
    const result = await computeTrendForAnalyte(req.user._id, analyteKey);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Trend computation failed', error: err.message });
  }
};

module.exports.computeTrendForAnalyte = computeTrendForAnalyte;
module.exports.THRESHOLDS = THRESHOLDS;