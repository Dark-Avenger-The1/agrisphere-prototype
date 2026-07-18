import axios from 'axios';

export const predictCropsFromTemp = async (monthlyAverages, lat, lng) => {
  const prompt = `You are an agricultural advisor for farmers in the Philippines (Region 11, Davao area).

Historical monthly temperature data for location (${lat}, ${lng}):
${JSON.stringify(monthlyAverages)}

Task:
1. Predict the expected min/max temperature for each month of the upcoming year.
2. For each month, suggest 3-5 crops well-suited to that predicted temperature range, prioritizing crops commonly grown in Mindanao/Davao Region.

Respond ONLY with valid JSON, no markdown, no explanation:
{
  "predictions": [
    { "month": "January", "minTemp": number, "maxTemp": number, "suggestedCrops": ["crop1", "crop2", "crop3"] }
  ]
}`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }] },
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

export default predictCropsFromTemp;