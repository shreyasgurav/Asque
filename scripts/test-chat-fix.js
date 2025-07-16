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

async function testChatFix() {
  try {
    console.log('🧪 Testing chat sessions fix...');
    
    // Initialize Firebase Admin
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    // Handle different private key formats
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    
    // Replace escaped newlines with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
    
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
    
    const userId = 'JxNSv886lwN8CYMdqAityIbtFA43';
    
    // Test the fixed query (simpler approach)
    console.log('\n🔍 Testing fixed query approach...');
    try {
      const querySnapshot = await db
        .collection('chatSessions')
        .where('userId', '==', userId)
        .get();
      
      console.log(`✅ Query successful: ${querySnapshot.size} total sessions found`);
      
      // Filter for authenticated sessions in memory
      const authenticatedSessions = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(session => session.isAuthenticated === true);
      
      console.log(`✅ Filtered to ${authenticatedSessions.length} authenticated sessions`);
      
      // Sort by lastActivityAt in memory (descending)
      const sortedSessions = authenticatedSessions.sort((a, b) => {
        const aTime = a.lastActivityAt instanceof Date ? a.lastActivityAt : new Date(a.lastActivityAt);
        const bTime = b.lastActivityAt instanceof Date ? b.lastActivityAt : new Date(b.lastActivityAt);
        return bTime.getTime() - aTime.getTime();
      });
      
      console.log('\n📋 Chat Sessions (sorted by most recent):');
      sortedSessions.forEach((session, index) => {
        const lastActivity = session.lastActivityAt instanceof Date ? 
          session.lastActivityAt : new Date(session.lastActivityAt);
        console.log(`  ${index + 1}. Session ${session.id}:`);
        console.log(`     - Messages: ${session.messages?.length || 0}`);
        console.log(`     - Status: ${session.status}`);
        console.log(`     - Last Activity: ${lastActivity.toLocaleString()}`);
        console.log(`     - Bot ID: ${session.botId}`);
      });
      
      console.log('\n🎉 Chat sessions fix is working!');
      console.log(`✅ Found ${sortedSessions.length} chat sessions for user ${userId}`);
      
    } catch (error) {
      console.log('❌ Query failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    process.exit(1);
  }
}

testChatFix(); 