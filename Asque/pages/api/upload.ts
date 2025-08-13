import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth/server';
import { AuthenticatedRequest } from '@/lib/auth/server';

interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
  timestamp: Date;
}

// In production, you'd use a proper file storage service like AWS S3, Cloudinary, etc.
// For now, we'll simulate the upload and return a placeholder URL
const handleUpload = async (
  req: AuthenticatedRequest,
  res: NextApiResponse<UploadResponse>
) => {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date()
    });
  }

  try {
    // In a real implementation, you would:
    // 1. Parse the multipart form data
    // 2. Validate the file
    // 3. Upload to your storage service (S3, Cloudinary, etc.)
    // 4. Return the public URL

    // For development, we'll use placeholder images from a reliable service
    // In production, replace this with actual file upload logic
    
    // Generate a consistent avatar based on user ID or timestamp
    const avatarId = Math.floor(Math.random() * 70) + 1; // 1-70 for variety
    const mockUploadUrl = `https://i.pravatar.cc/150?img=${avatarId}`;
    
    console.log('📤 Profile picture placeholder generated:', mockUploadUrl);
    
    return res.status(200).json({
      success: true,
      url: mockUploadUrl,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload file',
      timestamp: new Date()
    });
  }
};

export default withAuth(handleUpload);

// Disable body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
}; 