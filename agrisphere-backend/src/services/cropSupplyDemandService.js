import axios from 'axios';

const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

export const predictCropsWithSupplyDemand = async (monthlyAverages, lat, lng, location) => {
  const cacheKey = `${lat},${lng},${location}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const prompt = `You are an agricultural advisor for farmers in ${location}, Philippines (Davao Region).

Historical monthly temperature data for location (${lat}, ${lng}):
${JSON.stringify(monthlyAverages)}

Task: In ONE pass, identify the top 5-8 crops best suited to this location's climate, and for each provide full climate + market analysis to help a farmer decide what to plant while avoiding oversupply.

Respond ONLY with valid JSON, no markdown:
{
  "crops": [
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
    }
  ]
}`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 4000, temperature: 0.2 }
      },
      { timeout: 25000 }
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

    cache.set(cacheKey, { data: parsed.crops, expiresAt: Date.now() + CACHE_TTL_MS });
    return parsed.crops;
  } catch (error) {
    if (error.response) {
      const wrapped = new Error(`Gemini API error: ${JSON.stringify(error.response.data)}`);
      wrapped.statusCode = error.response.status;
      throw wrapped;
    }
    throw error;
  }
};

export default predictCropsWithSupplyDemand;