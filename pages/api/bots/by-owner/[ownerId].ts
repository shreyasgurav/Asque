import { NextApiResponse } from 'next';
import { Bot, ApiResponse } from '@/types';
import { serverDb } from '@/lib/database';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/server';

interface BotsResponse extends ApiResponse {
  data?: Bot[];
}

const handler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse<BotsResponse>
) => {
  const { ownerId } = req.query;
  const authenticatedUserId = req.user.uid;
  const userPhoneNumber = req.user.phoneNumber;

  // Ensure user can only access their own bots
  if (!ownerId || typeof ownerId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Owner ID is required',
      timestamp: new Date()
    });
  }

  if (ownerId !== authenticatedUserId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied: You can only access your own bots',
      timestamp: new Date()
    });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date()
    });
  }

  try {
    console.log('📋 Fetching bots for authenticated user:', authenticatedUserId);
    console.log('📱 User phone number:', userPhoneNumber);
    
    // Use the enhanced method that includes phone number fallback
    const bots = await serverDb.getBotsByOwnerWithFallback(authenticatedUserId, userPhoneNumber);
    
    console.log('✅ Found bots:', bots.length);
    
    return res.status(200).json({
      success: true,
      data: bots,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('❌ Error fetching bots by owner:', error);
    // Return empty array instead of error to prevent loading issues
    return res.status(200).json({
      success: true,
      data: [],
      timestamp: new Date()
    });
  }
};

export default withAuth(handler); 