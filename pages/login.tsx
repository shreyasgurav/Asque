import React from 'react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import PhoneLogin from '@/components/auth/PhoneLogin';
import SEO from '@/components/ui/SEO';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const { redirect } = router.query;

  useEffect(() => {
    if (!loading && isAuthenticated) {
      const redirectTo = typeof redirect === 'string' ? redirect : '/my-bots';
      router.push(redirectTo);
    }
  }, [isAuthenticated, loading, router, redirect]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div
              className="absolute inset-0 w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto"
              style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
            ></div>
          </div>
          <p className="text-slate-300 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  const redirectTo = typeof redirect === 'string' ? redirect : '/my-bots';

  return (
    <>
      <SEO 
        title="Login"
        description="Sign in to AsQue to create and manage your AI chatbots"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        {/* Header */}
        <div className="bg-slate-800/30 backdrop-blur-xl border-b border-slate-700/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                  <img 
                    src="/AsQue Logo NoBG.png" 
                    alt="AsQue Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <button
                  onClick={() => router.push('/')}
                  className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent hover:from-blue-300 hover:to-purple-300 transition-all duration-200"
                >
                  AsQue
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            {/* Welcome Section */}
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/25">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Welcome to AsQue
                </h1>
                <p className="text-slate-400 text-lg">
                  Sign in to create and manage your AI chatbots
                </p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-center justify-center gap-2 text-slate-300">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Create intelligent chatbots</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-slate-300">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Train with natural conversation</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-slate-300">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Deploy and share instantly</span>
                </div>
              </div>
            </div>

            {/* Login Form */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
              <PhoneLogin 
                redirectTo={redirectTo}
                onSuccess={() => {
                  console.log('✅ Login successful, redirecting to:', redirectTo);
                }}
              />
            </div>

            {/* Additional Info */}
            <div className="text-center">
              <p className="text-sm text-slate-400">
                Don't have an account? No worries!{' '}
                <br />
                <span className="text-slate-300">We'll create one for you automatically.</span>
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-6 pt-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Fast</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>Easy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 