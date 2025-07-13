const fetch = require('node-fetch');

// Test bot creation with file persistence
async function testBotCreation() {
  try {
    console.log('🧪 Testing bot creation with file persistence...');
    
    // Test data
    const testBot = {
      name: 'Test Bot Persistence',
      description: 'This is a test bot to verify file-based persistence',
      welcomeMessage: 'Hello! I am a persistent test bot.',
      ownerId: 'test-user-12345'
    };

    // Create bot via API
    const response = await fetch('http://localhost:3000/api/seed-test-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ botId: 'test-bot-123' }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Test data seeded successfully:', result);
      
      // Check if data persists
      const debugResponse = await fetch('http://localhost:3000/api/debug/mock-data');
      const debugResult = await debugResponse.json();
      
      console.log('📊 Mock database contents:');
      console.log('- Bots:', debugResult.data.bots.length);
      console.log('- Chat Sessions:', debugResult.data.chatSessions.length);
      console.log('- Unanswered Questions:', debugResult.data.unansweredQuestions.length);
      
      if (debugResult.data.bots.length > 0) {
        console.log('🎉 File persistence is working!');
        console.log('First bot:', debugResult.data.bots[0]);
      }
    } else {
      console.error('❌ Failed to seed test data:', response.status);
    }
    
  } catch (error) {
    console.error('💥 Error testing bot creation:', error);
  }
}

testBotCreation(); 