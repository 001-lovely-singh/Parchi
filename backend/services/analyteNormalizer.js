const ANALYTE_ALIASES = {
  creatinine: ['creatinine', 'serum creatinine', 's. creatinine', 'creat'],
  bun: ['bun', 'blood urea nitrogen', 'urea nitrogen'],
  acr: ['acr', 'albumin creatinine ratio', 'microalbumin/creatinine ratio', 'uacr'],
  hba1c: ['hba1c', 'glycosylated haemoglobin', 'glycated hemoglobin', 'gly. hb', 'gly hb', 'hemoglobin a1c', 'a1c'],
  egfr: ['egfr', 'estimated glomerular filtration rate', 'eGFR', 'gfr'],
};

const PLAUSIBLE_RANGE = {
  creatinine: [0.1, 20],
  bun: [1, 200],
  acr: [0, 5000],
  hba1c: [3, 20],
  egfr: [1, 200],
};

// Narrower than PLAUSIBLE_RANGE — used only to break ties when the SAME analyte
// is extracted more than once from one report (a common OCR/table-parsing
// artifact, e.g. a reference number or a second column misread as a result).
// A value outside this band is still allowed through on its own; it only loses
// to a duplicate that falls inside this band.
const TYPICAL_RANGE = {
  creatinine: [0.2, 8],
  bun: [2, 100],
  acr: [0, 1000],
  hba1c: [3, 16],
  egfr: [2, 150],
};

function isTypical(analyteKey, value) {
  const range = TYPICAL_RANGE[analyteKey];
  if (!range) return true; // no opinion for non-core analytes
  return value >= range[0] && value <= range[1];
}

function resolveAnalyteKey(rawName) {
  const normalized = rawName.trim().toLowerCase();
  for (const [key, aliases] of Object.entries(ANALYTE_ALIASES)) {
    if (aliases.some((alias) => normalized.includes(alias))) return key;
  }
  return null;
}

function convertToCanonical(analyteKey, value, unit) {
  const u = unit.trim().toLowerCase();

  if (analyteKey === 'hba1c') {
    if (u.includes('mmol/mol')) {
      return { value: Number((value / 10.929 + 2.15).toFixed(2)), unit: '%' };
    }
    return { value, unit: '%' };
  }

  if (['creatinine', 'bun'].includes(analyteKey)) {
    if (u.includes('µmol/l') || u.includes('umol/l')) {
      return { value: Number((value / 88.4).toFixed(2)), unit: 'mg/dL' };
    }
    return { value, unit: 'mg/dL' };
  }

  return { value, unit };
}

function isPlausible(analyteKey, value) {
  const range = PLAUSIBLE_RANGE[analyteKey];
  if (!range) return false;
  return value >= range[0] && value <= range[1];
}

function normalizeExtractedValue({ rawLabel, value, unit }) {
  const key = resolveAnalyteKey(rawLabel);

  if (!key) {
    // For non-core analytes, use a normalized version of the raw label as the key
    // This ensures that 'Glucose' and 'glucose' are treated as the same marker
    const normalizedLabel = rawLabel.trim().toLowerCase().replace(/\s+/g, '_');
    return { analyteKey: normalizedLabel, rawLabel, value, unit };
  }

  const { value: normalizedValue, unit: normalizedUnit } = convertToCanonical(key, value, unit);
  if (!isPlausible(key, normalizedValue)) return null;

  return { analyteKey: key, rawLabel, value: normalizedValue, unit: normalizedUnit };
}

module.exports = { normalizeExtractedValue, isTypical };
