import { NextApiResponse } from 'next';
import { withBotOwnership, AuthenticatedRequest } from '@/lib/auth/server';
import { serverDb } from '@/lib/database';

interface TrainingEntriesResponse {
  success: boolean;
  data?: any[];
  error?: string;
  timestamp: Date;
}

const handler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse<TrainingEntriesResponse>
) => {
  const { botId } = req.query;

  if (!botId || typeof botId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Bot ID is required',
      timestamp: new Date()
    });
  }

  if (req.method === 'GET') {
    try {
      console.log('📚 Fetching training entries for bot:', botId);

      const bot = await serverDb.getBot(botId);
      
      if (!bot) {
        return res.status(404).json({
          success: false,
          error: 'Bot not found',
          timestamp: new Date()
        });
      }

      // Check ownership
      if (bot.ownerId !== req.user.uid) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You do not own this bot',
          timestamp: new Date()
        });
      }

      // Fetch training entries from the new structure
      const trainingEntries = await serverDb.getTrainingEntries(botId);

      return res.status(200).json({
        success: true,
        data: trainingEntries,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error fetching training entries:', error);
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