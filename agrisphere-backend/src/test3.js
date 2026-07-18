import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

const testWasteToValueAndPotentialProducts = async () => {
  try {
    console.log('Testing waste-to-value-and-potential-products endpoint...');

    const response = await axios.get(`${BASE_URL}/trends/waste-to-value-and-potential-products`, {
      params: {
        wasteType: 'Rice Straw',
        location: 'Tagum City'
      },
      timeout: 30000
    });

    console.log('✅ Status:', response.status);
    console.log('✅ Message:', response.data.message);
    console.log('✅ Waste type:', response.data.data.wasteType);
    console.log('✅ Quality:', response.data.data.qualityLabel, '-', response.data.data.confidence + '%');
    console.log('✅ Waste-to-Value options:', JSON.stringify(response.data.data.wasteToValue, null, 2));
    console.log('✅ Potential Products:', JSON.stringify(response.data.data.potentialProducts, null, 2));
  } catch (error) {
    if (error.response) {
      console.error('❌ Request failed:', error.response.status, error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
};

testWasteToValueAndPotentialProducts();