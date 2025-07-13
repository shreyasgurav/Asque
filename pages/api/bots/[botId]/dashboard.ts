import { NextApiResponse } from 'next';
import { Bot, ApiResponse, BotAnalytics, UnansweredQuestion } from '@/types';
import { serverDb } from '@/lib/database';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/server';

interface DashboardBot extends Bot {
  analytics?: BotAnalytics;
  unansweredQuestions?: UnansweredQuestion[];
}

interface DashboardResponse extends ApiResponse {
  data?: DashboardBot;
}

const handler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse<DashboardResponse>
) => {
  const { botId } = req.query;
  
  if (typeof botId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid bot ID',
      timestamp: new Date()
    });
  }

  console.log(`📊 Dashboard API called for: ${botId}`);

  if (req.method === 'GET') {
    try {
      console.log('📋 Fetching bot details for dashboard...');
      
      // Get basic bot info first (fast)
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
      console.log('  Bot ownerPhoneNumber:', bot.ownerPhoneNumber);
      
      if (bot.ownerId !== req.user.uid) {
        // Try fallback with phone number
        if (req.user.phoneNumber && bot.ownerPhoneNumber === req.user.phoneNumber) {
          console.log('✅ Access granted via phone number fallback');
          // Update the bot's ownerId to the current user ID for future consistency
          bot.ownerId = req.user.uid;
          await serverDb.updateBot(bot);
        } else {
          console.log('❌ Access denied: User does not own this bot');
          console.log('  Phone number match failed:');
          console.log('    User phone:', req.user.phoneNumber);
          console.log('    Bot phone:', bot.ownerPhoneNumber);
          
          // For development, allow access if no phone number is set (temporary fix)
          if (!req.user.phoneNumber && !bot.ownerPhoneNumber) {
            console.log('⚠️  Development mode: Allowing access without phone verification');
            bot.ownerId = req.user.uid;
            await serverDb.updateBot(bot);
          } else {
            return res.status(403).json({
              success: false,
              error: 'Access denied: You do not own this bot',
              timestamp: new Date()
            });
          }
        }
      } else {
        console.log('✅ Direct ownership verified');
      }

      // Get unanswered questions only (analytics loaded separately for better performance)
      console.log('❓ Fetching unanswered questions...');
      const unansweredQuestions = await serverDb.getUnansweredQuestionsByBot(botId);

      const dashboardBot: DashboardBot = {
        ...bot,
        unansweredQuestions
      };

      console.log('✅ Dashboard data fetched successfully');
      console.log(`📊 Analytics: ${bot.analytics?.totalVisitors || 0} visitors, ${bot.analytics?.totalChats || 0} chats`);
      console.log(`❓ Unanswered questions: ${unansweredQuestions.length} total, ${unansweredQuestions.filter(q => !q.isAnswered).length} pending`);
      
      return res.status(200).json({
        success: true,
        data: dashboardBot,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('💥 Error fetching dashboard data:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to load dashboard data. Please try again.',
        timestamp: new Date()
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      console.log('🗑️ Deleting bot...');
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

      // Delete bot (in production, you'd also clean up related data)
      await serverDb.deleteBot(botId);

      console.log('✅ Bot deleted successfully');
      return res.status(200).json({
        success: true,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('💥 Error deleting bot:', error);
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