import getWasteToValueAndPotentialProducts from "../services/wasteToValueAndPotentialProductService.js";

const getWasteToValueAndPotentialProductsController = async (req, res) => {
  try {
    const { wasteType, location } = req.query;
    if (!wasteType || !location) {
      return res.status(400).json({ error: 'wasteType and location are required' });
    }

    console.time('wasteToValueAndPotentialProducts');
    const data = await getWasteToValueAndPotentialProducts(wasteType, location);
    console.timeEnd('wasteToValueAndPotentialProducts');

    return res.status(200).json({ message: 'Waste to value and potential products generated', data });
  } catch (error) {
    if (error.code === 'ECONNABORTED') return res.status(504).json({ error: 'AI API timed out' });
    return res.status(error.statusCode || 500).json({ error: error.message, raw: error.raw });
  }
};

export default getWasteToValueAndPotentialProductsController;