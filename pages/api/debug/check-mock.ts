import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface DebugResponse {
  success: boolean;
  data: {
    mockDatabaseExists: boolean;
    botsCount: number;
    bots: any[];
    filePath: string;
  };
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<DebugResponse>
) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      success: false,
      data: {
        mockDatabaseExists: false,
        botsCount: 0,
        bots: [],
        filePath: ''
      }
    });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      data: {
        mockDatabaseExists: false,
        botsCount: 0,
        bots: [],
        filePath: ''
      }
    });
  }

  try {
    const DEV_DATA_DIR = path.join(process.cwd(), '.dev-data');
    const BOTS_FILE = path.join(DEV_DATA_DIR, 'bots.json');
    
    const mockDatabaseExists = fs.existsSync(BOTS_FILE);
    let botsCount = 0;
    let bots: any[] = [];
    
    if (mockDatabaseExists) {
      try {
        const botsData = JSON.parse(fs.readFileSync(BOTS_FILE, 'utf-8'));
        botsCount = Object.keys(botsData).length;
        bots = Object.values(botsData);
        
        console.log('🔍 Mock database check:');
        console.log('📊 Bots count:', botsCount);
        console.log('📋 Bot IDs:', Object.keys(botsData));
        
        bots.forEach((bot, index) => {
          console.log(`🤖 Bot ${index + 1}: ${bot.name} (${bot.id}) - Owner: ${bot.ownerId}`);
        });
        
      } catch (error) {
        console.error('❌ Error reading mock database:', error);
      }
    } else {
      console.log('❌ Mock database file not found');
    }

    return res.status(200).json({
      success: true,
      data: {
        mockDatabaseExists,
        botsCount,
        bots,
        filePath: BOTS_FILE
      }
    });

  } catch (error) {
    console.error('Error checking mock database:', error);
    return res.status(500).json({
      success: false,
      data: {
        mockDatabaseExists: false,
        botsCount: 0,
        bots: [],
        filePath: ''
      }
    });
  }
} 