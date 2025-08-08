import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/server';
import { serverDb } from '@/lib/database';
import { adminStorage } from '@/lib/firebase-admin';

// Configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

const handler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse
) => {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date()
    });
  }

  try {
    console.log('🔍 Upload request received:', {
      method: req.method,
      hasUser: !!req.user,
      bodyKeys: Object.keys(req.body || {}),
      contentType: req.headers['content-type']
    });

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date()
      });
    }

    // Handle file upload using formidable or similar
    // For now, we'll use a simple approach with base64 encoding
    const { imageData, fileName, fileType } = req.body;

    if (!imageData || !fileName || !fileType) {
      console.log('❌ Missing required fields:', { imageData: !!imageData, fileName: !!fileName, fileType: !!fileType });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: imageData, fileName, fileType',
        timestamp: new Date()
      });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(fileType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
        timestamp: new Date()
      });
    }

    // Validate file size (rough estimate for base64)
    const base64Size = imageData.length * 0.75; // Base64 is ~33% larger
    if (base64Size > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 5MB.',
        timestamp: new Date()
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `image_${timestamp}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;

    // Upload to Firebase Storage
    if (!adminStorage) {
      console.error('❌ Firebase Storage not initialized');
      console.log('🔍 Environment check:', {
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        hasStorageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      });
      
      // Return error when Firebase Storage is not configured
      return res.status(500).json({
        success: false,
        error: 'Firebase Storage is not properly configured. Please check your environment variables.',
        timestamp: new Date()
      });
    }
    
    console.log('🔍 Firebase Storage check:', {
      hasAdminStorage: !!adminStorage,
      storageType: typeof adminStorage,
      bucketName: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });
    
    // Get bucket name from environment or use default
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;
    const bucket = adminStorage.bucket(bucketName);
    
    // Check if bucket exists and is accessible
    try {
      const [exists] = await bucket.exists();
      if (!exists) {
        console.warn(`⚠️ Storage bucket '${bucketName}' does not exist`);
        return res.status(500).json({
          success: false,
          error: `Storage bucket '${bucketName}' does not exist. Please check your Firebase configuration.`,
          timestamp: new Date()
        });
      }
      console.log('✅ Storage bucket exists and is accessible');
    } catch (bucketError) {
      console.error('❌ Bucket access error:', bucketError);
      return res.status(500).json({
        success: false,
        error: 'Unable to access Firebase Storage bucket. Please check your configuration.',
        timestamp: new Date()
      });
    }
    
    const file = bucket.file(`images/${uniqueFileName}`);
    
    // Convert base64 to buffer
    const buffer = Buffer.from(imageData, 'base64');
    
    console.log('🔍 File upload details:', {
      bucketName: bucket.name,
      fileName: uniqueFileName,
      filePath: `images/${uniqueFileName}`,
      fileSize: buffer.length
    });
    
    // Upload to Firebase Storage
    try {
      await file.save(buffer, {
        metadata: {
          contentType: fileType,
          metadata: {
            uploadedBy: req.user.uid,
            originalName: fileName,
            uploadedAt: new Date().toISOString()
          }
        }
      });
      console.log('✅ File saved to Firebase Storage successfully');
    } catch (uploadError) {
      console.error('❌ Firebase Storage upload error:', uploadError);
      throw new Error(`Storage upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
    }

    // Make the file publicly accessible
    try {
      await file.makePublic();
      console.log('✅ File made public successfully');
      
      // Verify public access
      const [metadata] = await file.getMetadata();
      console.log('🔍 File metadata:', {
        public: metadata.public,
        mediaLink: metadata.mediaLink,
        selfLink: metadata.selfLink
      });
      
    } catch (publicError) {
      console.error('❌ Firebase Storage public access error:', publicError);
      // Try alternative method to make file public
      try {
        await file.setMetadata({
          metadata: {
            public: true
          }
        });
        console.log('✅ File made public via alternative method');
      } catch (altError) {
        console.error('❌ Alternative public access method failed:', altError);
        // Continue with the process even if public access fails
        console.log('⚠️ Warning: Could not make file public, but continuing...');
      }
    }

    // Get the public URL
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

    console.log(`✅ Image uploaded to Firebase Storage: ${imageUrl}`);
    
    // Test the URL accessibility
    try {
      const testResponse = await fetch(imageUrl, { method: 'HEAD' });
      console.log(`🔍 Image URL test: ${testResponse.status} ${testResponse.statusText}`);
      if (testResponse.status !== 200) {
        console.warn(`⚠️ Image URL may not be accessible: ${testResponse.status}`);
        return res.status(500).json({
          success: false,
          error: 'Uploaded image is not publicly accessible. Please check your Firebase Storage configuration.',
          timestamp: new Date()
        });
      }
    } catch (testError) {
      console.warn('⚠️ Could not test image URL accessibility:', testError);
      // Continue with the upload even if testing fails
      console.log('⚠️ Proceeding with upload despite URL test failure');
    }

    // Store image metadata in database
    const imageMetadata = {
      id: uniqueFileName,
      userId: req.user.uid,
      fileName,
      fileType,
      fileSize: base64Size,
      imageUrl,
      uploadedAt: new Date(),
      isPublic: true
    };

    // Save to database (you'd implement this)
    // await serverDb.saveImageMetadata(imageMetadata);

    console.log(`✅ Image uploaded: ${fileName} by user ${req.user.uid}`);

    return res.status(200).json({
      success: true,
      data: {
        imageUrl,
        fileName,
        fileType,
        fileSize: base64Size
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('❌ Error uploading image:', error);
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // More specific error messages
    let errorMessage = 'Failed to upload image. Please try again.';
    
    if (error instanceof Error) {
      if (error.message.includes('storage')) {
        errorMessage = 'Storage service unavailable. Please try again.';
      } else if (error.message.includes('bucket')) {
        errorMessage = 'Storage configuration error. Please contact support.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'Permission denied. Please check your authentication.';
      } else {
        errorMessage = `Upload failed: ${error.message}`;
      }
    }
    
    return res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: new Date()
    });
  }
};

// Re-enable authentication
export default withAuth(handler);

// Enable body parsing for JSON data
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};