import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/server';
import { serverDb } from '@/lib/database';
import { TrainingEntry } from '@/types';
import { nanoid } from 'nanoid';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TrainRequest {
  botId: string;
  entries: Array<{
    type: "qa" | "context";
    question?: string;
    answer?: string;
    contextBlock?: string;
  }>;
}

interface TrainResponse {
  success: boolean;
  savedCount: number;
  error?: string;
  timestamp: Date;
}

const handler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse<TrainResponse>
) => {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      savedCount: 0,
      error: 'Method not allowed',
      timestamp: new Date()
    });
  }

  try {
    const { botId, entries }: TrainRequest = req.body;

    // Validate botId
    if (!botId || typeof botId !== 'string') {
      return res.status(400).json({
        success: false,
        savedCount: 0,
        error: 'Bot ID is required',
        timestamp: new Date()
      });
    }

    // Validate entries
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        success: false,
        savedCount: 0,
        error: 'Entries array is required and must not be empty',
        timestamp: new Date()
      });
    }

    // Check bot ownership
    const bot = await serverDb.getBot(botId);
    if (!bot) {
      return res.status(404).json({
        success: false,
        savedCount: 0,
        error: 'Bot not found',
        timestamp: new Date()
      });
    }

    if (bot.ownerId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        savedCount: 0,
        error: 'Access denied: You do not own this bot',
        timestamp: new Date()
      });
    }

    let savedCount = 0;

    // Process each entry
    for (const entry of entries) {
      // Validate entry structure
      if (entry.type !== 'qa' && entry.type !== 'context') {
        console.warn(`Skipping invalid entry type: ${entry.type}`);
        continue;
      }

      if (entry.type === 'qa' && (!entry.question || !entry.answer)) {
        console.warn('Skipping Q&A entry with missing question or answer');
        continue;
      }

      if (entry.type === 'context' && !entry.contextBlock) {
        console.warn('Skipping context entry with missing contextBlock');
        continue;
      }

      try {
        // Build text to embed
        let textToEmbed: string;
        if (entry.type === 'qa') {
          textToEmbed = `${entry.question} ${entry.answer}`;
        } else {
          textToEmbed = entry.contextBlock!;
        }

        // Generate embedding
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: textToEmbed
        });

        const embedding = embeddingResponse.data[0].embedding;

        // Create training entry
        const trainingEntry: TrainingEntry = {
          id: nanoid(12),
          type: entry.type,
          question: entry.question,
          answer: entry.answer,
          contextBlock: entry.contextBlock,
          embedding,
          source: "user-input",
          keywords: [], // Will be populated later if needed
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Save to Firestore
        await serverDb.saveTrainingEntry(botId, trainingEntry);
        savedCount++;

        console.log(`✅ Saved training entry ${trainingEntry.id} for bot ${botId}`);

      } catch (error) {
        console.error(`Error processing training entry:`, error);
        // Continue with other entries even if one fails
      }
    }

    return res.status(200).json({
      success: true,
      savedCount,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error in training API:', error);
    return res.status(500).json({
      success: false,
      savedCount: 0,
      error: 'Internal server error',
      timestamp: new Date()
    });
  }
};

export default withAuth(handler); 