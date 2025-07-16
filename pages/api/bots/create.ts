import { NextApiResponse } from 'next';
import { nanoid } from 'nanoid';
import { CreateBotRequest, CreateBotResponse, Bot } from '@/types';
import { serverDb } from '@/lib/database';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/server';

const handler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse<CreateBotResponse>
) => {
  console.log('🤖 Bot creation API called');
  console.log('Method:', req.method);
  console.log('Body:', JSON.stringify(req.body, null, 2));

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date()
    });
  }

  try {
    const { name, description, profilePictureUrl, welcomeMessage }: CreateBotRequest = req.body;
    const ownerId = req.user.uid; // Get owner ID from authenticated user
    const ownerPhoneNumber = req.user.phoneNumber; // Get phone number for cross-session identification

    console.log('📝 Validating input...');
    console.log('👤 Authenticated user:', req.user.uid);
    console.log('📱 User phone number:', req.user.phoneNumber);

    // Validate input
    if (!name || !name.trim()) {
      console.log('❌ Validation failed: Bot name is required');
      return res.status(400).json({
        success: false,
        error: 'Bot name is required',
        timestamp: new Date()
      });
    }

    console.log('✅ Validation passed');

    // Generate unique bot ID
    const botId = `bot_${nanoid(12)}`;
    const publicUrl = `/bot/${botId}`;
    
    const now = new Date();
    
    console.log('🆔 Generated bot ID:', botId);
    
    // Create bot object
    const newBot: Bot = {
      id: botId,
      name: name.trim(),
      description: description?.trim() || '', // Ensure it's never undefined
      profilePictureUrl: profilePictureUrl || undefined,
      welcomeMessage: welcomeMessage?.trim() || undefined,
      ownerId,
      ownerPhoneNumber: ownerPhoneNumber || undefined,
      status: 'deployed', // CHANGED: Make bot public by default
      trainingMessages: [],
      publicUrl,
      createdAt: now,
      updatedAt: now
    };
    console.log('📦 Created bot object (should be deployed):', newBot);
    console.log('🔍 Debug - Full bot object:', JSON.stringify(newBot, null, 2));

    // Save to database
    console.log('💾 Saving bot to database...');
    const savedBot = await serverDb.createBot(newBot);
    console.log('✅ Bot saved successfully!');

    const response = {
      success: true,
      data: {
        bot: savedBot,
        redirectUrl: `/bot/${botId}/train`
      },
      timestamp: new Date()
    };

    console.log('📤 Sending response:', {
      success: response.success,
      botId: response.data.bot.id,
      redirectUrl: response.data.redirectUrl
    });

    return res.status(201).json(response);

  } catch (error) {
    console.error('💥 Error creating bot:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date()
    });
  }
};

export default withAuth(handler); 