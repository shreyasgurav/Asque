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

export default function handler(
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
    console.log('🔄 Force reloading mock database from files...');
    
    // Clear existing global data
    if (typeof global !== 'undefined') {
      (global as any).__MOCK_BOTS__ = undefined;
      (global as any).__MOCK_CHAT_SESSIONS__ = undefined;
      (global as any).__MOCK_UNANSWERED_QUESTIONS__ = undefined;
    }
    
    // Import the database module to trigger reinitialization
    const { serverDb } = require('@/lib/database');
    
    // Access the data to trigger loading
    const mockBots = (global as any).__MOCK_BOTS__ || new Map();
    const mockChatSessions = (global as any).__MOCK_CHAT_SESSIONS__ || new Map();
    const mockUnansweredQuestions = (global as any).__MOCK_UNANSWERED_QUESTIONS__ || new Map();
    
    console.log('✅ Data reloaded successfully');
    console.log('📊 Bots:', mockBots.size);
    console.log('💬 Chat Sessions:', mockChatSessions.size);
    console.log('❓ Unanswered Questions:', mockUnansweredQuestions.size);

    return res.status(200).json({
      success: true,
      message: 'Mock database reloaded successfully',
      data: {
        botsLoaded: mockBots.size,
        chatSessionsLoaded: mockChatSessions.size,
        unansweredQuestionsLoaded: mockUnansweredQuestions.size
      }
    });

  } catch (error) {
    console.error('Error reloading mock database:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reload mock database',
      data: {
        botsLoaded: 0,
        chatSessionsLoaded: 0,
        unansweredQuestionsLoaded: 0
      }
    });
  }
} 