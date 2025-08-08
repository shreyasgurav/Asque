import OpenAI from 'openai';
import { UserMemory, MemoryExtractionResult } from '@/types';
import { nanoid } from 'nanoid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log('🔍 OpenAI client initialized:', {
  hasApiKey: !!process.env.OPENAI_API_KEY,
  apiKeyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0
});

// Input sanitization for user messages
export function sanitizeUserInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove any potentially harmful content
  const sanitized = input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, 2000); // Limit length
    
  return sanitized;
}

// Generate embedding for text using OpenAI
export async function getEmbedding(text: string): Promise<number[]> {
  try {
    console.log(`🔤 Generating embedding for: "${text ? text.substring(0, 50) : 'empty'}..."`);
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not found in environment');
      throw new Error('OpenAI API key not configured');
    }
    
    console.log('🔍 Creating OpenAI embedding...');
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text
    });
    console.log('✅ OpenAI embedding created successfully');
    
    const embedding = response.data[0].embedding;
    console.log(`✅ Generated embedding with ${embedding.length} dimensions`);
    
    return embedding;
  } catch (error) {
    console.error('❌ Error generating embedding:', error);
    throw error;
  }
}

// Calculate cosine similarity between two vectors
export function calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    normA += vec1[i] * vec1[i];
    normB += vec2[i] * vec2[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Search training entries using embeddings with fallback
export async function searchTrainingEntriesWithEmbeddings(
  userQuery: string, 
  trainingEntries: any[], 
  similarityThreshold: number = 0.5, // Lowered from 0.75
  maxResults: number = 5
): Promise<{ entries: any[], confidence: number }> {
  try {
    if (trainingEntries.length === 0) {
      return { entries: [], confidence: 0 };
    }

    // Generate embedding for user query
    console.log('🔍 Generating embedding for user query...');
    const queryEmbedding = await getEmbedding(userQuery);
    console.log('✅ Embedding generated successfully');

    // Calculate similarity for each training entry
    console.log('🔍 Calculating similarities...');
    const scoredEntries = trainingEntries.map(entry => {
      const similarity = calculateCosineSimilarity(queryEmbedding, entry.embedding);
      return { ...entry, similarity };
    });
    console.log('✅ Similarities calculated successfully');

    // Sort by similarity (highest first)
    scoredEntries.sort((a, b) => b.similarity - a.similarity);

    // Boost image entries for image-related queries
    const imageKeywords = ['menu', 'image', 'photo', 'picture', 'show', 'see', 'look', 'display'];
    const isImageQuery = imageKeywords.some(keyword => 
      userQuery.toLowerCase().includes(keyword.toLowerCase())
    );

    if (isImageQuery) {
      // Boost image entries by increasing their similarity score
      scoredEntries.forEach(entry => {
        if (entry.type === 'image') {
          entry.similarity += 0.1; // Boost image entries
        }
      });
      // Re-sort after boosting
      scoredEntries.sort((a, b) => b.similarity - a.similarity);
    }

    // Try with primary threshold first
    let relevantEntries = scoredEntries
      .filter(entry => entry.similarity >= similarityThreshold)
      .slice(0, maxResults);

    // Always include image entry for image-related queries
    const imageEntry = scoredEntries.find(entry => entry.type === 'image');
    if (isImageQuery && imageEntry && !relevantEntries.some(e => e.id === imageEntry.id)) {
      relevantEntries.unshift(imageEntry);
      relevantEntries = relevantEntries.slice(0, maxResults);
    }

    // If no results, try with lower threshold (fallback)
    if (relevantEntries.length === 0) {
      console.log(`🔍 No results with threshold ${similarityThreshold}, trying fallback...`);
      const fallbackThreshold = 0.4; // Higher fallback threshold
      relevantEntries = scoredEntries
        .filter(entry => entry.similarity >= fallbackThreshold)
        .slice(0, maxResults);
      
      if (relevantEntries.length > 0) {
        console.log(`✅ Found ${relevantEntries.length} entries with fallback threshold ${fallbackThreshold}`);
      }
    }

    // If still no results, don't return any entries (let the AI respond with "no information")
    if (relevantEntries.length === 0) {
      console.log(`🔍 No results with fallback, returning empty entries`);
    }

    // Calculate overall confidence based on top match
    const confidence = relevantEntries.length > 0 ? relevantEntries[0].similarity : 0;

    console.log(`📊 Search results: ${relevantEntries.length} entries, confidence: ${confidence.toFixed(3)}`);
    
    return { entries: relevantEntries, confidence };
  } catch (error) {
    console.error('Error searching training entries with embeddings:', error);
    return { entries: [], confidence: 0 };
  }
}

// Build system prompt for chat using training data
export function buildSystemPrompt(
  userMessage: string, 
  contextQA: { question: string; answer: string; type: string }[]
): string {
  if (contextQA.length === 0) {
    return `You are a helpful assistant. The user asked: "${userMessage}"

Unfortunately, I don't have specific information about this topic. Please respond politely that you don't have information about this right now.`;
  }

  const contextSection = contextQA.map((item, index) => {
    if (item.type === 'qa') {
      return `Q: ${item.question || ''}
A: ${item.answer || ''}`;
    } else {
      return `Information: ${item.answer || ''}`;
    }
  }).join('\n\n');

  return `You are a helpful assistant. Use the following information to answer user queries:

${contextSection}

Now answer this question:
"${userMessage}"

Provide a helpful, accurate response based on the information above. Be conversational and natural.`;
}

// Send prompt to OpenAI and get response
export async function sendToOpenAI(
  prompt: string, 
  userMessage: string,
  model: string = "gpt-3.5-turbo"
): Promise<string> {
  try {
    console.log('🔍 Creating OpenAI completion...');
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 300
    });
    console.log('✅ OpenAI completion created successfully');

    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error('❌ Error sending to OpenAI:', error);
    return "I'm sorry, I'm having trouble processing your request right now.";
  }
}

// Main chat function with embedding search
export async function handleChatWithEmbeddings(
  userMessage: string,
  botId: string,
  trainingEntries: any[],
  conversationHistory: any[] = [], // Add conversation history parameter
  userContext?: any, // Add user context for time/location awareness
  userMemoryContext?: string // Add user memory context
): Promise<{
  response: string;
  confidence: number;
  usedTrainingIds: string[];
  wasAnswered: boolean;
  images?: Array<{
    url: string;
    description: string;
    altText: string;
  }>;
}> {
  try {
    console.log(`🔍 Searching for: "${userMessage}"`);
    console.log(`📚 Training entries available: ${trainingEntries.length}`);
    console.log(`💬 Conversation history: ${conversationHistory.length} messages`);
    
    // Filter out entries without embeddings
    console.log('🔍 Checking training entries...');
    console.log(`📚 Total training entries: ${trainingEntries.length}`);
    
    const validEntries = trainingEntries.filter(entry => 
      entry.embedding && 
      Array.isArray(entry.embedding) && 
      entry.embedding.length > 0
    );
    
    console.log(`✅ Valid entries with embeddings: ${validEntries.length}`);
    console.log(`❌ Invalid entries: ${trainingEntries.length - validEntries.length}`);
    
    if (validEntries.length === 0) {
      console.log('❌ No valid training entries with embeddings found');
      return {
        response: "I'm still learning and don't have enough training data yet. Please add some training content first.",
        confidence: 0,
        usedTrainingIds: [],
        wasAnswered: false
      };
    }
    
    console.log(`✅ Found ${validEntries.length} valid training entries`);

    // Search for relevant training entries
    console.log('🔍 Calling searchTrainingEntriesWithEmbeddings...');
    const searchResult = await searchTrainingEntriesWithEmbeddings(userMessage, validEntries);
    console.log('✅ searchTrainingEntriesWithEmbeddings completed');
    
    if (searchResult.entries.length === 0) {
      console.log('❌ No relevant entries found in search');
      return {
        response: "I don't have specific information about that. Could you try asking something else or rephrase your question?",
        confidence: 0,
        usedTrainingIds: [],
        wasAnswered: false
      };
    }

    console.log(`✅ Found ${searchResult.entries.length} relevant entries`);
    console.log('🔍 Search result entries:', searchResult.entries.map(entry => ({
      id: entry.id,
      type: entry.type,
      similarity: entry.similarity,
      hasImage: !!entry.imageUrl
    })));

    // Build context from relevant entries
    const contextQA = searchResult.entries.map(entry => ({
      question: entry.question || '',
      answer: entry.answer || entry.content || entry.contextBlock || '',
      type: entry.type || 'qa',
      imageUrl: entry.imageUrl,
      imageDescription: entry.imageDescription
    }));

    // Build system prompt with conversation history, user context, and memory
    console.log('🔍 Building system prompt...');
    const systemPrompt = buildSystemPromptWithContext(userMessage, contextQA, conversationHistory, userContext, userMemoryContext);
    console.log('✅ System prompt built successfully');

    // Get response from OpenAI
    console.log('🔍 Sending to OpenAI...');
    const response = await sendToOpenAI(systemPrompt, userMessage);
    console.log('✅ OpenAI response received');

    // Get IDs of used training entries
    const usedTrainingIds = searchResult.entries.map(entry => entry.id);

    console.log(`✅ Generated response with confidence: ${searchResult.confidence.toFixed(3)}`);

    // Only set wasAnswered true if confidence is above threshold
    const MIN_CONFIDENCE_THRESHOLD = 0.6;
    const wasAnswered = searchResult.confidence >= MIN_CONFIDENCE_THRESHOLD;

    // Check if any relevant entries contain images
    const imageEntries = searchResult.entries.filter(entry => entry.type === 'image' && entry.imageUrl);
    
    // Only return the first (most relevant) image to avoid showing multiple similar images
    const firstImage = imageEntries.length > 0 ? {
      url: imageEntries[0].imageUrl,
      description: imageEntries[0].imageDescription || 'Image',
      altText: imageEntries[0].imageAltText || 'Image'
    } : null;
    
    const result = {
      response,
      confidence: searchResult.confidence,
      usedTrainingIds,
      wasAnswered,
      images: firstImage ? [firstImage] : []
    };
    
    return result;

  } catch (error) {
    console.error('Error in handleChatWithEmbeddings:', error);
    return {
      response: "I'm sorry, I encountered an error while processing your request. Please try again.",
      confidence: 0,
      usedTrainingIds: [],
      wasAnswered: false,
      images: []
    };
  }
}

// New function to build system prompt with conversation history, user context, and memory
export function buildSystemPromptWithContext(
  userMessage: string, 
  contextQA: { question: string; answer: string; type: string; imageUrl?: string; imageDescription?: string }[],
  conversationHistory: any[] = [],
  userContext?: any,
  userMemoryContext?: string
): string {
  if (contextQA.length === 0) {
    return `You are a helpful assistant. The user asked: "${userMessage}"

Unfortunately, I don't have specific information about this topic. Please respond politely that you don't have information about this right now.`;
  }

  const contextSection = contextQA.map((item, index) => {
    if (item.type === 'qa') {
      return `Q: ${item.question || ''}
A: ${item.answer || ''}`;
    } else if (item.type === 'image') {
      return `Image Information: ${item.imageDescription || 'An image'}
Note: This is an image that should be displayed to the user when relevant.`;
    } else {
      return `Information: ${item.answer || ''}`;
    }
  }).join('\n\n');

  // Build conversation history section
  let conversationSection = '';
  if (conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-6); // Last 6 messages (3 exchanges)
    conversationSection = `\n\nPrevious conversation:
${recentHistory.map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}`;
  }

  // Build user context section
  let userContextSection = '';
  if (userContext) {
    const { location, time } = userContext;
    const currentTime = new Date(time.currentTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: time.timezone
    });
    
    userContextSection = `\n\nCurrent Context:
- Location: ${location.city}, ${location.country}
- Time: ${currentTime} (${time.timezone})
- Day: ${time.dayOfWeek}
- Meal Time: ${time.mealTime || 'not specified'}
- Time of Day: ${time.isDaytime ? 'daytime' : 'nighttime'}`;
  }

  return `You are a helpful assistant. Use the following information to answer user queries:

${contextSection}${conversationSection}${userContextSection}${userMemoryContext || ''}

Now answer this question:
"${userMessage}"

Provide a helpful, accurate response based on the information above. Be conversational and natural. If the user is asking a follow-up question, make sure to reference the context from the previous conversation. Use the current time and location context to provide relevant responses when appropriate. Use what you know about the user to personalize your response (e.g., if you know their name, department, class, etc.).

IMPORTANT: If there are images in the context that are relevant to the user's question, mention them naturally in your response (e.g., "Here's the mess menu" or "I can show you the timetable"), but DO NOT include any URLs or technical image references in your text response. The system will automatically display the images when appropriate.`;
}

// Extract keywords and context from training message
export async function enhanceTrainingMessage(content: string, botName: string): Promise<{
  keywords: string[];
  summary: string;
  category: string;
}> {
  try {
    const prompt = `Analyze this training message for a bot named "${botName}":

"${content}"

Extract:
1. Important keywords (3-5 words that would help find this info later)
2. A brief summary (1 sentence)
3. A category (like "hours", "contact", "rules", "services", "location", etc.)

Respond in JSON format:
{
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "summary": "Brief summary here",
  "category": "category_name"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 120
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      keywords: result.keywords || [],
      summary: result.summary || (content ? content.substring(0, 100) + '...' : 'No content'),
      category: result.category || 'general'
    };
  } catch (error) {
    console.error('Error enhancing training message:', error);
    // Fallback to simple extraction
    const words = content.toLowerCase().split(/\s+/);
    const keywords = words.filter(word => word.length > 3).slice(0, 5);
    return {
      keywords,
      summary: content ? content.substring(0, 100) + '...' : 'No content',
      category: 'general'
    };
  }
}

// Generate bot response during training
export async function generateTrainingResponse(content: string, botName: string, existingMessages: any[]): Promise<string> {
  try {
    const context = existingMessages.slice(-3).map(msg => msg.content).join('\n');
    
    const prompt = `You are ${botName} learning. User taught: "${content}"

Previous: ${context}

Respond showing you learned this. Be specific and under 40 words. Examples:
- "Got it! I'll remember [detail]"
- "Perfect! I'll tell people [key info]"
- "Understood! Noted [fact]"`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", 
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 80
    });

    return response.choices[0].message.content || "Thanks for teaching me that! I'll remember it.";
  } catch (error) {
    console.error('Error generating training response:', error);
    return "Thanks for teaching me that! I'll remember it for when people ask questions.";
  }
}

// Generate AI response using OpenAI with relevant training context
export async function generateBotResponse(userQuery: string, botName: string, botDescription: string, relevantMessages: any[]): Promise<string> {
  try {
    if (relevantMessages.length === 0) {
      return `I'm sorry, I don't have information about that. I'm ${botName} and I'm here to help with specific topics I've been trained on. Could you try asking about something else?`;
    }
    
    const context = relevantMessages.map(msg => msg.content).join('\n\n');
    
    const prompt = `You are ${botName}${botDescription ? `, ${botDescription}` : ''}. 

User: "${userQuery}"

Training data:
${context}

Respond helpfully using this information. Be conversational as ${botName}. Keep under 100 words.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5, // Lower temperature for more consistent responses
      max_tokens: 150 // Reduced tokens for faster responses
    });

    return response.choices[0].message.content || "I'm here to help! Could you please rephrase your question?";
  } catch (error) {
    console.error('Error generating bot response:', error);
    return `I'm ${botName} and I'd love to help, but I'm having trouble processing your request right now. Please try again!`;
  }
}

// New function to search training entries using embeddings
export async function searchTrainingEntries(userQuery: string, trainingEntries: any[]): Promise<any[]> {
  try {
    if (trainingEntries.length === 0) {
      return [];
    }

    // Generate embedding for user query
    const queryEmbedding = await getEmbedding(userQuery);

    // Calculate cosine similarity for each training entry
    const scoredEntries = trainingEntries.map(entry => {
      const similarity = calculateCosineSimilarity(queryEmbedding, entry.embedding);
      return { ...entry, similarity };
    });

    // Return top 3 most similar entries
    return scoredEntries
      .filter(entry => entry.similarity > 0.3) // Only return entries with decent similarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

  } catch (error) {
    console.error('Error searching training entries:', error);
    return [];
  }
}

// Extract user memories from conversation
export async function extractUserMemories(
  userMessage: string,
  botResponse: string,
  conversationHistory: any[],
  userId: string,
  botId: string,
  sessionId: string,
  existingMemories: UserMemory[] = []
): Promise<MemoryExtractionResult> {
  try {
    // Build context from recent conversation
    const recentMessages = conversationHistory.slice(-4); // Last 4 messages for context
    const conversationContext = recentMessages
      .map(msg => `${msg.type === 'user' ? 'User' : 'Bot'}: ${msg.content}`)
      .join('\n');

    // Build existing memories context
    const existingMemoriesContext = existingMemories.length > 0
      ? `\n\nExisting memories about this user:\n${existingMemories.map(m => `${m.key}: ${m.value}`).join('\n')}`
      : '';

    const prompt = `Analyze this conversation and extract important user information that should be remembered:

Recent conversation:
${conversationContext}
User: ${userMessage}
Bot: ${botResponse}${existingMemoriesContext}

Extract key information about the user that should be remembered for future conversations. Focus on:
1. Personal info (name, age, location)
2. Academic info (university, department, class, year, roll number)
3. Preferences (likes, dislikes, habits)
4. Important context (current situation, goals, needs)
5. Facts they mention about themselves

For each piece of information, determine:
- Type: personal/academic/preference/context/fact
- Importance: 1-10 (how useful for future conversations)
- Confidence: 0.1-1.0 (how sure you are this is correct)

Respond in JSON format:
{
  "extractedMemories": [
    {
      "key": "name",
      "value": "John",
      "memoryType": "personal",
      "importance": 9,
      "confidence": 0.95,
      "extractedFrom": "Hi, I'm John from CS department"
    }
  ],
  "memoryContext": "Brief summary of what we learned about the user"
}

Only extract information that is clearly stated or strongly implied. Don't make assumptions.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2, // Low temperature for consistent extraction
      max_tokens: 500
    });

    const result = JSON.parse(response.choices[0].message.content || '{"extractedMemories": [], "memoryContext": ""}');
    
    // Create full UserMemory objects
    const extractedMemories: UserMemory[] = result.extractedMemories.map((memory: any) => ({
      id: `memory_${nanoid(12)}`,
      userId,
      botId,
      sessionId,
      memoryType: memory.memoryType,
      key: memory.key,
      value: memory.value,
      confidence: memory.confidence,
      extractedFrom: memory.extractedFrom || userMessage,
      conversationContext: conversationContext,
      isVerified: false,
      importance: memory.importance,
      firstMentioned: new Date(),
      lastUpdated: new Date()
    }));

    // Check for updates to existing memories
    const updatedMemories: UserMemory[] = [];
    for (const newMemory of extractedMemories) {
      const existing = existingMemories.find(m => m.key === newMemory.key);
      if (existing) {
        // Update existing memory if new info is more confident or recent
        if (newMemory.confidence > existing.confidence) {
          existing.value = newMemory.value;
          existing.confidence = newMemory.confidence;
          existing.lastUpdated = new Date();
          existing.extractedFrom = newMemory.extractedFrom;
          updatedMemories.push(existing);
        }
      }
    }

    return {
      extractedMemories: extractedMemories.filter(memory => 
        !existingMemories.find(existing => existing.key === memory.key)
      ),
      updatedMemories,
      memoryContext: result.memoryContext || ''
    };

  } catch (error) {
    console.error('Error extracting user memories:', error);
    return {
      extractedMemories: [],
      updatedMemories: [],
      memoryContext: ''
    };
  }
}

// Build memory context for AI responses
export function buildMemoryContext(memories: UserMemory[]): string {
  if (memories.length === 0) return '';

  const categorizedMemories = {
    personal: memories.filter(m => m.memoryType === 'personal'),
    academic: memories.filter(m => m.memoryType === 'academic'),
    preference: memories.filter(m => m.memoryType === 'preference'),
    context: memories.filter(m => m.memoryType === 'context'),
    fact: memories.filter(m => m.memoryType === 'fact')
  };

  let memoryContext = '\n\nWhat I know about this user:';
  
  if (categorizedMemories.personal.length > 0) {
    memoryContext += '\nPersonal: ' + categorizedMemories.personal.map(m => `${m.key}: ${m.value}`).join(', ');
  }
  
  if (categorizedMemories.academic.length > 0) {
    memoryContext += '\nAcademic: ' + categorizedMemories.academic.map(m => `${m.key}: ${m.value}`).join(', ');
  }
  
  if (categorizedMemories.preference.length > 0) {
    memoryContext += '\nPreferences: ' + categorizedMemories.preference.map(m => `${m.key}: ${m.value}`).join(', ');
  }
  
  if (categorizedMemories.context.length > 0) {
    memoryContext += '\nContext: ' + categorizedMemories.context.map(m => `${m.key}: ${m.value}`).join(', ');
  }
  
  if (categorizedMemories.fact.length > 0) {
    memoryContext += '\nFacts: ' + categorizedMemories.fact.map(m => `${m.key}: ${m.value}`).join(', ');
  }

  return memoryContext;
} 