#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 AsQue Environment Test');
console.log('========================');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local file exists');
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  
  let hasOpenAIKey = false;
  let hasFirebaseConfig = false;
  
  lines.forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key === 'OPENAI_API_KEY') {
        if (value && value !== 'sk-your-openai-api-key-here') {
          console.log('✅ OpenAI API key is set');
          hasOpenAIKey = true;
        } else {
          console.log('⚠️  OpenAI API key needs to be set');
        }
      }
      if (key.startsWith('NEXT_PUBLIC_FIREBASE_')) {
        hasFirebaseConfig = true;
      }
    }
  });
  
  if (!hasOpenAIKey) {
    console.log('\n❌ CRITICAL: OpenAI API key is required');
    console.log('   Get your key from: https://platform.openai.com/api-keys');
    console.log('   Add it to .env.local as: OPENAI_API_KEY=sk-your-actual-key');
  }
  
  if (!hasFirebaseConfig) {
    console.log('\nℹ️  Firebase config not found - app will use mock database');
    console.log('   This is fine for development');
  }
  
} else {
  console.log('❌ .env.local file not found');
  console.log('   Run: node scripts/setup-env.js');
}

// Check if .dev-data directory exists
const devDataPath = path.join(process.cwd(), '.dev-data');
if (fs.existsSync(devDataPath)) {
  console.log('✅ .dev-data directory exists');
  
  const files = fs.readdirSync(devDataPath);
  console.log(`   Found ${files.length} data files`);
} else {
  console.log('ℹ️  .dev-data directory will be created automatically');
}

// Check package.json dependencies
const packagePath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  const requiredDeps = ['next', 'react', 'openai', 'firebase'];
  
  console.log('\n📦 Checking dependencies...');
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} is installed`);
    } else {
      console.log(`❌ ${dep} is missing`);
    }
  });
}

console.log('\n🔧 Next steps:');
console.log('   1. Add your OpenAI API key to .env.local');
console.log('   2. Run: npm run dev');
console.log('   3. Open http://localhost:3000');
console.log('   4. Create a bot and test the functionality');

console.log('\n💡 If you still have loading issues:');
console.log('   - Check the browser console for errors');
console.log('   - Check the terminal for server errors');
console.log('   - Try refreshing the page');
console.log('   - Restart the development server'); 