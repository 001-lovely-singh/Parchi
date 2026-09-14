const PDFDocument = require('pdfkit');

// ============================================================
// Renders the summary payload from summaryController.buildSummary
// into a printable PDF the patient can take to a doctor.
// ============================================================

const LEFT = 50;
const RIGHT = 545;
const CONTENT_W = RIGHT - LEFT;

const COLORS = {
  primary: '#0F766E',
  accent: '#14B8A6',
  secondary: '#2563EB',
  heading: '#0F172A',
  body: '#334155',
  muted: '#64748B',
  hairline: '#E2E8F0',
  panel: '#F8FAFC',
  danger: '#DC2626',
  warning: '#D97706',
  success: '#16A34A'
};

const LEVEL_STYLE = {
  see_doctor_soon: { color: COLORS.danger, tint: '#FEE2E2', label: 'RECOMMENDED: SEE A DOCTOR SOON' },
  discuss_next_visit: { color: COLORS.warning, tint: '#FEF3C7', label: 'MENTION AT YOUR NEXT VISIT' },
  monitor: { color: COLORS.success, tint: '#DCFCE7', label: 'NO URGENT VISIT NEEDED' },
  gathering_data: { color: COLORS.secondary, tint: '#DBEAFE', label: 'GATHERING MORE DATA' }
};

const ANALYTE_COLOR = {
  creatinine: COLORS.primary,
  egfr: COLORS.accent,
  bun: COLORS.secondary,
  hba1c: COLORS.primary,
  acr: COLORS.muted
};

function fmtDate(d) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  return `${date.getDate()} ${date.toLocaleDateString('en-US', { month: 'short' })} '${String(date.getFullYear()).slice(-2)}`;
}

// Keeps content from running off the bottom of a page.
function ensureSpace(doc, needed) {
  if (doc.y + needed > 770) {
    doc.addPage();
    doc.y = 50;
  }
}

function drawHeader(doc, summary) {
  doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(20).text('Parchi', LEFT, 45);
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8)
    .text('Health trend summary', LEFT, 68);

  doc.fillColor(COLORS.muted).fontSize(8)
    .text(`Generated ${fmtDate(new Date())}`, RIGHT - 200, 45, { width: 200, align: 'right' });

  doc.moveTo(LEFT, 86).lineTo(RIGHT, 86).strokeColor(COLORS.primary).lineWidth(1.5).stroke();

  doc.fillColor(COLORS.heading).font('Helvetica-Bold').fontSize(17)
    .text(`${summary.patient.name}'s summary`, LEFT, 100);

  const range =
    summary.patient.reportsCount > 0
      ? `Based on ${summary.patient.reportsCount} report${summary.patient.reportsCount === 1 ? '' : 's'} from ${summary.patient.rangeStart} to ${summary.patient.rangeEnd}`
      : 'No verified reports yet';
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(9).text(range, LEFT, 122);

  doc.y = 145;
}

function drawDoctorVisit(doc, doctorVisit) {
  const style = LEVEL_STYLE[doctorVisit.level] || LEVEL_STYLE.gathering_data;
  const boxH = 54;

  const boxY = doc.y;
  doc.roundedRect(LEFT, boxY, CONTENT_W, boxH, 6).fillAndStroke(style.tint, style.tint);
  doc.fillColor(style.color).font('Helvetica-Bold').fontSize(8)
    .text(style.label, LEFT + 16, boxY + 12, { width: CONTENT_W - 32 });
  doc.fillColor(COLORS.body).font('Helvetica').fontSize(10)
    .text(doctorVisit.message, LEFT + 16, boxY + 27, { width: CONTENT_W - 32 });

  doc.y = boxY + boxH + 16;
}

function sectionTitle(doc, text) {
  ensureSpace(doc, 40);
  doc.fillColor(COLORS.heading).font('Helvetica-Bold').fontSize(13).text(text, LEFT, doc.y);
  doc.moveTo(LEFT, doc.y + 4).lineTo(RIGHT, doc.y + 4).strokeColor(COLORS.hairline).lineWidth(1).stroke();
  doc.y += 14;
}

// Vector line chart — same data the web charts use, redrawn with pdfkit paths.
function drawChart(doc, { title, points, valueKey, color, threshold, unit }) {
  const values = points.map((p) => p[valueKey]).filter((v) => typeof v === 'number');
  if (values.length === 0) return;

  const chartH = 110;
  ensureSpace(doc, chartH + 54);

  const top = doc.y + 16;
  const plotLeft = LEFT + 38;
  const plotRight = RIGHT - 14;
  const plotW = plotRight - plotLeft;

  doc.fillColor(COLORS.heading).font('Helvetica-Bold').fontSize(9)
    .text(unit ? `${title}  (${unit})` : title, LEFT, doc.y);

  const candidates = threshold ? [...values, threshold.value] : values;
  let min = Math.min(...candidates);
  let max = Math.max(...candidates);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.15;
  min -= pad;
  max += pad;

  const xFor = (i) => (values.length === 1 ? plotLeft + plotW / 2 : plotLeft + (plotW * i) / (values.length - 1));
  const yFor = (v) => top + chartH - ((v - min) / (max - min)) * chartH;

  // horizontal gridlines + y labels
  doc.lineWidth(0.5).font('Helvetica').fontSize(6.5);
  for (let g = 0; g <= 3; g++) {
    const v = min + ((max - min) * g) / 3;
    const y = yFor(v);
    doc.moveTo(plotLeft, y).lineTo(plotRight, y).strokeColor('#EEF2F6').stroke();
    doc.fillColor(COLORS.muted).text(v.toFixed(1), LEFT, y - 3, { width: 34, align: 'right' });
  }

  // threshold marker
  if (threshold && threshold.value >= min && threshold.value <= max) {
    const ty = yFor(threshold.value);
    doc.save().lineWidth(1).dash(3, { space: 2 }).strokeColor('#CBD5E1')
      .moveTo(plotLeft, ty).lineTo(plotRight, ty).stroke().undash().restore();
    doc.fillColor(COLORS.muted).fontSize(6.5)
      .text(`${threshold.value}`, plotRight - 28, ty - 8, { width: 28, align: 'right' });
  }

  // the trend line
  doc.save().lineWidth(1.8).strokeColor(color).lineJoin('round');
  values.forEach((v, i) => (i === 0 ? doc.moveTo(xFor(i), yFor(v)) : doc.lineTo(xFor(i), yFor(v))));
  doc.stroke().restore();

  // dots
  values.forEach((v, i) => {
    doc.circle(xFor(i), yFor(v), 2.6).fillAndStroke('#FFFFFF', color);
  });

  // x labels — first/last always, middles when there's room
  const labelPoints = points.filter((p) => typeof p[valueKey] === 'number');
  doc.font('Helvetica').fontSize(6).fillColor(COLORS.muted);
  labelPoints.forEach((p, i) => {
    const step = Math.ceil(labelPoints.length / 5);
    if (i !== 0 && i !== labelPoints.length - 1 && i % step !== 0) return;
    doc.text(fmtDate(p.date), xFor(i) - 26, top + chartH + 6, { width: 52, align: 'center' });
  });

  doc.y = top + chartH + 22;
}

function drawAnalyte(doc, insight) {
  if (!insight) return;
  ensureSpace(doc, 120);

  const color = ANALYTE_COLOR[insight.analyteKey] || COLORS.primary;

  const hasValue = insight.latestValue !== null && insight.latestValue !== undefined;
  const headingY = doc.y;

  doc.fillColor(COLORS.heading).font('Helvetica-Bold').fontSize(10).text(insight.label, LEFT, headingY);
  if (hasValue) {
    const labelW = doc.widthOfString(insight.label) + 12;
    doc.fillColor(color).font('Helvetica-Bold').fontSize(10)
      .text(`${insight.latestValue} ${insight.unit}`, LEFT + labelW, headingY);
    const valueW = doc.widthOfString(`${insight.latestValue} ${insight.unit}`) + 6;
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8)
      .text(`(${insight.latestDate || ''})`, LEFT + labelW + valueW, headingY + 1.5);
  }
  doc.y = headingY + 15;

  if (insight.reference) {
    doc.fillColor(COLORS.body).font('Helvetica').fontSize(8.5)
      .text(insight.reference.function, LEFT, doc.y, { width: CONTENT_W });
    doc.fillColor(COLORS.muted).fontSize(7.5)
      .text(`Normal range: ${insight.reference.normalRangeText} (Source: ${insight.reference.source})`, { width: CONTENT_W });
    doc.moveDown(0.4);
  }

  // highlighted projection — the thing the patient most needs to see
  if (insight.timeToThreshold || insight.alreadyCrossed) {
    const text = insight.alreadyCrossed
      ? `Already at or beyond the reference threshold (${insight.threshold?.value} ${insight.unit}).`
      : `At the current rate, projected to reach the reference threshold in about ${insight.timeToThreshold.text}.`;
    const tint = insight.alreadyCrossed ? '#FEE2E2' : '#FEF3C7';
    const accent = insight.alreadyCrossed ? COLORS.danger : COLORS.warning;

    doc.font('Helvetica-Bold').fontSize(9);
    const h = doc.heightOfString(text, { width: CONTENT_W - 28 }) + 18;
    ensureSpace(doc, h + 10);

    const blockY = doc.y;
    doc.roundedRect(LEFT, blockY, CONTENT_W, h, 4).fillAndStroke(tint, tint);
    doc.rect(LEFT, blockY, 3, h).fill(accent);
    doc.fillColor(COLORS.body).font('Helvetica-Bold').fontSize(9)
      .text(text, LEFT + 14, blockY + 9, { width: CONTENT_W - 28 });
    doc.y = blockY + h + 8;
  }

  doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(7)
    .text('WHY THIS IS FLAGGED', LEFT, doc.y);
  doc.fillColor(COLORS.body).font('Helvetica').fontSize(8.5)
    .text(insight.whyFlagged, { width: CONTENT_W });
  doc.moveDown(0.3);

  doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(7)
    .text('WHEN TO SEE A DOCTOR', LEFT, doc.y);
  doc.fillColor(COLORS.body).font('Helvetica').fontSize(8.5)
    .text(insight.whenToSeeDoctor, { width: CONTENT_W });
  doc.moveDown(0.3);

  if (insight.questionsToAsk?.length) {
    ensureSpace(doc, 30 + insight.questionsToAsk.length * 20);
    doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(7)
      .text('WHAT TO ASK YOUR DOCTOR', LEFT, doc.y);
    doc.moveDown(0.2);

    insight.questionsToAsk.forEach((q) => {
      doc.font('Helvetica').fontSize(8.5);
      const h = doc.heightOfString(q, { width: CONTENT_W - 26 }) + 12;
      ensureSpace(doc, h + 6);

      const blockY = doc.y;
      doc.roundedRect(LEFT, blockY, CONTENT_W, h, 3).fillAndStroke(COLORS.panel, COLORS.hairline);
      doc.fillColor(COLORS.body).font('Helvetica').fontSize(8.5)
        .text(q, LEFT + 12, blockY + 6, { width: CONTENT_W - 26 });
      doc.y = blockY + h + 4;
    });
  }

  doc.moveDown(0.6);
}

function drawRecordsTable(doc, records) {
  if (!records?.length) return;
  sectionTitle(doc, 'All values on record');

  const cols = [
    { x: LEFT, w: 190, label: 'MARKER' },
    { x: LEFT + 190, w: 110, label: 'VALUE' },
    { x: LEFT + 300, w: 100, label: 'DATE' },
    { x: LEFT + 400, w: 95, label: 'STATUS' }
  ];

  // Every cell is drawn at an explicit y — pdfkit advances doc.y after each
  // text() call, which would otherwise compound and blow the rows apart.
  ensureSpace(doc, 40);
  const headY = doc.y;
  doc.rect(LEFT, headY, CONTENT_W, 16).fill(COLORS.primary);
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7);
  cols.forEach((c) => doc.text(c.label, c.x + 6, headY + 5, { width: c.w - 6, lineBreak: false }));
  doc.y = headY + 16;

  const statusColor = {
    concerning: COLORS.danger,
    borderline: COLORS.warning,
    normal: COLORS.success,
    unclassified: COLORS.muted
  };

  records.forEach((r, i) => {
    ensureSpace(doc, 24);
    const rowY = doc.y;
    if (i % 2 === 1) doc.rect(LEFT, rowY, CONTENT_W, 16).fill('#F1F5F9');

    doc.font('Helvetica').fontSize(8).fillColor(COLORS.body)
      .text(r.label, cols[0].x + 6, rowY + 4.5, { width: cols[0].w - 6, lineBreak: false });
    doc.fillColor(COLORS.body)
      .text(`${r.value} ${r.unit}`, cols[1].x + 6, rowY + 4.5, { width: cols[1].w - 6, lineBreak: false });
    doc.fillColor(COLORS.muted)
      .text(fmtDate(r.date), cols[2].x + 6, rowY + 4.5, { width: cols[2].w - 6, lineBreak: false });
    doc.fillColor(statusColor[r.status] || COLORS.muted).font('Helvetica-Bold')
      .text(r.status, cols[3].x + 6, rowY + 4.5, { width: cols[3].w - 6, lineBreak: false });

    doc.y = rowY + 16;
  });

  doc.y += 12;
}

function drawKeepAnEye(doc, keepAnEye, allNormal) {
  if (allNormal) {
    sectionTitle(doc, 'Keep an eye on');
    ensureSpace(doc, 40);
    doc.roundedRect(LEFT, doc.y, CONTENT_W, 30, 4).fillAndStroke('#DCFCE7', '#DCFCE7');
    doc.fillColor(COLORS.body).font('Helvetica').fontSize(9)
      .text('Everything looks healthy right now — all tracked markers are within normal, expected ranges.', LEFT + 14, doc.y + 10, { width: CONTENT_W - 28 });
    doc.y += 40;
    return;
  }

  if (!keepAnEye?.length) return;
  sectionTitle(doc, 'Keep an eye on');

  keepAnEye.forEach((item) => {
    const text = `${item.label} — ${item.currentValue} ${item.unit}. ${item.reason}`;
    doc.font('Helvetica').fontSize(8.5);
    const h = doc.heightOfString(text, { width: CONTENT_W - 26 }) + 14;
    ensureSpace(doc, h + 8);

    const blockY = doc.y;
    doc.roundedRect(LEFT, blockY, CONTENT_W, h, 4).fillAndStroke('#FEF3C7', '#FDE68A');
    doc.fillColor(COLORS.body).font('Helvetica').fontSize(8.5)
      .text(text, LEFT + 12, blockY + 7, { width: CONTENT_W - 26 });
    doc.y = blockY + h + 6;
  });

  doc.y += 8;
}

function drawHabits(doc, habits) {
  if (!habits) return;
  sectionTitle(doc, 'Everyday habits');

  [['Diet', habits.diet], ['Movement', habits.movement], ['General', habits.general]].forEach(([title, items]) => {
    if (!items?.length) return;
    ensureSpace(doc, 24 + items.length * 14);
    doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(8.5).text(title, LEFT, doc.y);
    items.forEach((p) => {
      doc.fillColor(COLORS.body).font('Helvetica').fontSize(8.5)
        .text(`•  ${p}`, LEFT + 10, doc.y + 2, { width: CONTENT_W - 20 });
    });
    doc.moveDown(0.4);
  });

  if (habits.disclaimer) {
    doc.font('Helvetica-Oblique').fontSize(7.5);
    const h = doc.heightOfString(habits.disclaimer, { width: CONTENT_W - 26 }) + 14;
    ensureSpace(doc, h + 10);

    const blockY = doc.y;
    doc.roundedRect(LEFT, blockY, CONTENT_W, h, 4).fillAndStroke('#FEF3C7', '#FDE68A');
    doc.fillColor(COLORS.body).font('Helvetica-Oblique').fontSize(7.5)
      .text(habits.disclaimer, LEFT + 12, blockY + 7, { width: CONTENT_W - 26 });
    doc.y = blockY + h + 8;
  }
}

function drawFooters(doc) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7)
      .text(
        'Parchi shows the direction of your lab values over time. It does not diagnose. Always discuss results with a qualified doctor.',
        LEFT, 790, { width: CONTENT_W - 60 }
      );
    doc.text(`Page ${i - range.start + 1} of ${range.count}`, RIGHT - 60, 790, { width: 60, align: 'right' });
  }
}

function generateSummaryPdf(summary, stream) {
  const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
  doc.pipe(stream);

  drawHeader(doc, summary);
  drawDoctorVisit(doc, summary.doctorVisit);

  if (summary.patient.reportsCount === 0) {
    doc.moveDown(2);
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(10)
      .text('Upload and verify your first report to see trends here.', LEFT, doc.y, { width: CONTENT_W });
    drawFooters(doc);
    doc.end();
    return;
  }

  sectionTitle(doc, 'Kidney');
  drawChart(doc, {
    title: 'Creatinine',
    points: summary.kidney.chartData,
    valueKey: 'creatinine',
    color: ANALYTE_COLOR.creatinine,
    threshold: summary.kidney.analytes.creatinine?.threshold,
    unit: 'mg/dL'
  });
  drawChart(doc, {
    title: 'BUN',
    points: summary.kidney.chartData,
    valueKey: 'bun',
    color: ANALYTE_COLOR.bun,
    threshold: summary.kidney.analytes.bun?.threshold,
    unit: 'mg/dL'
  });
  drawChart(doc, {
    title: 'eGFR',
    points: summary.kidney.egfrChartData,
    valueKey: 'egfr',
    color: ANALYTE_COLOR.egfr,
    threshold: summary.kidney.analytes.egfr?.threshold,
    unit: 'mL/min'
  });

  ['creatinine', 'egfr', 'bun', 'acr'].forEach((k) => drawAnalyte(doc, summary.kidney.analytes[k]));

  sectionTitle(doc, 'Diabetes');
  drawChart(doc, {
    title: 'HbA1c',
    points: summary.diabetes.chartData,
    valueKey: 'hba1c',
    color: ANALYTE_COLOR.hba1c,
    threshold: summary.diabetes.analytes.hba1c?.threshold,
    unit: '%'
  });
  drawAnalyte(doc, summary.diabetes.analytes.hba1c);

  drawKeepAnEye(doc, summary.keepAnEye, summary.allNormal);
  drawRecordsTable(doc, summary.records);
  drawHabits(doc, summary.habits);

  drawFooters(doc);
  doc.end();
}

module.exports = { generateSummaryPdf };
