import axios from 'axios';

export const fetchSeasonalForecast = async (lat, lng) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    const error = new Error('Invalid lat/lng values');
    error.statusCode = 400;
    throw error;
  }

  try {
    const response = await axios.get('https://seasonal-api.open-meteo.com/v1/seasonal', {
      params: {
        latitude,
        longitude,
        daily: 'temperature_2m_max,temperature_2m_min',
        timezone: 'auto'
      },
      timeout: 10000
    });

    const { time, temperature_2m_max, temperature_2m_min } = response.data.daily;
    const monthlyData = {};

    time.forEach((dateStr, i) => {
      const monthKey = dateStr.slice(0, 7);
      if (!monthlyData[monthKey]) monthlyData[monthKey] = { maxSum: 0, minSum: 0, count: 0 };
      monthlyData[monthKey].maxSum += temperature_2m_max[i] ?? 0;
      monthlyData[monthKey].minSum += temperature_2m_min[i] ?? 0;
      monthlyData[monthKey].count += 1;
    });

    const monthlyAverages = Object.entries(monthlyData).map(([month, v]) => ({
      month,
      avgMaxTemp: +(v.maxSum / v.count).toFixed(1),
      avgMinTemp: +(v.minSum / v.count).toFixed(1)
    }));

    return { location: { latitude, longitude }, monthlyAverages };
  } catch (error) {
    // Surface the REAL cause instead of a generic axios message
    if (error.response) {
      const wrapped = new Error(`Open-Meteo error: ${JSON.stringify(error.response.data)}`);
      wrapped.statusCode = error.response.status;
      throw wrapped;
    }
    throw error;
  }
};