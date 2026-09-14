const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clinic: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reportDate: { type: Date, required: true },
    labName: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);