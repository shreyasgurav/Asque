import { NextApiRequest, NextApiResponse } from 'next';
import { Bot, ChatSession, UnansweredQuestion } from '@/types';

interface DebugResponse {
  success: boolean;
  data: {
    bots: any[];
    chatSessions: any[];
    unansweredQuestions: any[];
    mockBotsSize: number;
    mockChatSessionsSize: number;
    mockUnansweredQuestionsSize: number;
  };
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<DebugResponse>
) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      success: false,
      data: {
        bots: [],
        chatSessions: [],
        unansweredQuestions: [],
        mockBotsSize: 0,
        mockChatSessionsSize: 0,
        mockUnansweredQuestionsSize: 0
      }
    });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      data: {
        bots: [],
        chatSessions: [],
        unansweredQuestions: [],
        mockBotsSize: 0,
        mockChatSessionsSize: 0,
        mockUnansweredQuestionsSize: 0
      }
    });
  }

  try {
    // Access global mock databases
    const mockBots = (global as any).__MOCK_BOTS__ as Map<string, Bot> || new Map<string, Bot>();
    const mockChatSessions = (global as any).__MOCK_CHAT_SESSIONS__ as Map<string, ChatSession> || new Map<string, ChatSession>();
    const mockUnansweredQuestions = (global as any).__MOCK_UNANSWERED_QUESTIONS__ as Map<string, UnansweredQuestion> || new Map<string, UnansweredQuestion>();

    // Convert Maps to arrays for JSON serialization
    const bots = Array.from(mockBots.entries()).map(([_, bot]) => ({
      ...bot,
      createdAt: bot.createdAt instanceof Date ? bot.createdAt.toISOString() : bot.createdAt,
      updatedAt: bot.updatedAt instanceof Date ? bot.updatedAt.toISOString() : bot.updatedAt,
      deployedAt: bot.deployedAt instanceof Date ? bot.deployedAt.toISOString() : bot.deployedAt
    }));

    const chatSessions = Array.from(mockChatSessions.entries()).map(([_, session]) => ({
      ...session,
      startedAt: session.startedAt instanceof Date ? session.startedAt.toISOString() : session.startedAt,
      lastActivityAt: session.lastActivityAt instanceof Date ? session.lastActivityAt.toISOString() : session.lastActivityAt
    }));

    const unansweredQuestions = Array.from(mockUnansweredQuestions.entries()).map(([_, question]) => ({
      ...question,
      timestamp: question.timestamp instanceof Date ? question.timestamp.toISOString() : question.timestamp,
      respondedAt: question.respondedAt instanceof Date ? question.respondedAt.toISOString() : question.respondedAt
    }));

    console.log('🔍 Debug: Mock database contents:');
    console.log('📋 Bots:', bots.length);
    console.log('💬 Chat Sessions:', chatSessions.length);
    console.log('❓ Unanswered Questions:', unansweredQuestions.length);

    // Log individual bot details
    bots.forEach(bot => {
      console.log(`🤖 Bot ${bot.id}: owner=${bot.ownerId}, name=${bot.name}`);
    });

    return res.status(200).json({
      success: true,
      data: {
        bots,
        chatSessions,
        unansweredQuestions,
        mockBotsSize: mockBots.size,
        mockChatSessionsSize: mockChatSessions.size,
        mockUnansweredQuestionsSize: mockUnansweredQuestions.size
      }
    });

  } catch (error) {
    console.error('Error accessing mock database:', error);
    return res.status(500).json({
      success: false,
      data: {
        bots: [],
        chatSessions: [],
        unansweredQuestions: [],
        mockBotsSize: 0,
        mockChatSessionsSize: 0,
        mockUnansweredQuestionsSize: 0
      }
    });
  }
} 