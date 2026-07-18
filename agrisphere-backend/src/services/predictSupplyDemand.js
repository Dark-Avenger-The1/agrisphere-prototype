import axios from 'axios';

export const predictSupplyDemandTiming = async (crop, location) => {
    const prompt = `You are an agricultural market advisor for farmers in the Philippines.

Crop: ${crop}
Location: ${location}

Task: Based on typical growing cycles, regional harvest patterns, and general supply-demand trends for this crop in this location, determine:
1. The best month(s) to plant this crop to avoid market oversupply at harvest time.
2. The best month(s) to sell/harvest this crop when demand is typically higher and supply is lower.
3. A brief reason for the recommendation.

Respond ONLY with valid JSON, no markdown, no explanation outside the JSON:
{
  "crop": "string",
  "location": "string",
  "bestPlantingMonths": ["Month1", "Month2"],
  "bestSellingMonths": ["Month1", "Month2"],
  "reason": "short explanation of the supply-demand pattern behind this recommendation"
}`;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: prompt }] }]
            },
            { timeout: 15000 }
        );

        const rawText = response.data.candidates[0].content.parts[0].text;
        const cleaned = rawText.replace(/```json|```/g, '').trim();

        try {
            return JSON.parse(cleaned);
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

export default predictSupplyDemandTiming;