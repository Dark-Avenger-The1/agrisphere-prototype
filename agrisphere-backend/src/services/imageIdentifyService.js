import axios from 'axios';

export const identifyImage = async (base64Image, mimeType) => {
  const prompt = `You are an agricultural identification assistant for Philippine farms.

Look at this image and identify ONE of the following:
- A growing crop/plant (category: "crop")
- Harvested agricultural waste/byproduct like rice straw, corn stalks, banana waste, husks, etc. (category: "waste")

If you cannot confidently identify either, say so honestly — do not guess.

Respond ONLY with valid JSON, no markdown:
{
  "identified": boolean,
  "category": "crop" | "waste" | null,
  "name": "string or null, e.g. 'Mango' or 'Rice Straw'",
  "confidence": number (0-100),
  "message": "string, only if identified is false — explain briefly why (e.g. 'Image too blurry' or 'No plant or waste material visible')"
}`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64Image } }
          ]
        }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.1 }
      },
      { timeout: 25000 }
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

export default identifyImage;