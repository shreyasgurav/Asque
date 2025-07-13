import { NextApiResponse } from 'next';
import { Bot, ApiResponse } from '@/types';
import { serverDb } from '@/lib/database';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/server';

interface UpdateBotRequest {
  name?: string;
  description?: string;
  welcomeMessage?: string;
  profilePictureUrl?: string;
}

const handler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse<Bot>>
) => {
  const { botId } = req.query;
  
  if (typeof botId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid bot ID',
      timestamp: new Date()
    });
  }

  console.log(`🔧 Bot update API called for: ${botId}`);
  console.log('Method:', req.method);

  if (req.method === 'GET') {
    try {
      console.log('📋 Fetching bot details...');
      const bot = await serverDb.getBot(botId);
      
      if (!bot) {
        console.log('❌ Bot not found');
        return res.status(404).json({
          success: false,
          error: 'Bot not found',
          timestamp: new Date()
        });
      }

      // Check ownership
      console.log('🔍 Ownership check:');
      console.log('  Bot ownerId:', bot.ownerId);
      console.log('  User uid:', req.user.uid);
      console.log('  User phone:', req.user.phoneNumber);
      
      if (bot.ownerId !== req.user.uid) {
        // Try fallback with phone number
        if (req.user.phoneNumber && bot.ownerPhoneNumber === req.user.phoneNumber) {
          console.log('✅ Access granted via phone number fallback');
          // Update the bot's ownerId to the current user ID for future consistency
          bot.ownerId = req.user.uid;
          await serverDb.updateBot(bot);
        } else {
          console.log('❌ Access denied: User does not own this bot');
          console.log('  Bot ownerPhoneNumber:', bot.ownerPhoneNumber);
          return res.status(403).json({
            success: false,
            error: 'Access denied: You do not own this bot',
            timestamp: new Date()
          });
        }
      }

      console.log('✅ Bot details fetched successfully');
      return res.status(200).json({
        success: true,
        data: bot,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('💥 Error fetching bot:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date()
      });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { name, description, welcomeMessage, profilePictureUrl }: UpdateBotRequest = req.body;
      
      console.log('📝 Validating update request...');
      console.log('👤 Authenticated user:', req.user.uid);

      // Get current bot
      const currentBot = await serverDb.getBot(botId);
      
      if (!currentBot) {
        console.log('❌ Bot not found');
        return res.status(404).json({
          success: false,
          error: 'Bot not found',
          timestamp: new Date()
        });
      }

      // Check ownership
      if (currentBot.ownerId !== req.user.uid) {
        console.log('❌ Access denied: User does not own this bot');
        return res.status(403).json({
          success: false,
          error: 'Access denied: You do not own this bot',
          timestamp: new Date()
        });
      }

      console.log('✅ Validation passed');

      // Update bot with new data
      const updatedBot: Bot = {
        ...currentBot,
        name: name?.trim() || currentBot.name,
        description: description?.trim() || currentBot.description,
        welcomeMessage: welcomeMessage?.trim() || undefined,
        profilePictureUrl: profilePictureUrl !== undefined ? profilePictureUrl : currentBot.profilePictureUrl,
        updatedAt: new Date()
      };

      console.log('💾 Updating bot in database...');
      const savedBot = await serverDb.updateBot(updatedBot);
      console.log('✅ Bot updated successfully!');

      return res.status(200).json({
        success: true,
        data: savedBot,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('💥 Error updating bot:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
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

export default withAuth(handler); 