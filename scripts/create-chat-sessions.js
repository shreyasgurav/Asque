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

async function createChatSessions() {
  try {
    console.log('🔧 Creating sample chat sessions...');
    
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
    
    // Create sample chat sessions for the user
    const userId = 'JxNSv886lwN8CYMdqAityIbtFA43';
    const botId = 'bot_Gtklsx1Zf2_m';
    
    console.log('\n💬 Creating sample chat sessions...');
    
    const sampleChatSessions = [
      {
        id: 'session_1',
        botId: botId,
        userId: userId,
        isAuthenticated: true,
        messages: [
          {
            id: 'msg_1',
            content: 'Hello! How can I help you today?',
            role: 'assistant',
            timestamp: new Date(Date.now() - 86400000), // 1 day ago
          },
          {
            id: 'msg_2',
            content: 'I need help with my order',
            role: 'user',
            timestamp: new Date(Date.now() - 86400000 + 60000), // 1 day ago + 1 min
          },
          {
            id: 'msg_3',
            content: 'I can help you with that. What\'s your order number?',
            role: 'assistant',
            timestamp: new Date(Date.now() - 86400000 + 120000), // 1 day ago + 2 min
          }
        ],
        startedAt: new Date(Date.now() - 86400000),
        lastActivityAt: new Date(Date.now() - 86400000 + 120000),
        status: 'completed'
      },
      {
        id: 'session_2',
        botId: botId,
        userId: userId,
        isAuthenticated: true,
        messages: [
          {
            id: 'msg_4',
            content: 'Hi there! Welcome back.',
            role: 'assistant',
            timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          },
          {
            id: 'msg_5',
            content: 'Can you tell me about your services?',
            role: 'user',
            timestamp: new Date(Date.now() - 3600000 + 30000), // 1 hour ago + 30 sec
          },
          {
            id: 'msg_6',
            content: 'Of course! We offer various services including...',
            role: 'assistant',
            timestamp: new Date(Date.now() - 3600000 + 60000), // 1 hour ago + 1 min
          }
        ],
        startedAt: new Date(Date.now() - 3600000),
        lastActivityAt: new Date(Date.now() - 3600000 + 60000),
        status: 'active'
      },
      {
        id: 'session_3',
        botId: botId,
        userId: userId,
        isAuthenticated: true,
        messages: [
          {
            id: 'msg_7',
            content: 'Hello! How may I assist you?',
            role: 'assistant',
            timestamp: new Date(Date.now() - 300000), // 5 minutes ago
          },
          {
            id: 'msg_8',
            content: 'I have a question about pricing',
            role: 'user',
            timestamp: new Date(Date.now() - 300000 + 15000), // 5 minutes ago + 15 sec
          }
        ],
        startedAt: new Date(Date.now() - 300000),
        lastActivityAt: new Date(Date.now() - 300000 + 15000),
        status: 'active'
      }
    ];
    
    // Add chat sessions to Firestore
    for (const session of sampleChatSessions) {
      await db.collection('chatSessions').doc(session.id).set(session);
      console.log(`✅ Created chat session: ${session.id}`);
    }
    
    console.log('\n🎉 Sample chat sessions created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Go to Firebase Console → Firestore Database → Indexes');
    console.log('2. Create the following composite index:');
    console.log('\n   💬 Chat Sessions by User (with authentication):');
    console.log('   - Collection: chatSessions');
    console.log('   - Fields: userId (Ascending), isAuthenticated (Ascending), lastActivityAt (Descending), __name__ (Ascending)');
    console.log('\n   Direct Link:');
    console.log('   https://console.firebase.google.com/v1/r/project/askitai/firestore/indexes?create_composite=Ckxwcm9qZWN0cy9hc2tpdGFpL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jaGF0U2Vzc2lvbnMvaW5kZXhlcy9fEAEaEwoPaXNBdXRoZW50aWNhdGVkEAEaCgoGdXNlcklkEAEaEgoObGFzdEFjdGl2aXR5QXQQAhoMCghfX25hbWVfXxAC');
    
    // Clean up test document
    await db.collection('_test').doc('connection').delete();
    console.log('\n🧹 Cleaned up test document');
    
  } catch (error) {
    console.error('❌ Error creating chat sessions:', error);
    process.exit(1);
  }
}

createChatSessions(); 