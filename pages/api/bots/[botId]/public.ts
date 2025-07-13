import { NextApiRequest, NextApiResponse } from 'next';
import { Bot, ApiResponse } from '@/types';
import { serverDb } from '@/lib/database';

interface PublicBotResponse extends ApiResponse {
  data?: Bot;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicBotResponse>
) {
  const { botId } = req.query;
  
  if (typeof botId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid bot ID',
      timestamp: new Date()
    });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date()
    });
  }

  try {
    console.log(`🌍 Public bot API called for: ${botId}`);
    
    const bot = await serverDb.getBot(botId);
    
    if (!bot) {
      console.log('❌ Bot not found for public access:', botId);
      return res.status(404).json({
        success: false,
        error: 'Bot not found',
        timestamp: new Date()
      });
    }

    // Only return deployed bots for public access
    if (bot.status !== 'deployed') {
      console.log('❌ Bot not deployed for public access:', botId);
      return res.status(404).json({
        success: false,
        error: 'Bot not available for public access',
        timestamp: new Date()
      });
    }

    console.log('✅ Public bot details fetched successfully:', botId);
    
    // Return bot data without sensitive information
    const publicBot: Bot = {
      ...bot,
      // Don't expose owner information in public API
      ownerId: 'hidden'
    };

    return res.status(200).json({
      success: true,
      data: publicBot,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('💥 Error fetching public bot:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date()
    });
  }
} 