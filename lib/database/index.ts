import { 
  collection, 
  doc, 
  getDoc, 
  addDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { adminDb } from '@/lib/firebase-admin';
import { Bot, ChatSession, UnansweredQuestion, ChatAnalytics, BotAnalytics } from '@/types';
import * as fs from 'fs';
import * as path from 'path';

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

// File-based persistence for development
const DEV_DATA_DIR = path.join(process.cwd(), '.dev-data');
const BOTS_FILE = path.join(DEV_DATA_DIR, 'bots.json');
const CHAT_SESSIONS_FILE = path.join(DEV_DATA_DIR, 'chat-sessions.json');
const UNANSWERED_QUESTIONS_FILE = path.join(DEV_DATA_DIR, 'unanswered-questions.json');

// Ensure dev data directory exists
const ensureDevDataDir = () => {
  if (typeof window !== 'undefined') return; // Only run on server
  
  try {
    if (!fs.existsSync(DEV_DATA_DIR)) {
      fs.mkdirSync(DEV_DATA_DIR, { recursive: true });
    }
  } catch (error) {
    console.warn('Could not create dev data directory:', error);
  }
};

// Load data from file
const loadFromFile = <T>(filePath: string): Map<string, T> => {
  if (typeof window !== 'undefined') return new Map(); // Only run on server
  
  try {
    console.log(`📂 Attempting to load data from: ${filePath}`);
    if (fs.existsSync(filePath)) {
      console.log(`✅ File exists: ${filePath}`);
      const data = fs.readFileSync(filePath, 'utf-8');
      console.log(`📄 File content length: ${data.length} characters`);
      
      const parsed = JSON.parse(data);
      console.log(`🔍 Parsed object keys: ${Object.keys(parsed)}`);
      
      const map = new Map<string, T>();
      
      // Convert dates back to Date objects
      Object.entries(parsed).forEach(([key, value]: [string, any]) => {
        console.log(`🔑 Processing key: ${key}`);
        if (value && typeof value === 'object') {
          // Convert date strings back to Date objects
          Object.keys(value).forEach(prop => {
            if (prop.includes('At') || prop === 'timestamp') {
              if (typeof value[prop] === 'string' && value[prop].includes('T')) {
                const originalValue = value[prop];
                value[prop] = new Date(value[prop]);
                console.log(`📅 Converted date ${prop}: ${originalValue} -> ${value[prop]}`);
              }
            }
          });
        }
        map.set(key, value as T);
        console.log(`✅ Added to map: ${key}`);
      });
      
      console.log(`📊 Final map size: ${map.size}`);
      return map;
    } else {
      console.log(`❌ File does not exist: ${filePath}`);
    }
  } catch (error) {
    console.warn(`❌ Could not load data from ${filePath}:`, error);
  }
  
  return new Map<string, T>();
};

// Save data to file
const saveToFile = <T>(filePath: string, data: Map<string, T>) => {
  if (typeof window !== 'undefined') return; // Only run on server
  
  try {
    ensureDevDataDir();
    const obj = Object.fromEntries(data.entries());
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));
  } catch (error) {
    console.warn(`Could not save data to ${filePath}:`, error);
  }
};

// Global mock database storage for development
// Use global to persist across hot reloads and different API routes
declare global {
  // eslint-disable-next-line no-var
  var __MOCK_BOTS__: Map<string, Bot> | undefined;
  // eslint-disable-next-line no-var
  var __MOCK_CHAT_SESSIONS__: Map<string, ChatSession> | undefined;
  // eslint-disable-next-line no-var
  var __MOCK_UNANSWERED_QUESTIONS__: Map<string, UnansweredQuestion> | undefined;
}

// Initialize global mock databases if not exists
if (typeof global !== 'undefined') {
  try {
    if (!global.__MOCK_BOTS__) {
      global.__MOCK_BOTS__ = loadFromFile<Bot>(BOTS_FILE);
      console.log(`📂 Loaded ${global.__MOCK_BOTS__.size} bots from file`);
    }
    if (!global.__MOCK_CHAT_SESSIONS__) {
      global.__MOCK_CHAT_SESSIONS__ = loadFromFile<ChatSession>(CHAT_SESSIONS_FILE);
      console.log(`📂 Loaded ${global.__MOCK_CHAT_SESSIONS__.size} chat sessions from file`);
    }
    if (!global.__MOCK_UNANSWERED_QUESTIONS__) {
      global.__MOCK_UNANSWERED_QUESTIONS__ = loadFromFile<UnansweredQuestion>(UNANSWERED_QUESTIONS_FILE);
      console.log(`📂 Loaded ${global.__MOCK_UNANSWERED_QUESTIONS__.size} unanswered questions from file`);
    }
  } catch (error) {
    console.warn('⚠️ Error initializing mock databases:', error);
    // Initialize empty maps as fallback
    if (!global.__MOCK_BOTS__) global.__MOCK_BOTS__ = new Map<string, Bot>();
    if (!global.__MOCK_CHAT_SESSIONS__) global.__MOCK_CHAT_SESSIONS__ = new Map<string, ChatSession>();
    if (!global.__MOCK_UNANSWERED_QUESTIONS__) global.__MOCK_UNANSWERED_QUESTIONS__ = new Map<string, UnansweredQuestion>();
  }
}

// Get the persistent mock database instances
const getMockBots = (): Map<string, Bot> => {
  if (typeof global !== 'undefined') {
    if (!global.__MOCK_BOTS__) {
      global.__MOCK_BOTS__ = loadFromFile<Bot>(BOTS_FILE);
    }
    return global.__MOCK_BOTS__;
  }
  return new Map<string, Bot>();
};

const getMockChatSessions = (): Map<string, ChatSession> => {
  if (typeof global !== 'undefined') {
    if (!global.__MOCK_CHAT_SESSIONS__) {
      global.__MOCK_CHAT_SESSIONS__ = loadFromFile<ChatSession>(CHAT_SESSIONS_FILE);
    }
    return global.__MOCK_CHAT_SESSIONS__;
  }
  return new Map<string, ChatSession>();
};

const getMockUnansweredQuestions = (): Map<string, UnansweredQuestion> => {
  if (typeof global !== 'undefined') {
    if (!global.__MOCK_UNANSWERED_QUESTIONS__) {
      global.__MOCK_UNANSWERED_QUESTIONS__ = loadFromFile<UnansweredQuestion>(UNANSWERED_QUESTIONS_FILE);
    }
    return global.__MOCK_UNANSWERED_QUESTIONS__;
  }
  return new Map<string, UnansweredQuestion>();
};

// Helper function to check if Firebase is available and working
// Cache Firebase availability to avoid repeated checks
let firebaseAvailableCache: boolean | null = null;
let firebaseCheckTime = 0;
const FIREBASE_CHECK_CACHE_DURATION = 30000; // 30 seconds

const isFirebaseAvailable = async (): Promise<boolean> => {
  if (!adminDb) {
    return false;
  }
  
  // Return cached result if recent
  const now = Date.now();
  if (firebaseAvailableCache !== null && (now - firebaseCheckTime) < FIREBASE_CHECK_CACHE_DURATION) {
    return firebaseAvailableCache;
  }
  
  // If adminDb exists and is initialized, consider Firebase available
  // Don't do actual database operations that might fail due to permissions
  firebaseAvailableCache = true;
  firebaseCheckTime = now;
  console.log('🔥 Firebase Admin DB is available and initialized');
  return true;
};

// Helper function to calculate analytics from chat sessions
const calculateAnalytics = (sessions: ChatSession[]): BotAnalytics => {
  if (sessions.length === 0) {
    return {
      totalVisitors: 0,
      totalChats: 0,
      totalMessages: 0,
      averageResponseTime: 0,
      dailyVisitors: [],
      weeklyChats: [],
      topQuestions: [],
      responseTimeHistory: []
    };
  }

  const totalVisitors = sessions.length;
  const totalChats = sessions.filter(s => s.messageCount > 0).length;
  const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0);
  const averageResponseTime = sessions.reduce((sum, s) => sum + s.averageResponseTime, 0) / sessions.length;
  const lastActiveAt = new Date(Math.max(...sessions.map(s => new Date(s.lastActivityAt).getTime())));

  // Calculate daily visitors for the last 7 days
  const dailyVisitors: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const count = sessions.filter(s => {
      const sessionDate = new Date(s.startedAt).toISOString().split('T')[0];
      return sessionDate === dateStr;
    }).length;
    dailyVisitors.push({ date: dateStr, count });
  }

  // Calculate weekly chats for the last 4 weeks
  const weeklyChats: { week: string; count: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - (i * 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const weekStr = `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
    const count = sessions.filter(s => {
      const sessionDate = new Date(s.startedAt);
      return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
    }).length;
    weeklyChats.push({ week: weekStr, count });
  }

  // Top questions would need to be extracted from chat messages
  // For now, we'll use a placeholder
  const topQuestions: { question: string; count: number }[] = [];

  // Response time history for the last 7 days
  const responseTimeHistory: { date: string; avgTime: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const daySessions = sessions.filter(s => {
      const sessionDate = new Date(s.startedAt).toISOString().split('T')[0];
      return sessionDate === dateStr;
    });
    const avgTime = daySessions.length > 0 
      ? daySessions.reduce((sum, s) => sum + s.averageResponseTime, 0) / daySessions.length 
      : 0;
    responseTimeHistory.push({ date: dateStr, avgTime });
  }

  return {
    totalVisitors,
    totalChats,
    totalMessages,
    averageResponseTime,
    lastActiveAt,
    dailyVisitors,
    weeklyChats,
    topQuestions,
    responseTimeHistory
  };
};

// Server-side database operations (for API routes)
export const serverDb = {
  // Get bot by ID
  async getBot(botId: string): Promise<Bot | null> {
    console.log('🔍 serverDb.getBot called for:', botId);
    
    // Always check mock database first for development
    const mockBots = getMockBots();
    const mockBot = mockBots.get(botId);
    
    if (mockBot) {
      console.log('🔍 Mock bot details:', {
        id: mockBot.id,
        name: mockBot.name,
        ownerId: mockBot.ownerId,
        ownerPhoneNumber: mockBot.ownerPhoneNumber
      });
    }
    
    // For development, use mock data only to avoid Firebase delays
    if (!adminDb) {
      console.log('📱 Firebase Admin not available, using mock database only');
      if (mockBot) {
        console.log('✅ Returning mock bot data for:', botId);
        return mockBot;
      } else {
        console.log('🚫 Mock bot not found for:', botId);
        return null;
      }
    }
    
    // Skip Firebase for now to improve performance
    // TODO: Re-enable Firebase when needed for production
    if (mockBot) {
      console.log('✅ Returning mock bot data for:', botId);
      return mockBot;
    }
    
    console.log('🚫 Bot not found in Firebase or mock database:', botId);
    return null;
  },

  // Get bot with analytics
  async getBotWithAnalytics(botId: string): Promise<Bot | null> {
    console.log('📊 serverDb.getBotWithAnalytics called for:', botId);
    
    const bot = await this.getBot(botId);
    if (!bot) {
      return null;
    }

    // Get chat sessions for this bot
    const sessions = await this.getChatSessionsByBot(botId);
    
    // Calculate analytics from sessions
    const analytics = calculateAnalytics(sessions);
    
    return {
      ...bot,
      analytics
    };
  },

  // Create new bot
  async createBot(botData: Bot): Promise<Bot> {
    console.log('🤖 serverDb.createBot called with:', botData.id);
    
    // Try to save to Firebase first (primary database)
    if (adminDb) {
      const firebaseAvailable = await isFirebaseAvailable();
      if (firebaseAvailable) {
        try {
          console.log('🔥 Attempting to save bot to Firebase...');
          // Clean the bot data to avoid Firestore undefined value errors
          const cleanBotData = {
            ...botData,
            description: botData.description || '',
            deployedAt: botData.deployedAt || null,
            profilePictureUrl: botData.profilePictureUrl || null,
            welcomeMessage: botData.welcomeMessage || null,
          };
          
          await adminDb.collection('bots').doc(botData.id).set(cleanBotData);
          console.log('✅ Bot saved to Firebase successfully');
          return botData;
        } catch (error) {
          console.error('❌ Error saving bot to Firebase, falling back to mock database:', error instanceof Error ? error.message : String(error));
        }
      }
    }
    
    // Fallback to mock database if Firebase is not available or failed
    console.log('📱 Using mock database as fallback');
    const mockBots = getMockBots();
    mockBots.set(botData.id, botData);
    console.log('✅ Bot saved to mock database:', botData.id);
    console.log('📋 Total mock bots now:', mockBots.size);

    // Save to file for persistence
    saveToFile(BOTS_FILE, mockBots);
    console.log('💾 Bot data saved to file');

    return botData;
  },

  // Update bot
  async updateBot(botData: Bot): Promise<Bot> {
    console.log('🔄 serverDb.updateBot called for:', botData.id);
    
    // Always update mock database
    const mockBots = getMockBots();
    mockBots.set(botData.id, botData);
    console.log('✅ Bot updated in mock database:', botData.id);

    // Save to file for persistence
    saveToFile(BOTS_FILE, mockBots);
    console.log('💾 Bot data saved to file');

    // Try to update Firebase if available
    if (adminDb) {
      const firebaseAvailable = await isFirebaseAvailable();
      if (firebaseAvailable) {
        try {
          console.log('🔥 Attempting to update bot in Firebase...');
          // Clean the bot data to avoid Firestore undefined value errors
          const cleanBotData = {
            ...botData,
            description: botData.description || '',
            deployedAt: botData.deployedAt || null,
            profilePictureUrl: botData.profilePictureUrl || null,
            welcomeMessage: botData.welcomeMessage || null,
          };
          
          await adminDb.collection('bots').doc(botData.id).set(cleanBotData);
          console.log('✅ Bot also updated in Firebase successfully');
        } catch (error) {
          console.error('❌ Error updating bot in Firebase (using mock as primary):', error instanceof Error ? error.message : String(error));
        }
      }
    }
    
    return botData;
  },

  // Get bots by owner ID
  async getBotsByOwner(ownerId: string): Promise<Bot[]> {
    console.log('📋 serverDb.getBotsByOwner called for:', ownerId);
    if (adminDb) {
      const firebaseAvailable = await isFirebaseAvailable();
      if (firebaseAvailable) {
        try {
          console.log('🔥 Attempting to fetch bots from Firebase...');
          const querySnapshot = await adminDb
            .collection('bots')
            .where('ownerId', '==', ownerId)
            .orderBy('createdAt', 'desc')
            .get();
          const firebaseBots: Bot[] = [];
          querySnapshot.forEach((doc: any) => {
            firebaseBots.push({ id: doc.id, ...doc.data() } as Bot);
          });
          console.log('✅ Found', firebaseBots.length, 'Firebase bots for owner:', ownerId);
          return firebaseBots;
        } catch (error) {
          console.error('❌ Firebase query failed for bots by owner:', error instanceof Error ? error.message : String(error));
        }
      }
    }
    // Fallback to mock database
    const mockBots = getMockBots();
    const mockOwnerBots = Array.from(mockBots.values()).filter(bot => bot.ownerId === ownerId);
    console.log('🔄 Using mock database as fallback for getBotsByOwner');
    return mockOwnerBots;
  },

  // Get bots by phone number (fallback for cross-session identification)
  async getBotsByPhoneNumber(phoneNumber: string): Promise<Bot[]> {
    console.log('📱 serverDb.getBotsByPhoneNumber called for:', phoneNumber);
    if (adminDb) {
      const firebaseAvailable = await isFirebaseAvailable();
      if (firebaseAvailable) {
        try {
          console.log('🔥 Attempting to fetch bots from Firebase by phone...');
          const querySnapshot = await adminDb
            .collection('bots')
            .where('ownerPhoneNumber', '==', phoneNumber)
            .orderBy('createdAt', 'desc')
            .get();
          const firebaseBots: Bot[] = [];
          querySnapshot.forEach((doc: any) => {
            firebaseBots.push({ id: doc.id, ...doc.data() } as Bot);
          });
          console.log('✅ Found', firebaseBots.length, 'Firebase bots for phone:', phoneNumber);
          return firebaseBots;
        } catch (error) {
          console.error('❌ Firebase query failed for bots by phone:', error instanceof Error ? error.message : String(error));
        }
      }
    }
    // Fallback to mock database
    const mockBots = getMockBots();
    const mockPhoneBots = Array.from(mockBots.values()).filter(bot => bot.ownerPhoneNumber === phoneNumber);
    console.log('🔄 Using mock database as fallback for getBotsByPhoneNumber');
    return mockPhoneBots;
  },

  // Enhanced getBotsByOwner that also checks phone number as fallback
  async getBotsByOwnerWithFallback(ownerId: string, phoneNumber?: string): Promise<Bot[]> {
    console.log('🔍 serverDb.getBotsByOwnerWithFallback called for:', ownerId, 'phone:', phoneNumber);
    let bots = await this.getBotsByOwner(ownerId);
    if (bots.length === 0 && phoneNumber) {
      console.log('🔄 No bots found by owner ID, trying phone number fallback...');
      const phoneBots = await this.getBotsByPhoneNumber(phoneNumber);
      if (phoneBots.length > 0) {
        console.log('✅ Found bots by phone number, updating owner IDs...');
        for (const bot of phoneBots) {
          bot.ownerId = ownerId;
          await this.updateBot(bot);
        }
        bots = phoneBots;
      }
    }
    console.log('📊 Total bots found:', bots.length);
    return bots;
  },

  // Delete bot
  async deleteBot(botId: string): Promise<boolean> {
    console.log('🗑️ serverDb.deleteBot called for:', botId);
    
    // Always delete from mock database
    const mockBots = getMockBots();
    const deleted = mockBots.delete(botId);
    console.log('✅ Bot deleted from mock database:', deleted);

    // Save to file for persistence
    saveToFile(BOTS_FILE, mockBots);
    console.log('💾 Bot data saved to file');

    // Try to delete from Firebase if available
    if (adminDb) {
      const firebaseAvailable = await isFirebaseAvailable();
      if (firebaseAvailable) {
        try {
          console.log('🔥 Attempting to delete bot from Firebase...');
          await adminDb.collection('bots').doc(botId).delete();
          console.log('✅ Bot also deleted from Firebase successfully');
        } catch (error) {
          console.error('❌ Error deleting bot from Firebase (mock deletion successful):', error instanceof Error ? error.message : String(error));
        }
      }
    }
    
    return deleted;
  },

  // Chat Sessions Management
  async createChatSession(sessionData: ChatSession): Promise<ChatSession> {
    console.log('💬 serverDb.createChatSession called for bot:', sessionData.botId);
    
    // Try to save to Firebase first (primary database)
    if (adminDb) {
      const firebaseAvailable = await isFirebaseAvailable();
      if (firebaseAvailable) {
        try {
          console.log('�� Attempting to save chat session to Firebase...');
          await adminDb.collection('chatSessions').doc(sessionData.id).set(sessionData);
          console.log('✅ Chat session saved to Firebase successfully');
          return sessionData;
        } catch (error) {
          console.error('❌ Error saving chat session to Firebase, falling back to mock database:', error instanceof Error ? error.message : String(error));
        }
      }
    }
    
    // Fallback to mock database if Firebase is not available or failed
    console.log('📱 Using mock database as fallback for chat session');
    const mockSessions = getMockChatSessions();
    mockSessions.set(sessionData.id, sessionData);
    console.log('✅ Chat session saved to mock database:', sessionData.id);

    // Save to file for persistence
    saveToFile(CHAT_SESSIONS_FILE, mockSessions);

    return sessionData;
  },

  async updateChatSession(sessionData: ChatSession): Promise<ChatSession> {
    console.log('🔄 serverDb.updateChatSession called for:', sessionData.id);
    
    // Try to update Firebase first (primary database)
    if (adminDb) {
      const firebaseAvailable = await isFirebaseAvailable();
      if (firebaseAvailable) {
        try {
          console.log('🔥 Attempting to update chat session in Firebase...');
          await adminDb.collection('chatSessions').doc(sessionData.id).set(sessionData);
          console.log('✅ Chat session updated in Firebase successfully');
          return sessionData;
        } catch (error) {
          console.error('❌ Error updating chat session in Firebase, falling back to mock database:', error instanceof Error ? error.message : String(error));
        }
      }
    }
    
    // Fallback to mock database if Firebase is not available or failed
    console.log('📱 Using mock database as fallback for chat session update');
    const mockSessions = getMockChatSessions();
    mockSessions.set(sessionData.id, sessionData);
    console.log('✅ Chat session updated in mock database:', sessionData.id);

    // Save to file for persistence
    saveToFile(CHAT_SESSIONS_FILE, mockSessions);

    return sessionData;
  },

  async getChatSessionsByBot(botId: string): Promise<ChatSession[]> {
    console.log('📊 serverDb.getChatSessionsByBot called for:', botId);
    if (adminDb) {
      const firebaseAvailable = await isFirebaseAvailable();
      if (firebaseAvailable) {
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
          console.log('✅ Found', firebaseSessions.length, 'Firebase chat sessions for bot:', botId);
          return firebaseSessions;
        } catch (error) {
          console.error('❌ Firebase query failed for chat sessions by bot:', error instanceof Error ? error.message : String(error));
        }
      }
    }
    // Fallback to mock database
    const mockSessions = getMockChatSessions();
    const mockBotSessions = Array.from(mockSessions.values()).filter(session => session.botId === botId);
    console.log('🔄 Using mock database as fallback for getChatSessionsByBot');
    return mockBotSessions;
  },

  async getChatSessionsByUser(userId: string): Promise<ChatSession[]> {
    console.log('👤 serverDb.getChatSessionsByUser called for:', userId);
    if (adminDb) {
      const firebaseAvailable = await isFirebaseAvailable();
      if (firebaseAvailable) {
        try {
          const querySnapshot = await adminDb
            .collection('chatSessions')
            .where('userId', '==', userId)
            .where('isAuthenticated', '==', true)
            .orderBy('lastActivityAt', 'desc')
            .get();
          const firebaseSessions: ChatSession[] = [];
          querySnapshot.forEach((doc: any) => {
            firebaseSessions.push({ id: doc.id, ...doc.data() } as ChatSession);
          });
          console.log('✅ Found', firebaseSessions.length, 'Firebase chat sessions for user:', userId);
          return firebaseSessions;
        } catch (error) {
          console.error('❌ Firebase query failed for chat sessions by user:', error instanceof Error ? error.message : String(error));
        }
      }
    }
    // Fallback to mock database
    const mockSessions = getMockChatSessions();
    const userSessions = Array.from(mockSessions.values())
      .filter(session => session.userId === userId && session.isAuthenticated)
      .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());
    console.log('🔄 Using mock database as fallback for getChatSessionsByUser');
    return userSessions;
  },

  async getChatSession(sessionId: string): Promise<ChatSession | null> {
    console.log('💬 serverDb.getChatSession called for:', sessionId);
    if (adminDb) {
      const firebaseAvailable = await isFirebaseAvailable();
      if (firebaseAvailable) {
        try {
          const docRef = adminDb.collection('chatSessions').doc(sessionId);
          const docSnap = await docRef.get();
          if (docSnap.exists) {
            console.log('✅ Chat session found in Firebase:', sessionId);
            return { id: docSnap.id, ...docSnap.data() } as ChatSession;
          }
        } catch (error) {
          console.error('❌ Firebase query failed for chat session:', error instanceof Error ? error.message : String(error));
        }
      }
    }
    // Fallback to mock database
    const mockSessions = getMockChatSessions();
    const session = mockSessions.get(sessionId);
    if (session) {
      console.log('🔄 Using mock database as fallback for getChatSession');
      return session;
    }
    console.log('❌ Chat session not found:', sessionId);
    return null;
  },

  // Unanswered Questions Management
  async createUnansweredQuestion(questionData: UnansweredQuestion): Promise<UnansweredQuestion> {
    console.log('❓ serverDb.createUnansweredQuestion called for bot:', questionData.botId);
    
    const mockQuestions = getMockUnansweredQuestions();
    mockQuestions.set(questionData.id, questionData);
    console.log('✅ Unanswered question saved to mock database:', questionData.id);

    // Save to file for persistence
    saveToFile(UNANSWERED_QUESTIONS_FILE, mockQuestions);

    // Try to save to Firebase if available
    if (adminDb) {
      const firebaseAvailable = await isFirebaseAvailable();
      if (firebaseAvailable) {
        try {
          await adminDb.collection('unansweredQuestions').doc(questionData.id).set(questionData);
          console.log('✅ Unanswered question also saved to Firebase successfully');
        } catch (error) {
          console.error('❌ Error saving unanswered question to Firebase:', error instanceof Error ? error.message : String(error));
        }
      }
    }
    
    return questionData;
  },

  async updateUnansweredQuestion(questionData: UnansweredQuestion): Promise<UnansweredQuestion> {
    console.log('🔄 serverDb.updateUnansweredQuestion called for:', questionData.id);
    
    const mockQuestions = getMockUnansweredQuestions();
    mockQuestions.set(questionData.id, questionData);
    console.log('✅ Unanswered question updated in mock database:', questionData.id);

    // Save to file for persistence
    saveToFile(UNANSWERED_QUESTIONS_FILE, mockQuestions);

    // Try to update Firebase if available
    if (adminDb) {
      const firebaseAvailable = await isFirebaseAvailable();
      if (firebaseAvailable) {
        try {
          await adminDb.collection('unansweredQuestions').doc(questionData.id).set(questionData);
          console.log('✅ Unanswered question also updated in Firebase successfully');
        } catch (error) {
          console.error('❌ Error updating unanswered question in Firebase:', error instanceof Error ? error.message : String(error));
        }
      }
    }
    
    return questionData;
  },

  async getUnansweredQuestionsByBot(botId: string): Promise<UnansweredQuestion[]> {
    console.log('❓ serverDb.getUnansweredQuestionsByBot called for:', botId);
    
    const mockQuestions = getMockUnansweredQuestions();
    // Filter to only return questions that are NOT answered
    const mockBotQuestions = Array.from(mockQuestions.values())
      .filter(question => question.botId === botId && !question.isAnswered);
    console.log('📱 Found', mockBotQuestions.length, 'mock unanswered questions for bot:', botId);

    // For development, use mock data only to avoid Firebase delays
    if (!adminDb) {
      return mockBotQuestions;
    }
    
    // Skip Firebase for now to improve performance
    // TODO: Re-enable Firebase when needed for production
    return mockBotQuestions;
  },

  async getUnansweredQuestion(questionId: string): Promise<UnansweredQuestion | null> {
    console.log('❓ serverDb.getUnansweredQuestion called for:', questionId);
    
    const mockQuestions = getMockUnansweredQuestions();
    const mockQuestion = mockQuestions.get(questionId);

    // If no Firebase, return mock only
    if (!adminDb) {
      return mockQuestion || null;
    }
    
    // Try Firebase if available
    const firebaseAvailable = await isFirebaseAvailable();
    if (firebaseAvailable) {
      try {
        const docRef = adminDb.collection('unansweredQuestions').doc(questionId);
        const docSnap = await docRef.get();
        
        if (docSnap.exists) {
          console.log('✅ Unanswered question found in Firebase:', questionId);
          return { id: docSnap.id, ...docSnap.data() } as UnansweredQuestion;
        }
      } catch (error) {
        console.error('❌ Firebase query failed for unanswered question:', error instanceof Error ? error.message : String(error));
      }
    }
    
    return mockQuestion || null;
  }
}; 