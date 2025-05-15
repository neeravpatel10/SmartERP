const axios = require('axios');

// Get token from command-line argument if provided, or use empty string
const token = process.argv[2] || '';

// Test the departments API endpoint
async function testDepartmentsAPI() {
  try {
    console.log('Testing departments API endpoint...');
    console.log(`Using token: ${token ? 'Token provided' : 'No token provided'}`);
    
    const response = await axios.get('http://localhost:3000/api/departments', {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API Response Status:', response.status);
    console.log('Success:', response.data.success);
    
    if (response.data.success) {
      const departments = response.data.data.departments;
      console.log(`Departments found: ${departments.length}`);
      console.log('First few departments:');
      departments.slice(0, 3).forEach(dept => {
        console.log(`- ${dept.code}: ${dept.name} (ID: ${dept.id})`);
      });
    } else {
      console.log('API returned success: false');
      console.log('Message:', response.data.message);
    }
  } catch (error) {
    console.error('Error testing departments API:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request error:', error.message);
    }
  }
}

// Run the test
testDepartmentsAPI();
