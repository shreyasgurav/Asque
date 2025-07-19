"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/ui/SEO';
import CreateBotForm from '@/components/forms/CreateBotForm';
import { useAuth } from '@/components/auth/AuthContext';
import { signOut } from '@/lib/auth';
import { User, ArrowLeft } from 'lucide-react';

export default function CreateBotPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
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

  const handleSuccess = (botId: string) => {
    // Redirect to training page
    router.push(`/bot/${botId}/train`);
  };

  const handleError = (error: string) => {
    // Error is handled by the form component itself
    console.error('Bot creation error:', error);
  };

  return (
    <>
      <SEO 
        title="Create Your AI Chatbot"
        description="Create a custom AI chatbot that knows exactly what you teach it. Start building your intelligent bot in seconds."
        keywords={['create chatbot', 'AI bot builder', 'custom chatbot', 'bot creation']}
      />
      <div className="min-h-screen bg-slate-900 text-white">
        {/* Custom Header with Centered Logo */}
        <nav className="fixed top-0 w-full z-50 backdrop-blur-md">
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
              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <div
                    className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center cursor-pointer"
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
        </nav>

        {/* Hero Section */}
        <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="max-w-4xl mx-auto relative">
              <div className="text-center mb-12">
                <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto">
                  Give your bot a name, purpose, and personality, then train it by simply chatting
                </p>
              </div>

              {/* Create Bot Form */}
              <div className="max-w-xl mx-auto">
                <CreateBotForm onSuccess={handleSuccess} onError={handleError} />
              </div>
            </div>
          </section>
        </div>
      </>
    );
} 