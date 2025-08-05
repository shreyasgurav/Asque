import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

console.log('🔍 Firebase Admin credentials check:', {
  hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
  hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
  hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
  isValidPrivateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY') : false,
  hasValidCredentials: !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY),
  privateKeyLength: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 0
});

let adminDb: FirebaseFirestore.Firestore | null = null;
let adminStorage: any = null;

// Test Firebase connection
async function testFirebaseConnection(db: FirebaseFirestore.Firestore) {
  try {
    await db.collection('_test').limit(1).get();
    console.log('✅ Firebase connection test successful');
  } catch (testError) {
    console.warn('⚠️ Firebase connection test failed:', testError instanceof Error ? testError.message : String(testError));
    console.log('🔄 Will fallback to mock database for operations');
  }
}

try {
  // Check if we have all required credentials
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.log('🚫 Firebase Admin disabled - missing credentials, using mock data for development');
    adminDb = null;
    adminStorage = null;
  } else {
    // Initialize Firebase Admin if not already initialized
    if (getApps().length === 0) {
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

      adminDb = getFirestore(app);
      adminStorage = getStorage(app);
      console.log('✅ Firebase Admin initialized successfully with Firestore and Storage');
      
      // Test the connection asynchronously
      testFirebaseConnection(adminDb);
    } else {
      adminDb = getFirestore();
      adminStorage = getStorage();
      console.log('✅ Firebase Admin already initialized');
    }
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error instanceof Error ? error.message : String(error));
  console.log('🚫 Firebase Admin disabled - using mock data for development');
  adminDb = null;
  adminStorage = null;
}

export { adminDb, adminStorage }; 