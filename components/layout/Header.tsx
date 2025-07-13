"use client"

import { useRouter } from 'next/router';
import { useAuth } from '@/components/auth/AuthContext';
import { signOut } from '@/lib/auth';

export default function Header() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                <img 
                  src="/AsQue Logo NoBG.png" 
                  alt="AsQue Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                AsQue
              </span>
              <div className="text-xs text-slate-400 -mt-1">AI Chatbot Platform</div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => router.push('/my-bots')}
                  className="text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-md"
                >
                  My Bots
                </button>
                                  <button
                    onClick={() => router.push('/create')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Create Bot
                  </button>
                <button
                  onClick={handleSignOut}
                  className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/login')}
                  className="text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-md"
                >
                  Sign In
                </button>
                                  <button
                    onClick={() => router.push('/create')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Get Started Free
                  </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 