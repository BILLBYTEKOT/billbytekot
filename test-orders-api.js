const axios = require('axios');

async function testOrdersAPI() {
  try {
    console.log('🔧 Testing Orders API...');
    
    // Test without authentication first
    try {
      const response = await axios.get('http://localhost:8000/api/orders');
      console.log('✅ Orders API response:', response.data.length, 'orders');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('❌ Orders API requires authentication');
        console.log('Response:', error.response.data);
      } else {
        console.log('❌ Orders API error:', error.message);
      }
    }
    
    // Test direct database query
    console.log('\n🔧 Testing direct database connection...');
    
    // Try to connect to MongoDB directly
    const { MongoClient } = require('mongodb');
    const mongoUrl = process.env.MONGO_URL || 'mongodb+srv://shivshankarkumar281_db_user:RNdGNCCyBtj1d5Ar@retsro-ai.un0np9m.mongodb.net/restrobill?retryWrites=true&w=majority&authSource=admin&readPreference=primary&appName=retsro-ai';
    
    const client = new MongoClient(mongoUrl);
    await client.connect();
    
    const db = client.db('restrobill');
    const orders = await db.collection('orders').find({}).limit(10).toArray();
    
    console.log('✅ Direct DB query found', orders.length, 'orders');
    
    if (orders.length > 0) {
      console.log('📊 Sample order:', {
        id: orders[0].id,
        status: orders[0].status,
        created_at: orders[0].created_at,
        total: orders[0].total
      });
    }
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testOrdersAPI();