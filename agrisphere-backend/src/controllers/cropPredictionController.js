import { fetchSeasonalForecast } from "../services/fetchSeasonalWeather.js";
import predictCropsFromTemp from "../services/cropRecommendationTemp.js";

const getCropRecommendation = async (req,res)=>{
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' });

        const tempHistory = await fetchSeasonalForecast(lat, lng);
        const prediction = await predictCropsFromTemp(tempHistory.monthlyAverages, lat, lng);

        return res.status(200).json({ message: 'Crop recommendation generated', data: prediction });
    } catch (error) {
        if (error.code === 'ECONNABORTED') return res.status(504).json({ error: 'AI API timed out' });
        return res.status(error.statusCode || 500).json({ error: error.message, raw: error.raw });
  }
}

export default getCropRecommendation;