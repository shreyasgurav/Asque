import React, { useState, useRef } from 'react';
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
  profilePicture: File | null;
  profilePicturePreview: string | null;
}

export default function CreateBotForm({ onSuccess, onError }: CreateBotFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    welcomeMessage: '',
    profilePicture: null,
    profilePicturePreview: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Image file size must be less than 5MB');
      return;
    }

    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({
        ...prev,
        profilePicture: file,
        profilePicturePreview: e.target?.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProfilePicture = () => {
    setFormData(prev => ({
      ...prev,
      profilePicture: null,
      profilePicturePreview: null
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadProfilePicture = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'bot-profile');

      const response = await authenticatedFetch('/api/upload', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, let the browser set it with boundary
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success || !result.url) {
        throw new Error(result.error || 'Upload failed');
      }

      return result.url;
    } catch (error) {
      console.error('Profile picture upload error:', error);
      throw new Error('Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

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

      let profilePictureUrl: string | undefined;

      // Upload profile picture if selected
      if (formData.profilePicture) {
        try {
          profilePictureUrl = await uploadProfilePicture(formData.profilePicture);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to upload profile picture');
          setIsLoading(false);
          return;
        }
      }

      const requestData: CreateBotRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        welcomeMessage: formData.welcomeMessage.trim() || undefined,
        profilePictureUrl,
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
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-slate-600/50 rounded-2xl backdrop-blur-sm p-8 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative z-10">
        <form onSubmit={handleSubmit} className="space-y-6">
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
                  {formData.profilePicturePreview ? (
                    <img
                      src={formData.profilePicturePreview}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 text-slate-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Remove button */}
                {formData.profilePicturePreview && (
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
            <label htmlFor="name" className="block text-lg font-semibold text-white mb-3">
              Bot Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Hostel Clearance HelpBot"
              className="w-full px-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-lg"
              disabled={isLoading}
              maxLength={100}
            />
          </div>

          {/* Bot Description */}
          <div>
            <label htmlFor="description" className="block text-lg font-semibold text-white mb-3">
              Bot Purpose / Description
              <span className="text-slate-400 text-sm ml-2">(optional)</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Write what your bot does in simple words"
              rows={4}
              className="w-full px-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-300 text-lg"
              disabled={isLoading}
              maxLength={500}
            />
          </div>

          {/* Custom Welcome Message */}
          <div>
            <label htmlFor="welcomeMessage" className="block text-lg font-semibold text-white mb-3">
              Custom Welcome Message
              <span className="text-slate-400 text-sm ml-2">(optional)</span>
            </label>
            <textarea
              id="welcomeMessage"
              value={formData.welcomeMessage}
              onChange={(e) => setFormData(prev => ({ ...prev, welcomeMessage: e.target.value }))}
              placeholder="Hi! I'm your AI assistant. How can I help you today?"
              rows={3}
              className="w-full px-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-300 text-lg"
              disabled={isLoading}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !formData.name.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-8 rounded-xl text-xl font-semibold shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
          >
            {isLoading ? (
              <div className="flex items-center">
                <Loading size="sm" />
                <span className="ml-3">Creating Bot...</span>
              </div>
            ) : (
              <>
                <svg className="mr-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Create Bot
                <svg className="ml-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Info Section */}
        <div className="mt-8 p-6 bg-slate-800/30 rounded-xl border border-slate-600/30">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            What happens next?
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-slate-300">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-sm font-bold text-blue-300 mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium text-white">Train Your Bot</p>
                <p className="text-sm">Chat with your bot and teach it everything it needs to know</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-sm font-bold text-purple-300 mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium text-white">Deploy & Share</p>
                <p className="text-sm">Get a shareable link that anyone can use to chat with your bot</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 