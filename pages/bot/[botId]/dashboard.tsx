"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/components/auth/AuthContext';
import { authenticatedFetch } from '@/lib/auth';
import SEO from '@/components/ui/SEO';
import Loading from '@/components/ui/Loading';

interface Bot {
  id: string;
  name: string;
  description?: string;
  profilePictureUrl?: string;
  welcomeMessage?: string;
  status: 'training' | 'deployed';
  ownerId: string;
  trainingMessages: TrainingMessage[];
  createdAt: Date;
  updatedAt: Date;
  deployedAt?: Date;
  analytics?: BotAnalytics;
  unansweredQuestions?: UnansweredQuestion[];
}

interface TrainingMessage {
  id: string;
  content: string;
  timestamp: Date;
  category?: string;
  summary?: string;
  keywords?: string[];
}

interface BotAnalytics {
  totalVisitors: number;
  totalChats: number;
  totalMessages: number;
  averageResponseTime: number;
  lastActiveAt?: Date;
}

interface UnansweredQuestion {
  id: string;
  question: string;
  timestamp: Date;
  sessionId: string;
  isAnswered: boolean;
  creatorResponse?: string;
  respondedAt?: Date;
}

interface ApiResponse {
  success: boolean;
  data?: Bot;
  error?: string;
}

export default function BotDashboard() {
  const router = useRouter();
  const { botId } = router.query;
  const { user, loading: authLoading } = useAuth();
  const [bot, setBot] = useState<Bot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'unanswered' | 'analytics'>('overview');
  
  // Edit form states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    welcomeMessage: '',
    profilePicture: null as File | null,
    profilePicturePreview: null as string | null
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Unanswered questions
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  
  // Analytics loading
  const [analytics, setAnalytics] = useState<BotAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (botId && typeof botId === 'string' && user && !authLoading) {
      fetchBot(botId);
    }
  }, [botId, user, authLoading]);

  useEffect(() => {
    if (botId && typeof botId === 'string' && activeTab === 'analytics' && bot) {
      loadAnalytics(botId);
    }
  }, [activeTab, botId, bot]);

  const fetchBot = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load dashboard data (optimized for performance)
      const response = await authenticatedFetch(`/api/bots/${id}/dashboard`);
      const result = await response.json() as ApiResponse;

      if (result.success && result.data) {
        setBot(result.data);
        setEditForm({
          name: result.data.name,
          description: result.data.description || '',
          welcomeMessage: result.data.welcomeMessage || '',
          profilePicture: null,
          profilePicturePreview: result.data.profilePictureUrl || null
        });
      } else {
        if (response.status === 403) {
          setError("Access denied: You do not own this bot");
        } else {
          setError(result.error || "Bot not found");
        }
      }
    } catch (err: any) {
      console.error("Error fetching bot:", err);
      if (err.name === 'AbortError') {
        setError("Request timed out. Please try again.");
      } else if (err.message?.includes('403')) {
        setError("Access denied: You do not own this bot");
      } else {
        setError("Failed to load bot. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async (botId: string) => {
    if (activeTab !== 'analytics') return;
    
    try {
      setLoadingAnalytics(true);
      const response = await authenticatedFetch(`/api/bots/${botId}/analytics`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image file size must be less than 5MB');
      return;
    }

    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditForm(prev => ({
        ...prev,
        profilePicture: file,
        profilePicturePreview: e.target?.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProfilePicture = () => {
    setEditForm(prev => ({
      ...prev,
      profilePicture: null,
      profilePicturePreview: null
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpdateBot = async () => {
    if (!bot || !editForm.name.trim()) {
      setError('Bot name is required');
      return;
    }

    setIsEditing(true);
    setError(null);

    try {
      let profilePictureUrl = bot.profilePictureUrl;

      // Upload new profile picture if selected
      if (editForm.profilePicture) {
        setIsUploading(true);
        try {
          const formData = new FormData();
          formData.append('file', editForm.profilePicture);
          formData.append('type', 'bot-profile');

          const uploadResponse = await authenticatedFetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error('Upload failed');
          }

          const uploadResult = await uploadResponse.json();
          if (uploadResult.success && uploadResult.url) {
            profilePictureUrl = uploadResult.url;
          }
        } catch (error) {
          setError('Failed to upload profile picture');
          setIsEditing(false);
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      } else if (editForm.profilePicturePreview === null) {
        // User removed the profile picture
        profilePictureUrl = undefined;
      }

      const updateData = {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        welcomeMessage: editForm.welcomeMessage.trim() || undefined,
        profilePictureUrl
      };

      const response = await authenticatedFetch(`/api/bots/${bot.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      const result = await response.json() as ApiResponse;

      if (result.success && result.data) {
        setBot(result.data);
        setActiveTab('overview');
        // Show success message (you could add a toast notification here)
      } else {
        setError(result.error || 'Failed to update bot');
      }
    } catch (error) {
      console.error('Error updating bot:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteBot = async () => {
    if (!bot) return;

    setIsDeleting(true);
    try {
      const response = await authenticatedFetch(`/api/bots/${bot.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        router.push('/my-bots');
      } else {
        setError(result.error || 'Failed to delete bot');
      }
    } catch (error) {
      console.error('Error deleting bot:', error);
      setError('Failed to delete bot');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRespondToQuestion = async (questionId: string) => {
    if (!responseText.trim()) return;

    setIsResponding(true);
    try {
      const response = await authenticatedFetch(`/api/bots/${bot?.id}/unanswered/${questionId}`, {
        method: 'POST',
        body: JSON.stringify({ response: responseText.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh bot data to get updated unanswered questions
        if (bot) {
          await fetchBot(bot.id);
        }
        setRespondingTo(null);
        setResponseText('');
      } else {
        setError(result.error || 'Failed to respond to question');
      }
    } catch (error) {
      console.error('Error responding to question:', error);
      setError('Failed to respond to question');
    } finally {
      setIsResponding(false);
    }
  };

  const handleDeployBot = async () => {
    if (!bot) return;

    try {
      const response = await authenticatedFetch(`/api/bots/${bot.id}/deploy`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        await fetchBot(bot.id);
      } else {
        setError(result.error || 'Failed to deploy bot');
      }
    } catch (error) {
      console.error('Error deploying bot:', error);
      setError('Failed to deploy bot');
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
          <p className="text-slate-300 font-medium">Loading bot dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !bot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="max-w-md mx-auto p-8 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-slate-400 mb-6">{error || "Bot not found"}</p>
          <Button
            onClick={() => router.push("/my-bots")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            Back to My Bots
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title={`${bot.name} Dashboard`}
        description={`Manage your AI chatbot ${bot.name}. Edit settings, view analytics, and respond to questions.`}
      />
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
          {/* Header */}
          <div className="bg-slate-800/30 backdrop-blur-xl border-b border-slate-700/30 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/my-bots")}
                    className="text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </Button>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center overflow-hidden">
                      {bot.profilePictureUrl ? (
                        <img 
                          src={bot.profilePictureUrl} 
                          alt={`${bot.name} profile`} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to icon if image fails to load
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <svg className={`w-6 h-6 text-white ${bot.profilePictureUrl ? 'hidden' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-xl font-semibold text-white">{bot.name}</h1>
                      <div className="flex items-center gap-2">
                        <Badge variant={bot.status === 'deployed' ? 'default' : 'secondary'}>
                          {bot.status === 'deployed' ? 'Live' : 'Training'}
                        </Badge>
                        <span className="text-sm text-slate-400">•</span>
                        <span className="text-sm text-slate-400">{bot.trainingMessages.length} training messages</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => router.push(`/bot/${bot.id}/train`)}
                    variant="outline"
                    className="bg-slate-700/30 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Train Bot
                  </Button>
                  {bot.status === 'training' ? (
                    <Button
                      onClick={handleDeployBot}
                      disabled={bot.trainingMessages.length === 0}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Deploy Bot
                    </Button>
                  ) : (
                    <Button
                      onClick={() => router.push(`/bot/${bot.id}`)}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      View Public Chat
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex space-x-1 bg-slate-800/30 backdrop-blur-sm rounded-xl p-1 mb-8">
              {[
                { id: 'overview', label: 'Overview', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                { id: 'edit', label: 'Edit Bot', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
                { id: 'unanswered', label: `Unanswered (${bot.unansweredQuestions?.length || 0})`, icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50 p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-slate-400">Total Visitors</p>
                        <p className="text-2xl font-bold text-white">
                          {loadingAnalytics ? (
                            <Loading size="sm" />
                          ) : (
                            analytics?.totalVisitors || bot.analytics?.totalVisitors || 0
                          )}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50 p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-slate-400">Total Chats</p>
                        <p className="text-2xl font-bold text-white">
                          {loadingAnalytics ? (
                            <Loading size="sm" />
                          ) : (
                            analytics?.totalChats || bot.analytics?.totalChats || 0
                          )}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50 p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-slate-400">Training Data</p>
                        <p className="text-2xl font-bold text-white">{bot.trainingMessages.length}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50 p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-slate-400">Unanswered</p>
                        <p className="text-2xl font-bold text-white">{bot.unansweredQuestions?.filter(q => !q.isAnswered).length || 0}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Bot Info */}
                <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Bot Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Description</p>
                      <p className="text-white">{bot.description || 'No description provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Welcome Message</p>
                      <p className="text-white">{bot.welcomeMessage || 'Default welcome message'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Created</p>
                      <p className="text-white">{new Date(bot.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Last Updated</p>
                      <p className="text-white">{new Date(bot.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {bot.status === 'deployed' && (
                    <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <h4 className="text-green-300 font-medium mb-2">Public URL</h4>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={`${window.location.origin}/bot/${bot.id}`}
                          readOnly
                          className="flex-1 text-sm bg-slate-700/50 border border-slate-600/50 rounded px-3 py-2 text-slate-300"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/bot/${bot.id}`);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Danger Zone */}
                <Card className="bg-red-500/10 border-red-500/30 p-6">
                  <h3 className="text-lg font-semibold text-red-300 mb-4">Danger Zone</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Delete Bot</p>
                      <p className="text-sm text-slate-400">This action cannot be undone. All data will be permanently deleted.</p>
                    </div>
                    <Button
                      onClick={() => setShowDeleteConfirm(true)}
                      variant="outline"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-500"
                    >
                      Delete Bot
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Edit Tab Content */}
            {activeTab === 'edit' && (
              <div className="space-y-6">
                <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Edit Bot Information</h3>
                  
                  <div className="space-y-6">
                    {/* Profile Picture Section */}
                    <div className="space-y-3">
                      <label className="block text-lg font-semibold text-white mb-3">
                        Bot Profile Picture
                        <span className="text-slate-400 text-sm ml-2">(optional)</span>
                      </label>
                      
                      <div className="flex items-center space-x-4">
                        {/* Profile Picture Preview */}
                        <div className="relative">
                          <div className="w-20 h-20 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center overflow-hidden">
                            {editForm.profilePicturePreview ? (
                              <img
                                src={editForm.profilePicturePreview}
                                alt="Profile preview"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to icon if image fails to load
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-12 h-12 text-slate-400 ${editForm.profilePicturePreview ? 'hidden' : ''}`}>
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          </div>
                          
                          {/* Remove button */}
                          {editForm.profilePicturePreview && (
                            <button
                              type="button"
                              onClick={handleRemoveProfilePicture}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                              disabled={isUploading}
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>

                        {/* Upload Button */}
                        <div className="flex-1">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={isUploading}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-full px-4 py-3 border border-slate-600/50 rounded-xl text-sm font-medium text-white bg-slate-800/50 hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                          >
                            {isUploading ? (
                              <div className="flex items-center justify-center">
                                <Loading size="sm" />
                                <span className="ml-2">Uploading...</span>
                              </div>
                            ) : (
                              'Choose Image'
                            )}
                          </button>
                          <p className="text-xs text-slate-400 mt-1">
                            JPEG, PNG, GIF, WebP • Max 5MB
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bot Name */}
                    <div>
                      <label htmlFor="edit-name" className="block text-lg font-semibold text-white mb-3">
                        Bot Name *
                      </label>
                      <input
                        type="text"
                        id="edit-name"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Customer Support Bot"
                        className="w-full px-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-lg"
                        disabled={isEditing}
                        maxLength={100}
                      />
                    </div>

                    {/* Bot Description */}
                    <div>
                      <label htmlFor="edit-description" className="block text-lg font-semibold text-white mb-3">
                        Bot Description
                        <span className="text-slate-400 text-sm ml-2">(optional)</span>
                      </label>
                      <textarea
                        id="edit-description"
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe what your bot does"
                        rows={4}
                        className="w-full px-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-300 text-lg"
                        disabled={isEditing}
                        maxLength={500}
                      />
                    </div>

                    {/* Welcome Message */}
                    <div>
                      <label htmlFor="edit-welcome" className="block text-lg font-semibold text-white mb-3">
                        Custom Welcome Message
                        <span className="text-slate-400 text-sm ml-2">(optional)</span>
                      </label>
                      <textarea
                        id="edit-welcome"
                        value={editForm.welcomeMessage}
                        onChange={(e) => setEditForm(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                        placeholder="Hi! I'm your AI assistant. How can I help you today?"
                        rows={3}
                        className="w-full px-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-300 text-lg"
                        disabled={isEditing}
                        maxLength={200}
                      />
                      <p className="text-xs text-slate-400 mt-2">
                        This message will be shown to users when they first chat with your bot
                      </p>
                    </div>

                    {/* Error Display */}
                    {error && (
                      <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <p className="text-red-300">{error}</p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setActiveTab('overview');
                          setError(null);
                        }}
                        className="flex-1 bg-slate-700/30 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                        disabled={isEditing}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdateBot}
                        disabled={isEditing || !editForm.name.trim()}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {isEditing ? (
                          <div className="flex items-center">
                            <Loading size="sm" />
                            <span className="ml-2">Updating...</span>
                          </div>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Unanswered Questions Tab Content */}
            {activeTab === 'unanswered' && (
              <div className="space-y-6">
                <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Unanswered Questions</h3>
                  <p className="text-slate-400 mb-6">
                    These are questions that your bot couldn't answer. Respond to them to improve your bot's knowledge.
                  </p>

                  {(!bot.unansweredQuestions || bot.unansweredQuestions.length === 0) ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-white mb-2">All caught up!</h4>
                      <p className="text-slate-400">
                        No unanswered questions at the moment. Your bot is handling all queries well.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bot.unansweredQuestions.filter(q => !q.isAnswered).map((question) => (
                        <Card key={question.id} className="bg-slate-700/30 border-slate-600/50 p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="text-white font-medium mb-2">User Question</h4>
                              <p className="text-slate-300 mb-3 leading-relaxed">{question.question}</p>
                              <div className="flex items-center text-sm text-slate-400 space-x-4">
                                <span>📅 {new Date(question.timestamp).toLocaleDateString()}</span>
                                <span>🕒 {new Date(question.timestamp).toLocaleTimeString()}</span>
                                <span>💬 Session: {question.sessionId.slice(-6)}</span>
                              </div>
                            </div>
                            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                              Pending
                            </Badge>
                          </div>

                          {respondingTo === question.id ? (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                  Your Response
                                </label>
                                <textarea
                                  value={responseText}
                                  onChange={(e) => setResponseText(e.target.value)}
                                  placeholder="Provide a helpful answer to this question..."
                                  rows={4}
                                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                  disabled={isResponding}
                                />
                              </div>
                              <div className="flex gap-3">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setRespondingTo(null);
                                    setResponseText('');
                                  }}
                                  className="bg-slate-700/30 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                                  disabled={isResponding}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => handleRespondToQuestion(question.id)}
                                  disabled={isResponding || !responseText.trim()}
                                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                >
                                  {isResponding ? (
                                    <div className="flex items-center">
                                      <Loading size="sm" />
                                      <span className="ml-2">Responding...</span>
                                    </div>
                                  ) : (
                                    'Submit Response'
                                  )}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              onClick={() => setRespondingTo(question.id)}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              Respond to Question
                            </Button>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* Analytics Tab Content */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Analytics Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Total Visitors</p>
                        <p className="text-3xl font-bold text-white">
                          {loadingAnalytics ? (
                            <Loading size="sm" />
                          ) : (
                            analytics?.totalVisitors || bot.analytics?.totalVisitors || 0
                          )}
                        </p>
                        <p className="text-xs text-green-400 mt-1">↗ +12% this week</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Total Chats</p>
                        <p className="text-3xl font-bold text-white">
                          {loadingAnalytics ? (
                            <Loading size="sm" />
                          ) : (
                            analytics?.totalChats || bot.analytics?.totalChats || 0
                          )}
                        </p>
                        <p className="text-xs text-green-400 mt-1">↗ +8% this week</p>
                      </div>
                      <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Total Messages</p>
                        <p className="text-3xl font-bold text-white">
                          {loadingAnalytics ? (
                            <Loading size="sm" />
                          ) : (
                            analytics?.totalMessages || bot.analytics?.totalMessages || 0
                          )}
                        </p>
                        <p className="text-xs text-green-400 mt-1">↗ +15% this week</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Avg Response Time</p>
                        <p className="text-3xl font-bold text-white">
                          {loadingAnalytics ? (
                            <Loading size="sm" />
                          ) : (
                            `${analytics?.averageResponseTime || bot.analytics?.averageResponseTime || 0}ms`
                          )}
                        </p>
                        <p className="text-xs text-green-400 mt-1">↘ -5% faster</p>
                      </div>
                      <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Performance Insights */}
                <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Performance Insights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-white font-medium mb-3">Bot Health Score</h4>
                      <div className="flex items-center mb-2">
                        <div className="flex-1 bg-slate-700 rounded-full h-3 mr-4">
                          <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                        <span className="text-white font-bold">85%</span>
                      </div>
                      <p className="text-sm text-slate-400">Excellent performance! Your bot is responding well to user queries.</p>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-3">User Satisfaction</h4>
                      <div className="flex items-center mb-2">
                        <div className="flex-1 bg-slate-700 rounded-full h-3 mr-4">
                          <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full" style={{ width: '92%' }}></div>
                        </div>
                        <span className="text-white font-bold">92%</span>
                      </div>
                      <p className="text-sm text-slate-400">Users are highly satisfied with your bot's responses.</p>
                    </div>
                  </div>
                </Card>

                {/* Usage Trends */}
                <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Usage Trends</h3>
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-600/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-white mb-2">Charts Coming Soon</h4>
                    <p className="text-slate-400">
                      Detailed usage charts and trends will be available in the next update.
                    </p>
                  </div>
                </Card>
              </div>
            )}

          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Delete Bot</h3>
                  <p className="text-slate-400">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-slate-300 mb-4">
                  Are you sure you want to delete <strong>{bot?.name}</strong>? This will permanently delete:
                </p>
                <ul className="text-sm text-slate-400 space-y-1 ml-4">
                  <li>• All training data ({bot?.trainingMessages.length} messages)</li>
                  <li>• Chat history and analytics</li>
                  <li>• Public bot access</li>
                  <li>• All associated data</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-slate-700/30 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteBot}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? (
                    <div className="flex items-center">
                      <Loading size="sm" />
                      <span className="ml-2">Deleting...</span>
                    </div>
                  ) : (
                    'Delete Forever'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </ProtectedRoute>
    </>
  );
} 