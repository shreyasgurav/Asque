import { NextApiResponse } from 'next';
import { serverDb } from '@/lib/database';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/server';
import { GetUserChatsResponse, UserChatSummary } from '@/types';

const handler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse<GetUserChatsResponse>
) => {
  console.log(`📱 User chats API called for: ${req.user.uid}`);

  if (req.method === 'GET') {
    try {
      // Get all chat sessions for this user
      const userSessions = await serverDb.getChatSessionsByUser(req.user.uid);
      
      // Convert to chat summaries
      const chatSummaries: UserChatSummary[] = userSessions.map(session => ({
        sessionId: session.id,
        botId: session.botId,
        botName: session.botName,
        botProfilePictureUrl: session.botProfilePictureUrl,
        lastMessage: session.messages.length > 0 
          ? session.messages[session.messages.length - 1].content 
          : 'Chat started',
        lastMessageTime: session.lastActivityAt,
        messageCount: session.messageCount,
        isActive: !session.isCompleted
      }));

      console.log(`✅ Found ${chatSummaries.length} chat sessions for user: ${req.user.uid}`);
      
      return res.status(200).json({
        success: true,
        data: chatSummaries,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('💥 Error fetching user chats:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to load chat history. Please try again.',
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