"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { nanoid } from 'nanoid';
import { useAuth } from '@/components/auth/AuthContext';
import { authenticatedFetch } from '@/lib/auth';
import Layout from '@/components/layout/Layout';
import { User, Send, Menu } from 'lucide-react';
import { Bot, UserChatSummary } from '@/types';
import { ChevronLeft } from 'lucide-react';
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatHeader from "@/components/layout/ChatHeader";

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

  const handleSidebarToggle = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Remove sidebarToggleButton and do not pass leftElement to ChatHeader
  return (
    <Layout showHeader={false} showFooter={false}>
      <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden">
        {/* Sticky Header */}
        <ChatHeader />
        <ChatSidebar
          isOpen={isSidebarOpen}
          onToggle={handleSidebarToggle}
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
        <div className="flex-1 flex flex-col h-screen bg-[var(--background)] min-w-0">
          {/* Main chat area: only this should scroll */}
          <div className="flex-1 min-h-0 flex flex-col overflow-y-auto px-2 sm:px-4 pb-2">
            {!selectedSessionId ? (
              !isAuthenticated ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <p className="text-sm text-[var(--muted-foreground)] text-center mb-4 font-medium leading-snug whitespace-nowrap" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
                    Sign in to save your chats and continue conversations.
                  </p>
                  <button
                    onClick={() => router.push('/login')}
                    className="signInButton"
                    style={{ minWidth: 44, minHeight: 32 }}
                  >
                    Sign In
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="text-sm text-slate-400 text-center opacity-70 hover:opacity-100 hover:text-slate-300 transition-all duration-200 cursor-pointer"
                    style={{ minWidth: 44, minHeight: 32 }}
                  >
                    Select a chat to continue
                  </button>
                </div>
              )
            ) : (
              <div className="flex-1" />
            )}
          </div>
          {/* Sticky Input Area */}
          {selectedSessionId && (
            <div className="sticky bottom-0 z-20 bg-[var(--background)] p-4 w-full border-t border-white/10">
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
                      style={{ minWidth: 0 }}
                    />
                    <div className="pb-0">
                      <button
                        type="submit"
                        disabled={!inputMessage.trim() || isTyping || !isAuthenticated}
                        className={`p-3 rounded-full transition-colors ${
                          inputMessage.trim() && !isTyping && isAuthenticated
                            ? 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90'
                            : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed opacity-40'
                        }`}
                        aria-label="Send message"
                        style={{ minWidth: 44, minHeight: 44 }}
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