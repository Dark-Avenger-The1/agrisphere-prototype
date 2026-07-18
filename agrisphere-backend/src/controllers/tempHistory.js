import axios from 'axios';
import fetchTempHistory from '../services/tempHistoryService.js';

const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;

const getTempHistoryGeo = async(req,res)=>{
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' });

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
             return res.status(400).json({ error: 'Invalid lat/lng values' });
        }

        const cacheKey = `${latitude},${longitude}`;
        const cached = cache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return res.status(200).json({ message: 'Temp history (cached)', data: cached.data });
        }

        const endDate = new Date();
        endDate.setDate(endDate.getDate() - 1);
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 3);
        const formatDate = (d) => d.toISOString().split('T')[0];

        const response = await axios.get('https://archive-api.open-meteo.com/v1/archive', {
        params: {
            latitude, longitude,
            start_date: formatDate(startDate),
            end_date: formatDate(endDate),
            daily: 'temperature_2m_max,temperature_2m_min,temperature_2m_mean',
            timezone: 'auto'
        },
        timeout: 10000
        });

        const { time, temperature_2m_max, temperature_2m_min, temperature_2m_mean } = response.data.daily;
        const monthlyData = {};

        time.forEach((dateStr, i) => {
        const monthKey = dateStr.slice(0, 7);
        if (!monthlyData[monthKey]) monthlyData[monthKey] = { maxSum: 0, minSum: 0, meanSum: 0, count: 0 };
            monthlyData[monthKey].maxSum += temperature_2m_max[i] ?? 0;
            monthlyData[monthKey].minSum += temperature_2m_min[i] ?? 0;
            monthlyData[monthKey].meanSum += temperature_2m_mean[i] ?? 0;
            monthlyData[monthKey].count += 1;
        });

        const monthlyAverages = Object.entries(monthlyData).map(([month, v]) => ({
            month,
            avgMaxTemp: +(v.maxSum / v.count).toFixed(1),
            avgMinTemp: +(v.minSum / v.count).toFixed(1),
            avgMeanTemp: +(v.meanSum / v.count).toFixed(1)
        }));

        const result = {
            location: { latitude, longitude },
            range: { start: formatDate(startDate), end: formatDate(endDate) },
            monthlyAverages
        };

        cache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
        return res.status(200).json({ message: 'Temp history fetched', data: result });
    } catch (error) {
        if (error.code === 'ECONNABORTED') return res.status(504).json({ error: 'Temp history API timed out' });
        return res.status(500).json({ error: error.message });
    }
};

export default getTempHistoryGeo;