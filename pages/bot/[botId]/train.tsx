"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/router"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/components/auth/AuthContext'
import { authenticatedFetch } from '@/lib/auth'
import SEO from '@/components/ui/SEO'
import Loading from '@/components/ui/Loading'
import TypingIndicator from '@/components/ui/TypingIndicator'
import Layout from '@/components/layout/Layout';
import { renderTextWithLinks } from '@/components/ui/LinkRenderer';

interface TrainingMessage {
  id: string
  content: string
  timestamp: Date
  category?: string
  summary?: string
  keywords?: string[]
}

interface Bot {
  id: string
  name: string
  description?: string
  profilePictureUrl?: string
  welcomeMessage?: string
  status: "training" | "deployed"
  ownerId: string
  trainingMessages: TrainingMessage[]
  createdAt: Date
  updatedAt: Date
}

interface TrainBotPageProps {
  params: { botId: string }
}

interface ApiResponse {
  success: boolean
  data?: Bot
  error?: string
  botResponse?: string
  savedCount?: number
}

export default function TrainBotPage() {
  const router = useRouter()
  const { botId } = router.query
  const { user, loading: authLoading } = useAuth()
  const [bot, setBot] = useState<Bot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trainingInput, setTrainingInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMemoryBank, setShowMemoryBank] = useState(true)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imageDescription, setImageDescription] = useState("")
  const [isImageUploading, setIsImageUploading] = useState(false)
  const [botResponses, setBotResponses] = useState<{ [messageId: string]: string }>({})
  const [isTyping, setIsTyping] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [welcomeMessage, setWelcomeMessage] = useState("")
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)
  const [trainingEntries, setTrainingEntries] = useState<any[]>([])
  const [loadingEntries, setLoadingEntries] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)



  // Memoize fetchBot to prevent infinite loops
  const fetchBot = useCallback(
    async (id: string) => {
      try {
        setLoading(true)
        setError(null)

        const response = await authenticatedFetch(`/api/bots/${id}`)
        const result = await response.json() as ApiResponse

        if (result.success && result.data) {
          if (result.data.ownerId !== user?.uid) {
            setError("Access denied: You do not own this bot")
            return
          }
          setBot(result.data)
          setWelcomeMessage(result.data.welcomeMessage || "")
        } else {
          if (response.status === 403) {
            setError("Access denied: You do not own this bot")
          } else {
            setError(result.error || "Bot not found")
          }
        }
      } catch (err) {
        console.error("Error fetching bot:", err)
        setError("Failed to load bot")
      } finally {
        setLoading(false)
      }
    },
    [user?.uid],
  )

  // Fixed useEffect with proper dependencies
  useEffect(() => {
    if (botId && typeof botId === 'string' && user && !authLoading && !bot) {
      fetchBot(botId)
    }
  }, [botId, user, authLoading, bot, fetchBot])

  // Fetch training entries when bot is loaded
  useEffect(() => {
    if (bot && bot.id) {
      fetchTrainingEntries()
    }
  }, [bot])

  const fetchTrainingEntries = async () => {
    if (!bot) return
    
    setLoadingEntries(true)
    try {
      const response = await authenticatedFetch(`/api/bots/${bot.id}/training-entries`)
      const result = await response.json()
      
      if (result.success) {
        setTrainingEntries(result.data || [])
      } else {
        console.error('Failed to fetch training entries:', result.error)
      }
    } catch (err) {
      console.error('Error fetching training entries:', err)
    } finally {
      setLoadingEntries(false)
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [bot?.trainingMessages])

  useEffect(() => {
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`
    }
  }, [trainingInput])

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSubmitTraining = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trainingInput.trim() || !bot || isSubmitting) return

    setIsSubmitting(true)
    setIsTyping(true)

    try {
      const response = await authenticatedFetch(`/api/bots/${bot.id}/training`, {
        method: "POST",
        body: JSON.stringify({ content: trainingInput.trim() }),
      })

      const result = await response.json() as ApiResponse

      if (result.success) {
        // Show success message with saved count
        if (result.savedCount && result.savedCount > 0) {
          setError(null) // Clear any previous errors
          setSuccessMessage(`✅ Successfully saved ${result.savedCount} training entries!`)
          
          // Clear success message after 5 seconds
          setTimeout(() => setSuccessMessage(null), 5000)
          
          // Refresh training entries to show the new ones
          await fetchTrainingEntries()
        }
        
        if (result.botResponse) {
          // Store the bot response for display
          const responseId = `response_${Date.now()}`;
          setBotResponses((prev) => ({
            ...prev,
            [responseId]: result.botResponse!,
          }))
        }

        setTrainingInput("")
        if (inputRef.current) {
          inputRef.current.style.height = "auto"
        }
      } else {
        setError(result.error || "Failed to save training message")
      }
    } catch (err) {
      console.error("Training error:", err)
      setError("Failed to save training message")
    } finally {
      setIsSubmitting(false)
      setIsTyping(false)
    }
  }

  const [isDeploying, setIsDeploying] = useState(false);

  const handleDeployBot = async () => {
    if (!bot || isDeploying) return

    try {
      setIsDeploying(true);
      setError(null);
      
      const response = await authenticatedFetch(`/api/bots/${bot.id}/deploy`, {
        method: "POST",
      })

      const result = await response.json() as ApiResponse

      if (result.success) {
        // Show success message before redirecting
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.push(`/bot/${bot.id}`)
      } else {
        setError(result.error || "Failed to deploy bot")
      }
    } catch (err) {
      setError("Failed to deploy bot")
    } finally {
      setIsDeploying(false);
    }
  }

  const handleUpdateWelcomeMessage = async () => {
    if (!bot) return

    setIsUpdatingSettings(true)
    try {
      const response = await authenticatedFetch(`/api/bots/${bot.id}`, {
        method: "PATCH",
        body: JSON.stringify({ welcomeMessage: welcomeMessage.trim() || undefined }),
      })

      const result = await response.json() as ApiResponse

      if (result.success && result.data) {
        setBot(result.data)
        setShowSettings(false)
      } else {
        setError(result.error || "Failed to update welcome message")
      }
    } catch (err) {
      setError("Failed to update welcome message")
    } finally {
      setIsUpdatingSettings(false)
    }
  }

  const deleteTrainingMessage = async (entryId: string) => {
    if (!bot) return

    try {
      const response = await authenticatedFetch(`/api/bots/${bot.id}/training-entries/${entryId}`, {
        method: "DELETE",
      })

      const result = await response.json() as ApiResponse

      if (result.success) {
        // Refresh training entries after deletion
        await fetchTrainingEntries()
        setError(null)
      } else {
        setError(result.error || "Failed to delete training entry")
      }
    } catch (err) {
      setError("Failed to delete training entry")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmitTraining(e)
    }
  }

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedImage || !imageDescription.trim()) return

    setIsImageUploading(true)
    try {
      // Convert image to base64
      const reader = new FileReader()
      reader.onload = async () => {
        const base64Data = reader.result as string
        const imageData = base64Data.split(',')[1] // Remove data:image/...;base64, prefix

        // Upload image
        const uploadResponse = await authenticatedFetch('/api/upload', {
          method: 'POST',
          body: JSON.stringify({
            imageData,
            fileName: selectedImage.name,
            fileType: selectedImage.type
          })
        })

        const uploadResult = await uploadResponse.json()
        
        if (uploadResult.success) {
          // Add image as training data
          const trainingData = {
            type: 'image',
            imageUrl: uploadResult.data.imageUrl,
            imageDescription: imageDescription.trim(),
            imageAltText: `Image: ${imageDescription.trim()}`,
            content: imageDescription.trim()
          }

          const response = await authenticatedFetch(`/api/bots/${botId}/training`, {
            method: 'POST',
            body: JSON.stringify({
              content: JSON.stringify(trainingData),
              type: 'image'
            })
          })

          const result = await response.json()
          
          if (result.success) {
            setSuccessMessage('Image uploaded successfully!')
            setSelectedImage(null)
            setImageDescription('')
            fetchTrainingEntries()
          } else {
            setError(result.error || 'Failed to upload image')
          }
        } else {
          setError(uploadResult.error || 'Failed to upload image')
        }
      }
      reader.readAsDataURL(selectedImage)
    } catch (error) {
      console.error('Error uploading image:', error)
      setError('Failed to upload image')
    } finally {
      setIsImageUploading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      setImageDescription(file.name) // Auto-fill description with filename
    }
  }

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
          <p className="text-slate-300 font-medium">Loading your AI assistant...</p>
        </div>
      </div>
    )
  }

  if (error || !bot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="max-w-md mx-auto p-8 bg-slate-800/50 backdrop-blur-xl border-slate-700/50 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Oops! Something went wrong</h1>
          <p className="text-slate-400 mb-6">{error || "Bot not found"}</p>
          <Button
            onClick={() => router.push("/create")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            Create New Bot
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <Layout showFooter={false} showHeader={false}>
      <SEO 
        title={`Training ${bot.name}`}
        description={`Train your AI chatbot ${bot.name} by chatting with it. Teach it everything it needs to know.`}
      />
      <ProtectedRoute>
        <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)]">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col h-screen bg-[var(--background)]">
            {/* Header - Fixed at Top */}
            <div className="bg-slate-800/30 backdrop-blur-xl border-b border-slate-700/30 sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push("/my-bots")}
                      className="text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 p-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </Button>
                    <div className="flex items-center gap-2">
                      <div>
                        <h1 className="text-lg font-semibold text-white flex items-center gap-2">
                          {bot.name}
                          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        </h1>
                        <p className="text-sm text-slate-400">Training Mode • AI Learning</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowMemoryBank(!showMemoryBank)}
                      className="bg-slate-700/30 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200"
                    >
                      {showMemoryBank ? (
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                      Memory Bank
                      <Badge variant="secondary" className="ml-2 bg-slate-600/50 text-slate-300">
                        {loadingEntries ? '...' : trainingEntries.length}
                      </Badge>
                    </Button>
                    <Button
                      onClick={handleDeployBot}
                      disabled={trainingEntries.length === 0 || isDeploying}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-green-500/25"
                    >
                      {isDeploying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Deploying...
                        </>
                      ) : (
                        <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Deploy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Area - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="max-w-4xl mx-auto p-4 space-y-6">
                {/* Success Message */}
                {successMessage && (
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-green-400 text-center">
                    {successMessage}
                  </div>
                )}
                
                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-400 text-center">
                    {error}
                  </div>
                )}
                {/* Enhanced Welcome Message */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
                    {bot.profilePictureUrl ? (
                      <img 
                        src={bot.profilePictureUrl} 
                        alt={`${bot.name} profile`} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>';
                        }}
                      />
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="bg-slate-800/80 text-slate-200 rounded-2xl shadow-md mr-12 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <h2 className="text-lg font-semibold text-white">👋 Welcome to Training Mode</h2>
                        <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <div className="whitespace-pre-wrap break-words">
                        I'm your AI assistant ready to learn! Share knowledge, documents, or have conversations with me.
                        Everything you teach me will help me assist others better. Let's start building my knowledge base
                        together.
                      </div>
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-700/50">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>Interactive Learning</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                          </svg>
                          <span>Knowledge Building</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Training Conversation Messages */}
                {Object.keys(botResponses).length > 0 ? (
                  Object.entries(botResponses).map(([responseId, response]) => (
                    <div key={responseId} className="space-y-4">
                      {/* Bot Response */}
                      <div className="flex gap-4 justify-start">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
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
                        <div className="bg-slate-800/80 text-slate-200 rounded-2xl shadow-md mr-12">
                          <div className="whitespace-pre-wrap break-words p-4">
                            {renderTextWithLinks(response)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-400 py-8">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-slate-500 font-medium">Ready to train your bot!</p>
                      <p className="text-slate-600 text-sm mt-1">Add training content below and see responses here</p>
                    </div>
                  </div>
                )}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-3 max-w-[80%]">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
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
                      <div className="bg-[var(--muted)] text-[var(--muted-foreground)] p-3 rounded-xl rounded-bl-none">
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
                <form onSubmit={handleSubmitTraining} className="relative bg-[var(--input-background)] rounded-2xl border border-white/10 p-2 shadow-xl">
                  <div className="flex items-end gap-3">
                    <textarea
                      ref={inputRef}
                      value={trainingInput}
                      onChange={(e) => setTrainingInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Teach me something..."
                      className="flex-1 bg-transparent resize-none border-0 outline-none min-h-[40px] max-h-32 py-2 px-2 text-[var(--foreground)] placeholder:text-[var(--placeholder-foreground)] text-base leading-tight overflow-y-hidden focus:outline-none focus:ring-0 placeholder:opacity-50"
                      rows={1}
                      disabled={isSubmitting}
                    />
                    <div className="pb-0 flex gap-2">
                      {/* Image Upload Button */}
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          disabled={isSubmitting}
                        />
                        <div className="p-3 rounded-full bg-slate-700/50 hover:bg-slate-700/70 transition-colors text-slate-300 hover:text-white">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </label>
                      
                      <button
                        type="submit"
                        disabled={!trainingInput.trim() || isSubmitting}
                        className={`p-3 rounded-full transition-colors ${
                          trainingInput.trim() && !isSubmitting
                            ? 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90'
                            : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed opacity-40'
                        }`}
                        aria-label="Send message"
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
                {/* Image Upload Form */}
                {selectedImage && (
                  <div className="mt-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 bg-slate-700/50 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={URL.createObjectURL(selectedImage)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">
                            Image Description
                          </label>
                          <input
                            type="text"
                            value={imageDescription}
                            onChange={(e) => setImageDescription(e.target.value)}
                            placeholder="e.g., Mess timetable for this week"
                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleImageUpload}
                            disabled={!imageDescription.trim() || isImageUploading}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              imageDescription.trim() && !isImageUploading
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {isImageUploading ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                                Uploading...
                              </div>
                            ) : (
                              'Upload Image'
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedImage(null)
                              setImageDescription('')
                            }}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="text-center text-xs text-[var(--muted-foreground)] mt-2">
                  Press Enter to send, Shift+Enter for new line • {trainingInput.length}/2000
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Memory Bank Sidebar */}
          {showMemoryBank && (
            <div className="w-1/3 border-l border-slate-700/30 bg-slate-800/20 backdrop-blur-xl transition-all duration-300">
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Memory Bank</h3>
                    <p className="text-sm text-slate-400">
                      {loadingEntries ? 'Loading...' : `${trainingEntries.length} knowledge entries`}
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4">
                  {loadingEntries ? (
                    <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50 p-6 text-center">
                      <div className="w-8 h-8 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-slate-400 text-sm">Loading training entries...</p>
                    </Card>
                  ) : trainingEntries.length === 0 ? (
                    <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50 p-6 text-center">
                      <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-slate-400 text-sm mb-2">No training data yet</p>
                      <p className="text-slate-500 text-xs">Start chatting to build your AI's knowledge base!</p>
                    </Card>
                  ) : (
                    trainingEntries.map((entry) => (
                      <Card
                        key={entry.id}
                        className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50 p-4 hover:bg-slate-800/50 transition-all duration-200 group"
                      >
                        <div className="mb-3">
                          <Badge
                            variant="secondary"
                            className={`${
                              entry.type === 'qa' 
                                ? 'bg-blue-600/20 text-blue-300 border-blue-600/30'
                                : entry.type === 'image'
                                ? 'bg-purple-600/20 text-purple-300 border-purple-600/30'
                                : 'bg-green-600/20 text-green-300 border-green-600/30'
                            }`}
                          >
                            {entry.type === 'qa' ? 'Q&A' : entry.type === 'image' ? '📷 Image' : 'Context'}
                          </Badge>
                        </div>
                        
                        {entry.type === 'qa' ? (
                          <div className="space-y-2">
                            <div className="text-sm text-slate-300">
                              <span className="font-semibold text-blue-400">Q:</span> {entry.question}
                            </div>
                            <div className="text-sm text-slate-400">
                              <span className="font-semibold text-green-400">A:</span> {entry.answer}
                            </div>
                          </div>
                        ) : entry.type === 'image' ? (
                          <div className="space-y-2">
                            <div className="text-sm text-slate-300">
                              <span className="font-semibold text-purple-400">📷 Image:</span> {entry.imageDescription}
                            </div>
                            {entry.imageUrl && (
                              <div className="w-full h-20 bg-slate-700/50 rounded-lg overflow-hidden">
                                <img
                                  src={entry.imageUrl}
                                  alt={entry.imageDescription}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed">
                            {entry.contextBlock}
                          </p>
                        )}
                        
                        {entry.keywords && entry.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {entry.keywords.slice(0, 3).map((keyword: string, idx: number) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-xs bg-blue-600/10 text-blue-300 border-blue-600/30"
                              >
                                {keyword}
                              </Badge>
                            ))}
                            {entry.keywords.length > 3 && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-slate-600/20 text-slate-400 border-slate-600/30"
                              >
                                +{entry.keywords.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-xs text-slate-500">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTrainingMessage(entry.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Bot Settings</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              <div className="space-y-6">
                {/* Bot Profile Picture */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Bot Profile Picture
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-700/50 border-2 border-slate-600/50 flex items-center justify-center overflow-hidden">
                      {bot?.profilePictureUrl ? (
                        <img
                          src={bot.profilePictureUrl}
                          alt="Bot profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 text-slate-400">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-400">
                        {bot?.profilePictureUrl ? "Profile picture set" : "No profile picture"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Profile pictures are set during bot creation
                      </p>
                    </div>
                  </div>
                </div>

                {/* Welcome Message */}
                <div>
                  <label htmlFor="welcomeMessage" className="block text-sm font-medium text-slate-300 mb-2">
                    Custom Welcome Message
                  </label>
                  <textarea
                    id="welcomeMessage"
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Hi! I'm your AI assistant. How can I help you today?"
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none"
                    maxLength={200}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    This message will be shown to users when they first chat with your bot
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowSettings(false)}
                    className="flex-1 bg-slate-700/30 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateWelcomeMessage}
                    disabled={isUpdatingSettings}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isUpdatingSettings ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Updating...
                      </div>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </ProtectedRoute>
    </Layout>
  )
} 