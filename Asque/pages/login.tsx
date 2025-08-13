import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/auth/AuthContext';
import PhoneLogin from '@/components/auth/PhoneLogin';
import SEO from '@/components/ui/SEO';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const { redirect } = router.query;
  const [loginSuccess, setLoginSuccess] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated && !loginSuccess) {
      const redirectTo = typeof redirect === 'string' ? redirect : '/';
      router.push(redirectTo);
    }
  }, [isAuthenticated, loading, router, redirect, loginSuccess]);

  const handleLoginSuccess = () => {
    setLoginSuccess(true);
    // Show success animation for 2 seconds, then redirect
    setTimeout(() => {
      const redirectTo = typeof redirect === 'string' ? redirect : '/';
      router.push(redirectTo);
    }, 2000);
  };

  // Loading state
  if (loading) {
    return (
      <>
        <SEO 
          title="Login"
          description="Sign in to AsQue to create and manage your AI chatbots"
        />
        {/* Custom Header with Centered Logo */}
        <nav className="fixed top-0 w-full z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <button
                onClick={() => router.push('/')}
                className="text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 p-2 rounded-full"
              >
                <ArrowLeft size={20} />
              </button>
              <img 
                src="/AsQue Logo NoBG.png" 
                alt="AsQue Logo" 
                className="w-8 h-8 object-contain"
              />
              <div className="w-10"></div>
            </div>
          </div>
        </nav>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              className="inline-block rounded-full h-12 w-12 border-4 border-slate-700 border-t-slate-300 mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <div className="text-slate-300 font-medium">Loading...</div>
          </motion.div>
        </div>
      </>
    );
  }

  // Success state
  if (loginSuccess || (isAuthenticated && !loading)) {
    return (
      <>
        <SEO 
          title="Login Successful"
          description="Successfully logged in to AsQue"
        />
        {/* Custom Header with Centered Logo */}
        <nav className="fixed top-0 w-full z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <button
                onClick={() => router.push('/')}
                className="text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 p-2 rounded-full"
              >
                <ArrowLeft size={20} />
              </button>
              <img 
                src="/AsQue Logo NoBG.png" 
                alt="AsQue Logo" 
                className="w-8 h-8 object-contain"
              />
              <div className="w-10"></div>
            </div>
          </div>
        </nav>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6 border border-green-500/30"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="w-10 h-10 text-green-400" />
            </motion.div>
            <motion.h1
              className="text-3xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Welcome to AsQue!
            </motion.h1>
            <motion.p
              className="text-slate-400"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              You have successfully logged in.
            </motion.p>
          </motion.div>
        </div>
      </>
    );
  }

  // Login form state
  const redirectTo = typeof redirect === 'string' ? redirect : '/';

  return (
    <>
      <SEO 
        title="Login"
        description="Sign in to AsQue to create and manage your AI chatbots"
      />
      {/* Custom Header with Centered Logo */}
      <nav className="fixed top-0 w-full z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => router.push('/')}
              className="text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 p-2 rounded-full"
            >
              <ArrowLeft size={20} />
            </button>
            <img 
              src="/AsQue Logo NoBG.png" 
              alt="AsQue Logo" 
              className="w-8 h-8 object-contain"
            />
            <div className="w-10"></div>
          </div>
        </div>
      </nav>
      <PhoneLogin 
        redirectTo={redirectTo}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
}