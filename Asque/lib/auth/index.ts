import { 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  ConfirmationResult,
  User,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Types for auth flow
export interface PhoneAuthState {
  phoneNumber: string;
  confirmationResult: ConfirmationResult | null;
  verificationId: string | null;
  loading: boolean;
  error: string | null;
}

export interface AuthUser {
  uid: string;
  phoneNumber: string | null;
  displayName?: string | null;
}

// Initialize reCAPTCHA verifier
export const initializeRecaptcha = (containerId: string): RecaptchaVerifier => {
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: (response: any) => {
      console.log('reCAPTCHA solved:', response);
    },
    'expired-callback': () => {
      console.log('reCAPTCHA expired');
    }
  });
};

// Send OTP to phone number
export const sendOTP = async (
  phoneNumber: string, 
  recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  try {
    console.log('🔐 Sending OTP to:', phoneNumber);
    
    // Ensure phone number has country code
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    
    const confirmationResult = await signInWithPhoneNumber(
      auth, 
      formattedPhone, 
      recaptchaVerifier
    );
    
    console.log('✅ OTP sent successfully');
    return confirmationResult;
  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    throw error;
  }
};

// Verify OTP and complete sign in
export const verifyOTP = async (
  confirmationResult: ConfirmationResult, 
  otp: string
): Promise<User> => {
  try {
    console.log('🔐 Verifying OTP:', otp);
    
    const result = await confirmationResult.confirm(otp);
    console.log('✅ OTP verified successfully');
    
    return result.user;
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    throw error;
  }
};

// Sign out user
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
    console.log('✅ User signed out successfully');
  } catch (error) {
    console.error('❌ Error signing out:', error);
    throw error;
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({
        uid: user.uid,
        phoneNumber: user.phoneNumber,
        displayName: user.displayName
      });
    } else {
      callback(null);
    }
  });
};

// Format phone number for display
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format as +1 (555) 123-4567 for US numbers
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const match = cleaned.match(/^1(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
    }
  }
  
  // Format as +91 12345 67890 for other countries (10 digits)
  if (cleaned.length === 10) {
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
  }
  
  // Return with + prefix if not already present
  return phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
};

// Validate phone number format
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Must be at least 10 digits, at most 15 (international format)
  if (cleaned.length < 10 || cleaned.length > 15) {
    return false;
  }
  
  return true;
};

// Get current user's auth token
export const getCurrentUserToken = async (): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return null;
    }
    
    const token = await user.getIdToken();
    return token;
  } catch (error) {
    console.error('❌ Error getting user token:', error);
    return null;
  }
};

// Create authenticated fetch wrapper
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = await getCurrentUserToken();
  console.log('authenticatedFetch: token', token); // DEBUG LOG

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
};

// Parse auth error for user-friendly messages
export const parseAuthError = (error: any): string => {
  const errorCode = error?.code;
  
  switch (errorCode) {
    case 'auth/invalid-phone-number':
      return 'Please enter a valid phone number with country code';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later';
    case 'auth/invalid-verification-code':
      return 'Invalid verification code. Please check and try again';
    case 'auth/code-expired':
      return 'Verification code has expired. Please request a new one';
    case 'auth/missing-phone-number':
      return 'Phone number is required';
    case 'auth/quota-exceeded':
      return 'SMS quota exceeded. Please try again later';
    case 'auth/captcha-check-failed':
      return 'reCAPTCHA verification failed. Please try again';
    default:
      return error?.message || 'An error occurred during authentication';
  }
}; 