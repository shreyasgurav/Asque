"use client"

import React from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/ui/SEO';
import CreateBotForm from '@/components/forms/CreateBotForm';

export default function CreateBotPage() {
  const router = useRouter();

  const handleSuccess = (botId: string) => {
    // Redirect to training page
    router.push(`/bot/${botId}/train`);
  };

  const handleError = (error: string) => {
    // Error is handled by the form component itself
    console.error('Bot creation error:', error);
  };

  return (
    <>
      <SEO 
        title="Create Your AI Chatbot"
        description="Create a custom AI chatbot that knows exactly what you teach it. Start building your intelligent bot in seconds."
        keywords={['create chatbot', 'AI bot builder', 'custom chatbot', 'bot creation']}
      />
      <Layout>
        <div className="min-h-screen bg-slate-900 text-white">
          {/* Hero Section */}
          <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-slate-900"></div>
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="max-w-4xl mx-auto relative">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 px-4 py-2 rounded-full text-sm mb-6">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Your First Bot
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Create Your AI Chatbot
                </h1>
                <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto">
                  Give your bot a name, purpose, and personality, then train it by simply chatting
                </p>
              </div>

              {/* Create Bot Form */}
              <div className="max-w-2xl mx-auto">
                <CreateBotForm onSuccess={handleSuccess} onError={handleError} />
              </div>
            </div>
          </section>
        </div>
      </Layout>
    </>
  );
} 