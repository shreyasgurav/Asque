import { 
  collection, 
  doc, 
  getDoc, 
  addDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { adminDb } from '@/lib/firebase-admin';
import { Bot, ChatSession, UnansweredQuestion, ChatAnalytics, BotAnalytics } from '@/types';
import fs from 'fs';
import path from 'path';

// Mock database file paths
const DEV_DATA_DIR = path.join(process.cwd(), '.dev-data');
const BOTS_FILE = path.join(DEV_DATA_DIR, 'bots.json');
const CHAT_SESSIONS_FILE = path.join(DEV_DATA_DIR, 'chatSessions.json');
const UNANSWERED_QUESTIONS_FILE = path.join(DEV_DATA_DIR, 'unansweredQuestions.json');

// Ensure dev data directory exists
if (!fs.existsSync(DEV_DATA_DIR)) {
  fs.mkdirSync(DEV_DATA_DIR, { recursive: true });
}

// Mock database helper functions
const loadMockData = (filePath: string) => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn(`Could not read ${filePath}:`, error);
  }
  return {};
};

const saveMockData = (filePath: string, data: any) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Could not save to ${filePath}:`, error);
  }
};

// Client-side database operations (for frontend)
export const clientDb = {
  // Get bot data
  async getBot(botId: string): Promise<Bot | null> {
    try {
      const docRef = doc(db, 'bots', botId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Bot;
      }
      return null;
    } catch (error) {
      console.error('Error fetching bot:', error);
      return null;
    }
  },
  // Add chat session
  async addChatSession(sessionData: Omit<ChatSession, 'id'>): Promise<string | null> {
    try {
      const docRef = await addDoc(collection(db, 'chatSessions'), sessionData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding chat session:', error);
      return null;
    }
  }
};

// Helper function to calculate analytics
const calculateAnalytics = (sessions: ChatSession[]): BotAnalytics => {
  const totalVisitors = sessions.length;
  const totalChats = sessions.reduce((sum, session) => sum + session.messageCount, 0);
  const totalMessages = sessions.reduce((sum, session) => sum + session.messages.length, 0);
  const averageResponseTime = sessions.length > 0 
    ? sessions.reduce((sum, session) => sum + (session.averageResponseTime || 0), 0) / sessions.length 
    : 0;
  const successfulResponses = sessions.reduce((sum, session) => sum + session.successfulResponses, 0);
  const failedQuestions = sessions.reduce((sum, session) => sum + session.failedQuestions, 0);

  return {
    totalVisitors,
    totalChats,
    totalMessages,
    averageResponseTime,
    successfulResponses,
    failedQuestions,
    successRate: totalMessages > 0 ? (successfulResponses / totalMessages) * 100 : 0,
    dailyVisitors: [],
    weeklyChats: [],
    topQuestions: [],
    responseTimeHistory: []
  };
};

// Server-side database operations (for API routes)
export const serverDb = {
  // Get bot by ID
  async getBot(botId: string): Promise<Bot | null> {
    if (!adminDb) {
      // Use mock database
      const bots = loadMockData(BOTS_FILE);
      const bot = bots[botId];
      if (bot) {
        return {
          ...bot,
          createdAt: new Date(bot.createdAt),
          updatedAt: new Date(bot.updatedAt),
          deployedAt: bot.deployedAt ? new Date(bot.deployedAt) : undefined
        } as Bot;
      }
      return null;
    }
    
    try {
      const docRef = adminDb.collection('bots').doc(botId);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        return { id: docSnap.id, ...docSnap.data() } as Bot;
      }
      return null;
    } catch (error) {
      console.error('Error fetching bot from Firebase:', error);
      return null;
    }
  },

  // Get bot with analytics
  async getBotWithAnalytics(botId: string): Promise<Bot | null> {
    const bot = await this.getBot(botId);
    if (!bot) return null;

    const sessions = await this.getChatSessionsByBot(botId);
    bot.analytics = calculateAnalytics(sessions);
    return bot;
  },

  // Create new bot
  async createBot(botData: Bot): Promise<Bot> {
    if (!adminDb) {
      // Use mock database
      const bots = loadMockData(BOTS_FILE);
      const cleanBotData = {
        ...botData,
        description: botData.description || '',
        deployedAt: botData.deployedAt || null,
        profilePictureUrl: botData.profilePictureUrl || null,
        welcomeMessage: botData.welcomeMessage || null,
      };
      bots[botData.id] = cleanBotData;
      saveMockData(BOTS_FILE, bots);
      return botData;
    }
    
    try {
      const cleanBotData = {
        ...botData,
        description: botData.description || '',
        deployedAt: botData.deployedAt || null,
        profilePictureUrl: botData.profilePictureUrl || null,
        welcomeMessage: botData.welcomeMessage || null,
      };
      await adminDb.collection('bots').doc(botData.id).set(cleanBotData);
      return botData;
    } catch (error) {
      console.error('Error saving bot to Firebase:', error);
      throw error;
    }
  },

  // Update bot
  async updateBot(botData: Bot): Promise<Bot> {
    if (!adminDb) {
      // Use mock database
      const bots = loadMockData(BOTS_FILE);
      const cleanBotData = {
        ...botData,
        description: botData.description || '',
        deployedAt: botData.deployedAt || null,
        profilePictureUrl: botData.profilePictureUrl || null,
        welcomeMessage: botData.welcomeMessage || null,
      };
      bots[botData.id] = cleanBotData;
      saveMockData(BOTS_FILE, bots);
      return botData;
    }
    
    try {
      const cleanBotData = {
        ...botData,
        description: botData.description || '',
        deployedAt: botData.deployedAt || null,
        profilePictureUrl: botData.profilePictureUrl || null,
        welcomeMessage: botData.welcomeMessage || null,
      };
      await adminDb.collection('bots').doc(botData.id).set(cleanBotData);
      return botData;
    } catch (error) {
      console.error('Error updating bot in Firebase:', error);
      throw error;
    }
  },

  // Get bots by owner ID
  async getBotsByOwner(ownerId: string): Promise<Bot[]> {
    if (!adminDb) {
      // Use mock database
      const bots = loadMockData(BOTS_FILE);
      const userBots: Bot[] = [];
      
      Object.values(bots).forEach((bot: any) => {
        if (bot.ownerId === ownerId) {
          userBots.push({
            ...bot,
            createdAt: new Date(bot.createdAt),
            updatedAt: new Date(bot.updatedAt),
            deployedAt: bot.deployedAt ? new Date(bot.deployedAt) : undefined
          } as Bot);
        }
      });
      
      // Sort by createdAt descending
      return userBots.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    
    try {
      const querySnapshot = await adminDb
        .collection('bots')
        .where('ownerId', '==', ownerId)
        .orderBy('createdAt', 'desc')
        .get();
      const firebaseBots: Bot[] = [];
      querySnapshot.forEach((doc: any) => {
        firebaseBots.push({ id: doc.id, ...doc.data() } as Bot);
      });
      return firebaseBots;
    } catch (error) {
      console.error('Error fetching bots by owner from Firebase:', error);
      return [];
    }
  },

  // Get bots by phone number
  async getBotsByPhoneNumber(phoneNumber: string): Promise<Bot[]> {
    if (!adminDb) {
      // Use mock database
      const bots = loadMockData(BOTS_FILE);
      const phoneBots: Bot[] = [];
      
      Object.values(bots).forEach((bot: any) => {
        if (bot.ownerPhoneNumber === phoneNumber) {
          phoneBots.push({
            ...bot,
            createdAt: new Date(bot.createdAt),
            updatedAt: new Date(bot.updatedAt),
            deployedAt: bot.deployedAt ? new Date(bot.deployedAt) : undefined
          } as Bot);
        }
      });
      
      // Sort by createdAt descending
      return phoneBots.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    
    try {
      const querySnapshot = await adminDb
        .collection('bots')
        .where('ownerPhoneNumber', '==', phoneNumber)
        .orderBy('createdAt', 'desc')
        .get();
      const firebaseBots: Bot[] = [];
      querySnapshot.forEach((doc: any) => {
        firebaseBots.push({ id: doc.id, ...doc.data() } as Bot);
      });
      return firebaseBots;
    } catch (error) {
      console.error('Error fetching bots by phone from Firebase:', error);
      return [];
    }
  },

  // Enhanced getBotsByOwner that also checks phone number as fallback
  async getBotsByOwnerWithFallback(ownerId: string, phoneNumber?: string): Promise<Bot[]> {
    let bots = await this.getBotsByOwner(ownerId);
    if (bots.length === 0 && phoneNumber) {
      const phoneBots = await this.getBotsByPhoneNumber(phoneNumber);
      if (phoneBots.length > 0) {
        for (const bot of phoneBots) {
          bot.ownerId = ownerId;
          await this.updateBot(bot);
        }
        bots = phoneBots;
      }
    }
    return bots;
  },

  // Delete bot
  async deleteBot(botId: string): Promise<boolean> {
    if (!adminDb) {
      // Use mock database
      const bots = loadMockData(BOTS_FILE);
      if (bots[botId]) {
        delete bots[botId];
        saveMockData(BOTS_FILE, bots);
        return true;
      }
      return false;
    }
    
    try {
      await adminDb.collection('bots').doc(botId).delete();
      return true;
    } catch (error) {
      console.error('Error deleting bot from Firebase:', error);
      return false;
    }
  },

  // Chat Sessions Management
  async createChatSession(sessionData: ChatSession): Promise<ChatSession> {
    if (!adminDb) {
      // Use mock database
      const sessions = loadMockData(CHAT_SESSIONS_FILE);
      sessions[sessionData.id] = sessionData;
      saveMockData(CHAT_SESSIONS_FILE, sessions);
      return sessionData;
    }
    
    try {
      await adminDb.collection('chatSessions').doc(sessionData.id).set(sessionData);
      return sessionData;
    } catch (error) {
      console.error('Error saving chat session to Firebase:', error);
      throw error;
    }
  },

  async updateChatSession(sessionData: ChatSession): Promise<ChatSession> {
    if (!adminDb) {
      // Use mock database
      const sessions = loadMockData(CHAT_SESSIONS_FILE);
      sessions[sessionData.id] = sessionData;
      saveMockData(CHAT_SESSIONS_FILE, sessions);
      return sessionData;
    }
    
    try {
      await adminDb.collection('chatSessions').doc(sessionData.id).set(sessionData);
      return sessionData;
    } catch (error) {
      console.error('Error updating chat session in Firebase:', error);
      throw error;
    }
  },

  async getChatSessionsByBot(botId: string): Promise<ChatSession[]> {
    if (!adminDb) {
      // Use mock database
      const sessions = loadMockData(CHAT_SESSIONS_FILE);
      const botSessions: ChatSession[] = [];
      
      Object.values(sessions).forEach((session: any) => {
        if (session.botId === botId) {
          botSessions.push({
            ...session,
            startedAt: new Date(session.startedAt),
            lastActivityAt: new Date(session.lastActivityAt)
          } as ChatSession);
        }
      });
      
      return botSessions.sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
    }
    
    try {
      const querySnapshot = await adminDb
        .collection('chatSessions')
        .where('botId', '==', botId)
        .orderBy('lastActivityAt', 'desc')
        .get();
      const firebaseSessions: ChatSession[] = [];
      querySnapshot.forEach((doc: any) => {
        firebaseSessions.push({ id: doc.id, ...doc.data() } as ChatSession);
      });
      return firebaseSessions;
    } catch (error) {
      console.error('Error fetching chat sessions by bot from Firebase:', error);
      return [];
    }
  },

  async getChatSessionsByUser(userId: string): Promise<ChatSession[]> {
    if (!adminDb) {
      // Use mock database
      const sessions = loadMockData(CHAT_SESSIONS_FILE);
      const userSessions: ChatSession[] = [];
      
      Object.values(sessions).forEach((session: any) => {
        if (session.userId === userId && session.isAuthenticated) {
          userSessions.push({
            ...session,
            startedAt: new Date(session.startedAt),
            lastActivityAt: new Date(session.lastActivityAt)
          } as ChatSession);
        }
      });
      
      return userSessions.sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
    }
    
    try {
      // Use simpler query to avoid complex composite index requirements
      const querySnapshot = await adminDb
        .collection('chatSessions')
        .where('userId', '==', userId)
        .get();
      
      const firebaseSessions: ChatSession[] = [];
      querySnapshot.forEach((doc: any) => {
        const sessionData = doc.data();
        // Filter for authenticated sessions in memory
        if (sessionData.isAuthenticated === true) {
          firebaseSessions.push({ id: doc.id, ...sessionData } as ChatSession);
        }
      });
      
      // Sort by lastActivityAt in memory (descending)
      return firebaseSessions.sort((a, b) => {
        const aTime = a.lastActivityAt instanceof Date ? a.lastActivityAt : new Date(a.lastActivityAt);
        const bTime = b.lastActivityAt instanceof Date ? b.lastActivityAt : new Date(b.lastActivityAt);
        return bTime.getTime() - aTime.getTime();
      });
    } catch (error) {
      console.error('Error fetching chat sessions by user from Firebase:', error);
      return [];
    }
  },

  async getChatSession(sessionId: string): Promise<ChatSession | null> {
    if (!adminDb) {
      // Use mock database
      const sessions = loadMockData(CHAT_SESSIONS_FILE);
      const session = sessions[sessionId];
      if (session) {
        return {
          ...session,
          startedAt: new Date(session.startedAt),
          lastActivityAt: new Date(session.lastActivityAt)
        } as ChatSession;
      }
      return null;
    }
    
    try {
      const docRef = adminDb.collection('chatSessions').doc(sessionId);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        return { id: docSnap.id, ...docSnap.data() } as ChatSession;
      }
      return null;
    } catch (error) {
      console.error('Error fetching chat session from Firebase:', error);
      return null;
    }
  },

  // Unanswered Questions Management
  async createUnansweredQuestion(questionData: UnansweredQuestion): Promise<UnansweredQuestion> {
    if (!adminDb) {
      // Use mock database
      const questions = loadMockData(UNANSWERED_QUESTIONS_FILE);
      questions[questionData.id] = questionData;
      saveMockData(UNANSWERED_QUESTIONS_FILE, questions);
      return questionData;
    }
    
    try {
      await adminDb.collection('unansweredQuestions').doc(questionData.id).set(questionData);
      return questionData;
    } catch (error) {
      console.error('Error saving unanswered question to Firebase:', error);
      throw error;
    }
  },

  async updateUnansweredQuestion(questionData: UnansweredQuestion): Promise<UnansweredQuestion> {
    if (!adminDb) {
      // Use mock database
      const questions = loadMockData(UNANSWERED_QUESTIONS_FILE);
      questions[questionData.id] = questionData;
      saveMockData(UNANSWERED_QUESTIONS_FILE, questions);
      return questionData;
    }
    
    try {
      await adminDb.collection('unansweredQuestions').doc(questionData.id).set(questionData);
      return questionData;
    } catch (error) {
      console.error('Error updating unanswered question in Firebase:', error);
      throw error;
    }
  },

  async getUnansweredQuestionsByBot(botId: string): Promise<UnansweredQuestion[]> {
    if (!adminDb) {
      // Use mock database
      const questions = loadMockData(UNANSWERED_QUESTIONS_FILE);
      const botQuestions: UnansweredQuestion[] = [];
      
      Object.values(questions).forEach((question: any) => {
        if (question.botId === botId && !question.isAnswered) {
          botQuestions.push({
            ...question,
            timestamp: new Date(question.timestamp),
            respondedAt: question.respondedAt ? new Date(question.respondedAt) : undefined
          } as UnansweredQuestion);
        }
      });
      
      return botQuestions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    
    try {
      const querySnapshot = await adminDb
        .collection('unansweredQuestions')
        .where('botId', '==', botId)
        .where('isAnswered', '==', false)
        .get();
      const questions: UnansweredQuestion[] = [];
      querySnapshot.forEach((doc: any) => {
        questions.push({ id: doc.id, ...doc.data() } as UnansweredQuestion);
      });
      return questions;
    } catch (error) {
      console.error('Error fetching unanswered questions from Firebase:', error);
      return [];
    }
  },

  async getUnansweredQuestion(questionId: string): Promise<UnansweredQuestion | null> {
    if (!adminDb) {
      // Use mock database
      const questions = loadMockData(UNANSWERED_QUESTIONS_FILE);
      const question = questions[questionId];
      if (question) {
        return {
          ...question,
          timestamp: new Date(question.timestamp),
          respondedAt: question.respondedAt ? new Date(question.respondedAt) : undefined
        } as UnansweredQuestion;
      }
      return null;
    }
    
    try {
      const docRef = adminDb.collection('unansweredQuestions').doc(questionId);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        return { id: docSnap.id, ...docSnap.data() } as UnansweredQuestion;
      }
      return null;
    } catch (error) {
      console.error('Error fetching unanswered question from Firebase:', error);
      return null;
    }
  }
}; 