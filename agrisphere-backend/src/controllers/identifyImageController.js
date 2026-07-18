import identifyImage from "../services/imageIdentifyService.js";

const postIdentifyImage = async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    if (!image || !mimeType) {
      return res.status(400).json({ error: 'image (base64) and mimeType are required' });
    }

    console.time('identifyImage');
    const result = await identifyImage(image, mimeType);
    console.timeEnd('identifyImage');

    return res.status(200).json({ message: 'Image identification complete', data: result });
  } catch (error) {
    if (error.code === 'ECONNABORTED') return res.status(504).json({ error: 'AI API timed out' });
    return res.status(error.statusCode || 500).json({ error: error.message, raw: error.raw });
  }
};

export default postIdentifyImage;