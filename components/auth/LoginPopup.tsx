import React, { useState, useEffect } from 'react';
import { 
  initializeRecaptcha, 
  sendOTP, 
  verifyOTP, 
  validatePhoneNumber, 
  formatPhoneNumber,
  parseAuthError
} from '@/lib/auth';
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';

interface LoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  botName?: string;
}

export default function LoginPopup({ isOpen, onClose, onSuccess, botName }: LoginPopupProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [timer, setTimer] = useState(0);

  // Initialize reCAPTCHA when popup opens
  useEffect(() => {
    if (isOpen && !recaptchaVerifier) {
      const verifier = initializeRecaptcha('chat-recaptcha-container');
      setRecaptchaVerifier(verifier);
    }

    return () => {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        setRecaptchaVerifier(null);
      }
    };
  }, [isOpen]);

  // Reset state when popup closes
  useEffect(() => {
    if (!isOpen) {
      setStep('phone');
      setPhoneNumber('');
      setOtp('');
      setError(null);
      setConfirmationResult(null);
      setTimer(0);
    }
  }, [isOpen]);

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
    setError(null);

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }

    if (!recaptchaVerifier) {
      setError('reCAPTCHA not initialized. Please refresh and try again.');
      return;
    }

    setLoading(true);
    
    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const result = await sendOTP(formattedPhone, recaptchaVerifier);
      setConfirmationResult(result);
      setStep('otp');
      setTimer(60); // 60 second timer
    } catch (error: any) {
      setError(parseAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp.trim() || otp.length < 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    if (!confirmationResult) {
      setError('No confirmation result. Please try again.');
      return;
    }

    setLoading(true);

    try {
      await verifyOTP(confirmationResult, otp);
      onSuccess();
    } catch (error: any) {
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
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const result = await sendOTP(formattedPhone, recaptchaVerifier);
      setConfirmationResult(result);
      setTimer(60);
    } catch (error: any) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Login to Chat</h2>
            <p className="text-slate-400 mt-1">
              {botName ? `Continue chatting with ${botName}` : 'Login to save your conversation'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                disabled={loading}
                required
              />
              <p className="text-xs text-slate-400 mt-2">
                Enter your phone number with country code (e.g., +1 for US)
              </p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-red-300">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !phoneNumber.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Sending Code...
                </div>
              ) : (
                'Send Verification Code'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-slate-300 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-center text-lg tracking-widest"
                disabled={loading}
                maxLength={6}
                required
              />
              <p className="text-xs text-slate-400 mt-2">
                Enter the 6-digit code sent to {formatPhoneNumber(phoneNumber)}
              </p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-red-300">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  'Verify & Login'
                )}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-slate-400 hover:text-white transition-colors"
                  disabled={loading}
                >
                  ← Change Number
                </button>
                
                {timer > 0 ? (
                  <span className="text-slate-400">
                    Resend in {formatTimer(timer)}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    disabled={loading}
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </div>
          </form>
        )}

        {/* Benefits */}
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">Why login?</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save your conversation history
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Continue conversations across devices
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Access all your chats in one place
            </div>
          </div>
        </div>

        {/* reCAPTCHA container */}
        <div id="chat-recaptcha-container" className="hidden"></div>
      </div>
    </div>
  );
} 