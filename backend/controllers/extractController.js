const AnalyteRecord = require('../models/AnalyteRecord');
const Report = require('../models/Report');
const geminiService = require('../services/geminiService');
const { normalizeExtractedValue, isTypical } = require('../services/analyteNormalizer');

// A single report sometimes yields the same analyte twice (e.g. a reference
// number or a second table column misread as a result). When that happens and
// exactly one of the duplicates falls in the analyte's typical range, keep
// only that one — the other is almost certainly an extraction artifact.
// If it's ambiguous (none or multiple look typical), keep all of them so the
// patient can resolve it during verification instead of us guessing wrong.
function dedupeByAnalyteKey(list) {
  const byKey = {};
  for (const item of list) {
    if (!byKey[item.analyteKey]) byKey[item.analyteKey] = [];
    byKey[item.analyteKey].push(item);
  }

  const result = [];
  for (const items of Object.values(byKey)) {
    if (items.length === 1) {
      result.push(items[0]);
      continue;
    }
    const typicalOnes = items.filter((i) => isTypical(i.analyteKey, i.value));
    if (typicalOnes.length === 1) {
      result.push(typicalOnes[0]);
    } else {
      result.push(...items);
    }
  }
  return result;
}

exports.extractFromReport = async (req, res) => {
  try {
    console.log('--- Extraction Request Received ---');
    console.log('Body:', req.body);
    console.log('File:', req.file ? `File received: ${req.file.originalname}` : 'No file received');

    const { reportId } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    // Access Check: Patient must own it, OR Clinic must be linked to it
    const isPatient = report.patient.equals(req.user._id);
    const isClinic = report.clinic && report.clinic.equals(req.user._id);

    if (!isPatient && !isClinic) {
      return res.status(403).json({ message: 'Access denied to this report' });
    }

    let geminiResult;
    try {
      geminiResult = await geminiService.extractValues(req.file.buffer, req.file.mimetype);
    } catch (aiErr) {
      console.error('Gemini AI Error:', aiErr);
      return res.status(502).json({ message: 'AI extraction service failed', error: aiErr.message });
    }

    if (geminiResult.reportDate) {
      const date = new Date(geminiResult.reportDate);
      if (!isNaN(date.getTime())) {
        report.reportDate = date;
        report.labName = geminiResult.labName;
        await report.save();
      } else {
        console.warn(`Invalid date extracted by AI: ${geminiResult.reportDate}`);
      }
    }

    // Normalize Analytes (Kidney/Diabetes + Others)
    const normalized = dedupeByAnalyteKey(
      (geminiResult.analytes || [])
        .map((a) => normalizeExtractedValue(a))
        .filter(Boolean)
    );

    if (normalized.length === 0) {
      return res.status(200).json({ message: 'No relevant analytes found in this report', drafts: [] });
    }

    try {
      const drafts = await AnalyteRecord.insertMany(
        normalized.map((n) => ({
          patient: report.patient,
          report: report._id,
          analyteName: n.analyteKey,
          rawLabel: n.rawLabel,
          unit: n.unit,
          extractedValue: n.value,
          value: n.value,
          date: report.reportDate,
          status: 'pending_verification'
        }))
      );

      res.status(201).json({ message: 'Extracted — please verify these values', drafts });
    } catch (dbErr) {
      console.error('DB Insert Error:', dbErr);
      res.status(500).json({ message: 'Failed to save extracted values to database', error: dbErr.message });
    }
  } catch (err) {
    console.error('Unexpected Extraction Error:', err);
    res.status(500).json({ message: 'An unexpected error occurred during extraction', error: err.message });
  }
};