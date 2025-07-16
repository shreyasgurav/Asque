import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  initializeRecaptcha,
  sendOTP,
  verifyOTP,
  validatePhoneNumber,
  parseAuthError,
} from "@/lib/auth";
import { RecaptchaVerifier, ConfirmationResult } from "firebase/auth";

interface PhoneLoginProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export default function PhoneLogin({ onSuccess, redirectTo = "/my-bots" }: PhoneLoginProps) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const verifier = initializeRecaptcha("recaptcha-container");
    setRecaptchaVerifier(verifier);
    return () => verifier.clear();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (step === "otp" && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timer]);

  const handleSendOTP = async () => {
    if (!phoneNumber.trim() || !recaptchaVerifier || loading) return;
    setLoading(true);
    setError(null);
    try {
      if (!validatePhoneNumber(phoneNumber)) {
        throw new Error("Please enter a valid phone number");
      }
      const result = await sendOTP(phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
      setStep("otp");
      setTimer(60);
    } catch (error: any) {
      setError(parseAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || !confirmationResult || loading) return;
    setLoading(true);
    setError(null);
    try {
      await verifyOTP(confirmationResult, otp);
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(redirectTo);
      }
    } catch (error: any) {
      setError(parseAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!recaptchaVerifier || timer > 0 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await sendOTP(phoneNumber, recaptchaVerifier);
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
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-lg">
        {/* Header - only show on phone step */}
        {step === "phone" && (
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">Login to AsQue</h1>
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        {step === "phone" ? (
          <div className="relative">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Phone Number"
              className="w-full h-16 px-6 pr-20 bg-gray-800 border border-gray-700 text-white placeholder-gray-400 text-lg rounded-2xl focus:border-gray-600 focus:ring-0 focus:ring-offset-0"
              disabled={loading}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendOTP();
                }
              }}
            />
            <Button
              onClick={handleSendOTP}
              disabled={!phoneNumber.trim() || loading}
              className="absolute right-2 top-2 h-12 w-12 rounded-full bg-gray-700 hover:bg-gray-600 border-0 p-0 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <ArrowRight className="h-5 w-5 text-white" />
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-2">Enter verification code</h2>
              <p className="text-gray-400 text-sm">
                We sent a code to {phoneNumber.replace(/(\+\d{1,3})\d{4,}(\d{4})/, "$1****$2")}
              </p>
            </div>

            <div className="relative">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="w-full h-16 px-6 pr-20 bg-gray-800 border border-gray-700 text-white placeholder-gray-400 text-2xl text-center tracking-widest font-mono rounded-2xl focus:border-gray-600 focus:ring-0 focus:ring-offset-0"
                disabled={loading}
                autoFocus
                maxLength={6}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && otp.length === 6) {
                    handleVerifyOTP();
                  }
                }}
              />
              <Button
                onClick={handleVerifyOTP}
                disabled={otp.length !== 6 || loading}
                className="absolute right-2 top-2 h-12 w-12 rounded-full bg-gray-700 hover:bg-gray-600 border-0 p-0 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <ArrowRight className="h-5 w-5 text-white" />
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setError(null);
                  setTimer(0);
                }}
                className="text-gray-400 hover:text-white hover:bg-gray-800 p-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              {timer > 0 ? (
                <span className="text-gray-400 text-sm">Resend in {formatTimer(timer)}</span>
              ) : (
                <Button
                  variant="ghost"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-gray-400 hover:text-white hover:bg-gray-800 text-sm"
                >
                  Resend code
                </Button>
              )}
            </div>
          </div>
        )}

        <div id="recaptcha-container" className="hidden"></div>
      </div>
    </div>
  );
} 