import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

const testCropPrediction = async () => {
  try {
    console.log('Testing crop prediction endpoint...');

    const response = await axios.get(`${BASE_URL}/trends/get-crop-prediction`, {
      params: { lat: 7.3, lng: 125.68 },
      timeout: 20000
    });

    console.log('✅ Status:', response.status);
    console.log('✅ Message:', response.data.message);
    console.log('✅ Sample month:', response.data.data.predictions[0]);
    console.log('✅ Total months returned:', response.data.data.predictions.length);
  } catch (error) {
    if (error.response) {
      console.error('❌ Request failed:', error.response.status, error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
};

testCropPrediction();