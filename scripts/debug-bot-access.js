#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Bot Access Debug Script');
console.log('==========================');

// Check if .dev-data directory exists and has bot data
const devDataPath = path.join(process.cwd(), '.dev-data');
const botsFile = path.join(devDataPath, 'bots.json');

if (fs.existsSync(botsFile)) {
  console.log('✅ Found bots.json file');
  
  try {
    const botsData = JSON.parse(fs.readFileSync(botsFile, 'utf-8'));
    console.log(`📊 Found ${Object.keys(botsData).length} bots in file`);
    
    // Display bot details
    Object.entries(botsData).forEach(([botId, bot]) => {
      console.log(`\n🤖 Bot: ${botId}`);
      console.log(`   Name: ${bot.name}`);
      console.log(`   Owner ID: ${bot.ownerId}`);
      console.log(`   Owner Phone: ${bot.ownerPhoneNumber || 'Not set'}`);
      console.log(`   Status: ${bot.status}`);
      console.log(`   Created: ${new Date(bot.createdAt).toLocaleString()}`);
    });
    
  } catch (error) {
    console.error('❌ Error reading bots file:', error);
  }
} else {
  console.log('❌ No bots.json file found');
  console.log('   This means no bots have been created yet or the file was deleted');
}

console.log('\n🔧 Troubleshooting Steps:');
console.log('1. Create a new bot and check if it appears in the file');
console.log('2. Check the browser console for detailed error messages');
console.log('3. Check the server logs for ownership verification details');
console.log('4. Try accessing the bot dashboard again');
console.log('\n💡 If the issue persists:');
console.log('   - Clear browser cache and cookies');
console.log('   - Restart the development server');
console.log('   - Check if you\'re logged in with the same phone number'); 