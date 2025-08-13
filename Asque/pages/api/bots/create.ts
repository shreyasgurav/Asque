import { NextApiResponse } from 'next';
import { nanoid } from 'nanoid';
import { CreateBotRequest, CreateBotResponse, Bot } from '@/types';
import { serverDb } from '@/lib/database';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/server';
import { withRateLimit, apiLimiter } from '@/lib/rate-limit';
import { validateBotCreation } from '@/lib/validation';

const handler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse<CreateBotResponse>
) => {
  console.log('🤖 Bot creation API called');
  console.log('Method:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date()
    });
  }

  try {
    const { name, description, profilePictureUrl, welcomeMessage }: CreateBotRequest = req.body;
    const ownerId = req.user.uid;
    const ownerPhoneNumber = req.user.phoneNumber;

    console.log('📝 Validating input...');
    console.log('👤 Authenticated user:', req.user.uid);
    console.log('📱 User phone number:', req.user.phoneNumber);

    // Validate input using the validation utility
    const validation = validateBotCreation({
      name,
      description,
      welcomeMessage,
      profilePictureUrl
    });

    if (!validation.isValid) {
      console.log('❌ Validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        error: validation.errors.join(', '),
        timestamp: new Date()
      });
    }

    console.log('✅ Validation passed');

    // Generate unique bot ID
    const botId = `bot_${nanoid(12)}`;
    const publicUrl = `/bot/${botId}`;
    
    const now = new Date();
    
    console.log('🆔 Generated bot ID:', botId);
    
    // Create bot object with sanitized values
    const newBot: Bot = {
      id: botId,
      name: validation.sanitizedValue || name.trim(),
      description: description?.trim() || '',
      profilePictureUrl: profilePictureUrl || undefined,
      welcomeMessage: welcomeMessage?.trim() || undefined,
      ownerId,
      ownerPhoneNumber: ownerPhoneNumber || undefined,
      status: 'training',
      trainingMessages: [],
      publicUrl,
      createdAt: now,
      updatedAt: now
    };

    console.log('📦 Created bot object:', newBot);

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
    
    // More specific error messages based on error type
    let errorMessage = 'Failed to create bot';
    
    if (error instanceof Error) {
      if (error.message?.includes('Firebase') || error.message?.includes('database')) {
        errorMessage = 'Database connection issue. Please try again in a moment.';
      } else if (error.message?.includes('validation')) {
        errorMessage = 'Invalid bot information provided. Please check your input and try again.';
      } else if (error.message?.includes('authentication')) {
        errorMessage = 'Authentication error. Please log in again and try creating the bot.';
      } else if (error.message?.includes('rate limit')) {
        errorMessage = 'Too many requests. Please wait a moment before creating another bot.';
      }
    }
    
    return res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: new Date()
    });
  }
};

// Export with rate limiting
export default withRateLimit(apiLimiter, withAuth(handler)); 