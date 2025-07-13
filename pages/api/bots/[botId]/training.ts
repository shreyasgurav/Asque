import { NextApiResponse } from 'next';
import { nanoid } from 'nanoid';
import { Bot, TrainingMessage, ApiResponse } from '@/types';
import { serverDb } from '@/lib/database';
import { enhanceTrainingMessage, generateTrainingResponse } from '@/lib/ai';
import { withBotOwnership, AuthenticatedRequest } from '@/lib/auth/server';

interface TrainingResponse extends ApiResponse {
  data?: Bot;
  botResponse?: string;
}

const handler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse<TrainingResponse>
) => {
  const { botId } = req.query;

  if (!botId || typeof botId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Bot ID is required',
      timestamp: new Date()
    });
  }

  if (req.method === 'POST') {
    try {
      const { content } = req.body;

      console.log('🎓 Training request from user:', req.user.uid, 'for bot:', botId);

      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Training content is required',
          timestamp: new Date()
        });
      }

      const bot = await serverDb.getBot(botId);
      
      if (!bot) {
        return res.status(404).json({
          success: false,
          error: 'Bot not found',
          timestamp: new Date()
        });
      }

      // Check ownership
      console.log('🔍 Training ownership check:');
      console.log('  Bot ownerId:', bot.ownerId);
      console.log('  User uid:', req.user.uid);
      console.log('  User phone:', req.user.phoneNumber);
      
      if (bot.ownerId !== req.user.uid) {
        // Try fallback with phone number
        if (req.user.phoneNumber && bot.ownerPhoneNumber === req.user.phoneNumber) {
          console.log('✅ Training access granted via phone number fallback');
          // Update the bot's ownerId to the current user ID for future consistency
          bot.ownerId = req.user.uid;
          await serverDb.updateBot(bot);
        } else {
          console.log('❌ Training access denied: User does not own this bot');
          console.log('  Bot ownerPhoneNumber:', bot.ownerPhoneNumber);
          return res.status(403).json({
            success: false,
            error: 'Access denied: You do not own this bot',
            timestamp: new Date()
          });
        }
      }

      // Enhance the training message with AI
      const enhancement = await enhanceTrainingMessage(content.trim(), bot.name);
      
      // Generate bot response
      const botResponse = await generateTrainingResponse(content.trim(), bot.name, bot.trainingMessages);

      // Create new training message with enhanced metadata
      const newMessage: TrainingMessage = {
        id: `msg_${nanoid(12)}`,
        content: content.trim(),
        timestamp: new Date(),
        keywords: enhancement.keywords,
        summary: enhancement.summary,
        category: enhancement.category
      };

      // Add message to bot's training messages
      const updatedBot: Bot = {
        ...bot,
        trainingMessages: [...bot.trainingMessages, newMessage],
        updatedAt: new Date()
      };

      // Save updated bot
      const savedBot = await serverDb.updateBot(updatedBot);

      return res.status(200).json({
        success: true,
        data: savedBot,
        botResponse,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error adding training message:', error);
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