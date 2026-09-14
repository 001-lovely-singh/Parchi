const mongoose = require('mongoose');

const ALLOWED_ANALYTES = ['creatinine', 'bun', 'acr', 'hba1c', 'egfr'];

const analyteRecordSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },

    analyteName: { type: String, required: true }, // allow any extracted analyte key, not only the 6 core values
    rawLabel: { type: String, required: true }, // original printed label, audit ke liye
    unit: { type: String, required: true },

    extractedValue: { type: Number, required: true }, // AI se jo mila, kabhi overwrite nahi hota
    value: { type: Number, required: true },           // current — verify pe update hota hai
    wasEdited: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ['pending_verification', 'verified'],
      default: 'pending_verification'
    },

    date: { type: Date, required: true } // report ki date, trend sorting ke liye
  },
  { timestamps: true }
);

module.exports = mongoose.model('AnalyteRecord', analyteRecordSchema);
module.exports.ALLOWED_ANALYTES = ALLOWED_ANALYTES;