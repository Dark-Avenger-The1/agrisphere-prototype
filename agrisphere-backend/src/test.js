import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

const testBestCropsFinal = async () => {
  try {
    console.log('Testing best-crops-final endpoint...');

    const response = await axios.get(`${BASE_URL}/trends/best-crops-final`, {
      params: {
        lat: 7.45,
        lng: 125.81,
        location: 'Tagum City'
      },
      timeout: 40000
    });

    console.log('✅ Status:', response.status);
    console.log('✅ Message:', response.data.message);
    console.log('✅ Location:', response.data.data.location);
    console.log('✅ Total crops:', response.data.data.crops.length);
    console.log('✅ Sample crop:', JSON.stringify(response.data.data.crops[0], null, 2));
  } catch (error) {
    if (error.response) {
      console.error('❌ Request failed:', error.response.status, error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
};

testBestCropsFinal();