import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Bot } from '@/types';
import { useAuth } from '@/components/auth/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { signOut, authenticatedFetch, formatPhoneNumber } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SEO from '@/components/ui/SEO';
import Layout from '@/components/layout/Layout';
import Header from "@/components/layout/Header";
import { User, ArrowLeft } from 'lucide-react';

// Add UserDropdown component for the user icon dropdown in the header
const UserDropdown: React.FC<{ user: any }> = ({ user }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative ml-2" ref={ref}>
      <div
        className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center cursor-pointer"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
      >
        <User size={18} className="text-white" />
      </div>
      {open && (
        <div
          className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 animate-fade-in"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="px-4 py-3 border-b border-slate-800 text-xs text-slate-400 font-semibold">
            {user?.phoneNumber ? formatPhoneNumber(user.phoneNumber) : 'No phone'}
          </div>
          <button
            className="block w-full text-left px-4 py-3 text-slate-200 hover:bg-slate-800 text-sm"
            onClick={() => { router.push('/my-bots'); setOpen(false); }}
          >
            My Bots
          </button>
          <button
            className="block w-full text-left px-4 py-3 text-slate-200 hover:bg-slate-800 text-sm"
            onClick={() => { router.push('/create'); setOpen(false); }}
          >
            Create Bot
          </button>
          <div className="border-t border-slate-800 my-1" />
          <button
            className="block w-full text-left px-4 py-3 text-red-400 hover:bg-slate-800 text-sm"
            onClick={async () => { await signOut(); setOpen(false); }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default function MyBotsPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('🔍 MyBots useEffect - authLoading:', authLoading, 'user:', !!user);
    if (!authLoading && user) {
      fetchUserBots();
    }
  }, [user, authLoading]);

  // Close dropdown on outside click
  useEffect(() => {
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

  const fetchUserBots = async () => {
    if (!user) return;

    console.log('🔍 Fetching bots for user:', user.uid);
    
    try {
      setLoading(true);
      setError(null);
      
      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await authenticatedFetch(`/api/bots/by-owner/${user.uid}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('🔍 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('🔍 Response data:', result);

      if (result.success) {
        setBots(result.data || []);
        console.log('🔍 Bots set:', result.data?.length || 0);
      } else {
        console.error('🔍 API returned error:', result.error);
        setError(result.error || 'Failed to load bots');
      }
    } catch (err: any) {
      console.error('Error fetching bots:', err);
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(`Failed to load bots: ${err.message}`);
      }
    } finally {
      console.log('🔍 Setting loading to false');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  // Show loading while authenticating
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push('/login');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-300 font-medium">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <SEO 
        title="My Bots - AsQue"
        description="Manage your AI chatbots and share them with others"
      />
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* My Bots Title */}
          <div className="pt-24 pb-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-wide drop-shadow" style={{fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 800}}>
              My Bots
            </h1>
          </div>

          {/* Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <p className="mt-2 text-slate-400">
                Manage your chatbots and share them with others
              </p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-300 font-medium">Loading your bots...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <Card className="mb-6 bg-red-500/10 border-red-500/30 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-300">Error</h3>
                    <p className="mt-1 text-sm text-red-200">{error}</p>
                    <Button
                      onClick={fetchUserBots}
                      className="mt-2 text-xs bg-red-600 hover:bg-red-700"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Empty State */}
            {!loading && !error && bots.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-lg font-medium text-white mb-2">No bots yet</h3>
                <p className="text-slate-400 mb-6">
                  Create your first chatbot to get started. It only takes a minute!
                </p>
                <Button
                  onClick={() => router.push("/create")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                >
                  Create Your First Bot
                </Button>
              </div>
            )}

            {/* Bots Grid */}
            {!loading && !error && bots.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bots.map((bot) => (
                  <div key={bot.id} className="group relative bg-slate-800/20 border border-slate-700/30 rounded-xl p-5 hover:bg-slate-800/30 hover:border-slate-600/50 transition-all duration-300">
                    {/* Status Indicator */}
                    <div className="absolute top-4 right-4">
                      <div className={`w-2 h-2 rounded-full ${bot.status === 'deployed' ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`}></div>
                    </div>

                    {/* Bot Avatar */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
                        {bot.profilePictureUrl ? (
                          <img
                            src={bot.profilePictureUrl}
                            alt={bot.name}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg class="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>';
                            }}
                          />
                        ) : (
                          <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {bot.name}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {bot.status === 'deployed' ? 'Live' : 'Training'}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    {bot.description && (
                      <p className="text-slate-300 text-sm mb-4 line-clamp-2 leading-relaxed">
                        {bot.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                      <span>- training entries</span>
                      <span>{bot.unansweredQuestions?.length || 0} unanswered</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => router.push(`/bot/${bot.id}/dashboard`)}
                        className="flex-1 bg-slate-700/50 hover:bg-slate-700/70 text-white border border-slate-600/50 hover:border-slate-500/50 transition-all duration-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Manage
                      </Button>
                      
                      {bot.status === 'deployed' && (
                        <Button
                          onClick={() => router.push(`/bot/${bot.id}`)}
                          className="bg-slate-600/50 hover:bg-slate-600/70 text-white border border-slate-500/50 hover:border-slate-400/50 transition-all duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </Button>
                      )}
                    </div>

                    {/* Share Link for Deployed Bots */}
                    {bot.status === 'deployed' && (
                      <div className="mt-3 pt-3 border-t border-slate-700/30">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/bot/${bot.id}`}
                            readOnly
                            className="flex-1 text-xs bg-slate-700/20 border border-slate-600/30 rounded px-2 py-1 text-slate-300"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (typeof window !== 'undefined') {
                                navigator.clipboard.writeText(`${window.location.origin}/bot/${bot.id}`);
                              }
                            }}
                            className="text-slate-400 hover:text-slate-300 text-xs p-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ProtectedRoute>
    </>
  );
} 