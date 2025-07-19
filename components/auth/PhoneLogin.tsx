import React, { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, Phone, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
        />
      </div>

      <motion.div
        className="w-full max-w-lg relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <AnimatePresence mode="wait">
          {step === "phone" && (
            <motion.div
              key="header"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="text-center mb-8"
            >
              <motion.div
                className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-full mb-4 border border-slate-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Phone className="w-8 h-8 text-slate-300" />
              </motion.div>
              <p className="text-slate-400">Enter your phone number to sign in to AsQue</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl mb-6 text-center backdrop-blur-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {step === "phone" ? (
            <motion.div
              key="phone-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <div className="relative group">
                <motion.input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+911234567890"
                  className="w-full h-16 px-6 pr-20 bg-slate-800/50 border border-slate-700 text-white placeholder-slate-400 text-lg rounded-2xl focus:border-slate-600 focus:ring-0 focus:ring-offset-0 backdrop-blur-sm transition-all duration-300 focus:bg-slate-800/70"
                  disabled={loading}
                  autoFocus
                  whileFocus={{ scale: 1.02 }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSendOTP();
                    }
                  }}
                />
                <motion.div
                  className="absolute right-2 top-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleSendOTP}
                    disabled={!phoneNumber.trim() || loading}
                    className="h-12 w-12 rounded-full bg-slate-700 hover:bg-slate-600 border-0 p-0 disabled:opacity-50 transition-all duration-300"
                  >
                    {loading ? (
                      <div className="w-5 h-5 relative">
                        <div className="absolute inset-0 rounded-full border-2 border-t-white border-transparent animate-spin"></div>
                      </div>
                    ) : (
                      <ArrowRight className="h-5 w-5 text-white" />
                    )}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-full mb-4 border border-slate-700"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Shield className="w-8 h-8 text-slate-300" />
                </motion.div>
                <h2 className="text-xl font-semibold text-white mb-2">Enter verification code</h2>
                <p className="text-slate-400 text-sm">
                  We sent a code to {phoneNumber.replace(/(\+\d{1,3})\d{4,}(\d{4})/, "$1****$2")}
                </p>
              </motion.div>

              <motion.div
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <motion.input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="w-full h-16 px-6 pr-20 bg-slate-800/50 border border-slate-700 text-white placeholder-slate-400 text-2xl text-center tracking-widest font-mono rounded-2xl focus:border-slate-600 focus:ring-0 focus:ring-offset-0 backdrop-blur-sm transition-all duration-300 focus:bg-slate-800/70"
                  disabled={loading}
                  autoFocus
                  maxLength={6}
                  whileFocus={{ scale: 1.02 }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && otp.length === 6) {
                      handleVerifyOTP();
                    }
                  }}
                />
                <motion.div
                  className="absolute right-2 top-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleVerifyOTP}
                    disabled={otp.length !== 6 || loading}
                    className="h-12 w-12 rounded-full bg-slate-700 hover:bg-slate-600 border-0 p-0 disabled:opacity-50 transition-all duration-300"
                  >
                    {loading ? (
                      <div className="w-5 h-5 relative">
                        <div className="absolute inset-0 rounded-full border-2 border-t-white border-transparent animate-spin"></div>
                      </div>
                    ) : (
                      <ArrowRight className="h-5 w-5 text-white" />
                    )}
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div
                className="flex items-center justify-between"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setStep("phone");
                      setOtp("");
                      setError(null);
                      setTimer(0);
                    }}
                    className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 transition-all duration-300"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </motion.div>

                {timer > 0 ? (
                  <motion.span
                    key="timer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-slate-400 text-sm"
                  >
                    Resend in {formatTimer(timer)}
                  </motion.span>
                ) : (
                  <motion.div
                    key="resend"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      onClick={handleResendOTP}
                      disabled={loading}
                      className="text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition-all duration-300"
                    >
                      Resend code
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div id="recaptcha-container" className="hidden"></div>
      </motion.div>
    </div>
  );
}