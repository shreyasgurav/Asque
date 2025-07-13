#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 AsQue Environment Setup');
console.log('========================');

const envPath = path.join(process.cwd(), '.env.local');

// Check if .env.local already exists
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local already exists');
  console.log('📝 Current environment variables:');
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key] = line.split('=');
      console.log(`   ${key}`);
    }
  });
  
  console.log('\n💡 To add missing variables, edit .env.local manually');
} else {
  console.log('❌ .env.local not found');
  console.log('\n📋 Creating basic .env.local file...');
  
  const basicEnvContent = `# AsQue Bot Platform - Environment Variables

# ==============================================
# REQUIRED - OpenAI Configuration
# ==============================================
# Get your API key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-openai-api-key-here

# ==============================================
# OPTIONAL - Application Configuration
# ==============================================
# Base URL for your application (useful for production)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ==============================================
# Development Notes
# ==============================================
# 1. Only OPENAI_API_KEY is required to start development
# 2. Without Firebase config, the app uses a mock database
# 3. All NEXT_PUBLIC_ variables are exposed to the client
# 4. Never commit your actual .env.local file to version control
# 5. For production deployment, set these in your hosting platform's environment variables
`;

  fs.writeFileSync(envPath, basicEnvContent);
  console.log('✅ Created .env.local file');
  console.log('\n⚠️  IMPORTANT: You need to add your OpenAI API key to .env.local');
  console.log('   1. Get your API key from: https://platform.openai.com/api-keys');
  console.log('   2. Replace "sk-your-openai-api-key-here" with your actual key');
  console.log('   3. Restart the development server');
}

console.log('\n🔧 Next steps:');
console.log('   1. Add your OpenAI API key to .env.local');
console.log('   2. Run: npm run dev');
console.log('   3. Open http://localhost:3000');
console.log('\n📚 For Firebase setup (optional):');
console.log('   - Copy Firebase config from env.example to .env.local');
console.log('   - The app works without Firebase using mock database'); 