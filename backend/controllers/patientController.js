const { computeTrendForAnalyte } = require('./trendController');
const { ALLOWED_ANALYTES } = require('../models/AnalyteRecord');
const groqService = require('../services/groqService');
const AnalyteRecord = require('../models/AnalyteRecord');

// patient ka apna poora growth dashboard — sabhi kidney+diabetes analytes ek saath
exports.getGrowthOverview = async (req, res) => {
  try {
    // 1. Get ALL unique analytes the patient has records for
    const allAnalytes = await AnalyteRecord.distinct('analyteName', { patient: req.user._id });

    const results = await Promise.all(
      allAnalytes.map(async (key) => {
        const result = await computeTrendForAnalyte(req.user._id, key);

        // Generate AI brief for EVERY analyte that has at least one record
        if (result.trend.reportsUploaded > 0) {
          try {
            const brief = await groqService.generateBrief(result);
            result.brief = brief;
          } catch (e) {
            console.error(`Groq brief failed for ${key}:`, e);
            result.brief = 'Could not generate summary at this time.';
          }
        }

        return result;
      })
    );

    // Transform array to map
    const growthMap = {};
    results.forEach(r => {
      growthMap[r.analyteKey] = r;
    });

    res.json({ patientId: req.user._id, analytes: results, growthMap });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load growth overview', error: err.message });
  }
};