import fetchSeasonalForecast from "../services/fetchSeasonalWeather.js";
import predictCropsWithSupplyDemand from "../services/cropSupplyDemandService.js";

const getFinalCropRecommendations = async (req, res) => {
  try {
    const { lat, lng, location } = req.query;
    if (!lat || !lng || !location) {
      return res.status(400).json({ error: 'lat, lng, and location are required' });
    }

    console.time('seasonalForecast');
    const tempHistory = await fetchSeasonalForecast(lat, lng);
    console.timeEnd('seasonalForecast');

    console.time('cropAndSupplyDemand');
    const crops = await predictCropsWithSupplyDemand(tempHistory.monthlyAverages, lat, lng, location);
    console.timeEnd('cropAndSupplyDemand');

    return res.status(200).json({
      message: 'Crop recommendations with supply-demand filtering generated',
      data: { location, crops }
    });
  } catch (error) {
    if (error.code === 'ECONNABORTED') return res.status(504).json({ error: 'AI API timed out' });
    return res.status(error.statusCode || 500).json({ error: error.message, raw: error.raw });
  }
};

export default getFinalCropRecommendations;