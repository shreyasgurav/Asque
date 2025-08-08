import { NextApiRequest, NextApiResponse } from 'next';
import { nanoid } from 'nanoid';
import { ChatWithBotRequest, ChatWithBotResponse, Bot, ChatSession, UnansweredQuestion } from '@/types';
import { serverDb } from '@/lib/database';
import { verifyAuthToken } from '@/lib/auth/server';
import { handleChatWithEmbeddings, extractUserMemories, buildMemoryContext } from '@/lib/ai';
import { withRateLimit, chatLimiter } from '@/lib/rate-limit';
import { validateChatMessage, validateBotId, validateSessionId } from '@/lib/validation';
import { getUserContext } from '@/lib/utils';

// Configuration
const MIN_CONFIDENCE_THRESHOLD = 0.6;
const MAX_TRAINING_ENTRIES = 500;

// Basic conversation patterns
const BASIC_CONVERSATION_PATTERNS = [
  /^(hi|hello|hey|greetings|good morning|good afternoon|good evening)$/i,
  /^(how are you|how's it going|how do you do)$/i,
  /^(thank you|thanks|thx|ty)$/i,
  /^(bye|goodbye|see you|farewell)$/i,
  /^(what can you do|help|what do you do|your capabilities)$/i
];

function isBasicConversation(message: string): boolean {
  return BASIC_CONVERSATION_PATTERNS.some(pattern => pattern.test(message.trim()));
}

// Helper function to generate basic conversation responses
function generateBasicConversationResponse(message: string, botName: string, botDescription: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (/^(hi|hello|hey|greetings)/.test(lowerMessage)) {
    return `Hello! I'm ${botName}. How can I help you today?`;
  }
  
  if (/^(how are you|how's it going)/.test(lowerMessage)) {
    return `I'm doing well, thank you for asking! I'm ${botName} and I'm here to help.`;
  }
  
  if (/^(thank you|thanks)/.test(lowerMessage)) {
    return `You're welcome! I'm happy to help.`;
  }
  
  if (/^(bye|goodbye)/.test(lowerMessage)) {
    return `Goodbye! Feel free to come back if you have more questions.`;
  }
  
  if (/^(what can you do|help|your capabilities)/.test(lowerMessage)) {
    return `I'm ${botName}${botDescription ? `, ${botDescription}` : ''}. I can answer questions and help you with information I've been trained on.`;
  }
  
  return `I'm ${botName} and I'm here to help! What would you like to know?`;
}

// Helper function to get or create chat session
async function getOrCreateChatSession(
  botId: string,
  sessionId: string,
  bot: Bot,
  userAgent: string | undefined,
  userId?: string,
  userPhoneNumber?: string
): Promise<ChatSession> {
  try {
    // Try to get existing session
    let session = await serverDb.getChatSession(sessionId);
    
    if (!session) {
      // Create new session
      session = {
        id: sessionId,
        botId,
        botName: bot.name,
        botProfilePictureUrl: bot.profilePictureUrl,
        userId: userId || 'anonymous',
        userPhoneNumber,
        userAgent: userAgent || 'unknown',
        messages: [],
        messageCount: 0,
        successfulResponses: 0,
        failedQuestions: 0,
        averageResponseTime: 0,
        isAuthenticated: !!userId,
        startedAt: new Date(),
        lastActivityAt: new Date(),
        isCompleted: false
      };
      
      await serverDb.createChatSession(session);
    } else {
      // Update existing session with current bot name and profile picture
      session.botName = bot.name;
      session.botProfilePictureUrl = bot.profilePictureUrl;
      session.lastActivityAt = new Date();
      await serverDb.updateChatSession(session);
    }
    
    return session;
  } catch (error) {
    console.error('Error getting/creating chat session:', error);
    // Return a basic session if database fails
    return {
      id: sessionId,
      botId,
      botName: bot.name,
      botProfilePictureUrl: bot.profilePictureUrl,
      userId: userId || 'anonymous',
      userPhoneNumber,
      userAgent: userAgent || 'unknown',
      messages: [],
      messageCount: 0,
      successfulResponses: 0,
      failedQuestions: 0,
      averageResponseTime: 0,
      isAuthenticated: !!userId,
      startedAt: new Date(),
      lastActivityAt: new Date(),
      isCompleted: false
    };
  }
}

// Helper function to create unanswered question
async function createUnansweredQuestion(
  botId: string,
  sessionId: string,
  question: string,
  confidence: number,
  userAgent: string | undefined
): Promise<void> {
  try {
    const unansweredQuestion: UnansweredQuestion = {
      id: `question_${nanoid(12)}`,
      botId,
      sessionId,
      question,
      confidence,
      userAgent: userAgent || 'unknown',
      isAnswered: false,
      timestamp: new Date(),
      askedAt: new Date()
    };
    
    await serverDb.createUnansweredQuestion(unansweredQuestion);
  } catch (error) {
    console.error('Error creating unanswered question:', error);
  }
}

// Helper function to update chat session with new message
async function updateChatSession(
  session: ChatSession, 
  userMessage: string, 
  botResponse: string, 
  confidence: number, 
  responseTime: number,
  usedTrainingIds: string[] = [],
  images?: Array<{
    url: string;
    description: string;
    altText: string;
  }>
): Promise<void> {
  const userMsg: any = {
    id: `msg_${Date.now()}_user`,
    type: 'user',
    content: userMessage,
    timestamp: new Date()
  };

  const botMsg: any = {
    id: `msg_${Date.now()}_bot`,
    type: 'bot',
    content: botResponse,
    timestamp: new Date(),
    images: images || [], // Store images in the bot message
    metadata: {
      confidence,
      responseTime,
      wasAnswered: confidence >= MIN_CONFIDENCE_THRESHOLD,
      usedTrainingIds
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

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<ChatWithBotResponse>
) => {
  const { botId } = req.query;

  // Validate bot ID
  const botIdValidation = validateBotId(botId as string);
  if (!botIdValidation.isValid) {
    return res.status(400).json({
      success: false,
      error: botIdValidation.errors.join(', '),
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
    const { message, sessionId, userContext: requestUserContext } = req.body as ChatWithBotRequest;
    const finalSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userAgent = req.headers['user-agent'] as string;

    // Validate message
    const messageValidation = validateChatMessage(message);
    if (!messageValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: messageValidation.errors.join(', '),
        timestamp: new Date()
      });
    }

    // Validate session ID
    const sessionIdValidation = validateSessionId(finalSessionId);
    if (!sessionIdValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: sessionIdValidation.errors.join(', '),
        timestamp: new Date()
      });
    }

    // Check for authentication (optional for chat)
    let authUser = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        authUser = await verifyAuthToken(token);
      } catch (error) {
        // console.log('⚠️ Invalid auth token in chat request, proceeding as anonymous');
      }
    }

    // Get the bot and check if it's deployed
    let bot = await serverDb.getBot(botId as string);
    
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
    const chatSession = await getOrCreateChatSession(
      botId as string, 
      finalSessionId, 
      bot, 
      userAgent,
      authUser?.uid,
      authUser?.phoneNumber
    );

    let confidence = 0;
    let botResponse = '';
    let relevantMessages: any[] = [];
    let wasAnswered = false;
    let usedTrainingIds: string[] = [];
    let chatResult: any = { images: [] }; // Initialize chatResult to prevent ReferenceError

    // Check if this is basic conversation first
    if (isBasicConversation(message.trim())) {
      botResponse = generateBasicConversationResponse(message.trim(), bot!.name, bot!.description || '');
      confidence = 0.9; // High confidence for basic conversation
      wasAnswered = true;
    } else {
      // Get training entries for embedding search
      const trainingEntries = await serverDb.getTrainingEntries(botId as string);

      if (trainingEntries.length === 0) {
        // No training data available
        botResponse = `I'm ${bot!.name} and I'm still learning! I don't have any training data yet. Please ask my creator to train me with some information first.`;
        confidence = 0;
        wasAnswered = false;
              } else {
          try {
            // Get user memories for personalization (simplified)
            const userIdentifier = authUser?.uid || finalSessionId;
            let userMemories: any[] = [];
            let userMemoryContext = '';
            
            try {
              userMemories = await serverDb.getUserMemories(userIdentifier, botId as string);
              userMemoryContext = buildMemoryContext(userMemories);
            } catch (error) {
              // console.log('Could not load user memories:', error);
            }

           // Use user context from request or fallback to server-generated context (simplified)
           let userContext = requestUserContext;
           if (!userContext) {
             // Use simple fallback context
             const now = new Date();
             userContext = {
               location: {
                 city: 'Mumbai',
                 country: 'India',
                 timezone: 'Asia/Kolkata',
                 coordinates: undefined
               },
               time: {
                 currentTime: now,
                 localTime: now,
                 timezone: 'Asia/Kolkata',
                 isDaytime: true,
                 mealTime: 'breakfast',
                 dayOfWeek: 'Monday'
               }
             };
           }

                     // Use embedding-based search with conversation history, user context, and memory
           chatResult = await handleChatWithEmbeddings(
             message.trim(),
             botId as string,
             trainingEntries,
             chatSession.messages, // Pass conversation history
             userContext, // Pass user context
             userMemoryContext // Pass user memory context
           );

          botResponse = chatResult.response;
          confidence = chatResult.confidence;
          wasAnswered = chatResult.wasAnswered;
          usedTrainingIds = chatResult.usedTrainingIds;
          
          // Extract and save user memories from this conversation (temporarily disabled)
          /*
          try {
            const memoryResult = await extractUserMemories(
              message.trim(),
              botResponse,
              chatSession.messages,
              userIdentifier,
              botId as string,
              finalSessionId,
              userMemories
            );
            
            // Save new memories
            for (const memory of memoryResult.extractedMemories) {
              await serverDb.createUserMemory(memory);
            }
            
            // Update existing memories
            for (const memory of memoryResult.updatedMemories) {
              await serverDb.updateUserMemory(memory);
            }
            
            if (memoryResult.extractedMemories.length > 0 || memoryResult.updatedMemories.length > 0) {
              // console.log(`🧠 Memory update: +${memoryResult.extractedMemories.length} new, ${memoryResult.updatedMemories.length} updated`);
            }
          } catch (memoryError) {
            // console.error('❌ Error processing user memories:', memoryError);
            // console.error('❌ Memory error details:', {
            //   name: memoryError instanceof Error ? memoryError.name : 'Unknown',
            //   message: memoryError instanceof Error ? memoryError.message : String(memoryError),
            //   stack: memoryError instanceof Error ? memoryError.stack : undefined
            // });
          }
          */
          
          // Create relevant messages from the training entries that were used
          relevantMessages = trainingEntries
            .filter(entry => usedTrainingIds.includes(entry.id))
            .map((entry: any) => {
              const content = entry.question
                ? `Q: ${entry.question} A: ${entry.answer}`
                : (entry.answer || entry.content || entry.contextBlock || '');
              let summary = '';
              if (entry.summary) {
                summary = entry.summary;
              } else if (entry.content) {
                summary = entry.content.substring(0, 100);
              } else if (entry.answer) {
                summary = entry.answer.substring(0, 100);
              } else if (entry.question) {
                summary = entry.question.substring(0, 100);
              } else if (entry.contextBlock) {
                summary = entry.contextBlock.substring(0, 100);
              } else {
                summary = content.substring(0, 100);
              }
              return {
                content,
                summary
              };
            });
        } catch (chatError) {
          // console.error('❌ Error in handleChatWithEmbeddings:', chatError);
          // console.error('❌ Error details:', {
          //   name: chatError instanceof Error ? chatError.name : 'Unknown',
          //   message: chatError instanceof Error ? chatError.message : String(chatError),
          //   stack: chatError instanceof Error ? chatError.stack : undefined
          // });
          // More specific error message
          botResponse = `I'm ${bot.name} and I'm having trouble processing your request right now. This might be due to a temporary issue with my AI processing. Please try again in a moment, or contact my creator if the problem persists.`;
          confidence = 0;
          wasAnswered = false;
          usedTrainingIds = [];
        }
      }
    }

    // Create unanswered question if confidence is low
    if (!wasAnswered && confidence < MIN_CONFIDENCE_THRESHOLD) {
      await createUnansweredQuestion(botId as string, finalSessionId, message.trim(), confidence, userAgent);
    }
    
    const responseTime = Date.now() - startTime;

    // Process images - use only actual uploaded images
    let finalImages = (typeof chatResult !== 'undefined' && chatResult.images) ? chatResult.images : [];

    // Update chat session with this interaction (including images)
    await updateChatSession(chatSession, message.trim(), botResponse, confidence, responseTime, usedTrainingIds, finalImages);

    console.log(`💬 Bot ${botId} chat - Confidence: ${confidence.toFixed(2)}, Answered: ${wasAnswered}, Response time: ${responseTime}ms`);
    console.log('🔍 Chat result images:', finalImages);
    
    const responseData = {
      success: true,
      data: {
        message: botResponse,
        confidence,
        responseTime,
        sessionId: finalSessionId,
        wasAnswered,
        images: finalImages
      },
      timestamp: new Date()
    };
    
    return res.status(200).json(responseData);

  } catch (error: any) {
    console.error('❌ Error in bot chat:', error);
    console.error('❌ Error stack:', error.stack);
    
    // More specific error messages based on error type
    let errorMessage = 'Internal server error';
    
    if (error.message?.includes('OpenAI')) {
      errorMessage = 'AI service temporarily unavailable. Please try again in a moment.';
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorMessage = 'Network connection issue. Please check your internet connection and try again.';
    } else if (error.message?.includes('rate limit')) {
      errorMessage = 'Too many requests. Please wait a moment before trying again.';
    } else if (error.message?.includes('authentication')) {
      errorMessage = 'Authentication error. Please refresh the page and try again.';
    }
    
    return res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: new Date()
    });
  }
};

// Export with rate limiting
export default withRateLimit(chatLimiter, handler); 