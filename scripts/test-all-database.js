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

async function testAllDatabase() {
  try {
    console.log('🧪 Testing all database functions...');
    
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
    const phoneNumber = '+911234567890';
    
    // Test 1: Get bots by owner
    console.log('\n1️⃣ Testing getBotsByOwner...');
    try {
      const botsByOwner = await db
        .collection('bots')
        .where('ownerId', '==', userId)
        .get();
      
      console.log(`✅ Found ${botsByOwner.size} bots for owner ${userId}`);
      
      botsByOwner.forEach((doc) => {
        const bot = doc.data();
        console.log(`  - ${bot.name} (${doc.id}): ${bot.status}`);
      });
      
    } catch (error) {
      console.log('❌ getBotsByOwner failed:', error.message);
    }
    
    // Test 2: Get bots by phone number
    console.log('\n2️⃣ Testing getBotsByPhoneNumber...');
    try {
      const botsByPhone = await db
        .collection('bots')
        .where('ownerPhoneNumber', '==', phoneNumber)
        .get();
      
      console.log(`✅ Found ${botsByPhone.size} bots for phone ${phoneNumber}`);
      
      botsByPhone.forEach((doc) => {
        const bot = doc.data();
        console.log(`  - ${bot.name} (${doc.id}): ${bot.status}`);
      });
      
    } catch (error) {
      console.log('❌ getBotsByPhoneNumber failed:', error.message);
      if (error.message.includes('index')) {
        console.log('📋 Need index for: ownerPhoneNumber + createdAt + __name__');
      }
    }
    
    // Test 3: Get chat sessions by user
    console.log('\n3️⃣ Testing getChatSessionsByUser...');
    try {
      const chatSessions = await db
        .collection('chatSessions')
        .where('userId', '==', userId)
        .get();
      
      console.log(`✅ Found ${chatSessions.size} total chat sessions for user ${userId}`);
      
      // Filter for authenticated sessions
      const authenticatedSessions = chatSessions.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(session => session.isAuthenticated === true);
      
      console.log(`✅ Filtered to ${authenticatedSessions.length} authenticated sessions`);
      
      authenticatedSessions.forEach((session, index) => {
        console.log(`  ${index + 1}. Session ${session.id}: ${session.messages?.length || 0} messages`);
      });
      
    } catch (error) {
      console.log('❌ getChatSessionsByUser failed:', error.message);
    }
    
    // Test 4: Get unanswered questions
    console.log('\n4️⃣ Testing getUnansweredQuestionsByBot...');
    try {
      const botId = 'bot_Gtklsx1Zf2_m';
      const unansweredQuestions = await db
        .collection('unansweredQuestions')
        .where('botId', '==', botId)
        .get();
      
      console.log(`✅ Found ${unansweredQuestions.size} unanswered questions for bot ${botId}`);
      
      unansweredQuestions.forEach((doc) => {
        const question = doc.data();
        console.log(`  - ${question.question} (${doc.id})`);
      });
      
    } catch (error) {
      console.log('❌ getUnansweredQuestionsByBot failed:', error.message);
    }
    
    // Test 5: Get specific bot
    console.log('\n5️⃣ Testing getBot...');
    try {
      const botId = 'bot_Gtklsx1Zf2_m';
      const botDoc = await db.collection('bots').doc(botId).get();
      
      if (botDoc.exists) {
        const bot = botDoc.data();
        console.log(`✅ Found bot: ${bot.name} (${botId})`);
        console.log(`  - Status: ${bot.status}`);
        console.log(`  - Owner: ${bot.ownerId}`);
        console.log(`  - Messages: ${bot.trainingMessages?.length || 0}`);
      } else {
        console.log(`❌ Bot ${botId} not found`);
      }
      
    } catch (error) {
      console.log('❌ getBot failed:', error.message);
    }
    
    console.log('\n🎉 All database tests completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    process.exit(1);
  }
}

testAllDatabase(); 