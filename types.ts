// User Authentication Types (simplified)
export interface User {
  id: string;
  phoneNumber?: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Bot Analytics Interface
export interface BotAnalytics {
  totalVisitors: number;
  totalChats: number;
  totalMessages: number;
  averageResponseTime: number;
  successfulResponses: number;
  failedQuestions: number;
  successRate: number;
  lastActiveAt?: Date;
  dailyVisitors: { date: string; count: number }[];
  weeklyChats: { week: string; count: number }[];
  topQuestions: { question: string; count: number }[];
  responseTimeHistory: { date: string; avgTime: number }[];
}

// Unanswered Question Interface
export interface UnansweredQuestion {
  id: string;
  botId: string;
  question: string;
  timestamp: Date;
  sessionId: string;
  isAnswered: boolean;
  creatorResponse?: string;
  respondedAt?: Date;
  userAgent?: string;
  ipAddress?: string;
  confidence?: number; // AI confidence when it failed to answer
  askedAt?: Date;
  answerCount?: number;
}

// Chat Analytics Interface
export interface ChatAnalytics {
  sessionId: string;
  botId: string;
  startedAt: Date;
  endedAt?: Date;
  messageCount: number;
  averageResponseTime: number;
  userSatisfaction?: number;
  failedQuestions: number;
  successfulResponses: number;
}

// Simplified Bot interface for V1
export interface Bot {
  id: string;
  name: string;
  description?: string;
  profilePictureUrl?: string;
  welcomeMessage?: string;
  ownerId: string;
  // Add phone number for cross-session identification
  ownerPhoneNumber?: string;
  status: 'training' | 'deployed';
  trainingMessages: TrainingMessage[];
  publicUrl: string; // e.g., /bot/xyz123
  createdAt: Date;
  updatedAt: Date;
  deployedAt?: Date;
  // Analytics data (computed from chat sessions)
  analytics?: BotAnalytics;
  // Unanswered questions (fetched separately)
  unansweredQuestions?: UnansweredQuestion[];
}

// New Training Data Structure
export interface TrainingEntry {
  id: string;
  type: "qa" | "context" | "image";
  
  // For Q&A entries
  question?: string;
  answer?: string;
  
  // For context entries
  contextBlock?: string;
  
  // For image entries
  imageUrl?: string;
  imageDescription?: string;
  imageAltText?: string;
  
  // Embedding and metadata
  embedding: number[]; // 1536-dimensional vector
  source: "user-input" | "file" | "web-paste" | "image-upload";
  keywords?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Legacy TrainingMessage interface (for backward compatibility)
export interface TrainingMessage {
  id: string;
  content: string;
  timestamp: Date;
  editedAt?: Date;
  keywords?: string[];
  summary?: string;
  category?: string;
  // Track if this was added from an unanswered question
  sourceType?: 'manual' | 'unanswered_question';
  sourceQuestionId?: string;
}

// Chat message interface for public bot chats
export interface ChatMessage {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  images?: {
    url: string;
    description: string;
    altText: string;
  }[];
  metadata?: {
    confidence?: number;
    responseTime?: number;
    wasAnswered?: boolean;
    usedTrainingIds?: string[];
  };
}

// Chat session for public bot conversations
export interface ChatSession {
  id: string;
  botId: string;
  botName: string; // Cache bot name for easier display
  botProfilePictureUrl?: string; // Cache bot profile picture
  messages: ChatMessage[];
  startedAt: Date;
  lastActivityAt: Date;
  userAgent?: string;
  ipAddress?: string;
  // User authentication
  userId?: string; // Firebase auth UID when user is logged in
  userPhoneNumber?: string; // User's phone number for identification
  isAuthenticated: boolean; // Whether this session is authenticated
  // Analytics data
  messageCount: number;
  averageResponseTime: number;
  failedQuestions: number;
  successfulResponses: number;
  isCompleted: boolean;
}

// API request/response types for bot operations
export interface CreateBotRequest {
  name: string;
  description?: string;
  profilePictureUrl?: string;
  welcomeMessage?: string;
  ownerId: string;
}

export interface CreateBotResponse extends ApiResponse {
  data?: {
    bot: Bot;
    redirectUrl: string;
  };
}

export interface TrainingMessageRequest {
  botId: string;
  content: string;
}

export interface UpdateTrainingMessageRequest {
  messageId: string;
  content: string;
}

export interface DeployBotRequest {
  botId: string;
}

// Chat API types for public bot conversations
export interface ChatWithBotRequest {
  botId: string;
  message: string;
  sessionId?: string;
  userContext?: any; // User location and time context
}

export interface ChatWithBotResponse extends ApiResponse {
  data?: {
    message: string;
    confidence: number;
    responseTime: number;
    sessionId: string;
    wasAnswered: boolean;
    images?: {
      url: string;
      description: string;
      altText: string;
    }[];
  };
}

// Unanswered Questions API types
export interface RespondToQuestionRequest {
  response: string;
}

export interface RespondToQuestionResponse extends ApiResponse {
  data?: {
    questionId: string;
    response: string;
    respondedAt: Date;
    addedToTraining: boolean;
  };
}

// User chat history interfaces
export interface UserChatSummary {
  sessionId: string;
  botId: string;
  botName: string;
  botProfilePictureUrl?: string;
  lastMessage: string;
  lastMessageTime: Date;
  messageCount: number;
  isActive: boolean; // Whether the conversation is ongoing
}

export interface GetUserChatsResponse extends ApiResponse {
  data?: UserChatSummary[];
}

export interface GetChatSessionResponse extends ApiResponse {
  data?: ChatSession;
}

// User Memory System Types
export interface UserMemory {
  id: string;
  userId: string; // Firebase UID or session ID for anonymous users
  botId: string; // Which bot this memory is for
  sessionId: string; // Which chat session this came from
  
  // Memory content
  memoryType: 'personal' | 'academic' | 'preference' | 'context' | 'fact';
  key: string; // e.g., "name", "department", "class", "favorite_food"
  value: string; // e.g., "John", "Computer Science", "CS101", "Pizza"
  confidence: number; // AI confidence in this information (0-1)
  
  // Metadata
  extractedFrom: string; // Original conversation snippet
  conversationContext: string; // Surrounding context
  isVerified: boolean; // Whether user confirmed this info
  importance: number; // How important this info is (1-10)
  
  // Timestamps
  firstMentioned: Date;
  lastUpdated: Date;
  lastUsed?: Date;
}

export interface UserMemoryContext {
  userId: string;
  botId: string;
  memories: UserMemory[];
  summary: string; // AI-generated summary of what we know about the user
  lastUpdated: Date;
}

// Memory extraction from conversations
export interface MemoryExtractionResult {
  extractedMemories: Partial<UserMemory>[];
  updatedMemories: UserMemory[];
  memoryContext: string; // Summary for AI prompt
}

// Generic API response type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
} 