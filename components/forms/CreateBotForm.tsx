import React, { useState } from 'react';
import { CreateBotRequest, CreateBotResponse } from '@/types';
import { useAuth } from '@/components/auth/AuthContext';
import { authenticatedFetch } from '@/lib/auth';
import Loading from '@/components/ui/Loading';

interface CreateBotFormProps {
  onSuccess: (botId: string) => void;
  onError: (error: string) => void;
}

interface FormData {
  name: string;
  description: string;
  welcomeMessage: string;
}

export default function CreateBotForm({ onSuccess, onError }: CreateBotFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    welcomeMessage: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Bot name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!user) {
        setError('You must be logged in to create a bot');
        return;
      }

      const requestData: CreateBotRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        welcomeMessage: formData.welcomeMessage.trim() || undefined,
        ownerId: user.uid
      };

      const response = await authenticatedFetch('/api/bots/create', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setError(`Failed to create bot: ${errorText}`);
        return;
      }

      const result: CreateBotResponse = await response.json();

      if (result.success && result.data) {
        onSuccess(result.data.bot.id);
      } else {
        setError(result.error || 'Failed to create bot');
      }
    } catch (error) {
      console.error('Error creating bot:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-slate-600/50 rounded-xl backdrop-blur-sm p-4 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative z-10">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Bot Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-white mb-1">
              Bot Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Write name of your Chat"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm"
              disabled={isLoading}
              maxLength={100}
            />
          </div>

          {/* Bot Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-white mb-1">
              Bot Purpose / Description
              <span className="text-slate-400 text-xs ml-2">(optional)</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Write what your bot does in simple words"
              rows={2}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-300 text-sm"
              disabled={isLoading}
              maxLength={500}
            />
          </div>

          {/* Custom Welcome Message */}
          <div>
            <label htmlFor="welcomeMessage" className="block text-sm font-semibold text-white mb-1">
              Custom Welcome Message
              <span className="text-slate-400 text-xs ml-2">(optional)</span>
            </label>
            <textarea
              id="welcomeMessage"
              value={formData.welcomeMessage}
              onChange={(e) => setFormData(prev => ({ ...prev, welcomeMessage: e.target.value }))}
              placeholder="Hi! I'm your AI assistant. How can I help you today?"
              rows={2}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-300 text-sm"
              disabled={isLoading}
              maxLength={200}
            />
            <p className="text-xs text-slate-400 mt-0.5">
              This message will be shown to users when they first chat with your bot
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !formData.name.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 px-4 rounded-lg text-base font-semibold shadow-xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
          >
            {isLoading ? (
              <div className="flex items-center">
                <Loading size="sm" />
                <span className="ml-2">Creating Bot...</span>
              </div>
            ) : (
              <>
                <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Create Bot
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Info Section */}
        <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-600/30">
          <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            What happens next?
          </h3>
          <div className="grid md:grid-cols-2 gap-2 text-slate-300">
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 bg-blue-500/20 rounded-full flex items-center justify-center text-xs font-bold text-blue-300 mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium text-white text-xs">Train Your Bot</p>
                <p className="text-xs">Chat with your bot and teach it everything it needs to know</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 bg-purple-500/20 rounded-full flex items-center justify-center text-xs font-bold text-purple-300 mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium text-white text-xs">Deploy & Share</p>
                <p className="text-xs">Get a shareable link that anyone can use to chat with your bot</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 