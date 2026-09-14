const Report = require('../models/Report');
const { ALLOWED_ANALYTES } = require('../models/AnalyteRecord');
const { computeTrendForAnalyte } = require('./trendController');

// clinic apne saare linked patients ki list aur unka growth trend dekh sakta hai
exports.getMyPatients = async (req, res) => {
  try {
    const clinicId = req.user._id;
    const patients = await Report.aggregate([
      { $match: { clinic: clinicId } },
      {
        $group: {
          _id: '$patient',
          reportCount: { $sum: 1 },
          lastReportDate: { $max: '$reportDate' }
        }
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'patientInfo' } },
      { $unwind: '$patientInfo' },
      {
        $project: {
          name: '$patientInfo.name',
          email: '$patientInfo.email',
          reportCount: 1,
          lastReportDate: 1
        }
      },
      { $sort: { lastReportDate: -1 } }
    ]);

    // Har patient ke liye computeTrendForAnalyte chalao (MASTER PROMPT: Clinic gets complete visibility)
    const patientsWithTrends = await Promise.all(
      patients.map(async (p) => {
        const analytes = await Promise.all(
          ALLOWED_ANALYTES.map((key) => computeTrendForAnalyte(p._id, key))
        );
        // sirf data wale analytes rakho
        const filteredAnalytes = analytes.filter((r) => r.trend.reportsUploaded > 0);
        return { ...p, analytes: filteredAnalytes };
      })
    );

    res.json({ clinicId, patients: patientsWithTrends });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch patients', error: err.message });
  }
};

// Clinic kisi specific patient ka growth dashboard dekh sakta hai
exports.getPatientGrowth = async (req, res) => {
  try {
    const { patientId } = req.params;
    const clinicId = req.user._id;

    // Security Check: Kya ye patient is clinic se linked hai?
    const isLinked = await Report.findOne({ patient: patientId, clinic: clinicId });
    if (!isLinked) {
      return res.status(403).json({ message: 'Access denied. Patient is not linked to this clinic.' });
    }

    const results = await Promise.all(
      ALLOWED_ANALYTES.map((key) => computeTrendForAnalyte(patientId, key))
    );

    // sirf wo analytes bhejo jinke koi records hai
    const withData = results.filter((r) => r.trend.reportsUploaded > 0);

    res.json({ patientId, analytes: withData });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load patient growth', error: err.message });
  }
};