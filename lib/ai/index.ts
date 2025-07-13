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
      summary: result.summary || content.substring(0, 100) + '...',
      category: result.category || 'general'
    };
  } catch (error) {
    console.error('Error enhancing training message:', error);
    // Fallback to simple extraction
    const words = content.toLowerCase().split(/\s+/);
    const keywords = words.filter(word => word.length > 3).slice(0, 5);
    return {
      keywords,
      summary: content.substring(0, 100) + '...',
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