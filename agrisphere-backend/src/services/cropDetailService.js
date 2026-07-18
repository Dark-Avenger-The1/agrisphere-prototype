import axios from 'axios';

const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

export const getCropDetail = async (crop, location, monthlyAverages) => {
  const cacheKey = `${crop.toLowerCase()},${location.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const prompt = `You are an agricultural advisor for a farmer in ${location}, Philippines (Davao Region).

Crop: ${crop}
Historical monthly temperature data for this location: ${JSON.stringify(monthlyAverages)}

Task: Provide full climate and market analysis for this ONE crop to help the farmer decide whether and when to plant it, avoiding oversupply. Keep "climateNote" and "marketNote" each under 15 words.

Respond ONLY with valid JSON, no markdown:
{
  "name": "English name",
  "localName": "Filipino/Tagalog name",
  "temperatureFit": number (0-100),
  "climateNote": "1 short sentence",
  "bestPlantMonth": "e.g. Aug - Oct",
  "harvestWindowDays": "e.g. 90-110 days to harvest",
  "expectedRevenuePerHa": "e.g. \u20b112,400/ha",
  "demandLevel": "High Demand | Moderate Demand | Med Supply | Low Demand | Stable",
  "marketRisk": "Low | Moderate | High",
  "marketNote": "1 short sentence on supply-demand outlook",
  "effortLevel": "Low | Moderate | High"
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

export default getCropDetail;