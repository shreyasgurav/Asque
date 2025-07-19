"use client"

import { useRouter } from 'next/router';
import { useAuth } from '@/components/auth/AuthContext';
import { signOut } from '@/lib/auth';
import React, { useRef, useState } from 'react';
import { Menu } from 'lucide-react';

export default function Header({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

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
          <div className="flex items-center gap-2">
            {/* Sidebar toggle button for chat pages */}
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors mr-2"
                aria-label="Toggle sidebar"
              >
                <Menu size={22} />
              </button>
            )}
            <button
              onClick={() => router.push('/')}
              className="flex items-center focus:outline-none group"
              aria-label="Go to home page"
              style={{ background: 'none', border: 'none', padding: 0, margin: 0 }}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                  <img 
                    src="/AsQue Logo NoBG.png" 
                    alt="AsQue Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-slate-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-sm">
                    {user?.displayName?.[0] || user?.phoneNumber?.slice(-2) || '?'}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">
                    {user?.displayName || user?.phoneNumber || 'User'}
                  </span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-50 animate-fade-in">
                    <button
                      onClick={() => { router.push('/my-bots'); setDropdownOpen(false); }}
                      className="block w-full text-left px-4 py-2 text-slate-200 hover:bg-slate-700"
                >
                  My Bots
                </button>
                                  <button
                      onClick={() => { router.push('/create'); setDropdownOpen(false); }}
                      className="block w-full text-left px-4 py-2 text-slate-200 hover:bg-slate-700"
                  >
                    Create Bot
                  </button>
                    <div className="border-t border-slate-700 my-1" />
                <button
                      onClick={() => { handleSignOut(); setDropdownOpen(false); }}
                      className="block w-full text-left px-4 py-2 text-red-400 hover:bg-slate-700"
                >
                  Sign Out
                </button>
                  </div>
                )}
              </div>
            ) : (
                <button
                  onClick={() => router.push('/login')}
                  className="text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-md"
                >
                  Sign In
                </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 