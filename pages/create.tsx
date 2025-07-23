"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/ui/SEO';
import CreateBotForm from '@/components/forms/CreateBotForm';
import { useAuth } from '@/components/auth/AuthContext';
import { signOut } from '@/lib/auth';
import { User, ArrowLeft } from 'lucide-react';
import Header from "@/components/layout/Header";

export default function CreateBotPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

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
      <Header />
      <SEO 
        title="Create Your AI Chatbot"
        description="Create a custom AI chatbot that knows exactly what you teach it. Start building your intelligent bot in seconds."
        keywords={['create chatbot', 'AI bot builder', 'custom chatbot', 'bot creation']}
      />
      <div className="min-h-screen bg-slate-900 text-white">
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="max-w-4xl mx-auto relative">
              <div className="text-center mb-12">
                <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto">
                  Give your bot a name, purpose, and personality, then train it by simply chatting
                </p>
              </div>

              {/* Create Bot Form */}
              <div className="max-w-xl mx-auto">
                <CreateBotForm onSuccess={handleSuccess} onError={handleError} />
              </div>
            </div>
          </section>
        </div>
      </>
    );
} 