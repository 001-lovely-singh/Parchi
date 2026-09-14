const { computeTrendForAnalyte } = require('./trendController');
const groqService = require('../services/groqService');

exports.getBrief = async (req, res) => {
  try {
    const { analyteKey } = req.params;
    const result = await computeTrendForAnalyte(req.user._id, analyteKey);

    if (result.trend.status === 'insufficient_data') {
      return res.json({
        analyteKey,
        brief: `Abhi ${result.trend.reportsUploaded} report(s) hai. Trend ke liye ${result.trend.reportsNeeded} aur report upload karo.`
      });
    }

    const brief = await groqService.generateBrief(result);
    res.json({ analyteKey, brief, tier: result.tier });
  } catch (err) {
    res.status(500).json({ message: 'Brief generation failed', error: err.message });
  }
};