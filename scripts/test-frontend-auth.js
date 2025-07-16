const fetch = require('node-fetch');

async function testFrontendAuth() {
  try {
    console.log('🧪 Testing frontend authentication...');
    
    const baseUrl = 'http://localhost:3000';
    
    // Test 1: Check if the app is accessible
    console.log('\n1️⃣ Testing app accessibility...');
    try {
      const homeResponse = await fetch(`${baseUrl}/`);
      console.log(`✅ Home page: ${homeResponse.status}`);
    } catch (error) {
      console.log('❌ Home page failed:', error.message);
    }
    
    // Test 2: Check if the my-bots page is accessible
    console.log('\n2️⃣ Testing my-bots page accessibility...');
    try {
      const myBotsResponse = await fetch(`${baseUrl}/my-bots`);
      console.log(`✅ My-bots page: ${myBotsResponse.status}`);
    } catch (error) {
      console.log('❌ My-bots page failed:', error.message);
    }
    
    // Test 3: Check if the my-chats page is accessible
    console.log('\n3️⃣ Testing my-chats page accessibility...');
    try {
      const myChatsResponse = await fetch(`${baseUrl}/my-chats`);
      console.log(`✅ My-chats page: ${myChatsResponse.status}`);
    } catch (error) {
      console.log('❌ My-chats page failed:', error.message);
    }
    
    // Test 4: Check authentication context
    console.log('\n4️⃣ Testing authentication endpoints...');
    try {
      const authResponse = await fetch(`${baseUrl}/api/auth/status`);
      console.log(`✅ Auth status: ${authResponse.status}`);
      if (authResponse.ok) {
        const authData = await authResponse.json();
        console.log('   Auth data:', authData);
      }
    } catch (error) {
      console.log('❌ Auth status failed:', error.message);
    }
    
    console.log('\n📋 Instructions for testing:');
    console.log('1. Open your browser to http://localhost:3000');
    console.log('2. Sign in with your phone number');
    console.log('3. Navigate to /my-bots and /my-chats');
    console.log('4. Check the browser console for detailed error messages');
    console.log('5. The enhanced error handling will show specific issues');
    
    console.log('\n🎉 Frontend testing complete!');
    
  } catch (error) {
    console.error('❌ Error during frontend testing:', error);
    process.exit(1);
  }
}

testFrontendAuth(); 