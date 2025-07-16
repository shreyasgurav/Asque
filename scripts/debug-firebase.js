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

async function debugFirebase() {
  try {
    console.log('🔍 Debugging Firebase setup...');
    
    // Check environment variables
    console.log('\n📋 Environment Variables:');
    console.log('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing');
    console.log('- FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing');
    console.log('- FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✅ Set' : '❌ Missing');
    
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      console.log('\n❌ Missing Firebase credentials. Please check your .env.local file.');
      return;
    }
    
    // Initialize Firebase Admin
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    // Handle different private key formats
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    
    // Replace escaped newlines with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    // Validate the private key format
    if (!privateKey.includes('BEGIN PRIVATE KEY') || !privateKey.includes('END PRIVATE KEY')) {
      console.log('\n❌ Invalid private key format');
      return;
    }

    console.log('\n🔧 Initializing Firebase Admin...');
    
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
    console.log('\n🔍 Testing Firebase connection...');
    const testDoc = await db.collection('_test').doc('connection').get();
    console.log('✅ Firestore connection successful');
    
    // Check existing collections
    console.log('\n📊 Checking existing collections...');
    
    // Check bots collection
    const botsSnapshot = await db.collection('bots').limit(5).get();
    console.log(`✅ Bots collection: ${botsSnapshot.size} documents found`);
    
    // Check chatSessions collection
    const chatSessionsSnapshot = await db.collection('chatSessions').limit(5).get();
    console.log(`✅ ChatSessions collection: ${chatSessionsSnapshot.size} documents found`);
    
    // Check unansweredQuestions collection
    const unansweredQuestionsSnapshot = await db.collection('unansweredQuestions').limit(5).get();
    console.log(`✅ UnansweredQuestions collection: ${unansweredQuestionsSnapshot.size} documents found`);
    
    // Test the specific query that's failing
    console.log('\n🔍 Testing the failing query...');
    const userId = 'JxNSv886lwN8CYMdqAityIbtFA43';
    
    try {
      const querySnapshot = await db
        .collection('chatSessions')
        .where('userId', '==', userId)
        .where('isAuthenticated', '==', true)
        .orderBy('lastActivityAt', 'desc')
        .get();
      
      console.log(`✅ Query successful: ${querySnapshot.size} chat sessions found for user ${userId}`);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`  - Session ${doc.id}: ${data.messages?.length || 0} messages, last activity: ${data.lastActivityAt}`);
      });
      
    } catch (error) {
      console.log('❌ Query failed:', error.message);
      if (error.message.includes('index')) {
        console.log('\n📋 Index creation needed. Use this direct link:');
        console.log('https://console.firebase.google.com/v1/r/project/askitai/firestore/indexes?create_composite=Ckxwcm9qZWN0cy9hc2tpdGFpL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jaGF0U2Vzc2lvbnMvaW5kZXhlcy9fEAEaEwoPaXNBdXRoZW50aWNhdGVkEAEaCgoGdXNlcklkEAEaEgoObGFzdEFjdGl2aXR5QXQQAhoMCghfX25hbWVfXxAC');
      }
    }
    
    // Create more chat sessions if needed
    console.log('\n💬 Creating additional chat sessions for testing...');
    const sampleChatSessions = [
      {
        id: 'session_debug_1',
        botId: 'bot_Gtklsx1Zf2_m',
        userId: userId,
        isAuthenticated: true,
        messages: [
          {
            id: 'msg_debug_1',
            content: 'Debug test message 1',
            role: 'user',
            timestamp: new Date(Date.now() - 60000), // 1 minute ago
          },
          {
            id: 'msg_debug_2',
            content: 'This is a debug response',
            role: 'assistant',
            timestamp: new Date(Date.now() - 30000), // 30 seconds ago
          }
        ],
        startedAt: new Date(Date.now() - 60000),
        lastActivityAt: new Date(Date.now() - 30000),
        status: 'active',
        messageCount: 2,
        successfulResponses: 1,
        failedQuestions: 0,
        averageResponseTime: 30000
      },
      {
        id: 'session_debug_2',
        botId: 'bot_Gtklsx1Zf2_m',
        userId: userId,
        isAuthenticated: true,
        messages: [
          {
            id: 'msg_debug_3',
            content: 'Another debug message',
            role: 'user',
            timestamp: new Date(Date.now() - 120000), // 2 minutes ago
          }
        ],
        startedAt: new Date(Date.now() - 120000),
        lastActivityAt: new Date(Date.now() - 120000),
        status: 'active',
        messageCount: 1,
        successfulResponses: 0,
        failedQuestions: 0,
        averageResponseTime: 0
      }
    ];
    
    for (const session of sampleChatSessions) {
      await db.collection('chatSessions').doc(session.id).set(session);
      console.log(`✅ Created debug chat session: ${session.id}`);
    }
    
    // Test the query again
    console.log('\n🔍 Testing query again after creating sessions...');
    try {
      const querySnapshot2 = await db
        .collection('chatSessions')
        .where('userId', '==', userId)
        .where('isAuthenticated', '==', true)
        .orderBy('lastActivityAt', 'desc')
        .get();
      
      console.log(`✅ Query successful: ${querySnapshot2.size} chat sessions found for user ${userId}`);
      
    } catch (error) {
      console.log('❌ Query still failing:', error.message);
    }
    
    // Clean up test document
    await db.collection('_test').doc('connection').delete();
    console.log('\n🧹 Cleaned up test document');
    
    console.log('\n🎉 Debugging complete!');
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
    process.exit(1);
  }
}

debugFirebase(); 