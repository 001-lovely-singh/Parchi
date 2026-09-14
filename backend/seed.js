require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Report = require('./models/Report');
const AnalyteRecord = require('./models/AnalyteRecord');

const reset = async () => {
  await connectDB();

  await Promise.all([User.deleteMany({}), Report.deleteMany({}), AnalyteRecord.deleteMany({})]);

  const clinic = await User.create({
    name: 'Demo Clinic Admin',
    email: 'clinic@demo.com',
    password: 'password123',
    role: 'clinic',
    clinicName: 'Demo Diagnostic Clinic',
    clinicCode: 'DEMO1234'
  });

  const patient = await User.create({
    name: 'Demo Patient',
    email: 'patient@demo.com',
    password: 'password123',
    role: 'patient',
    dateOfBirth: new Date('1985-06-15'),
    gender: 'male'
  });

  // 5 reports over years — rising creatinine trend, sab already verified (demo ke liye)
  const dates = ['2021-04-01', '2022-06-01', '2023-02-01', '2024-03-01', '2026-01-01'];
  const creatinineValues = [0.9, 0.95, 1.0, 1.05, 1.1];

  for (let i = 0; i < dates.length; i++) {
    const report = await Report.create({
      patient: patient._id,
      clinic: clinic._id,
      reportDate: dates[i],
      labName: `Demo Lab ${i + 1}`
    });

    await AnalyteRecord.create({
      patient: patient._id,
      report: report._id,
      analyteName: 'creatinine',
      rawLabel: 'Creatinine',
      unit: 'mg/dL',
      extractedValue: creatinineValues[i],
      value: creatinineValues[i],
      status: 'verified',
      date: dates[i]
    });
  }

  console.log('Seed complete:');
  console.log('  Patient login: patient@demo.com / password123');
  console.log('  Clinic login:  clinic@demo.com / password123 (clinicCode: DEMO1234)');

  await mongoose.disconnect();
  process.exit(0);
};

reset().catch((err) => {
  console.error(err);
  process.exit(1);
});