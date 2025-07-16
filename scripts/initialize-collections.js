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

async function initializeCollections() {
  try {
    console.log('🔧 Initializing Firestore collections...');
    
    // Initialize Firebase Admin
    // Clean and validate the private key
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    // Handle different private key formats
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    
    // Replace escaped newlines with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    // Validate the private key format
    if (!privateKey.includes('BEGIN PRIVATE KEY') || !privateKey.includes('END PRIVATE KEY')) {
      throw new Error('Invalid private key format - must contain BEGIN and END PRIVATE KEY markers');
    }

    console.log('🔧 Initializing Firebase Admin with cleaned credentials...');
    
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    };

    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    
    const db = getFirestore(app);
    
    console.log('✅ Firebase Admin initialized');
    console.log('📋 Project ID:', process.env.FIREBASE_PROJECT_ID);
    
    // Test connection
    const testDoc = await db.collection('_test').doc('connection').get();
    console.log('✅ Firestore connection successful');
    
    // Initialize chatSessions collection
    console.log('\n📝 Initializing chatSessions collection...');
    const sampleChatSession = {
      id: 'sample_session_1',
      botId: 'sample_bot',
      userId: 'sample_user',
      messages: [
        {
          id: 'msg_1',
          content: 'Hello!',
          role: 'user',
          timestamp: new Date(),
        },
        {
          id: 'msg_2',
          content: 'Hi there! How can I help you?',
          role: 'assistant',
          timestamp: new Date(),
        }
      ],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.collection('chatSessions').doc('sample_session_1').set(sampleChatSession);
    console.log('✅ Created sample chat session');
    
    // Initialize unansweredQuestions collection
    console.log('\n❓ Initializing unansweredQuestions collection...');
    const sampleUnansweredQuestion = {
      id: 'sample_question_1',
      botId: 'sample_bot',
      question: 'What is the meaning of life?',
      context: 'User asked a philosophical question',
      timestamp: new Date(),
      status: 'pending',
    };
    
    await db.collection('unansweredQuestions').doc('sample_question_1').set(sampleUnansweredQuestion);
    console.log('✅ Created sample unanswered question');
    
    console.log('\n🎉 Collections initialized successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Go to Firebase Console → Firestore Database → Indexes');
    console.log('2. Create the following composite indexes:');
    console.log('\n   📊 Chat Sessions by Bot:');
    console.log('   - Collection: chatSessions');
    console.log('   - Fields: botId (Ascending), createdAt (Descending), __name__ (Ascending)');
    console.log('\n   📊 Chat Sessions by User:');
    console.log('   - Collection: chatSessions');
    console.log('   - Fields: userId (Ascending), createdAt (Descending), __name__ (Ascending)');
    console.log('\n   ❓ Unanswered Questions by Bot:');
    console.log('   - Collection: unansweredQuestions');
    console.log('   - Fields: botId (Ascending), timestamp (Descending), __name__ (Ascending)');
    
    // Clean up test document
    await db.collection('_test').doc('connection').delete();
    console.log('\n🧹 Cleaned up test document');
    
  } catch (error) {
    console.error('❌ Error initializing collections:', error);
    process.exit(1);
  }
}

initializeCollections(); 