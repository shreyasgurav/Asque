import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/components/auth/AuthContext';
import { authenticatedFetch } from '@/lib/auth';
import SEO from '@/components/ui/SEO';
import Loading from '@/components/ui/Loading';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserChatSummary, GetUserChatsResponse } from '@/types';
import Layout from '@/components/layout/Layout';

export default function MyChats() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [chats, setChats] = useState<UserChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !authLoading) {
      fetchChats();
    }
  }, [user, authLoading]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching chats for user:', user?.uid);
      
      const response = await authenticatedFetch('/api/chats');
      console.log('🔍 Chats response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Chats response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result: GetUserChatsResponse = await response.json();
      console.log('🔍 Chats response data:', result);

      if (result.success && result.data) {
        setChats(result.data);
        console.log('🔍 Chats set:', result.data?.length || 0);
      } else {
        console.error('🔍 Chats API returned error:', result.error);
        setError(result.error || 'Failed to load chat history');
      }
    } catch (err: any) {
      console.error('Error fetching chats:', err);
      setError(`Failed to load chat history: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueChat = (sessionId: string, botId: string) => {
    router.push(`/bot/${botId}?sessionId=${sessionId}`);
  };

  const formatLastMessage = (message: string, maxLength: number = 60) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - messageDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

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
          <p className="text-slate-300 font-medium">Loading your chats...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="My Chats"
        description="View and continue all your bot conversations in one place."
      />
      <ProtectedRoute>
        <Layout>
          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-6 py-8">
            {error && (
              <Card className="bg-red-500/20 border-red-500/30 p-6 mb-6">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-red-300">Error Loading Chats</h3>
                    <p className="text-red-200">{error}</p>
                  </div>
                  <Button
                    onClick={fetchChats}
                    variant="outline"
                    size="sm"
                    className="ml-auto border-red-500/50 text-red-300 hover:bg-red-500/20"
                  >
                    Retry
                  </Button>
                </div>
              </Card>
            )}

            {chats.length === 0 && !error ? (
              <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50 p-12 text-center">
                <div className="w-20 h-20 bg-slate-600/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">No Chat History Yet</h3>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                  You haven't started any conversations yet. Browse available bots or create your own to get started!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => router.push("/")}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Explore Bots
                  </Button>
                  <Button
                    onClick={() => router.push("/create")}
                    variant="outline"
                    className="bg-slate-700/30 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Your Bot
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">
                    {chats.length} Conversation{chats.length !== 1 ? 's' : ''}
                  </h2>
                  <Button
                    onClick={fetchChats}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {chats.map((chat) => (
                    <div 
                      key={chat.sessionId} 
                      className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/60 transition-all duration-200 cursor-pointer"
                      onClick={() => handleContinueChat(chat.sessionId, chat.botId)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                          {chat.botProfilePictureUrl ? (
                            <img 
                              src={chat.botProfilePictureUrl} 
                              alt={`${chat.botName} profile`} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <svg className={`w-6 h-6 text-white ${chat.botProfilePictureUrl ? 'hidden' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-white truncate">{chat.botName}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              {chat.isActive && (
                                <span className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                  Active
                                </span>
                              )}
                              <span>{formatTime(chat.lastMessageTime)}</span>
                            </div>
                          </div>
                          
                          <p className="text-slate-300 mb-3 leading-relaxed">
                            {formatLastMessage(chat.lastMessage)}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                {chat.messageCount} message{chat.messageCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                            
                            <button
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleContinueChat(chat.sessionId, chat.botId);
                              }}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                            >
                              Continue Chat
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                                                  </div>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
            )}
          </div>
        </Layout>
      </ProtectedRoute>
    </>
  );
} 