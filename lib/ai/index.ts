import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
    
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text
    });
    
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
    const queryEmbedding = await getEmbedding(userQuery);

    // Calculate similarity for each training entry
    const scoredEntries = trainingEntries.map(entry => {
      const similarity = calculateCosineSimilarity(queryEmbedding, entry.embedding);
      return { ...entry, similarity };
    });

    // Sort by similarity (highest first)
    scoredEntries.sort((a, b) => b.similarity - a.similarity);

    // Try with primary threshold first
    let relevantEntries = scoredEntries
      .filter(entry => entry.similarity >= similarityThreshold)
      .slice(0, maxResults);

    // If no results, try with lower threshold (fallback)
    if (relevantEntries.length === 0) {
      console.log(`🔍 No results with threshold ${similarityThreshold}, trying fallback...`);
      const fallbackThreshold = 0.3; // Much lower threshold
      relevantEntries = scoredEntries
        .filter(entry => entry.similarity >= fallbackThreshold)
        .slice(0, maxResults);
      
      if (relevantEntries.length > 0) {
        console.log(`✅ Found ${relevantEntries.length} entries with fallback threshold ${fallbackThreshold}`);
      }
    }

    // If still no results, take top 2 entries regardless of threshold
    if (relevantEntries.length === 0) {
      console.log(`🔍 No results with fallback, taking top entries...`);
      relevantEntries = scoredEntries.slice(0, 2);
      if (relevantEntries.length > 0) {
        console.log(`✅ Using top ${relevantEntries.length} entries with lower confidence`);
      }
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
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error('Error sending to OpenAI:', error);
    return "I'm sorry, I'm having trouble processing your request right now.";
  }
}

// Main chat function with embedding search
export async function handleChatWithEmbeddings(
  userMessage: string,
  botId: string,
  trainingEntries: any[]
): Promise<{
  response: string;
  confidence: number;
  usedTrainingIds: string[];
  wasAnswered: boolean;
}> {
  try {
    console.log(`🔍 Searching for: "${userMessage}"`);
    console.log(`📚 Training entries available: ${trainingEntries.length}`);
    
    // Filter out entries without embeddings
    const validEntries = trainingEntries.filter(entry => 
      entry.embedding && 
      Array.isArray(entry.embedding) && 
      entry.embedding.length > 0
    );
    
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
    const searchResult = await searchTrainingEntriesWithEmbeddings(userMessage, validEntries);
    
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

    // Build context from relevant entries
    const contextQA = searchResult.entries.map(entry => ({
      question: entry.question || '',
      answer: entry.answer || entry.content || entry.contextBlock || '',
      type: entry.type || 'qa'
    }));

    // Build system prompt
    const systemPrompt = buildSystemPrompt(userMessage, contextQA);

    // Get response from OpenAI
    const response = await sendToOpenAI(systemPrompt, userMessage);

    // Get IDs of used training entries
    const usedTrainingIds = searchResult.entries.map(entry => entry.id);

    console.log(`✅ Generated response with confidence: ${searchResult.confidence.toFixed(3)}`);

    // Only set wasAnswered true if confidence is above threshold
    const MIN_CONFIDENCE_THRESHOLD = 0.6;
    const wasAnswered = searchResult.confidence >= MIN_CONFIDENCE_THRESHOLD;

    return {
      response,
      confidence: searchResult.confidence,
      usedTrainingIds,
      wasAnswered
    };

  } catch (error) {
    console.error('Error in handleChatWithEmbeddings:', error);
    return {
      response: "I'm sorry, I encountered an error while processing your request. Please try again.",
      confidence: 0,
      usedTrainingIds: [],
      wasAnswered: false
    };
  }
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