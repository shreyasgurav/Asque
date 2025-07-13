import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/server';

interface DebugResponse {
  success: boolean;
  data?: {
    uid: string;
    phoneNumber?: string;
    email?: string;
  };
  error?: string;
  timestamp: Date;
}

const handler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse<DebugResponse>
) => {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date()
    });
  }

  try {
    console.log('🔍 Debug user info requested');
    console.log('  User UID:', req.user.uid);
    console.log('  User Phone:', req.user.phoneNumber);
    console.log('  User Email:', req.user.email);

    return res.status(200).json({
      success: true,
      data: {
        uid: req.user.uid,
        phoneNumber: req.user.phoneNumber,
        email: req.user.email
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('❌ Error in debug endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date()
    });
  }
};

export default withAuth(handler); 