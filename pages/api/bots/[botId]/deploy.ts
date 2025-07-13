import { NextApiResponse } from 'next';
import { Bot, ApiResponse } from '@/types';
import { serverDb } from '@/lib/database';
import { withBotOwnership, AuthenticatedRequest } from '@/lib/auth/server';

interface DeployResponse extends ApiResponse {
  data?: {
    bot: Bot;
    publicUrl: string;
  };
}

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
    console.log('🚀 Deploy API called for bot:', botId, 'by user:', req.user.uid);
    
    // Get the bot
    const bot = await serverDb.getBot(botId);
    
    if (!bot) {
      console.log('❌ Bot not found for deployment:', botId);
      return res.status(404).json({
        success: false,
        error: 'Bot not found',
        timestamp: new Date()
      });
    }

    // Check if bot has training messages
    if (!bot.trainingMessages || bot.trainingMessages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Bot must have at least one training message before deployment',
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

    // Save the updated bot
    const savedBot = await serverDb.updateBot(updatedBot);
    
    console.log('✅ Bot deployed successfully:', botId);
    console.log('🌐 Public URL:', savedBot.publicUrl);

    return res.status(200).json({
      success: true,
      data: {
        bot: savedBot,
        publicUrl: savedBot.publicUrl
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('❌ Error deploying bot:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date()
    });
  }
};

export default withBotOwnership(handler); 