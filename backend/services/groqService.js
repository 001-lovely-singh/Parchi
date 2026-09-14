const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const BRIEF_PROMPT = `You write a short, plain-language summary for a patient about a lab value trend. You are NOT a doctor and must NEVER diagnose, predict a disease, or tell the patient what they have.

RULES:
1. NEVER use: "diagnose", "diagnosis", "predict", "you have", "disease", "condition confirmed".
2. Only describe direction and rate of change.
3. Attribute any threshold to its source guideline — never invent your own cutoff.
4. Always end with a neutral suggestion to discuss with a doctor.
5. Under 80 words, plain language.
6. Output ONLY the summary text — no JSON, no markdown.`;

async function generateBrief({ analyteKey, trend, threshold, projection }) {
  const userPrompt = `Analyte: ${analyteKey}
Reports used: ${trend.reportsUploaded}
Slope per year: ${trend.slopePerYear}
Latest value: ${trend.latestValue}
Threshold: ${threshold ? `${threshold.value} (source: ${threshold.source})` : 'none'}
Projection: ${projection ? JSON.stringify(projection) : 'none'}`;

  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    temperature: 0.3,
    messages: [
      { role: 'system', content: BRIEF_PROMPT },
      { role: 'user', content: userPrompt }
    ]
  });

  return completion.choices[0]?.message?.content?.trim();
}

const HABITS_PROMPT = `You write short, general-audience everyday-habit notes (diet, movement, exercise) for a patient based on which lab markers are trending in a concerning direction. You are NOT a doctor or dietitian.

RULES:
1. NEVER give a diagnosis, a specific dosage, a specific drug, or a directive like "you must" / "you need to". Use gentle framing like "many people find it helpful to" or "generally".
2. Keep every suggestion general and safe for a broad audience — nothing extreme or restrictive.
3. If kidney markers are flagged, lean on general kidney-friendly habits (hydration, sodium awareness, routine checkups). If HbA1c/diabetes markers are flagged, lean on general blood-sugar-friendly habits (balanced carbohydrates, regular movement). If nothing is flagged, give general maintenance habits.
4. Output EXACTLY in this plain-text format, no markdown, no extra commentary:
DIET:
- point
- point
MOVEMENT:
- point
- point
GENERAL:
- point
- point
5. 2-3 bullet points per section, each under 20 words.`;

async function generateHabits({ flaggedAnalytes }) {
  const userPrompt =
    flaggedAnalytes && flaggedAnalytes.length > 0
      ? `Flagged markers: ${flaggedAnalytes.join(', ')}`
      : 'No markers are currently flagged — patient trends look healthy.';

  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    temperature: 0.4,
    messages: [
      { role: 'system', content: HABITS_PROMPT },
      { role: 'user', content: userPrompt }
    ]
  });

  const raw = completion.choices[0]?.message?.content?.trim() || '';
  return parseHabitsResponse(raw);
}

function parseHabitsResponse(raw) {
  const sections = { diet: [], movement: [], general: [] };
  const sectionKeyByHeader = { DIET: 'diet', MOVEMENT: 'movement', GENERAL: 'general' };
  let currentKey = null;

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const headerMatch = trimmed.match(/^(DIET|MOVEMENT|GENERAL):?$/i);
    if (headerMatch) {
      currentKey = sectionKeyByHeader[headerMatch[1].toUpperCase()];
      continue;
    }

    const bulletMatch = trimmed.match(/^[-•]\s*(.+)$/);
    if (bulletMatch && currentKey) {
      sections[currentKey].push(bulletMatch[1].trim());
    } else if (bulletMatch && !currentKey) {
      sections.general.push(bulletMatch[1].trim());
    }
  }

  const isEmpty = sections.diet.length === 0 && sections.movement.length === 0 && sections.general.length === 0;
  if (isEmpty && raw) {
    sections.general.push(raw);
  }

  return sections;
}

module.exports = { generateBrief, generateHabits };