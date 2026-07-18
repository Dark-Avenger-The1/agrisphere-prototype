import askGeneralQuestion from "../services/generalQuestionService.js";

const postAskQuestion = async (req, res) => {
  try {
    const { question, location } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'question is required' });
    }

    console.time('askGeneralQuestion');
    const result = await askGeneralQuestion(question, location);
    console.timeEnd('askGeneralQuestion');

    return res.status(200).json({ message: 'Answer generated', data: result });
  } catch (error) {
    if (error.code === 'ECONNABORTED') return res.status(504).json({ error: 'AI API timed out' });
    return res.status(error.statusCode || 500).json({ error: error.message, raw: error.raw });
  }
};

export default postAskQuestion;