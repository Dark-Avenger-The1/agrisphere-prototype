import axios from 'axios';

const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

export const getWasteToValueAndPotentialProducts = async (wasteType, location) => {
  const cacheKey = `${wasteType.toLowerCase()},${location.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const prompt = `You are an agricultural waste-to-value advisor for a farmer in ${location}, Philippines.

Identified waste/crop byproduct: ${wasteType}

Task: Provide two sets of recommendations:
1. "wasteToValue" — 3 ways to process this waste directly into value (e.g. biochar, compost, animal feed), ranked by effort/return. Mark the single best option with "best": true.
2. "potentialProducts" — 3 higher-value finished products this waste could be converted/sold into, with estimated price.

Also include an overall confidence score (0-100) and quality label for the identification.

Respond ONLY with valid JSON, no markdown:
{
  "wasteType": "string",
  "qualityLabel": "e.g. High Quality",
  "confidence": number (0-100),
  "wasteToValue": [
    { "name": "string", "note": "short note under 12 words, e.g. 'High carbon value - Low effort - Ready in 3 days'", "estimatedPrice": "e.g. \u20b16,200", "best": boolean }
  ],
  "potentialProducts": [
    { "name": "string", "note": "short note under 12 words", "estimatedPrice": "e.g. \u20b18,400" }
  ]
}`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2000, temperature: 0.2 }
      },
      { timeout: 20000 }
    );

    const rawText = response.data.candidates[0].content.parts[0].text;
    const cleaned = rawText.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      const error = new Error('AI returned invalid JSON');
      error.statusCode = 502;
      error.raw = rawText;
      throw error;
    }

    const result = { ...parsed, location };
    cache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  } catch (error) {
    if (error.response) {
      const wrapped = new Error(`Gemini API error: ${JSON.stringify(error.response.data)}`);
      wrapped.statusCode = error.response.status;
      throw wrapped;
    }
    throw error;
  }
};

export default getWasteToValueAndPotentialProducts;