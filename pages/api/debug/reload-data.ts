import { NextApiRequest, NextApiResponse } from 'next';

interface ReloadResponse {
  success: boolean;
  message: string;
  data: {
    botsLoaded: number;
    chatSessionsLoaded: number;
    unansweredQuestionsLoaded: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReloadResponse>
) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      success: false,
      message: 'This endpoint is only available in development mode',
      data: {
        botsLoaded: 0,
        chatSessionsLoaded: 0,
        unansweredQuestionsLoaded: 0
      }
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      data: {
        botsLoaded: 0,
        chatSessionsLoaded: 0,
        unansweredQuestionsLoaded: 0
      }
    });
  }

  try {
    console.log('🔄 Reloading data from Firebase database...');
    const { serverDb } = require('@/lib/database');

    // Fetch real data from Firebase
    const bots = await serverDb.getAllBots();
    const chatSessions = await serverDb.getAllChatSessions();
    const unansweredQuestions = await serverDb.getAllUnansweredQuestions();

    console.log('✅ Data loaded successfully');
    console.log('📊 Bots:', bots.length);
    console.log('💬 Chat Sessions:', chatSessions.length);
    console.log('❓ Unanswered Questions:', unansweredQuestions.length);

    return res.status(200).json({
      success: true,
      message: 'Database loaded successfully',
      data: {
        botsLoaded: bots.length,
        chatSessionsLoaded: chatSessions.length,
        unansweredQuestionsLoaded: unansweredQuestions.length
      }
    });

  } catch (error) {
    console.error('Error loading database:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load database',
      data: {
        botsLoaded: 0,
        chatSessionsLoaded: 0,
        unansweredQuestionsLoaded: 0
      }
    });
  }
} 