import fetchSeasonalForecast from "../services/fetchSeasonalWeather.js";
import getCropDetail from "../services/cropDetailService.js";

const getCropDetailByScan = async (req, res) => {
  try {
    const { crop, location, lat, lng } = req.query;
    if (!crop || !location || !lat || !lng) {
      return res.status(400).json({ error: 'crop, location, lat, and lng are required' });
    }

    console.time('seasonalForecast');
    const tempHistory = await fetchSeasonalForecast(lat, lng);
    console.timeEnd('seasonalForecast');

    console.time('cropDetail');
    const detail = await getCropDetail(crop, location, tempHistory.monthlyAverages);
    console.timeEnd('cropDetail');

    return res.status(200).json({ message: 'Crop detail generated', data: detail });
  } catch (error) {
    if (error.code === 'ECONNABORTED') return res.status(504).json({ error: 'AI API timed out' });
    return res.status(error.statusCode || 500).json({ error: error.message, raw: error.raw });
  }
};

export default getCropDetailByScan;