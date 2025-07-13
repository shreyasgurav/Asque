import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  initializeRecaptcha, 
  sendOTP, 
  verifyOTP, 
  validatePhoneNumber, 
  formatPhoneNumber,
  parseAuthError,
  PhoneAuthState 
} from '@/lib/auth';
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';

interface PhoneLoginProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export default function PhoneLogin({ onSuccess, redirectTo = '/my-bots' }: PhoneLoginProps) {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [timer, setTimer] = useState(0);

  // Initialize reCAPTCHA
  useEffect(() => {
    const verifier = initializeRecaptcha('recaptcha-container');
    setRecaptchaVerifier(verifier);

    return () => {
      verifier.clear();
    };
  }, []);

  // OTP timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timer]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || !recaptchaVerifier) return;

    setLoading(true);
    setError(null);

    try {
      // Validate phone number
      if (!validatePhoneNumber(phoneNumber)) {
        throw new Error('Please enter a valid phone number');
      }

      console.log('📱 Sending OTP to:', phoneNumber);
      const result = await sendOTP(phoneNumber, recaptchaVerifier);
      
      setConfirmationResult(result);
      setStep('otp');
      setTimer(60); // 60 second timer
      console.log('✅ OTP sent successfully');
      
    } catch (error: any) {
      console.error('❌ Error sending OTP:', error);
      setError(parseAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || !confirmationResult) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Verifying OTP:', otp);
      await verifyOTP(confirmationResult, otp);
      
      console.log('✅ Login successful');
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(redirectTo);
      }
      
    } catch (error: any) {
      console.error('❌ Error verifying OTP:', error);
      setError(parseAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!recaptchaVerifier || timer > 0) return;

    setLoading(true);
    setError(null);

    try {
      const result = await sendOTP(phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
      setTimer(60);
      console.log('✅ OTP resent successfully');
    } catch (error: any) {
      console.error('❌ Error resending OTP:', error);
      setError(parseAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {step === 'phone' ? 'Sign In with Phone' : 'Verify Your Number'}
        </h2>
        <p className="text-gray-600 mt-2">
          {step === 'phone' 
            ? 'Enter your phone number to receive a verification code'
            : `We sent a code to ${formatPhoneNumber(phoneNumber)}`
          }
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {step === 'phone' ? (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Include country code (e.g., +1 for US, +91 for India)
            </p>
          </div>

          <button
            type="submit"
            disabled={!phoneNumber.trim() || loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending Code...
              </div>
            ) : (
              'Send Verification Code'
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-wider"
              disabled={loading}
              autoFocus
              maxLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={otp.length !== 6 || loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verifying...
              </div>
            ) : (
              'Verify Code'
            )}
          </button>

          <div className="text-center">
            {timer > 0 ? (
              <p className="text-sm text-gray-500">
                Resend code in {formatTimer(timer)}
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                Resend Code
              </button>
            )}
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setOtp('');
                setError(null);
              }}
              className="text-sm text-gray-600 hover:text-gray-700"
            >
              ← Change Phone Number
            </button>
          </div>
        </form>
      )}

      {/* reCAPTCHA container */}
      <div id="recaptcha-container"></div>

      <div className="text-center mt-6">
        <p className="text-xs text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
} 