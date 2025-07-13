import { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/database';
import { Bot, ChatMessage, ApiResponse, ChatSession, UnansweredQuestion } from '@/types';
import { generateBotResponse } from '@/lib/ai';

interface ChatRequest {
  message: string;
  sessionId?: string;
}

interface ChatResponse extends ApiResponse {
  data?: {
    message: string;
    confidence: number;
    responseTime: number;
    sessionId: string;
    relevantTraining: string[];
    wasAnswered: boolean;
  };
}

// Minimum confidence threshold for considering a response as "answered"
const MIN_CONFIDENCE_THRESHOLD = 0.5;

// Check if message is basic conversation/greeting
function isBasicConversation(message: string): boolean {
  const basicPatterns = [
    'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
    'how are you', 'how are u', 'what\'s up', 'whats up', 'sup',
    'who are you', 'who are u', 'what do you do', 'what do u do',
    'tell me about yourself', 'introduce yourself', 'what can you do',
    'goodbye', 'bye', 'see you', 'thank you', 'thanks', 'thank u',
    'nice to meet you', 'pleasure to meet you', 'good night', 'goodnight'
  ];
  
  const normalizedMessage = message.toLowerCase().trim();
  return basicPatterns.some(pattern => normalizedMessage.includes(pattern));
}

// Generate context-aware basic conversation response
function generateBasicConversationResponse(userQuery: string, botName: string, botDescription: string): string {
  const normalizedQuery = userQuery.toLowerCase().trim();
  
  // Greetings
  if (normalizedQuery.includes('hello') || normalizedQuery.includes('hi') || normalizedQuery.includes('hey')) {
    return `Hello! I'm ${botName}. ${botDescription || 'I\'m here to help you with any questions you might have.'} How can I assist you today?`;
  }
  
  // How are you
  if (normalizedQuery.includes('how are you') || normalizedQuery.includes('how are u')) {
    return `I'm doing great, thank you for asking! I'm ${botName} and I'm ready to help you with any questions about our services. What can I help you with today?`;
  }
  
  // Who are you / What do you do
  if (normalizedQuery.includes('who are you') || normalizedQuery.includes('what do you do') || normalizedQuery.includes('tell me about yourself')) {
    return `I'm ${botName}, ${botDescription || 'your helpful assistant'}. I'm here to answer your questions and provide information about our services. What would you like to know?`;
  }
  
  // Goodbye
  if (normalizedQuery.includes('goodbye') || normalizedQuery.includes('bye') || normalizedQuery.includes('see you')) {
    return `Goodbye! It was nice chatting with you. If you have any more questions later, feel free to come back. Have a great day!`;
  }
  
  // Thank you
  if (normalizedQuery.includes('thank you') || normalizedQuery.includes('thanks')) {
    return `You're very welcome! I'm happy to help. Is there anything else you'd like to know about our services?`;
  }
  
  // Default response for other basic conversation
  return `Hi there! I'm ${botName}. ${botDescription || 'I\'m here to help you with any questions.'} What can I assist you with today?`;
}

// Enhanced search function using keywords and categories
function findRelevantTrainingMessages(userQuery: string, bot: Bot) {
  const queryWords = userQuery.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  const trainingMessages = bot.trainingMessages;
  
  // Define semantic mappings for common queries
  const semanticMappings: { [key: string]: string[] } = {
    'cost': ['pricing', 'price', 'cost', 'rate', 'fee', 'charge'],
    'price': ['pricing', 'price', 'cost', 'rate', 'fee', 'charge'],
    'pricing': ['pricing', 'price', 'cost', 'rate', 'fee', 'charge'],
    'how much': ['pricing', 'price', 'cost', 'rate', 'fee', 'charge'],
    'hours': ['hours', 'open', 'close', 'time', 'schedule', 'timing'],
    'open': ['hours', 'open', 'close', 'time', 'schedule', 'timing'],
    'close': ['hours', 'open', 'close', 'time', 'schedule', 'timing'],
    'time': ['hours', 'open', 'close', 'time', 'schedule', 'timing'],
    'schedule': ['hours', 'open', 'close', 'time', 'schedule', 'timing'],
    'location': ['location', 'address', 'place', 'where'],
    'address': ['location', 'address', 'place', 'where'],
    'where': ['location', 'address', 'place', 'where'],
    'contact': ['contact', 'phone', 'number', 'call'],
    'phone': ['contact', 'phone', 'number', 'call'],
    'services': ['services', 'offer', 'provide', 'what'],
    'what': ['services', 'offer', 'provide', 'what'],
    'help': ['help', 'assist', 'support', 'guide'],
    'assist': ['help', 'assist', 'support', 'guide']
  };
  
  const scoredMessages = trainingMessages.map(message => {
    let score = 0;
    const messageText = message.content.toLowerCase();
    const keywords = message.keywords || [];
    
    // Direct keyword matches (highest priority)
    queryWords.forEach(word => {
      if (keywords.some(keyword => keyword.toLowerCase().includes(word) || word.includes(keyword.toLowerCase()))) {
        score += 5;
      }
      if (messageText.includes(word)) {
        score += 2;
      }
    });
    
    // Semantic mappings (medium priority)
    queryWords.forEach(word => {
      const semanticMatches = semanticMappings[word] || [];
      semanticMatches.forEach(semanticWord => {
        if (keywords.some(keyword => keyword.toLowerCase().includes(semanticWord) || semanticWord.includes(keyword.toLowerCase()))) {
          score += 4;
        }
        if (messageText.includes(semanticWord)) {
          score += 2;
        }
      });
    });
    
    // Category relevance
    if (message.category) {
      queryWords.forEach(word => {
        if (message.category!.toLowerCase().includes(word) || word.includes(message.category!.toLowerCase())) {
          score += 3;
        }
        // Check semantic mappings for categories too
        const semanticMatches = semanticMappings[word] || [];
        semanticMatches.forEach(semanticWord => {
          if (message.category!.toLowerCase().includes(semanticWord) || semanticWord.includes(message.category!.toLowerCase())) {
            score += 2;
          }
        });
      });
    }
    
    // Summary matches
    if (message.summary) {
      const summaryText = message.summary.toLowerCase();
      queryWords.forEach(word => {
        if (summaryText.includes(word)) {
          score += 1.5;
        }
        // Check semantic mappings for summaries too
        const semanticMatches = semanticMappings[word] || [];
        semanticMatches.forEach(semanticWord => {
          if (summaryText.includes(semanticWord)) {
            score += 1;
          }
        });
      });
    }
    
    return { ...message, score };
  });
  
  // Return top 3 most relevant messages
  return scoredMessages
    .filter(msg => msg.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

// Calculate confidence based on how well the training data matches
function calculateConfidence(userQuery: string, relevantMessages: any[]): number {
  if (relevantMessages.length === 0) return 0.1;
  
  const queryWords = userQuery.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  const bestMessage = relevantMessages[0];
  
  let matches = 0;
  const messageKeywords = bestMessage.keywords || [];
  const messageText = bestMessage.content.toLowerCase();
  
  queryWords.forEach(word => {
    if (messageKeywords.some((keyword: string) => 
      keyword.toLowerCase().includes(word) || word.includes(keyword.toLowerCase())
    )) {
      matches += 2;
    } else if (messageText.includes(word)) {
      matches += 1;
    }
  });
  
  const confidence = Math.min(matches / (queryWords.length * 2), 1.0);
  return Math.max(confidence, 0.1);
}

// Helper function to get or create chat session
async function getOrCreateChatSession(botId: string, sessionId: string, userAgent?: string): Promise<ChatSession> {
  // Try to get existing session from mock database
  const mockSessions = (global as any).__MOCK_CHAT_SESSIONS__ || new Map();
  let session = mockSessions.get(sessionId);
  
  if (!session) {
    // Create new session
    session = {
      id: sessionId,
      botId,
      messages: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
      userAgent,
      messageCount: 0,
      averageResponseTime: 0,
      failedQuestions: 0,
      successfulResponses: 0,
      isCompleted: false
    };
    
    await serverDb.createChatSession(session);
  }
  
  return session;
}

// Helper function to update chat session with new message
async function updateChatSession(
  session: ChatSession, 
  userMessage: string, 
  botResponse: string, 
  confidence: number, 
  responseTime: number
): Promise<void> {
  const userMsg: ChatMessage = {
    id: `msg_${Date.now()}_user`,
    type: 'user',
    content: userMessage,
    timestamp: new Date()
  };
  
  const botMsg: ChatMessage = {
    id: `msg_${Date.now()}_bot`,
    type: 'bot',
    content: botResponse,
    timestamp: new Date(),
    metadata: {
      confidence,
      responseTime,
      wasAnswered: confidence >= MIN_CONFIDENCE_THRESHOLD
    }
  };
  
  session.messages.push(userMsg, botMsg);
  session.messageCount += 2;
  session.lastActivityAt = new Date();
  
  // Update analytics
  const totalResponseTime = session.averageResponseTime * (session.messageCount - 2) + responseTime;
  session.averageResponseTime = totalResponseTime / session.messageCount;
  
  if (confidence >= MIN_CONFIDENCE_THRESHOLD) {
    session.successfulResponses++;
  } else {
    session.failedQuestions++;
  }
  
  await serverDb.updateChatSession(session);
}

// Helper function to create unanswered question
async function createUnansweredQuestion(
  botId: string, 
  sessionId: string, 
  question: string, 
  confidence: number,
  userAgent?: string
): Promise<void> {
  const unansweredQuestion: UnansweredQuestion = {
    id: `uq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    botId,
    question,
    timestamp: new Date(),
    sessionId,
    isAnswered: false,
    userAgent,
    confidence
  };
  
  await serverDb.createUnansweredQuestion(unansweredQuestion);
  console.log('❓ Created unanswered question:', unansweredQuestion.id);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse>
) {
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
    const startTime = Date.now();
    const { message, sessionId } = req.body as ChatRequest;
    const finalSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userAgent = req.headers['user-agent'];

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
        timestamp: new Date()
      });
    }

    // Get the bot and check if it's deployed
    const bot = await serverDb.getBot(botId);
    
    if (!bot) {
      return res.status(404).json({
        success: false,
        error: 'Bot not found',
        timestamp: new Date()
      });
    }

    if (bot.status !== 'deployed') {
      return res.status(400).json({
        success: false,
        error: 'Bot is not deployed yet',
        timestamp: new Date()
      });
    }

    // Get or create chat session for analytics
    const chatSession = await getOrCreateChatSession(botId, finalSessionId, userAgent);

    let confidence = 0;
    let botResponse = '';
    let relevantMessages: any[] = [];
    let wasAnswered = false;

    // Check if this is basic conversation first
    if (isBasicConversation(message.trim())) {
      botResponse = generateBasicConversationResponse(message.trim(), bot.name, bot.description || '');
      confidence = 0.9; // High confidence for basic conversation
      wasAnswered = true;
    } else {
      // Find relevant training messages for specific questions
      relevantMessages = findRelevantTrainingMessages(message.trim(), bot);
      
      // Calculate confidence
      confidence = calculateConfidence(message.trim(), relevantMessages);
      
      // Generate response
      botResponse = await generateBotResponse(message.trim(), bot.name, bot.description || '', relevantMessages);
      
      // Determine if the question was answered
      wasAnswered = confidence >= MIN_CONFIDENCE_THRESHOLD;
      
      // Create unanswered question if confidence is low
      if (!wasAnswered) {
        await createUnansweredQuestion(botId, finalSessionId, message.trim(), confidence, userAgent);
      }
    }
    
    const responseTime = Date.now() - startTime;

    // Update chat session with this interaction
    await updateChatSession(chatSession, message.trim(), botResponse, confidence, responseTime);

    console.log(`💬 Bot ${botId} chat - Confidence: ${confidence.toFixed(2)}, Answered: ${wasAnswered}, Response time: ${responseTime}ms`);

    return res.status(200).json({
      success: true,
      data: {
        message: botResponse,
        confidence,
        responseTime,
        sessionId: finalSessionId,
        relevantTraining: relevantMessages.map(msg => msg.summary || msg.content.substring(0, 100) + '...'),
        wasAnswered
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error in bot chat:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date()
    });
  }
} 