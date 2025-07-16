const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    lines.forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          process.env[key] = valueParts.join('=');
        }
      }
    });
  }
}

loadEnvFile();

async function setupFirestoreIndexes() {
  try {
    console.log('🔧 Setting up Firestore indexes...');
    
    // Initialize Firebase Admin
    const app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    
    const db = getFirestore(app);
    
    console.log('✅ Firebase Admin initialized');
    console.log('📋 Project ID:', process.env.FIREBASE_PROJECT_ID);
    
    // Test connection
    const testDoc = await db.collection('_test').doc('connection').get();
    console.log('✅ Firestore connection successful');
    
    console.log('\n📝 Required Indexes:');
    console.log('1. Collection: bots');
    console.log('   - Fields: ownerId (Ascending), createdAt (Descending), __name__ (Ascending)');
    console.log('   - Purpose: Query bots by owner with date sorting');
    
    console.log('\n2. Collection: bots');
    console.log('   - Fields: ownerPhoneNumber (Ascending), createdAt (Descending), __name__ (Ascending)');
    console.log('   - Purpose: Query bots by phone number with date sorting');
    
    console.log('\n3. Collection: chatSessions');
    console.log('   - Fields: botId (Ascending), lastActivityAt (Descending), __name__ (Ascending)');
    console.log('   - Purpose: Query chat sessions by bot with activity sorting');
    
    console.log('\n4. Collection: chatSessions');
    console.log('   - Fields: userId (Ascending), isAuthenticated (Ascending), lastActivityAt (Descending), __name__ (Ascending)');
    console.log('   - Purpose: Query chat sessions by user with authentication filter');
    
    console.log('\n5. Collection: unansweredQuestions');
    console.log('   - Fields: botId (Ascending), isAnswered (Ascending), __name__ (Ascending)');
    console.log('   - Purpose: Query unanswered questions by bot');
    
    console.log('\n🔗 To create these indexes:');
    console.log('1. Go to: https://console.firebase.google.com/');
    console.log('2. Select your project:', process.env.FIREBASE_PROJECT_ID);
    console.log('3. Go to Firestore Database → Indexes');
    console.log('4. Click "Create Index" and add each index above');
    console.log('5. Wait for indexes to build (may take a few minutes)');
    
    console.log('\n⚠️  Note: Indexes are required for complex queries with multiple field filters and ordering.');
    console.log('   The app will show index errors until these are created.');
    
  } catch (error) {
    console.error('❌ Error setting up indexes:', error.message);
    console.log('\n💡 Make sure your .env.local has the correct Firebase credentials.');
  }
}

setupFirestoreIndexes(); 