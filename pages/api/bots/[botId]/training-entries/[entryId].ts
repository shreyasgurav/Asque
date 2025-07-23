import { NextApiResponse } from 'next';
import { withBotOwnership, AuthenticatedRequest } from '@/lib/auth/server';
import { serverDb } from '@/lib/database';

interface DeleteTrainingEntryResponse {
  success: boolean;
  error?: string;
  timestamp: Date;
}

const handler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse<DeleteTrainingEntryResponse>
) => {
  const { botId, entryId } = req.query;

  if (!botId || typeof botId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Bot ID is required',
      timestamp: new Date()
    });
  }

  if (!entryId || typeof entryId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Entry ID is required',
      timestamp: new Date()
    });
  }

  if (req.method === 'DELETE') {
    try {
      console.log('🗑️ Deleting training entry:', entryId, 'for bot:', botId);

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

      // Delete the training entry
      const deleted = await serverDb.deleteTrainingEntry(botId, entryId);

      if (deleted) {
        return res.status(200).json({
          success: true,
          timestamp: new Date()
        });
      } else {
        return res.status(404).json({
          success: false,
          error: 'Training entry not found',
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('Error deleting training entry:', error);
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