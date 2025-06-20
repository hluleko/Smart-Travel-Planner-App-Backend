const axios = require('axios');
const fs = require('fs');
const API_URL = "https://smart-travel-planner-app-backend-production.up.railway.app/api";

// Test endpoint availability
async function testEndpoints() {
  console.log('Testing export endpoints...');
  
  // List of formats to test
  const formats = ['excel', 'pdf', 'csv'];
  
  // List of tables to test
  const tables = ['user', 'trip', 'destination', 'budget', 'admin', 'alert', 'allergy', 'stop'];
  
  // Test preview endpoints
  console.log('\nTesting preview endpoints:');
  for (const table of tables) {
    try {
      const response = await axios.get(`${API_URL}/preview/${table}`);
      console.log(`✅ Preview for ${table}: ${response.status} - Found ${response.data.length} rows`);
    } catch (error) {
      console.log(`❌ Preview for ${table}: ${error.response?.status || 'Error'} - ${error.message}`);
    }
  }
  
  // Test export endpoints
  console.log('\nTesting export endpoints:');
  for (const format of formats) {
    for (const table of tables) {
      try {
        const response = await axios.get(`${API_URL}/export/${table}/${format}`, { responseType: 'arraybuffer' });
        const contentType = response.headers['content-type'];
        console.log(`✅ Export ${table} to ${format}: ${response.status} - Content-Type: ${contentType}`);
        
        // Save sample file for inspection
        fs.writeFileSync(`./test-export-${table}-${format}.${format === 'excel' ? 'xlsx' : format}`, response.data);
      } catch (error) {
        console.log(`❌ Export ${table} to ${format}: ${error.response?.status || 'Error'} - ${error.message}`);
      }
    }
  }
}

testEndpoints();