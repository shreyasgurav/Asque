import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { nanoid } from 'nanoid';
import { Bot, ChatMessage, ChatWithBotRequest, ChatWithBotResponse, ChatSession, GetChatSessionResponse } from '@/types';
import { useAuth } from '@/components/auth/AuthContext';
import { authenticatedFetch } from '@/lib/auth';
import LoginPopup from '@/components/auth/LoginPopup';
import Layout from '@/components/layout/Layout';

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
  const [sessionId] = useState(() => 
    typeof urlSessionId === 'string' ? urlSessionId : `session_${nanoid(12)}`
  );
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [messagesSent, setMessagesSent] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (botId && typeof botId === 'string') {
      fetchBot(botId);
    }
  }, [botId]);

  useEffect(() => {
    // Load existing chat session if user is authenticated and sessionId is provided
    if (isAuthenticated && typeof urlSessionId === 'string' && bot) {
      loadChatSession(urlSessionId);
    }
  }, [isAuthenticated, urlSessionId, bot]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Auto-focus input when page loads
    if (inputRef.current && bot && bot.status === 'deployed') {
      inputRef.current.focus();
    }
  }, [bot]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchBot = async (id: string) => {
    try {
      setLoading(true);
      // Use a public endpoint that doesn't require authentication
      const response = await fetch(`/api/bots/${id}/public`);
      const result = await response.json();

      if (result.success && result.data) {
        setBot(result.data);
        // Add welcome message if bot is deployed and no existing session
        if (result.data.status === 'deployed' && !urlSessionId) {
          const welcomeMessage: ChatMessage = {
            id: `msg_${nanoid()}`,
            type: 'bot',
            content: result.data.welcomeMessage || `👋 Hi! I'm ${result.data.name}. ${result.data.description || 'I\'m here to help answer your questions!'} How can I assist you today?`,
            timestamp: new Date()
          };
          setMessages([welcomeMessage]);
        }
      } else {
        setError(result.error || 'Bot not found');
      }
    } catch (err) {
      setError('Failed to load bot');
    } finally {
      setLoading(false);
    }
  };

  const loadChatSession = async (sessionId: string) => {
    try {
      const response = await authenticatedFetch(`/api/chats/${sessionId}`);
      const result: GetChatSessionResponse = await response.json();

      if (result.success && result.data) {
        setMessages(result.data.messages);
        setMessagesSent(result.data.messageCount);
        console.log(`✅ Loaded existing chat session with ${result.data.messages.length} messages`);
      } else {
        console.log('❌ Failed to load chat session, starting fresh');
        // If session doesn't exist or access denied, start fresh
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
      // Fallback to fresh session
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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !bot || isTyping) return;

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

    // Show login popup after 3 messages if user is not authenticated
    if (!isAuthenticated && messagesSent >= 2) {
      setShowLoginPopup(true);
      setIsTyping(false);
      return;
    }

    try {
      const requestData: ChatWithBotRequest = {
        botId: bot.id,
        message: userMessage.content,
        sessionId
      };

      const response = isAuthenticated 
        ? await authenticatedFetch(`/api/bots/${botId}/chat`, {
            method: 'POST',
            body: JSON.stringify(requestData)
          })
        : await fetch(`/api/bots/${botId}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
          });

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
          <h1 className="text-2xl font-bold text-white mb-2">Bot Under Training</h1>
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

  return (
    <Layout>
      {/* Enhanced Chat Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-slate-600/50 rounded-2xl backdrop-blur-sm min-h-[600px] flex flex-col shadow-2xl">
          {/* Messages */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[500px] space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md`}>
                  {message.type === 'bot' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                        {bot.profilePictureUrl ? (
                          <img 
                            src={bot.profilePictureUrl} 
                            alt={`${bot.name} profile`} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.warn('Profile picture failed to load:', bot.profilePictureUrl);
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-white text-sm">🤖</span>';
                            }}
                          />
                        ) : (
                          <span className="text-white text-sm">🤖</span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex-1">
                    <div
                      className={`p-4 rounded-2xl ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                          : 'bg-slate-700/80 text-slate-200 border border-slate-600/50'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                      {message.metadata?.responseTime && (
                        <span className="ml-2">({message.metadata.responseTime}ms)</span>
                      )}
                    </p>
                  </div>
                  {message.type === 'user' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-sm">👤</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Enhanced Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3 max-w-xs lg:max-w-md">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                      {bot.profilePictureUrl ? (
                        <img 
                          src={bot.profilePictureUrl} 
                          alt={`${bot.name} profile`} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.warn('Profile picture failed to load:', bot.profilePictureUrl);
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-white text-sm">🤖</span>';
                          }}
                        />
                      ) : (
                        <span className="text-white text-sm">🤖</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-slate-700/80 text-slate-200 p-4 rounded-2xl border border-slate-600/50">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Enhanced Input Area */}
          <div className="border-t border-slate-600/50 p-6">
            <form onSubmit={sendMessage} className="flex space-x-4">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-300"
                  rows={1}
                  disabled={isTyping}
                />
              </div>
              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                {isTyping ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 bg-slate-800/50 text-slate-400 border border-slate-600/50 px-4 py-2 rounded-full text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Powered by{' '}
            <button
              onClick={() => router.push('/')}
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
            >
              AsQue
            </button>
            {' '}- Create your own smart chatbot
          </div>
        </div>
      </div>

      {/* Login Popup */}
      <LoginPopup
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        onSuccess={() => {
          setShowLoginPopup(false);
          // Continue with the message that triggered the popup
          if (inputMessage.trim()) {
            sendMessage(new Event('submit') as any);
          }
        }}
        botName={bot?.name}
      />
    </Layout>
  );
} 