const fetch = require('node-fetch');

async function testApiEndpoints() {
  try {
    console.log('🧪 Testing API endpoints...');
    
    const baseUrl = 'http://localhost:3000';
    const userId = 'JxNSv886lwN8CYMdqAityIbtFA43';
    
    // Test 1: Debug endpoint
    console.log('\n1️⃣ Testing debug endpoint...');
    try {
      const debugResponse = await fetch(`${baseUrl}/api/debug/check-mock`);
      const debugData = await debugResponse.json();
      console.log(`✅ Debug endpoint: ${debugResponse.status} - ${debugData.success ? 'Success' : 'Failed'}`);
    } catch (error) {
      console.log('❌ Debug endpoint failed:', error.message);
    }
    
    // Test 2: Bots by owner endpoint (without auth)
    console.log('\n2️⃣ Testing bots by owner endpoint (without auth)...');
    try {
      const botsResponse = await fetch(`${baseUrl}/api/bots/by-owner/${userId}`);
      const botsData = await botsResponse.json();
      console.log(`✅ Bots endpoint: ${botsResponse.status} - ${botsData.success ? 'Success' : 'Failed'}`);
      if (botsData.success) {
        console.log(`   Found ${botsData.data?.length || 0} bots`);
      } else {
        console.log(`   Error: ${botsData.error}`);
      }
    } catch (error) {
      console.log('❌ Bots endpoint failed:', error.message);
    }
    
    // Test 3: Chats endpoint (without auth)
    console.log('\n3️⃣ Testing chats endpoint (without auth)...');
    try {
      const chatsResponse = await fetch(`${baseUrl}/api/chats`);
      const chatsData = await chatsResponse.json();
      console.log(`✅ Chats endpoint: ${chatsResponse.status} - ${chatsData.success ? 'Success' : 'Failed'}`);
      if (chatsData.success) {
        console.log(`   Found ${chatsData.data?.length || 0} chat sessions`);
      } else {
        console.log(`   Error: ${chatsData.error}`);
      }
    } catch (error) {
      console.log('❌ Chats endpoint failed:', error.message);
    }
    
    // Test 4: Check if server is responding
    console.log('\n4️⃣ Testing server response...');
    try {
      const homeResponse = await fetch(`${baseUrl}/`);
      console.log(`✅ Home page: ${homeResponse.status}`);
    } catch (error) {
      console.log('❌ Home page failed:', error.message);
    }
    
    console.log('\n🎉 API endpoint testing complete!');
    
  } catch (error) {
    console.error('❌ Error during API testing:', error);
    process.exit(1);
  }
}

testApiEndpoints(); 