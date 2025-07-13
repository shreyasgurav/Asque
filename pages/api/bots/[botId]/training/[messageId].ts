import { NextApiResponse } from 'next';
import { Bot, ApiResponse } from '@/types';
import { serverDb } from '@/lib/database';
import { withBotOwnership, AuthenticatedRequest } from '@/lib/auth/server';

interface DeleteMessageResponse extends ApiResponse {
  data?: Bot;
}

const handler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse<DeleteMessageResponse>
) => {
  const { botId, messageId } = req.query;

  if (!botId || typeof botId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Bot ID is required',
      timestamp: new Date()
    });
  }

  if (!messageId || typeof messageId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Message ID is required',
      timestamp: new Date()
    });
  }

  if (req.method === 'DELETE') {
    try {
      console.log('🗑️ Delete training message API called for bot:', botId, 'message:', messageId, 'by user:', req.user.uid);
      
      const bot = await serverDb.getBot(botId);
      
      if (!bot) {
        console.log('❌ Bot not found for message deletion:', botId);
        return res.status(404).json({
          success: false,
          error: 'Bot not found',
          timestamp: new Date()
        });
      }

      // Filter out the message to delete
      const updatedMessages = bot.trainingMessages.filter(msg => msg.id !== messageId);
      
      if (updatedMessages.length === bot.trainingMessages.length) {
        return res.status(404).json({
          success: false,
          error: 'Training message not found',
          timestamp: new Date()
        });
      }

      // Update bot with filtered messages
      const updatedBot: Bot = {
        ...bot,
        trainingMessages: updatedMessages,
        updatedAt: new Date()
      };

      // Save updated bot
      const savedBot = await serverDb.updateBot(updatedBot);

      return res.status(200).json({
        success: true,
        data: savedBot,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error deleting training message:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
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

export default withBotOwnership(handler); 