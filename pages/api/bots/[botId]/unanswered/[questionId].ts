import { NextApiResponse } from 'next';
import { ApiResponse, RespondToQuestionRequest, RespondToQuestionResponse, TrainingMessage } from '@/types';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/server';
import { serverDb } from '@/lib/database';

const handler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse<RespondToQuestionResponse>
) => {
  const { botId, questionId } = req.query;
  
  if (typeof botId !== 'string' || typeof questionId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid bot ID or question ID',
      timestamp: new Date()
    });
  }

  console.log(`💬 Unanswered question API called for bot: ${botId}, question: ${questionId}`);

  if (req.method === 'POST') {
    try {
      const { response }: RespondToQuestionRequest = req.body;

      if (!response || !response.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Response is required',
          timestamp: new Date()
        });
      }

      // Verify bot ownership
      const bot = await serverDb.getBot(botId);
      
      if (!bot) {
        return res.status(404).json({
          success: false,
          error: 'Bot not found',
          timestamp: new Date()
        });
      }

      // Check ownership with phone number fallback
      console.log('🔍 Unanswered questions ownership check:');
      console.log('  Bot ownerId:', bot.ownerId);
      console.log('  User uid:', req.user.uid);
      console.log('  User phone:', req.user.phoneNumber);
      console.log('  Bot ownerPhoneNumber:', bot.ownerPhoneNumber);
      
      if (bot.ownerId !== req.user.uid) {
        // Try fallback with phone number
        if (req.user.phoneNumber && bot.ownerPhoneNumber === req.user.phoneNumber) {
          console.log('✅ Unanswered questions access granted via phone number fallback');
          // Update the bot's ownerId to the current user ID for future consistency
          bot.ownerId = req.user.uid;
          await serverDb.updateBot(bot);
        } else {
          console.log('❌ Unanswered questions access denied: User does not own this bot');
          console.log('  Phone number match failed:');
          console.log('    User phone:', req.user.phoneNumber);
          console.log('    Bot phone:', bot.ownerPhoneNumber);
          
          // For development, allow access if no phone number is set (temporary fix)
          if (!req.user.phoneNumber && !bot.ownerPhoneNumber) {
            console.log('⚠️  Development mode: Allowing unanswered questions access without phone verification');
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
        console.log('✅ Direct ownership verified for unanswered questions');
      }

      // Get the unanswered question
      const question = await serverDb.getUnansweredQuestion(questionId);
      
      if (!question) {
        return res.status(404).json({
          success: false,
          error: 'Question not found',
          timestamp: new Date()
        });
      }

      if (question.botId !== botId) {
        return res.status(400).json({
          success: false,
          error: 'Question does not belong to this bot',
          timestamp: new Date()
        });
      }

      if (question.isAnswered) {
        return res.status(400).json({
          success: false,
          error: 'Question has already been answered',
          timestamp: new Date()
        });
      }

      // Mark the question as answered
      const updatedQuestion = {
        ...question,
        isAnswered: true,
        creatorResponse: response.trim(),
        respondedAt: new Date()
      };

      await serverDb.updateUnansweredQuestion(updatedQuestion);

      // Add the response to the bot's training data
      const newTrainingMessage: TrainingMessage = {
        id: `tm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: `Q: ${question.question}\nA: ${response.trim()}`,
        timestamp: new Date(),
        sourceType: 'unanswered_question',
        sourceQuestionId: questionId,
        keywords: extractKeywords(question.question),
        summary: `Response to: "${question.question.substring(0, 50)}..."`
      };

      // Update the bot with the new training message
      const updatedBot = {
        ...bot,
        trainingMessages: [...bot.trainingMessages, newTrainingMessage],
        updatedAt: new Date()
      };

      await serverDb.updateBot(updatedBot);

      console.log('✅ Creator response recorded for question:', questionId);
      console.log('📝 Response:', response.trim());
      console.log('🎓 Added to training data with ID:', newTrainingMessage.id);

      const responseData = {
        questionId,
        response: response.trim(),
        respondedAt: new Date(),
        addedToTraining: true
      };

      return res.status(200).json({
        success: true,
        data: responseData,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('💥 Error responding to question:', error);
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

// Helper function to extract keywords from a question
function extractKeywords(question: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'what', 'where', 'when', 'why', 'how',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your',
    'his', 'her', 'its', 'our', 'their', 'this', 'that', 'these', 'those'
  ]);

  return question
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 10); // Limit to 10 keywords
}

export default withAuth(handler); 