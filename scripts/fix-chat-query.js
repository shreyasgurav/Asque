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

async function fixChatQuery() {
  try {
    console.log('🔧 Fixing chat sessions query...');
    
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
    
    // Test different query approaches
    console.log('\n🔍 Testing different query approaches...');
    
    // Approach 1: Simple query by userId only
    console.log('\n1️⃣ Testing simple query by userId only...');
    try {
      const query1 = await db
        .collection('chatSessions')
        .where('userId', '==', userId)
        .get();
      
      console.log(`✅ Simple query successful: ${query1.size} sessions found`);
      
      // Filter in memory for isAuthenticated
      const authenticatedSessions = query1.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(session => session.isAuthenticated === true)
        .sort((a, b) => {
          const aTime = a.lastActivityAt?.toDate?.() || new Date(a.lastActivityAt);
          const bTime = b.lastActivityAt?.toDate?.() || new Date(b.lastActivityAt);
          return bTime - aTime;
        });
      
      console.log(`✅ Filtered to ${authenticatedSessions.length} authenticated sessions`);
      
      authenticatedSessions.forEach((session, index) => {
        console.log(`  ${index + 1}. Session ${session.id}: ${session.messages?.length || 0} messages`);
      });
      
    } catch (error) {
      console.log('❌ Simple query failed:', error.message);
    }
    
    // Approach 2: Query by userId and isAuthenticated (requires simple index)
    console.log('\n2️⃣ Testing query with userId and isAuthenticated...');
    try {
      const query2 = await db
        .collection('chatSessions')
        .where('userId', '==', userId)
        .where('isAuthenticated', '==', true)
        .get();
      
      console.log(`✅ Two-field query successful: ${query2.size} sessions found`);
      
      // Sort in memory
      const sortedSessions = query2.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const aTime = a.lastActivityAt?.toDate?.() || new Date(a.lastActivityAt);
          const bTime = b.lastActivityAt?.toDate?.() || new Date(b.lastActivityAt);
          return bTime - aTime;
        });
      
      sortedSessions.forEach((session, index) => {
        console.log(`  ${index + 1}. Session ${session.id}: ${session.messages?.length || 0} messages`);
      });
      
    } catch (error) {
      console.log('❌ Two-field query failed:', error.message);
      if (error.message.includes('index')) {
        console.log('\n📋 Need simple index for: userId + isAuthenticated');
        console.log('Direct link: https://console.firebase.google.com/v1/r/project/askitai/firestore/indexes?create_composite=CkRwcm9qZWN0cy9hc2tpdGFpL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jaGF0U2Vzc2lvbnMvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaEwoPaXNBdXRoZW50aWNhdGVkEAEaDAoIX19uYW1lX18QAg');
      }
    }
    
    console.log('\n🎉 Query testing complete!');
    console.log('\n📋 Recommendation:');
    console.log('1. Use the simple query approach (userId only)');
    console.log('2. Filter isAuthenticated in memory');
    console.log('3. Sort by lastActivityAt in memory');
    console.log('4. This avoids complex composite indexes');
    
  } catch (error) {
    console.error('❌ Error during query testing:', error);
    process.exit(1);
  }
}

fixChatQuery(); 