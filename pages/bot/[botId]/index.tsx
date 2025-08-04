import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { nanoid } from 'nanoid';
import { Bot, ChatMessage, ChatWithBotRequest, ChatWithBotResponse, ChatSession, GetChatSessionResponse, UserChatSummary, GetUserChatsResponse } from '@/types';
import { useAuth } from '@/components/auth/AuthContext';
import { authenticatedFetch, signOut, formatPhoneNumber } from '@/lib/auth';
import LoginPopup from '@/components/auth/LoginPopup';
import Layout from '@/components/layout/Layout';
import Loading from '@/components/ui/Loading';
import TypingIndicator from '@/components/ui/TypingIndicator';
import ChatSidebar from "@/components/chat/ChatSidebar";
import { renderTextWithLinks } from '@/components/ui/LinkRenderer';

// Import Lucide icons for the new UI
import { Send, User, Star, MessageSquare, ChevronLeft, Menu } from 'lucide-react';
import ChatHeader from "@/components/layout/ChatHeader";

// Custom 2-line menu icon
const TwoLineMenuIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="8" x2="20" y2="8" />
    <line x1="4" y1="16" x2="20" y2="16" />
  </svg>
);

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

// Define the ChatMainArea component (nested within PublicBotPage for single-file copy-paste)
interface ChatMainAreaProps {
  bot: Bot;
  messages: ChatMessage[];
  inputMessage: string;
  setInputMessage: (message: string) => void;
  sendMessage: (e: React.FormEvent) => Promise<void>;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  isTyping: boolean;
  chatEndRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  isAuthenticated: boolean;
  user: any;
  router: ReturnType<typeof useRouter>;
}

const ChatMainArea: React.FC<ChatMainAreaProps> = ({
  bot,
  messages,
  inputMessage,
  setInputMessage,
  sendMessage,
  handleKeyPress,
  isTyping,
  chatEndRef,
  inputRef,
  isAuthenticated,
  user,
  router,
}) => {
  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [inputMessage]);

  return (
    <div className="flex-1 flex flex-col h-screen bg-[var(--background)] pt-16">
      {/* Header - now removed, handled by ChatHeader */}
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* Messages */}
        <div className="max-w-4xl mx-auto p-4 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'bot' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {bot.profilePictureUrl ? (
                      <img
                        src={bot.profilePictureUrl}
                        alt={`${bot.name} profile`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-white text-sm">🤖</span>';
                        }}
                      />
                    ) : (
                      <span className="text-white text-sm">🤖</span>
                    )}
                  </div>
                )}

                <div
                  className={`max-w-[80%] p-4 rounded-2xl shadow-md ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white rounded-2xl shadow-md ml-12'
                      : 'bg-slate-800/80 text-slate-200 rounded-2xl shadow-md mr-12'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {renderTextWithLinks(message.content)}
                  </div>
                </div>

                {message.type === 'user' && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-slate-700 to-slate-900">
                    <User size={16} className="text-white" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start gap-3 max-w-[80%]">
                  <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {bot.profilePictureUrl ? (
                      <img
                        src={bot.profilePictureUrl}
                        alt={`${bot.name} profile`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-white text-sm">🤖</span>';
                        }}
                      />
                    ) : (
                      <span className="text-white text-sm">🤖</span>
                    )}
                  </div>
                  <div className="bg-slate-800/80 text-slate-200 rounded-2xl shadow-md px-6 py-4 flex items-center">
                    <TypingIndicator />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
      </div>

      {/* Input Area - Fixed at Bottom */}
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
                disabled={isTyping}
              />
              <div className="pb-0"> {/* Adjusted padding to match original button alignment */}
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isTyping}
                  className={`p-3 rounded-full transition-colors ${
                    inputMessage.trim() && !isTyping
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
    </div>
  );
};


export default function PublicBotPage() {
  const router = useRouter();
  const { botId, sessionId: urlSessionId } = router.query;
  const { user, isAuthenticated } = useAuth();
  const [bot, setBot] = useState<Bot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  // Initialize sessionId from URL or generate new
  const [currentSessionId, setCurrentSessionId] = useState(() =>
    typeof urlSessionId === 'string' ? urlSessionId : `session_${nanoid(12)}`
  );
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [messagesSent, setMessagesSent] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sidebar state
  const initialSidebarOpen = !botId;
  const [isSidebarOpen, setIsSidebarOpen] = useState(initialSidebarOpen);
  const [pastChats, setPastChats] = useState<UserChatSummary[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // --- Data Fetching Functions ---
  const fetchPastChats = useCallback(async () => {
    if (!isAuthenticated) {
      setPastChats([]);
      setLoadingChats(false);
      return;
    }
    try {
      setLoadingChats(true);
      const response = await authenticatedFetch('/api/chats');
      const result: GetUserChatsResponse = await response.json();

      if (result.success && result.data) {
        // Sort by last message time, most recent first
        result.data.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
        setPastChats(result.data);
      } else {
        console.error('Failed to load past chats:', result.error);
        setPastChats([]);
      }
    } catch (err) {
      console.error('Error fetching past chats:', err);
      setPastChats([]);
    } finally {
      setLoadingChats(false);
    }
  }, [isAuthenticated]);

  // --- Initial Bot and Session Loading ---
  useEffect(() => {
    if (botId && typeof botId === 'string') {
      fetchBot(botId);
    }
  }, [botId]);

  useEffect(() => {
    // If authenticated and a session ID from URL is present, load it
    if (isAuthenticated && typeof urlSessionId === 'string' && bot) {
      loadChatSession(urlSessionId);
    } else if (bot && bot.status === 'deployed' && !urlSessionId) {
      // If no URL session ID, and bot is deployed, start a fresh session with a welcome message
      const welcomeMessage: ChatMessage = {
        id: `msg_${nanoid()}`,
        type: 'bot',
        content: bot.welcomeMessage || `👋 Hi! I'm ${bot.name}. ${bot.description || 'I\'m here to help answer your questions!'} How can I assist you today?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      setCurrentSessionId(`session_${nanoid(12)}`); // Ensure a new session ID for truly new chats
    }
  }, [isAuthenticated, urlSessionId, bot]);

  // Only redirect to latest chat if user just logged in and is on the home page
  useEffect(() => {
    if (isAuthenticated && pastChats.length > 0 && router.pathname === '/') {
      const latestChat = pastChats[0];
      if (latestChat && latestChat.sessionId && latestChat.botId) {
        router.push(`/bot/${latestChat.botId}?sessionId=${latestChat.sessionId}`);
      }
    }
    // Only run when isAuthenticated transitions to true and pastChats updates
  }, [isAuthenticated, pastChats, router.pathname]);


  // --- Chat Management Effects ---
  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  // --- Sidebar Management Effects ---
  useEffect(() => {
    // Fetch all past chats if user is authenticated
    if (isAuthenticated) {
      fetchPastChats();
    } else {
      setPastChats([]); // Clear past chats if user logs out
      setLoadingChats(false);
    }
  }, [isAuthenticated, fetchPastChats]);

  // Refresh sidebar when messages change to keep current chat updated
  useEffect(() => {
    if (isAuthenticated && messages.length > 0 && currentSessionId && botId) {
      // Update the current chat in the sidebar with the latest message
      setPastChats(prevChats => {
        const updatedChats = [...prevChats];
        const currentChatIndex = updatedChats.findIndex(chat => 
          chat.sessionId === currentSessionId && chat.botId === botId
        );
        
        const lastMessage = messages[messages.length - 1];
        
        if (currentChatIndex !== -1) {
          // Update existing chat
          updatedChats[currentChatIndex] = {
            ...updatedChats[currentChatIndex],
            lastMessage: lastMessage.content,
            lastMessageTime: lastMessage.timestamp,
            messageCount: messages.length,
            isActive: true
          };
        } else {
          // Add new chat at the top
          const newChat: UserChatSummary = {
            sessionId: currentSessionId,
            botId: botId as string,
            botName: bot?.name || 'Bot',
            botProfilePictureUrl: bot?.profilePictureUrl,
            lastMessage: lastMessage.content,
            lastMessageTime: lastMessage.timestamp,
            messageCount: messages.length,
            isActive: true
          };
          updatedChats.unshift(newChat);
        }
        
        // Sort by last message time, most recent first
        return updatedChats.sort((a, b) => 
          new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        );
      });
    }
  }, [messages, currentSessionId, botId, isAuthenticated, bot]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  // --- Utility Functions ---
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatLastMessage = (message: string, maxLength: number = 40) => {
    if (!message) return "No messages yet.";
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const formatTime = (date: Date | string) => {
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
  };

  // --- Data Fetching Functions ---
  const fetchBot = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bots/${id}/public`);
      const result = await response.json();

      if (result.success && result.data) {
        setBot(result.data);
      } else {
        setError(result.error || 'Bot not found');
      }
    } catch (err) {
      setError('Failed to load bot');
    } finally {
      setLoading(false);
    }
  };

  const loadChatSession = async (sessionIdToLoad: string) => {
    try {
      // Set the current session ID to the one we are loading
      setCurrentSessionId(sessionIdToLoad);

      const response = await authenticatedFetch(`/api/chats/${sessionIdToLoad}`);
      const result: GetChatSessionResponse = await response.json();

      if (result.success && result.data) {
        setMessages(result.data.messages);
        setMessagesSent(result.data.messageCount);
        console.log(`✅ Loaded existing chat session with ${result.data.messages.length} messages`);
      } else {
        console.log(`❌ Failed to load chat session ${sessionIdToLoad}, starting fresh`);
        // If session not found/accessible, ensure a new fresh session for this bot
        setMessages([]); // Clear existing messages
        setCurrentSessionId(`session_${nanoid(12)}`); // Generate a new ID
        if (bot && bot.status === 'deployed') {
          const welcomeMessage: ChatMessage = {
            id: `msg_${nanoid()}`,
            type: 'bot',
            content: bot.welcomeMessage || `👋 Hi! I'm ${bot.name}. ${bot.description || 'I\'m here to help answer your questions!'} How can I assist you today?`,
            timestamp: new Date()
          };
          setMessages([welcomeMessage]);
        }
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
      setMessages([]);
      setCurrentSessionId(`session_${nanoid(12)}`);
      if (bot && bot.status === 'deployed') {
        const welcomeMessage: ChatMessage = {
          id: `msg_${nanoid()}`,
          type: 'bot',
          content: bot.welcomeMessage || `👋 Hi! I'm ${bot.name}. ${bot.description || 'I\'m here to help answer your questions!'} How can I assist you today?`,
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }
    }
  };

  // --- Event Handlers ---
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !bot || isTyping) return;
    
    // Check if bot is deployed
    if (bot.status !== 'deployed') {
      const errorMessage: ChatMessage = {
        id: `msg_${nanoid()}`,
        type: 'bot',
        content: 'Sorry, this bot is not deployed yet. Please try again later.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg_${nanoid()}`,
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setMessagesSent(prev => prev + 1);

    try {
      console.log('🔧 Debug: Sending chat request');
      console.log('  Bot ID from URL:', botId);
      console.log('  Bot ID from object:', bot.id);
      console.log('  Message:', userMessage.content);
      console.log('  Session ID:', currentSessionId);
      
      const requestData: ChatWithBotRequest = {
        botId: bot.id,
        message: userMessage.content,
        sessionId: currentSessionId // Use the currentSessionId state
      };

      const response = isAuthenticated
        ? await authenticatedFetch(`/api/bots/${bot.id}/chat`, {
            method: 'POST',
            body: JSON.stringify(requestData)
          })
        : await fetch(`/api/bots/${bot.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      console.log('🔧 Debug: Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Chat API error:', errorText);
      }

      const result: ChatWithBotResponse = await response.json();

      if (result.success && result.data) {
        const botMessage: ChatMessage = {
          id: `msg_${nanoid()}`,
          type: 'bot',
          content: result.data.message,
          timestamp: new Date(),
          metadata: {
            confidence: result.data.confidence,
            responseTime: result.data.responseTime
          }
        };
        setMessages(prev => [...prev, botMessage]);
        if (isAuthenticated) {
          fetchPastChats(); // Refresh all past chats
        }
      } else {
        const errorMessage: ChatMessage = {
          id: `msg_${nanoid()}`,
          type: 'bot',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: `msg_${nanoid()}`,
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleSelectChat = (selectedSessionId: string, selectedBotId: string) => {
    router.push(`/bot/${selectedBotId}?sessionId=${selectedSessionId}`);
    setIsSidebarOpen(false); // Close sidebar after selecting a chat
  };

  const handleStartNewChat = () => {
    router.push(`/bot/${botId}`);
    setIsSidebarOpen(false); // Close sidebar
    setMessages([]); // Clear current messages
    setCurrentSessionId(`session_${nanoid(12)}`); // Generate a new session ID for immediate use
    if (bot) {
      const welcomeMessage: ChatMessage = {
        id: `msg_${nanoid()}`,
        type: 'bot',
        content: bot.welcomeMessage || `👋 Hi! I'm ${bot.name}. How can I assist you today?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  };


  // --- Render Logic (Loading, Error, Bot Status) ---
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
          <p className="text-slate-300 font-medium">Loading bot...</p>
        </div>
      </div>
    );
  }

  if (error || !bot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
              <img
                src="/AsQue Logo NoBG.png"
                alt="AsQue Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Bot Not Found</h1>
          <p className="text-slate-300 mb-6">{error || 'This bot doesn\'t exist or hasn\'t been deployed yet.'}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (bot.status !== 'deployed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
              <img
                src="/AsQue Logo NoBG.png"
                alt="AsQue Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <h1 className="2xl font-bold text-white mb-2">Bot Under Training</h1>
          <p className="text-slate-300 mb-6">This bot is still being trained and isn't ready for public use yet.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
          >
            Create Your Own Bot
          </button>
        </div>
      </div>
    );
  }

  // --- Main Component Render ---
  const sidebarToggleButton = (
    <button
      onClick={toggleSidebar}
      className="text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 p-2 rounded-full"
      aria-label="Toggle sidebar"
    >
      <Menu size={22} />
    </button>
  );

  return (
    <Layout showHeader={false} showFooter={false}>
      <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)]">
        {/* Sidebar Component */}
        <ChatSidebar
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
          onSelectChat={handleSelectChat}
          onStartNewChat={handleStartNewChat}
          pastChats={pastChats}
          loadingChats={loadingChats}
          currentSessionId={currentSessionId}
          currentBotId={Array.isArray(botId) ? botId[0] : (botId || "")}
          isAuthenticated={isAuthenticated}
          formatLastMessage={formatLastMessage}
          formatTime={formatTime}
          sidebarRef={sidebarRef}
        />

        {/* Main Chat Area Component */}
        <ChatHeader botName={bot?.name} />
        <div className="flex-1 flex flex-col h-screen bg-[var(--background)]">
          {botId ? (
            <ChatMainArea
              bot={bot}
              messages={messages}
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              sendMessage={sendMessage}
              handleKeyPress={handleKeyPress}
              isTyping={isTyping}
              chatEndRef={chatEndRef}
              inputRef={inputRef}
              isAuthenticated={isAuthenticated}
              user={user}
              router={router}
            />
          ) : (
            <Loading />
          )}
        </div>
      </div>

      {/* Login Popup - Disabled for unauthenticated chat */}
      {/* <LoginPopup
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        onSuccess={() => {
          setShowLoginPopup(false);
          if (inputMessage.trim()) {
            sendMessage(new Event('submit') as any);
          }
        }}
        botName={bot?.name}
      /> */}
    </Layout>
  );
}
