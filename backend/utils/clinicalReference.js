// ============================================================
// Static, source-cited patient-education content.
// No AI involved here — every sentence is a fixed template so
// nothing gets hallucinated into a clinical claim.
// ============================================================

const ANALYTE_INFO = {
  creatinine: {
    label: 'Creatinine',
    unit: 'mg/dL',
    function:
      'Creatinine is a waste product made by your muscles at a steady rate. Healthy kidneys filter it out of your blood continuously — when the kidneys are not filtering as well, creatinine builds up in the blood.',
    normalRangeText: 'Roughly 0.6–1.3 mg/dL for most adults (labs vary slightly).',
    source: 'KDIGO'
  },
  egfr: {
    label: 'eGFR',
    unit: 'mL/min/1.73m²',
    function:
      'eGFR (estimated Glomerular Filtration Rate) estimates how much blood your kidneys filter per minute, calculated from your creatinine, age, and sex. It is the single most-used number for tracking overall kidney function.',
    normalRangeText: '90 and above is considered normal; sustained readings below 60 are a KDIGO-defined boundary for reduced kidney function.',
    source: 'KDIGO'
  },
  bun: {
    label: 'BUN (Blood Urea Nitrogen)',
    unit: 'mg/dL',
    function:
      'BUN measures urea nitrogen, another waste product filtered by the kidneys. It can also shift with diet (especially protein intake) and hydration, so it is usually read alongside creatinine rather than on its own.',
    normalRangeText: 'Roughly 7–20 mg/dL for most adults.',
    source: 'standard upper reference limit'
  },
  acr: {
    label: 'ACR (Albumin-Creatinine Ratio)',
    unit: 'mg/g',
    function:
      'ACR checks for albumin (a protein) leaking into urine. Healthy kidneys keep albumin in the blood, so any leakage is an early sign of kidney stress — often before creatinine or eGFR change at all.',
    normalRangeText: 'Below 30 mg/g is considered normal (KDIGO category A1).',
    source: 'KDIGO'
  },
  hba1c: {
    label: 'HbA1c',
    unit: '%',
    function:
      'HbA1c reflects your average blood sugar over the past ~2-3 months, measured as the percentage of hemoglobin that sugar has attached to. Unlike a single glucose reading, it is not affected by what you ate that day.',
    normalRangeText: 'Below 5.7% is normal; 5.7–6.4% is the prediabetes range; 6.5% and above is the diabetes range.',
    source: 'ADA'
  }
};

const QUESTIONS_TO_ASK = {
  creatinine: [
    'Is my kidney function trend expected for my age and health history?',
    'Should I have my eGFR and ACR checked together at my next visit?',
    'Are any of my current medications affected by this creatinine level?'
  ],
  egfr: [
    'What CKD stage does my current eGFR correspond to, and what does that mean for me?',
    'Do I need any additional kidney tests (like ACR or an ultrasound)?',
    'Should any of my medication doses be adjusted for my kidney function?'
  ],
  bun: [
    'Could my diet, hydration, or medications be affecting this BUN reading?',
    'Should BUN be checked together with creatinine and eGFR going forward?'
  ],
  acr: [
    'Does this ACR level mean I should be monitored more closely for kidney disease?',
    'Would a blood pressure or diabetes medication change help protect my kidneys?'
  ],
  hba1c: [
    'What does this HbA1c trend mean for my diabetes risk?',
    'Should I be tracking my blood sugar more closely at home?',
    'Would a change in diet, activity, or medication help bring this down?'
  ]
};

// KDIGO CKD stage -> plain-language consequence text
const CKD_STAGE_CONSEQUENCES = {
  G1: 'Kidney function is in the normal/high range — no functional concern at this stage.',
  G2: 'Kidney function is mildly decreased. On its own this is often not urgent, but it is worth tracking alongside other kidney markers.',
  G3a: 'This is KDIGO Stage G3a — kidney filtering is mildly to moderately reduced. At this stage, some medication doses may need adjusting and closer monitoring is generally recommended.',
  G3b: 'This is KDIGO Stage G3b — kidney filtering is moderately to severely reduced. Doctors typically recommend more frequent monitoring and evaluation for underlying causes at this stage.',
  G4: 'This is KDIGO Stage G4 — kidney filtering is severely reduced. This stage usually calls for specialist (nephrology) involvement.',
  G5: 'This is KDIGO Stage G5 — kidney failure range. This requires prompt medical attention.'
};

// ADA HbA1c category -> plain-language consequence text
const HBA1C_CATEGORY_CONSEQUENCES = {
  normal: 'This is within the normal range — no elevated blood sugar concern at this level.',
  prediabetes: 'This falls in the ADA-defined prediabetes range. Prediabetes does not mean diabetes is certain, but it is the point where lifestyle changes make the biggest difference in preventing progression.',
  diabetes_range: 'This falls in the ADA-defined diabetes range. Sustained levels here are associated with higher risk of long-term complications (eyes, kidneys, nerves, heart) if left unmanaged.'
};

function getAnalyteInfo(analyteKey) {
  return ANALYTE_INFO[analyteKey] || null;
}

function getQuestionsToAsk(analyteKey) {
  return QUESTIONS_TO_ASK[analyteKey] || [];
}

module.exports = {
  ANALYTE_INFO,
  QUESTIONS_TO_ASK,
  CKD_STAGE_CONSEQUENCES,
  HBA1C_CATEGORY_CONSEQUENCES,
  getAnalyteInfo,
  getQuestionsToAsk
};
