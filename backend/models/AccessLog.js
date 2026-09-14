const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['patient', 'clinic'], required: true },
    action: { type: String, required: true }, // e.g. 'VIEW_PATIENT_LIST', 'EDIT_ANALYTE', 'UPLOAD_REPORT'
    targetType: { type: String }, // 'Report' | 'AnalyteRecord' | 'User'
    targetId: { type: mongoose.Schema.Types.ObjectId },
    ipAddress: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AccessLog', accessLogSchema);