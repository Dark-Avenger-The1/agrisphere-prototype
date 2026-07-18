import axios from 'axios';

export const askGeneralQuestion = async (question, location) => {
  const prompt = `You are AgriAI, a friendly and knowledgeable farming assistant for Filipino farmers, especially those in ${location || 'the Philippines'}. You help with crop advice, waste-to-value ideas, market timing, and general farming questions.

Answer clearly and concisely (2-4 short paragraphs max, or a short list if that fits better). Use a warm, practical tone — you're talking to a farmer, not writing a research paper. If the question isn't related to farming, agriculture, or AgriSphere's features, politely say so and steer back to what you can help with.

Farmer's question: ${question}`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 800, temperature: 0.4 }
      },
      { timeout: 20000 }
    );

    const answer = response.data.candidates[0].content.parts[0].text.trim();
    return { answer };
  } catch (error) {
    if (error.response) {
      const wrapped = new Error(`Gemini API error: ${JSON.stringify(error.response.data)}`);
      wrapped.statusCode = error.response.status;
      throw wrapped;
    }
    throw error;
  }
};

export default askGeneralQuestion;