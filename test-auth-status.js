const axios = require('axios');

async function testAuthStatus() {
  try {
    console.log('🔧 Testing Authentication Status...');
    
    // Test the auth/me endpoint to see if there's a valid session
    try {
      const response = await axios.get('http://localhost:8000/api/auth/me');
      console.log('✅ User is authenticated:', response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('❌ No valid authentication found');
        console.log('Need to login first');
        
        // Try to login with demo credentials
        console.log('\n🔧 Attempting demo login...');
        try {
          const loginResponse = await axios.post('http://localhost:8000/api/auth/login', {
            email: 'demo@billbytekot.in',
            password: 'demo123'
          });
          
          console.log('✅ Demo login successful');
          const token = loginResponse.data.access_token;
          
          // Now test orders API with token
          console.log('\n🔧 Testing orders API with token...');
          const ordersResponse = await axios.get('http://localhost:8000/api/orders', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('✅ Orders API response:', ordersResponse.data.length, 'orders');
          
          if (ordersResponse.data.length > 0) {
            console.log('📊 Sample order:', {
              id: ordersResponse.data[0].id,
              status: ordersResponse.data[0].status,
              created_at: ordersResponse.data[0].created_at,
              total: ordersResponse.data[0].total
            });
          }
          
        } catch (loginError) {
          console.log('❌ Demo login failed:', loginError.response?.data || loginError.message);
        }
        
      } else {
        console.log('❌ Auth check error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuthStatus();