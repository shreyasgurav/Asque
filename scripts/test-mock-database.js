const fetch = require('node-fetch');

// Test mock database functionality
async function testMockDatabase() {
  try {
    console.log('🧪 Testing mock database functionality...');
    
    // Test 1: Create a bot
    console.log('\n1️⃣ Testing bot creation...');
    const createResponse = await fetch('http://localhost:3000/api/bots/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Mock auth for testing
      },
      body: JSON.stringify({
        name: 'Test Mock Bot',
        description: 'This is a test bot for mock database',
        welcomeMessage: 'Hello! I am a test bot.'
      }),
    });

    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log('✅ Bot created successfully:', createResult.data.bot.id);
      
      // Test 2: Fetch bots by owner
      console.log('\n2️⃣ Testing bot retrieval...');
      const ownerId = 'test-user-123';
      const fetchResponse = await fetch(`http://localhost:3000/api/bots/by-owner/${ownerId}`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      if (fetchResponse.ok) {
        const fetchResult = await fetchResponse.json();
        console.log('✅ Bots fetched successfully:', fetchResult.data?.length || 0, 'bots');
        
        if (fetchResult.data && fetchResult.data.length > 0) {
          console.log('📋 Bot details:', fetchResult.data[0].name);
        }
      } else {
        console.log('❌ Failed to fetch bots:', fetchResponse.status);
      }
      
    } else {
      console.log('❌ Failed to create bot:', createResponse.status);
    }
    
    // Test 3: Check mock data files
    console.log('\n3️⃣ Checking mock data files...');
    const fs = require('fs');
    const path = require('path');
    
    const devDataPath = path.join(process.cwd(), '.dev-data');
    const botsFile = path.join(devDataPath, 'bots.json');
    
    if (fs.existsSync(botsFile)) {
      const botsData = JSON.parse(fs.readFileSync(botsFile, 'utf-8'));
      console.log('✅ Mock database file exists with', Object.keys(botsData).length, 'bots');
    } else {
      console.log('❌ Mock database file not found');
    }
    
  } catch (error) {
    console.error('💥 Error testing mock database:', error);
  }
}

// Run the test
testMockDatabase(); 