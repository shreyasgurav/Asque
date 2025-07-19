"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { nanoid } from 'nanoid';
import { useAuth } from '@/components/auth/AuthContext';
import { authenticatedFetch } from '@/lib/auth';
import Layout from '@/components/layout/Layout';
import { User, Send } from 'lucide-react';
import { Bot, UserChatSummary } from '@/types';
import { ChevronLeft } from 'lucide-react';

// Custom 2-line menu icon
const TwoLineMenuIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="8" x2="20" y2="8" />
    <line x1="4" y1="16" x2="20" y2="16" />
  </svg>
);

function formatLastMessage(message: string, maxLength: number = 40) {
  if (!message) return "No messages yet.";
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + '...';
}

function formatTime(date: Date | string) {
  const now = new Date();
  const messageDate = new Date(date);
  const diffTime = Math.abs(now.getTime() - messageDate.getTime());
  const diffSeconds = Math.floor(diffTime / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

const ChatSidebar = ({
  isOpen,
  onToggle,
  onSelectChat,
  onStartNewChat,
  pastChats,
  loadingChats,
  currentSessionId,
  currentBotId,
  isAuthenticated,
  formatLastMessage,
  formatTime,
  sidebarRef,
}: any) => {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      <div
        ref={sidebarRef}
        className={`bg-slate-900 fixed lg:relative h-full border-r border-white/10 transition-all duration-300 ease-in-out z-50 flex flex-col ${isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:w-16 lg:translate-x-0'} ${!isOpen && 'lg:overflow-hidden'}`}
      >
        <div className="flex flex-col h-full">
          <div className="p-3">
            <div className="flex items-center">
              <button
                onClick={onToggle}
                className="p-2 rounded-full text-[var(--sidebar-toggle-text)] hover:bg-[var(--sidebar-toggle-hover-bg)] hover:text-white transition-colors"
                aria-label="Toggle sidebar"
              >
                {isOpen ? <ChevronLeft size={20} /> : <TwoLineMenuIcon size={20} />}
              </button>
              {isOpen && (
                <h2 className="ml-3 text-lg font-semibold text-[var(--sidebar-header-text)]">Chat History</h2>
              )}
            </div>
                          </div>
          {isOpen && (
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {loadingChats ? (
                <div className="text-center py-8">
                  <div className="w-7 h-7 border-2 border-[var(--spinner-color-light)] border-t-[var(--spinner-color-dark)] rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-[var(--sidebar-toggle-text)] text-sm">Loading chats...</p>
                        </div>
              ) : pastChats.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[var(--sidebar-time-text)] text-sm">No recent chats.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {pastChats.map((chat: any) => (
                    <button
                      key={chat.sessionId}
                      onClick={() => onSelectChat(chat.sessionId, chat.botId)}
                      className={`w-full text-left p-3 rounded-lg cursor-pointer transition-colors text-sm ${chat.sessionId === currentSessionId && chat.botId === currentBotId ? 'bg-[var(--sidebar-selected-bg)] text-[var(--sidebar-selected-text)]' : 'bg-[var(--sidebar-bg-default)] hover:bg-[var(--sidebar-hover-bg)] text-[var(--sidebar-text-default)]'} flex items-center gap-3 hover:bg-slate-700/60`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{chat.botName}</p>
                        <p className="text-xs text-[var(--sidebar-toggle-text)] truncate">{formatLastMessage(chat.lastMessage)}</p>
                      </div>
                    </button>
                  ))}
                      </div>
              )}
                      </div>
          )}
                    </div>
        {/* Sidebar Bottom Section */}
        {isOpen && (
          <div className="p-4 mt-auto text-xs text-[var(--sidebar-time-text)] border-t border-white/10">
            <a href="/about" className="block mb-1 opacity-70 hover:opacity-100 transition-opacity">About</a>
            <a href="/contact" className="block mb-1 opacity-70 hover:opacity-100 transition-opacity">Contact</a>
            <a href="https://www.linkedin.com/in/shreyasdgurav/" target="_blank" rel="noopener noreferrer" className="block opacity-80 hover:opacity-100 transition-opacity">
              By <span className="text-blue-500 font-semibold">Shreyas Gurav</span>
            </a>
                        </div>
        )}
                      </div>
    </>
  );
};

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
            {user?.phoneNumber ? user.phoneNumber : 'No phone'}
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
            onClick={async () => { await import('@/lib/auth').then(m => m.signOut()); setOpen(false); }}
          >
            Sign Out
          </button>
        </div>
      )}
            </div>
  );
};

export default function LandingChatPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pastChats, setPastChats] = useState<UserChatSummary[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const sidebarRef = useRef<HTMLDivElement>(null);
  // For input section
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Track selected chat
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);

  // Fetch past chats for sidebar
  useEffect(() => {
    async function fetchPastChats() {
      if (!isAuthenticated) {
        setPastChats([]);
        setLoadingChats(false);
        return;
      }
      
      try {
        setLoadingChats(true);
        const response = await authenticatedFetch('/api/chats');
        
        if (!response.ok) {
          console.error('Failed to fetch chats:', response.status);
          setPastChats([]);
          return;
        }
        
        const result = await response.json();
        if (result.success && result.data) {
          result.data.sort((a: any, b: any) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
          setPastChats(result.data);
        } else {
          setPastChats([]);
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
        setPastChats([]);
      } finally {
        setLoadingChats(false);
      }
    }
    fetchPastChats();
  }, [isAuthenticated]);

  const handleSelectChat = (sessionId: string, botId: string) => {
    setSelectedSessionId(sessionId);
    setSelectedBotId(botId);
    router.push(`/bot/${botId}?sessionId=${sessionId}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedSessionId || isTyping) return;

    // For now, just clear the input since we don't have actual chat functionality on the landing page
    setInputMessage('');
  };

  return (
    <Layout showHeader={false} showFooter={false}>
      <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)]">
        <ChatSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((v: boolean) => !v)}
          onSelectChat={handleSelectChat}
          onStartNewChat={() => {}}
          pastChats={pastChats}
          loadingChats={loadingChats}
          currentSessionId={selectedSessionId || ''}
          currentBotId={selectedBotId || ''}
          isAuthenticated={isAuthenticated}
          formatLastMessage={formatLastMessage}
          formatTime={formatTime}
          sidebarRef={sidebarRef}
        />
        <div className="flex-1 flex flex-col h-screen bg-[var(--background)]">
          {/* Header with centered logo and user icon or sign in button */}
          <div className="relative flex items-center justify-between p-4 bg-[var(--background)]">
            <div className="w-8 h-8"></div>
            <img 
              src="/AsQue Logo NoBG.png" 
              alt="AsQue Logo" 
              className="w-8 h-8 object-contain"
            />
            {isAuthenticated ? (
              <UserDropdown user={user} />
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="signInButton signInButtonSmall"
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
          {/* Main area: text if no chat selected, or sign-in prompt if not logged in */}
          {!selectedSessionId ? (
            !isAuthenticated ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-sm text-[var(--muted-foreground)] text-center mb-4 font-medium leading-snug whitespace-nowrap" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
                  Sign in to save your chats and continue conversations.
                </p>
                <button
                  onClick={() => router.push('/login')}
                  className="signInButton"
                >
                  Sign In
                </button>
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
                  .signInButton:hover {
                    background: rgba(255, 255, 255, 0.8);
                    border-color: rgba(255, 255, 255, 0.3);
                    color: black;
                  }
                `}</style>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="text-sm text-slate-400 text-center opacity-70 hover:opacity-100 hover:text-slate-300 transition-all duration-200 cursor-pointer"
                >
                  Select a chat to continue
                </button>
              </div>
            )
          ) : (
            <div className="flex-1" />
          )}

          {/* Input Area - Fixed at Bottom */}
          {selectedSessionId && (
            <div className="sticky bottom-0 bg-[var(--background)] p-4 w-full">
              <div className="max-w-3xl mx-auto">
                <form onSubmit={sendMessage} className="relative bg-[var(--input-background)] rounded-2xl border border-white/10 p-2 shadow-xl">
                  <div className="flex items-end gap-3">
                    <textarea
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask..."
                      className="flex-1 bg-transparent resize-none border-0 outline-none min-h-[40px] max-h-32 py-2 px-2 text-[var(--foreground)] placeholder:text-[var(--placeholder-foreground)] text-base leading-tight overflow-y-hidden focus:outline-none focus:ring-0 placeholder:opacity-50"
                      rows={1}
                      disabled={isTyping || !isAuthenticated}
                    />
                    <div className="pb-0"> {/* Adjusted padding to match original button alignment */}
                      <button
                        type="submit"
                        disabled={!inputMessage.trim() || isTyping || !isAuthenticated}
                        className={`p-3 rounded-full transition-colors ${
                          inputMessage.trim() && !isTyping && isAuthenticated
                            ? 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90'
                            : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed opacity-40'
                        }`}
                        aria-label="Send message"
                      >
                        {isTyping ? (
                          <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <Send size={18} />
                        )}
                      </button>
                    </div>
                </div>
                </form>
                <div className="text-center text-xs text-[var(--muted-foreground)] mt-2">
                  AsQue can make mistakes. Consider checking important information.
                </div>
                </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 