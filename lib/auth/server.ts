import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { getApps } from 'firebase-admin/app';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  phoneNumber?: string;
}

export interface AuthenticatedRequest extends NextApiRequest {
  user: AuthenticatedUser;
}

// Get auth token from request headers
const getAuthToken = (req: NextApiRequest): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

// Verify Firebase auth token and return user info
export const verifyAuthToken = async (token: string): Promise<AuthenticatedUser> => {
  try {
    // Check if Firebase Admin is initialized
    if (getApps().length === 0) {
      throw new Error('Firebase Admin is not initialized. Please check your environment variables.');
    }
    
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

// Verify bot ownership
export const verifyBotOwnership = async (
  botId: string, 
  userId: string, 
  userPhoneNumber?: string
): Promise<boolean> => {
  try {
    const { serverDb } = await import('@/lib/database');
    const bot = await serverDb.getBot(botId);
    
    if (!bot) {
      return false;
    }
    
    // Check direct ownership
    if (bot.ownerId === userId) {
      return true;
    }
    
    // Check phone number fallback
    if (userPhoneNumber && bot.ownerPhoneNumber === userPhoneNumber) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error verifying bot ownership:', error);
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