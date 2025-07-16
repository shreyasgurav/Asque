import { NextApiResponse } from 'next';
import { BotAnalytics, ApiResponse } from '@/types';
import { serverDb } from '@/lib/database';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/server';

interface AnalyticsResponse extends ApiResponse {
  data?: BotAnalytics;
}

const handler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse<AnalyticsResponse>
) => {
  const { botId } = req.query;
  
  if (typeof botId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid bot ID',
      timestamp: new Date()
    });
  }

  console.log(`📊 Analytics API called for: ${botId}`);

  if (req.method === 'GET') {
    try {
      console.log('📊 Fetching analytics...');
      
      // Get chat sessions for analytics
      const sessions = await serverDb.getChatSessionsByBot(botId);
      
      // Calculate analytics
      const analytics = calculateAnalytics(sessions);

      console.log('✅ Analytics calculated successfully');
      console.log(`📊 Analytics: ${analytics.totalVisitors} visitors, ${analytics.totalChats} chats`);
      
      return res.status(200).json({
        success: true,
        data: analytics,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('💥 Error fetching analytics:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to load analytics. Please try again.',
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

// Import the calculateAnalytics function
const calculateAnalytics = (sessions: any[]): BotAnalytics => {
  const totalVisitors = new Set(sessions.map(s => s.visitorId)).size;
  const totalChats = sessions.length;
  const totalMessages = sessions.reduce((sum, session) => sum + (session.messages?.length || 0), 0);
  
  // Calculate average response time (simplified)
  const responseTimes = sessions
    .flatMap(s => s.messages || [])
    .filter(m => m.timestamp && m.responseTime)
    .map(m => m.responseTime);
  
  const averageResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
    : 0;

  const lastActiveAt = sessions.length > 0 
    ? new Date(Math.max(...sessions.map(s => new Date(s.endedAt || s.startedAt).getTime())))
    : undefined;

  // Calculate successful responses and failed questions
  const successfulResponses = sessions.reduce((sum, session) => 
    sum + (session.successfulResponses || 0), 0);
  const failedQuestions = sessions.reduce((sum, session) => 
    sum + (session.failedQuestions || 0), 0);
  const successRate = totalMessages > 0 ? (successfulResponses / totalMessages) * 100 : 0;

  return {
    totalVisitors,
    totalChats,
    totalMessages,
    averageResponseTime,
    successfulResponses,
    failedQuestions,
    successRate,
    lastActiveAt,
    dailyVisitors: [], // Simplified for now
    weeklyChats: [], // Simplified for now
    topQuestions: [], // Simplified for now
    responseTimeHistory: [] // Simplified for now
  };
};

export default withAuth(handler); 