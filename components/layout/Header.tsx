"use client"

import { useRouter } from 'next/router';
import { useAuth } from '@/components/auth/AuthContext';
import { signOut } from '@/lib/auth';
import React, { useRef, useState } from 'react';
import { Menu, ArrowLeft, User } from 'lucide-react';

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
    <nav className="fixed top-0 w-full z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <button
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 p-2 rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            onClick={() => router.push('/')}
            className="focus:outline-none"
            aria-label="Go to home"
          >
            <img 
              src="/AsQue Logo NoBG.png" 
              alt="AsQue Logo" 
              className="w-8 h-8 object-contain"
            />
          </button>
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <div
                  className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center cursor-pointer"
                  onClick={() => setDropdownOpen((v) => !v)}
                  onMouseEnter={() => setDropdownOpen(true)}
                >
                  <User size={18} className="text-white" />
                </div>
                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 animate-fade-in"
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-slate-800 text-xs text-slate-400 font-semibold">
                      {user?.phoneNumber ? user.phoneNumber : 'No phone'}
                    </div>
                    <button
                      className="block w-full text-left px-4 py-3 text-slate-200 hover:bg-slate-800 text-sm"
                      onClick={() => { router.push('/my-bots'); setDropdownOpen(false); }}
                    >
                      My Bots
                    </button>
                    <button
                      className="block w-full text-left px-4 py-3 text-slate-200 hover:bg-slate-800 text-sm"
                      onClick={() => { router.push('/create'); setDropdownOpen(false); }}
                    >
                      Create Bot
                    </button>
                    <div className="border-t border-slate-800 my-1" />
                    <button
                      className="block w-full text-left px-4 py-3 text-red-400 hover:bg-slate-800 text-sm"
                      onClick={() => { signOut(); setDropdownOpen(false); }}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="ml-2 signInButton signInButtonSmall"
              >
                Sign In
              </button>
            )}
            <style jsx>{`
              .signInButton {
                background: rgba(255, 255, 255, 0.1);
                border: 0px solid rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                padding: 7px 14px;
                color: rgba(255, 255, 255, 0.8);
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                backdrop-filter: blur(4px);
              }
              .signInButtonSmall {
                padding: 3px 8px;
                font-size: 11px;
              }
              .signInButton:hover {
                background: rgba(255, 255, 255, 0.8);
                border-color: rgba(255, 255, 255, 0.3);
                color: black;
              }
            `}</style>
          </div>
        </div>
      </div>
    </nav>
  );
} 