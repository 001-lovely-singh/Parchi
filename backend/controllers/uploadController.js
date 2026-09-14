const Report = require('../models/Report');
const User = require('../models/User');
const AnalyteRecord = require('../models/AnalyteRecord');

exports.uploadReport = async (req, res) => {
  try {
    const { reportDate, clinicCode, patientId } = req.body;

    let clinicId = null;
    if (clinicCode) {
      const clinic = await User.findOne({ clinicCode, role: 'clinic' });
      if (!clinic) return res.status(400).json({ message: 'Invalid clinic code' });
      clinicId = clinic._id;
    } else if (req.user.role === 'clinic') {
      clinicId = req.user._id;
    }

    let patientIdToUse = req.user._id;
    if (req.user.role === 'clinic' && patientId) {
      // Verify patient exists
      const patient = await User.findById(patientId);
      if (!patient || patient.role !== 'patient') {
        return res.status(400).json({ message: 'Invalid patient ID provided' });
      }
      patientIdToUse = patient._id;
    } else if (req.user.role === 'clinic' && !patientId) {
      return res.status(400).json({ message: 'patientId is required when uploading as a clinic' });
    }

    const report = await Report.create({
      patient: patientIdToUse,
      clinic: clinicId,
      reportDate: reportDate || new Date()
    });

    res.status(201).json({ reportId: report._id, linkedClinic: clinicId ? 'Linked' : 'None' });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

exports.listReports = async (req, res) => {
  try {
    const filter = req.user.role === 'clinic' ? { clinic: req.user._id } : { patient: req.user._id };
    const reports = await Report.find(filter).sort('-reportDate').lean();

    const counts = await AnalyteRecord.aggregate([
      { $match: { report: { $in: reports.map((r) => r._id) } } },
      { $group: { _id: '$report', count: { $sum: 1 } } }
    ]);
    const countByReport = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));

    res.json(
      reports.map((r) => ({
        _id: r._id,
        reportDate: r.reportDate,
        labName: r.labName,
        analyteCount: countByReport[r._id.toString()] || 0,
        createdAt: r.createdAt
      }))
    );
  } catch (err) {
    res.status(500).json({ message: 'Failed to load reports', error: err.message });
  }
};

exports.getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const isPatient = report.patient.equals(req.user._id);
    const isClinic = report.clinic && report.clinic.equals(req.user._id);
    if (!isPatient && !isClinic) {
      return res.status(403).json({ message: 'Access denied to this report' });
    }

    const records = await AnalyteRecord.find({ report: report._id }).sort('analyteName');

    res.json({
      _id: report._id,
      reportDate: report.reportDate,
      labName: report.labName,
      records: records.map((r) => ({
        _id: r._id,
        analyteName: r.analyteName,
        rawLabel: r.rawLabel,
        value: r.value,
        unit: r.unit,
        status: r.status
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load report', error: err.message });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const isPatient = report.patient.equals(req.user._id);
    const isClinic = report.clinic && report.clinic.equals(req.user._id);
    if (!isPatient && !isClinic) {
      return res.status(403).json({ message: 'Access denied to this report' });
    }

    await AnalyteRecord.deleteMany({ report: report._id });
    await report.deleteOne();

    res.json({ message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete report', error: err.message });
  }
};
