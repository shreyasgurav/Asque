import { NextApiResponse } from 'next';
import { serverDb } from '@/lib/database';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/server';
import { GetChatSessionResponse } from '@/types';

const handler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse<GetChatSessionResponse>
) => {
  const { sessionId } = req.query;
  
  if (typeof sessionId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid session ID',
      timestamp: new Date()
    });
  }

  console.log(`💬 Chat session API called for: ${sessionId} by user: ${req.user.uid}`);

  if (req.method === 'GET') {
    try {
      // Get the chat session
      const session = await serverDb.getChatSession(sessionId);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Chat session not found',
          timestamp: new Date()
        });
      }

      // Check if user owns this session
      if (session.userId !== req.user.uid) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You do not own this chat session',
          timestamp: new Date()
        });
      }

      console.log(`✅ Chat session found: ${sessionId} with ${session.messages.length} messages`);
      
      return res.status(200).json({
        success: true,
        data: session,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('💥 Error fetching chat session:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to load chat session. Please try again.',
        timestamp: new Date()
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed',
    timestamp: new Date()
  });
};

export default withAuth(handler); 