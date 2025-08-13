import { NextApiResponse } from 'next';
import { Bot, ApiResponse } from '@/types';
import { serverDb } from '@/lib/database';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/server';
import { withRateLimit, apiLimiter } from '@/lib/rate-limit';

interface DeployResponse extends ApiResponse {
  data?: {
    bot: Bot;
    message: string;
  };
}

const MIN_TRAINING_ENTRIES = 3; // Minimum training entries required for deployment

const handler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse<DeployResponse>
) => {
  const { botId } = req.query;

  if (!botId || typeof botId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Bot ID is required',
      timestamp: new Date()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date()
    });
  }

  try {
    console.log('🚀 Deploy bot API called for bot:', botId);

    // Get the bot
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

    // Check if bot is already deployed
    if (bot.status === 'deployed') {
      return res.status(400).json({
        success: false,
        error: 'Bot is already deployed',
        timestamp: new Date()
      });
    }

    // Check minimum training requirements
    const trainingEntries = await serverDb.getTrainingEntries(botId);
    
    if (trainingEntries.length < MIN_TRAINING_ENTRIES) {
      return res.status(400).json({
        success: false,
        error: `Bot needs at least ${MIN_TRAINING_ENTRIES} training entries before deployment. Currently has ${trainingEntries.length} entries.`,
        timestamp: new Date()
      });
    }

    // Update bot status to deployed
    const updatedBot: Bot = {
      ...bot,
      status: 'deployed',
      deployedAt: new Date(),
      updatedAt: new Date()
    };

    await serverDb.updateBot(updatedBot);

    console.log('✅ Bot deployed successfully:', botId);

    return res.status(200).json({
      success: true,
      data: {
        bot: updatedBot,
        message: 'Bot deployed successfully'
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('❌ Error deploying bot:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to deploy bot',
      timestamp: new Date()
    });
  }
};

export default withRateLimit(apiLimiter, withAuth(handler)); 