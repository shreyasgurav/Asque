// Test script to manually add a bot with phone number to the mock database
const fs = require('fs');
const path = require('path');

const DEV_DATA_DIR = path.join(process.cwd(), '.dev-data');
const BOTS_FILE = path.join(DEV_DATA_DIR, 'bots.json');

function createTestBot() {
  console.log('🧪 Creating test bot with phone number...');
  
  // Ensure directory exists
  if (!fs.existsSync(DEV_DATA_DIR)) {
    fs.mkdirSync(DEV_DATA_DIR, { recursive: true });
  }
  
  // Create test bot data
  const testBot = {
    id: 'bot_test_persistence',
    name: 'Test Persistence Bot',
    description: 'This bot tests cross-session persistence',
    welcomeMessage: 'Hello! I persist across sessions.',
    ownerId: 'JxNSv886lwN8CYMdqAityIbtFA43', // The user ID from your logs
    ownerPhoneNumber: '+1234567890', // Test phone number
    status: 'deployed',
    trainingMessages: [
      {
        id: 'tm_1',
        content: 'Test training message',
        timestamp: new Date().toISOString(),
        sourceType: 'manual'
      }
    ],
    publicUrl: '/bot/bot_test_persistence',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Load existing bots or create new object
  let bots = {};
  if (fs.existsSync(BOTS_FILE)) {
    try {
      const data = fs.readFileSync(BOTS_FILE, 'utf-8');
      bots = JSON.parse(data);
    } catch (error) {
      console.warn('Could not read existing bots file:', error);
    }
  }
  
  // Add test bot
  bots[testBot.id] = testBot;
  
  // Save to file
  fs.writeFileSync(BOTS_FILE, JSON.stringify(bots, null, 2));
  
  console.log('✅ Test bot created and saved to file');
  console.log('🤖 Bot ID:', testBot.id);
  console.log('👤 Owner ID:', testBot.ownerId);
  console.log('📱 Owner Phone:', testBot.ownerPhoneNumber);
  console.log('📄 File path:', BOTS_FILE);
}

createTestBot(); 