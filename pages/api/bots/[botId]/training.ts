import { NextApiResponse } from 'next';
import { nanoid } from 'nanoid';
import { Bot, TrainingEntry, ApiResponse } from '@/types';
import { serverDb } from '@/lib/database';
import { enhanceTrainingMessage, generateTrainingResponse } from '@/lib/ai';
import { withBotOwnership, AuthenticatedRequest } from '@/lib/auth/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TrainingResponse extends ApiResponse {
  data?: Bot;
  botResponse?: string;
  savedCount?: number;
}

const handler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse<TrainingResponse>
) => {
  const { botId } = req.query;

  if (!botId || typeof botId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Bot ID is required',
      timestamp: new Date()
    });
  }

  if (req.method === 'POST') {
    try {
      const { content, type } = req.body;

      console.log('🎓 Training request from user:', req.user.uid, 'for bot:', botId);

      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Training content is required',
          timestamp: new Date()
        });
      }

      const bot = await serverDb.getBot(botId);
      
      if (!bot) {
        return res.status(404).json({
          success: false,
          error: 'Bot not found',
          timestamp: new Date()
        });
      }

      // Check ownership
      console.log('🔍 Training ownership check:');
      console.log('  Bot ownerId:', bot.ownerId);
      console.log('  User uid:', req.user.uid);
      console.log('  User phone:', req.user.phoneNumber);
      
      if (bot.ownerId !== req.user.uid) {
        // Try fallback with phone number
        if (req.user.phoneNumber && bot.ownerPhoneNumber === req.user.phoneNumber) {
          console.log('✅ Training access granted via phone number fallback');
          // Update the bot's ownerId to the current user ID for future consistency
          bot.ownerId = req.user.uid;
          await serverDb.updateBot(bot);
        } else {
          console.log('❌ Training access denied: User does not own this bot');
          console.log('  Bot ownerPhoneNumber:', bot.ownerPhoneNumber);
          return res.status(403).json({
            success: false,
            error: 'Access denied: You do not own this bot',
            timestamp: new Date()
          });
        }
      }

      // Handle image training
      if (type === 'image') {
        try {
          let imageData;
          try {
            imageData = JSON.parse(content);
          } catch (e) {
            return res.status(400).json({
              success: false,
              error: 'Invalid image data format',
              timestamp: new Date()
            });
          }

          // Generate embedding for the image description
          const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: imageData.imageDescription || imageData.content || 'Image'
          });

          const embedding = embeddingResponse.data[0].embedding;

          // Create image training entry
          const trainingEntry: TrainingEntry = {
            id: nanoid(12),
            type: "image",
            imageUrl: imageData.imageUrl,
            imageDescription: imageData.imageDescription,
            imageAltText: imageData.imageAltText || imageData.imageDescription,
            embedding,
            source: "image-upload",
            keywords: [imageData.imageDescription || 'image'],
            createdAt: new Date(),
            updatedAt: new Date()
          };

          // Save to Firestore
          await serverDb.saveTrainingEntry(botId, trainingEntry);

          console.log(`✅ Saved image training entry ${trainingEntry.id} for bot ${botId}`);

          return res.status(200).json({
            success: true,
            savedCount: 1,
            timestamp: new Date()
          });

        } catch (error) {
          console.error('Error processing image training entry:', error);
          return res.status(500).json({
            success: false,
            error: 'Failed to process image training entry',
            timestamp: new Date()
          });
        }
      }

      // Handle text training (existing logic)
      // Enhance the training message with AI
      const enhancement = await enhanceTrainingMessage(content.trim(), bot.name);
      
      // Generate bot response
      const botResponse = await generateTrainingResponse(content.trim(), bot.name, bot.trainingMessages);

      // Parse content into Q&A pairs and context blocks
      const { qaPairs, contextBlocks } = parseContentToTrainingEntries(content.trim());
      
      let savedCount = 0;

      // Process each Q&A pair
      for (const qaPair of qaPairs) {
        try {
          // Generate embedding for the Q&A pair
          const textToEmbed = `${qaPair.question} ${qaPair.answer}`;
          const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: textToEmbed
          });

          const embedding = embeddingResponse.data[0].embedding;

          // Create training entry
          const trainingEntry: TrainingEntry = {
            id: nanoid(12),
            type: "qa",
            question: qaPair.question,
            answer: qaPair.answer,
            embedding,
            source: "user-input",
            keywords: enhancement.keywords,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          // Save to Firestore under /bots/{botId}/trainingMessages/{messageId}
          await serverDb.saveTrainingEntry(botId, trainingEntry);
          savedCount++;

          console.log(`✅ Saved Q&A training entry ${trainingEntry.id} for bot ${botId}`);

        } catch (error) {
          console.error(`Error processing Q&A training entry:`, error);
          // Continue with other entries even if one fails
        }
      }

      // Process each context block
      for (const contextBlock of contextBlocks) {
        try {
          // Generate embedding for the context block
          const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: contextBlock
          });

          const embedding = embeddingResponse.data[0].embedding;

          // Create training entry
          const trainingEntry: TrainingEntry = {
            id: nanoid(12),
            type: "context",
            contextBlock,
            embedding,
            source: "user-input",
            keywords: enhancement.keywords,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          // Save to Firestore under /bots/{botId}/trainingMessages/{messageId}
          await serverDb.saveTrainingEntry(botId, trainingEntry);
          savedCount++;

          console.log(`✅ Saved context training entry ${trainingEntry.id} for bot ${botId}`);

        } catch (error) {
          console.error(`Error processing context training entry:`, error);
          // Continue with other entries even if one fails
        }
      }

      return res.status(200).json({
        success: true,
        botResponse,
        savedCount,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error adding training message:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
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

// Helper function to parse content into Q&A pairs and context blocks
function parseContentToTrainingEntries(content: string): { 
  qaPairs: Array<{ question: string; answer: string }>;
  contextBlocks: string[];
} {
  const qaPairs: Array<{ question: string; answer: string }> = [];
  const contextBlocks: string[] = [];
  
  // Split by sections (lines starting with 🎂, 🎉, etc.)
  const sections = content.split(/\n(?=🎂|🎉|🧁|🚚|💸|🧁)/);
  
  for (const section of sections) {
    if (!section.trim()) continue;
    
    // For each section, find all Q&A pairs using regex
    const qaRegex = /Q:\s*([^?]+\?)\s*A:\s*([^Q]+?)(?=\s*Q:|$)/g;
    let match;
    let sectionHasQA = false;
    
    while ((match = qaRegex.exec(section)) !== null) {
      const question = match[1].trim();
      const answer = match[2].trim();
      qaPairs.push({ question, answer });
      sectionHasQA = true;
    }
    
    // If no Q&A pairs found in this section, treat the entire section as a context block
    if (!sectionHasQA) {
      const trimmedSection = section.trim();
      if (trimmedSection && trimmedSection.length > 10) { // Only add if substantial content
        contextBlocks.push(trimmedSection);
      }
    }
  }
  
  // Also check for any paragraphs that don't follow Q&A pattern
  const lines = content.split('\n');
  let currentParagraph = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines and section headers
    if (!trimmedLine || trimmedLine.match(/^[🎂🎉🧁🚚💸🧁]/)) {
      if (currentParagraph.trim() && currentParagraph.trim().length > 10) {
        contextBlocks.push(currentParagraph.trim());
      }
      currentParagraph = '';
      continue;
    }
    
    // If line doesn't start with Q: or A:, it's part of a paragraph
    if (!trimmedLine.startsWith('Q:') && !trimmedLine.startsWith('A:')) {
      currentParagraph += (currentParagraph ? '\n' : '') + trimmedLine;
    }
  }
  
  // Add the last paragraph if it exists
  if (currentParagraph.trim() && currentParagraph.trim().length > 10) {
    contextBlocks.push(currentParagraph.trim());
  }
  
  return { qaPairs, contextBlocks };
}

export default withBotOwnership(handler); 