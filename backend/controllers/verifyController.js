const AnalyteRecord = require('../models/AnalyteRecord');
const Report = require('../models/Report');

exports.verifyRecords = async (req, res) => {
  try {
    const { records } = req.body; // [{ id, value }]
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'records array is required' });
    }

    const updated = [];
    for (const { id, value } of records) {
      const existing = await AnalyteRecord.findById(id);
      if (!existing) continue;

      const report = await Report.findById(existing.report);
      if (!report) continue;

      // Ownership check: Patient owns it OR Clinic is linked to report
      const isPatient = existing.patient.equals(req.user._id);
      const isClinic = report.clinic && report.clinic.equals(req.user._id);

      if (!isPatient && !isClinic) continue;

      existing.wasEdited = value !== existing.extractedValue;
      existing.value = value;
      existing.status = 'verified';
      await existing.save();
      updated.push(existing);
    }

    res.json({ message: 'Verified', records: updated });
  } catch (err) {
    res.status(500).json({ message: 'Verification failed', error: err.message });
  }
};