import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log('🔥 Firebase Admin initialized');
  } else {
    console.warn('⚠️ Firebase Admin not initialized - missing environment variables');
  }
}

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  phoneNumber?: string;
}

export interface AuthenticatedRequest extends NextApiRequest {
  user: AuthenticatedUser;
}

// Extract auth token from request headers
const getAuthToken = (req: NextApiRequest): string | null => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Also check for token in cookies (for browser requests)
  const tokenFromCookie = req.cookies['auth-token'];
  if (tokenFromCookie) {
    return tokenFromCookie;
  }
  
  return null;
};

// Verify Firebase auth token and return user info
export const verifyAuthToken = async (token: string): Promise<AuthenticatedUser> => {
  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      phoneNumber: decodedToken.phone_number,
    };
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    throw new Error('Invalid authentication token');
  }
};

// Middleware function to authenticate API requests
export const authenticateRequest = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthenticatedUser | null> => {
  try {
    const token = getAuthToken(req);
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date()
      });
      return null;
    }
    
    const user = await verifyAuthToken(token);
    return user;
  } catch (error) {
    console.error('❌ Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid authentication credentials',
      timestamp: new Date()
    });
    return null;
  }
};

// Higher-order function to wrap API handlers with authentication
export const withAuth = (
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = await authenticateRequest(req, res);
    
    if (!user) {
      // Response already sent by authenticateRequest
      return;
    }
    
    // Add user to request object
    (req as AuthenticatedRequest).user = user;
    
    // Call the original handler
    return handler(req as AuthenticatedRequest, res);
  };
};

// Verify bot ownership (now with phone number fallback)
export const verifyBotOwnership = async (
  botId: string,
  userId: string,
  userPhoneNumber?: string
): Promise<boolean> => {
  try {
    // Import here to avoid circular dependency
    const { serverDb } = await import('@/lib/database');
    const bot = await serverDb.getBot(botId);
    
    if (!bot) {
      return false;
    }
    
    // Direct ownership check
    if (bot.ownerId === userId) {
      return true;
    }
    
    // Phone number fallback
    if (userPhoneNumber && bot.ownerPhoneNumber === userPhoneNumber) {
      console.log('✅ Bot ownership verified via phone number fallback');
      // Update the bot's ownerId for future consistency
      bot.ownerId = userId;
      await serverDb.updateBot(bot);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error verifying bot ownership:', error);
    return false;
  }
};

// Middleware to verify bot ownership for bot-specific operations
export const withBotOwnership = (
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) => {
  return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { botId } = req.query;
    
    if (!botId || typeof botId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Bot ID is required',
        timestamp: new Date()
      });
    }
    
    const isOwner = await verifyBotOwnership(botId, req.user.uid, req.user.phoneNumber);
    
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not own this bot',
        timestamp: new Date()
      });
    }
    
    return handler(req, res);
  });
}; 