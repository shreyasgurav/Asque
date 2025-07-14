import { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/database';
import { ChatMessage, ChatSession, UnansweredQuestion } from '@/types';

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      success: false,
      message: 'This endpoint is only available in development mode'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { botId } = req.body;
    
    if (!botId) {
      return res.status(400).json({
        success: false,
        message: 'Bot ID is required'
      });
    }

    console.log('🌱 Seeding test data for bot:', botId);

    // Sample chat sessions
    const chatSessions: ChatSession[] = [
      {
        id: 'session_test_1',
        botId: botId,
        botName: 'Test Bot',
        isAuthenticated: true,
        messages: [
          { 
            id: 'msg_1', 
            type: 'user' as const, 
            content: 'Hello', 
            timestamp: new Date(Date.now() - 86400000) 
          },
          { 
            id: 'msg_2', 
            type: 'bot' as const, 
            content: 'Hi there!', 
            timestamp: new Date(Date.now() - 86400000), 
            metadata: { confidence: 0.9, responseTime: 200, wasAnswered: true } 
          }
        ],
        startedAt: new Date(Date.now() - 86400000),
        lastActivityAt: new Date(Date.now() - 86400000),
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        messageCount: 2,
        averageResponseTime: 200,
        failedQuestions: 0,
        successfulResponses: 1,
        isCompleted: true
      },
      {
        id: 'session_test_2',
        botId: botId,
        botName: 'Test Bot',
        isAuthenticated: true,
        messages: [
          { 
            id: 'msg_3', 
            type: 'user' as const, 
            content: 'What are your prices?', 
            timestamp: new Date(Date.now() - 3600000) 
          },
          { 
            id: 'msg_4', 
            type: 'bot' as const, 
            content: 'I don\'t have specific pricing information.', 
            timestamp: new Date(Date.now() - 3600000), 
            metadata: { confidence: 0.3, responseTime: 150, wasAnswered: false } 
          }
        ],
        startedAt: new Date(Date.now() - 3600000),
        lastActivityAt: new Date(Date.now() - 3600000),
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        messageCount: 2,
        averageResponseTime: 150,
        failedQuestions: 1,
        successfulResponses: 0,
        isCompleted: true
      },
      {
        id: 'session_test_3',
        botId: botId,
        botName: 'Test Bot',
        isAuthenticated: true,
        messages: [
          { 
            id: 'msg_5', 
            type: 'user' as const, 
            content: 'Do you offer support?', 
            timestamp: new Date(Date.now() - 7200000) 
          },
          { 
            id: 'msg_6', 
            type: 'bot' as const, 
            content: 'I\'m not sure about our support options.', 
            timestamp: new Date(Date.now() - 7200000), 
            metadata: { confidence: 0.2, responseTime: 180, wasAnswered: false } 
          }
        ],
        startedAt: new Date(Date.now() - 7200000),
        lastActivityAt: new Date(Date.now() - 7200000),
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15',
        messageCount: 2,
        averageResponseTime: 180,
        failedQuestions: 1,
        successfulResponses: 0,
        isCompleted: true
      },
      {
        id: 'session_test_4',
        botId: botId,
        botName: 'Test Bot',
        isAuthenticated: true,
        messages: [
          { 
            id: 'msg_7', 
            type: 'user' as const, 
            content: 'Thanks for your help!', 
            timestamp: new Date(Date.now() - 1800000) 
          },
          { 
            id: 'msg_8', 
            type: 'bot' as const, 
            content: 'You\'re welcome!', 
            timestamp: new Date(Date.now() - 1800000), 
            metadata: { confidence: 0.95, responseTime: 120, wasAnswered: true } 
          }
        ],
        startedAt: new Date(Date.now() - 1800000),
        lastActivityAt: new Date(Date.now() - 1800000),
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        messageCount: 2,
        averageResponseTime: 120,
        failedQuestions: 0,
        successfulResponses: 1,
        isCompleted: true
      }
    ];

    // Sample unanswered questions
    const unansweredQuestions: UnansweredQuestion[] = [
      {
        id: 'uq_test_1',
        botId: botId,
        question: 'What are your pricing plans?',
        timestamp: new Date(Date.now() - 3600000),
        sessionId: 'session_test_2',
        isAnswered: false,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        confidence: 0.3
      },
      {
        id: 'uq_test_2',
        botId: botId,
        question: 'Do you offer 24/7 customer support?',
        timestamp: new Date(Date.now() - 7200000),
        sessionId: 'session_test_3',
        isAnswered: false,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15',
        confidence: 0.2
      },
      {
        id: 'uq_test_3',
        botId: botId,
        question: 'What payment methods do you accept?',
        timestamp: new Date(Date.now() - 14400000),
        sessionId: 'session_test_4',
        isAnswered: false,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        confidence: 0.1
      }
    ];

    // Create chat sessions
    for (const session of chatSessions) {
      await serverDb.createChatSession(session);
    }

    // Create unanswered questions
    for (const question of unansweredQuestions) {
      await serverDb.createUnansweredQuestion(question);
    }

    console.log('✅ Test data seeded successfully!');
    console.log(`📊 Added ${chatSessions.length} chat sessions`);
    console.log(`❓ Added ${unansweredQuestions.length} unanswered questions`);

    return res.status(200).json({
      success: true,
      message: 'Test data seeded successfully',
      data: {
        chatSessions: chatSessions.length,
        unansweredQuestions: unansweredQuestions.length
      }
    });

  } catch (error) {
    console.error('Error seeding test data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to seed test data'
    });
  }
} 