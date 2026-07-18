import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

const testCropDetail = async () => {
  try {
    console.log('Testing crop-detail endpoint...');

    const response = await axios.get(`${BASE_URL}/trends/crop-detail`, {
      params: {
        crop: 'Mango',
        location: 'Tagum City',
        lat: 7.45,
        lng: 125.81
      },
      timeout: 30000
    });

    console.log('✅ Status:', response.status);
    console.log('✅ Message:', response.data.message);
    console.log('✅ Crop detail:', JSON.stringify(response.data.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.error('❌ Request failed:', error.response.status, error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
};

testCropDetail();