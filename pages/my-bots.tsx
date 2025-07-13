import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Bot } from '@/types';
import { useAuth } from '@/components/auth/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { signOut, authenticatedFetch } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SEO from '@/components/ui/SEO';

export default function MyBotsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 MyBots useEffect - authLoading:', authLoading, 'user:', !!user);
    if (!authLoading && user) {
      fetchUserBots();
    }
  }, [user, authLoading]);

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
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log('🔍 Response data:', result);

      if (result.success) {
        setBots(result.data || []);
        console.log('🔍 Bots set:', result.data?.length || 0);
      } else {
        setError(result.error || 'Failed to load bots');
      }
    } catch (err: any) {
      console.error('Error fetching bots:', err);
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Failed to load bots. Please try again.');
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
      <SEO 
        title="My Bots - AsQue"
        description="Manage your AI chatbots and share them with others"
      />
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* Navigation */}
          <nav className="bg-slate-800/30 backdrop-blur-xl border-b border-slate-700/30 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center">
                  <Link href="/" className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg overflow-hidden">
                      <img 
                        src="/AsQue Logo NoBG.png" 
                        alt="AsQue Logo" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-2xl font-bold text-white">AsQue</span>
                  </Link>
                  <div className="ml-4 flex items-center gap-2">
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-300 text-sm">My Bots</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={() => router.push("/create")}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create New Bot
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="text-slate-300 hover:text-white"
                  >
                    <span className="text-sm mr-2">
                      {user?.phoneNumber || 'User'}
                    </span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          </nav>

          {/* Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white">My Bots</h1>
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
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {bots.map((bot) => (
                  <Card key={bot.id} className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50 hover:bg-slate-800/60 transition-all duration-200">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {bot.name}
                          </h3>
                          {bot.description && (
                            <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                              {bot.description}
                            </p>
                          )}
                        </div>
                        <Badge variant={bot.status === 'deployed' ? 'default' : 'secondary'}>
                          {bot.status === 'deployed' ? 'Live' : 'Training'}
                        </Badge>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center text-sm text-slate-500">
                          <span>Training: {bot.trainingMessages?.length || 0} messages</span>
                          <span className="mx-2">•</span>
                          <span>Created {formatDate(bot.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          onClick={() => router.push(`/bot/${bot.id}/dashboard`)}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Manage Bot
                        </Button>
                      </div>

                      {bot.status === 'deployed' && (
                        <div className="mt-3 pt-3 border-t border-slate-700/50">
                          <p className="text-xs text-slate-500 mb-1">Share this link:</p>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/bot/${bot.id}`}
                              readOnly
                              className="flex-1 text-xs bg-slate-700/30 border border-slate-600/50 rounded px-2 py-1 text-slate-300"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (typeof window !== 'undefined') {
                                  navigator.clipboard.writeText(`${window.location.origin}/bot/${bot.id}`);
                                }
                              }}
                              className="text-blue-400 hover:text-blue-300 text-xs"
                            >
                              Copy
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </ProtectedRoute>
    </>
  );
} 