import axios from 'axios';

export const askGeneralQuestion = async (question, location) => {
  const prompt = `You are AgriAI, a friendly and knowledgeable farming assistant for Filipino farmers, especially those in ${location || 'the Philippines'}. You help with crop advice, waste-to-value ideas, market timing, and general farming questions.

Respond in English only, even if the location suggests a regional language. Answer clearly and concisely (2-4 short paragraphs max, or a short list if that fits better). Use a warm, practical tone — you're talking to a farmer, not writing a research paper. If the question isn't related to farming, agriculture, or AgriSphere's features, politely say so and steer back to what you can help with.

Farmer's question: ${question}`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1500, temperature: 0.4 }
      },
      { timeout: 20000 }
    );

    const candidate = response.data.candidates[0];

    // Diagnostic logging — safe to remove once you've confirmed behavior
    console.log('Finish reason:', candidate.finishReason);
    console.log('Number of parts:', candidate.content.parts.length);

    // Join ALL parts instead of assuming there's only one — a truncated or
    // multi-part response was silently dropping content when only
    // parts[0].text was read.
    const answer = candidate.content.parts.map(p => p.text || '').join('').trim();

    if (!answer) {
      const error = new Error('AI returned an empty response');
      error.statusCode = 502;
      throw error;
    }

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