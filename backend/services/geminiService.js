const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const EXTRACTION_PROMPT = `You are a medical lab report extraction engine. You do NOT interpret, diagnose, or comment — you ONLY copy numbers that are printed in the image.

STRICT RULES:
1. CORE ANALYTES: Prioritize extraction of Creatinine, BUN, ACR, HbA1c, and eGFR.
2. ALL ANALYTES: Extract EVERY numeric value found in the report that represents a lab test RESULT, including its label and unit.
3. FORBIDDEN: Do NOT hallucinate, guess, or infer any value not clearly printed.
4. FORBIDDEN: Do NOT extract reference ranges, sample/patient/test ID numbers, page numbers, phone numbers, or any other non-result number as if it were a test result.
5. EACH TEST ONCE: If a test name appears more than once on the page (e.g. once in a summary box and once in the detailed table), extract it only ONCE using its actual result value — never output the same test twice with two different numbers.
6. Copy value, unit, and analyte label EXACTLY as printed — no rounding, no conversion, no renaming.
7. Extract report date in ISO format (YYYY-MM-DD) if visible, else null.
8. Output ONLY valid JSON, no markdown fences, no extra text:
{
  "reportDate": "YYYY-MM-DD" | null,
  "labName": string | null,
  "analytes": [{ "rawLabel": string, "value": number, "unit": string }]
}
If nothing is found, return an empty array for analytes.`;

async function extractValues(fileBuffer, mimeType) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json'
      }
    });

    const result = await model.generateContent([
      EXTRACTION_PROMPT,
      {
        inlineData: {
          mimeType: mimeType,
          data: fileBuffer.toString('base64')
        }
      }
    ]);

    const rawText = result.response.text();
    if (!rawText) throw new Error('Empty response from Gemini');

    try {
      return JSON.parse(rawText);
    } catch (e) {
      throw new Error('Gemini returned non-JSON output: ' + rawText.slice(0, 200));
    }
  } catch (err) {
    console.error('--- Gemini Service Internal Error ---');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    throw err;
  }
}

module.exports = { extractValues };