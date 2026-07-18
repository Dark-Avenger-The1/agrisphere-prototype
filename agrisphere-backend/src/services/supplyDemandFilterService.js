import axios from 'axios';

export const filterBySupplyDemand = async (crops, location) => {
  const prompt = `You are an agricultural market advisor for farmers in ${location}, Philippines.

Crops to evaluate: ${JSON.stringify(crops)}

For EACH crop, provide climate and market analysis to help a farmer decide what to plant, avoiding oversupply.

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
      "expectedRevenuePerHa": "e.g. ₱12,400/ha",
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
      { contents: [{ parts: [{ text: prompt }] }] },
      { timeout: 20000 }
    );

    const rawText = response.data.candidates[0].content.parts[0].text;
    const cleaned = rawText.replace(/```json|```/g, '').trim();

    try {
      const parsed = JSON.parse(cleaned);
      return parsed.crops;
    } catch (parseError) {
      const error = new Error('AI returned invalid JSON');
      error.statusCode = 502;
      error.raw = rawText;
      throw error;
    }
  } catch (error) {
    if (error.response) {
      const wrapped = new Error(`Gemini API error: ${JSON.stringify(error.response.data)}`);
      wrapped.statusCode = error.response.status;
      throw wrapped;
    }
    throw error;
  }
};

export default filterBySupplyDemand;