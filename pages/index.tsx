"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/ui/SEO';

export default function AsQueLanding() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <SEO 
        title="Create AI Chatbots That Know Exactly What You Teach Them"
        description="Train your AI by simply chatting. Perfect for situations where regular AI doesn't know your specific information. Create smart chatbots with AsQue."
        keywords={['AI chatbot', 'chatbot builder', 'no-code chatbot', 'AI training', 'custom chatbot']}
      />
      <Layout>
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-slate-900"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="max-w-7xl mx-auto relative">
            <div className="text-center max-w-5xl mx-auto">
              {/* Top Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/30 px-4 py-2 rounded-full text-sm mb-8 transition-all duration-1000" style={{marginTop: 0}}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Create Smart Chatbots by Simply Chatting
                </div>
              {/* Logo */}

              {/* Main Headline */}
              <div
                className={`transition-all duration-1000 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              >
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
                  <span className="bg-gradient-to-r from-white via-slate-200 to-slate-300 bg-clip-text text-transparent">
                    Create Chatbots That
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                    Know Exactly
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-white via-slate-200 to-slate-300 bg-clip-text text-transparent">
                    What You Teach Them
                  </span>
                </h1>
              </div>

              {/* Subheading */}
              <div
                className={`transition-all duration-1000 delay-400 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              >
                <p className="text-xl md:text-2xl lg:text-3xl text-slate-300 mb-12 leading-relaxed max-w-4xl mx-auto">
                  Train your AI by simply chatting. Perfect for situations where regular AI doesn't know your{" "}
                  <span className="text-blue-400 font-semibold">specific information</span>.
                </p>
                {/* Trust Indicators (moved here) */}
                <div className={`mb-8 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                  <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-slate-400 mb-6">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Enterprise Security</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>30-Second Setup</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <span>No Code Required</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div
                className={`transition-all duration-1000 delay-600 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              >
                <div className="flex justify-center items-center mb-12">
                                  <button
                  onClick={() => router.push('/create')}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-10 py-6 text-xl font-semibold rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 flex items-center"
                >
                    <svg className="mr-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Create Your First Bot
                    <svg className="ml-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>

                {/* Social Proof */}
                <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-slate-400">
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900 to-slate-800">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 px-4 py-2 rounded-full text-sm mb-6">
                Simple Process
              </div>
              <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                How It Works
              </h2>
              <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto">
                Get your intelligent chatbot ready in just 3 simple steps
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
              {[
                {
                  step: "01",
                  title: "Create & Name Your Bot",
                  description: "Takes just 30 seconds to set up your new chatbot with a custom name and purpose.",
                  icon: "💬",
                  color: "from-blue-500 to-blue-600",
                  badge: "30 seconds",
                  badgeColor: "bg-green-500/20 text-green-300 border-green-500/30",
                },
                {
                  step: "02",
                  title: "Train by Chatting",
                  description:
                    "Simply have a conversation and tell your bot everything it needs to know. No coding required.",
                  icon: "🧠",
                  color: "from-purple-500 to-purple-600",
                  badge: "No Code Required",
                  badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
                },
                {
                  step: "03",
                  title: "Share & Deploy",
                  description: "Get an instant shareable link to deploy your chatbot anywhere, anytime.",
                  icon: "🌐",
                  color: "from-green-500 to-green-600",
                  badge: "Instant Deploy",
                  badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-slate-600/50 rounded-xl backdrop-blur-sm hover:border-slate-500/50 transition-all duration-500 group hover:transform hover:scale-105 p-8 relative overflow-hidden"
                >
                  {/* Step Number */}
                  <div className="absolute top-4 right-4 text-6xl font-bold text-slate-700/30 group-hover:text-slate-600/30 transition-colors">
                    {item.step}
                  </div>

                  {/* Gradient Line */}
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${item.color}`}></div>

                  {/* Icon */}
                  <div
                    className={`w-20 h-20 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 text-3xl`}
                  >
                    {item.icon}
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-blue-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-300 mb-6 leading-relaxed">{item.description}</p>

                  {/* Badge */}
                  <div className={`inline-flex items-center gap-2 ${item.badgeColor} px-3 py-1 rounded-full text-sm font-medium`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {item.badge}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Example Chat Conversation */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-800 to-slate-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 border border-green-500/30 px-4 py-2 rounded-full text-sm mb-6">
                See It In Action
              </div>
              <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Example Chat Conversation
              </h2>
              <p className="text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto">
                Here's how a trained chatbot handles specific questions about{" "}
                <span className="text-green-400 font-semibold">your business</span>
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 border border-slate-600/50 rounded-2xl backdrop-blur-sm p-8 relative overflow-hidden">
                {/* Chat Header */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-600/50">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Coffee Shop Assistant</h3>
                    <p className="text-sm text-slate-400">Trained with specific store information</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-slate-400">Online</span>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="space-y-4">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-2xl rounded-br-md max-w-xs md:max-w-md">
                      <p className="text-sm">Hi! What are your opening hours today?</p>
                    </div>
                  </div>

                  {/* Bot Message */}
                  <div className="flex justify-start">
                    <div className="bg-slate-700/80 text-slate-200 px-4 py-3 rounded-2xl rounded-bl-md max-w-xs md:max-w-md">
                      <p className="text-sm">Hello! We're open from 7:00 AM to 8:00 PM today (Monday). We're located at 123 Main Street. Would you like to know about our current specials?</p>
                    </div>
                  </div>

                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-2xl rounded-br-md max-w-xs md:max-w-md">
                      <p className="text-sm">Yes, what specials do you have?</p>
                    </div>
                  </div>

                  {/* Bot Message */}
                  <div className="flex justify-start">
                    <div className="bg-slate-700/80 text-slate-200 px-4 py-3 rounded-2xl rounded-bl-md max-w-xs md:max-w-md">
                      <p className="text-sm">Great! Today we have:</p>
                      <ul className="text-sm mt-2 space-y-1">
                        <li>• <span className="text-yellow-300">Happy Hour</span>: 50% off all drinks from 2-5 PM</li>
                        <li>• <span className="text-yellow-300">Student Discount</span>: 15% off with valid ID</li>
                        <li>• <span className="text-yellow-300">New Menu Item</span>: Try our seasonal pumpkin spice latte</li>
                      </ul>
                      <p className="text-sm mt-2">We also offer free WiFi and have plenty of seating for remote work!</p>
                    </div>
                  </div>

                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-2xl rounded-br-md max-w-xs md:max-w-md">
                      <p className="text-sm">Do you have parking available?</p>
                    </div>
                  </div>

                  {/* Bot Message */}
                  <div className="flex justify-start">
                    <div className="bg-slate-700/80 text-slate-200 px-4 py-3 rounded-2xl rounded-bl-md max-w-xs md:max-w-md">
                      <p className="text-sm">Yes! We have free parking in the back lot. There's also street parking available on Main Street (2-hour limit) and a public parking garage just one block away on Oak Avenue.</p>
                    </div>
                  </div>

                  {/* Typing Indicator */}
                  <div className="flex justify-start">
                    <div className="bg-slate-700/80 px-4 py-3 rounded-2xl rounded-bl-md">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Footer */}
                <div className="mt-6 pt-4 border-t border-slate-600/50">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>This bot was trained with specific store information</span>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Powered by AsQue</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="text-center mt-8">
                <p className="text-slate-300 mb-4">Create your own chatbot with specific knowledge</p>
                <button
                  onClick={() => router.push('/create')}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center mx-auto"
                >
                  <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Your Own Bot
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 border border-purple-500/30 px-4 py-2 rounded-full text-sm mb-6">
                Versatile Applications
              </div>
              <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Perfect For Any Situation
              </h2>
              <p className="text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto">
                Where Google and ChatGPT don't have your{" "}
                <span className="text-blue-400 font-semibold">specific answers</span>
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: "🏪",
                  title: "Shop Owner",
                  description: "Handle customer questions about store hours, closures, and policies instantly.",
                  example: "Why is the shop closed today?",
                  color: "from-orange-500 to-red-500",
                  bgColor: "from-orange-500/10 to-red-500/10",
                },
                {
                  icon: "📚",
                  title: "Student Helper",
                  description: "Get personalized help with specific homework assignments and course materials.",
                  example: "Help me with Chapter 5 calculus problems",
                  color: "from-green-500 to-emerald-500",
                  bgColor: "from-green-500/10 to-emerald-500/10",
                },
                {
                  icon: "🎫",
                  title: "Event Organizer",
                  description: "Share wedding details, event schedules, and instructions with all guests.",
                  example: "What's the dress code for the wedding?",
                  color: "from-purple-500 to-pink-500",
                  bgColor: "from-purple-500/10 to-pink-500/10",
                },
                {
                  icon: "🏠",
                  title: "Hostel Manager",
                  description: "Provide guests with comprehensive rules, guidelines, and facility information.",
                  example: "What are the check-in procedures?",
                  color: "from-blue-500 to-cyan-500",
                  bgColor: "from-blue-500/10 to-cyan-500/10",
                },
              ].map((useCase, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 border border-slate-600/50 rounded-xl backdrop-blur-sm hover:border-slate-500/50 transition-all duration-500 group hover:transform hover:scale-105 overflow-hidden p-6 relative"
                >
                  {/* Background Gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${useCase.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  ></div>

                  <div className="relative z-10">
                    {/* Icon */}
                    <div
                      className={`w-14 h-14 bg-gradient-to-br ${useCase.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 text-2xl`}
                    >
                      {useCase.icon}
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold mb-3 text-white group-hover:text-blue-300 transition-colors">
                      {useCase.title}
                    </h3>
                    <p className="text-slate-300 text-sm mb-4 leading-relaxed">{useCase.description}</p>

                    {/* Example */}
                    <div className="bg-slate-900/70 rounded-lg p-3 border border-slate-700/50">
                      <p className="text-xs text-slate-400 mb-1">Example question:</p>
                      <p className="text-sm text-slate-200 italic">"{useCase.example}"</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-slate-900 relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="max-w-5xl mx-auto text-center relative">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/30 px-4 py-2 rounded-full text-sm mb-8">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Join the AI Revolution
            </div>

            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent leading-tight">
              Ready to Create Your First Intelligent Chatbot?
            </h2>

            <p className="text-xl md:text-2xl text-slate-300 mb-12 leading-relaxed max-w-4xl mx-auto">
              Use AsQue to solve specific communication needs and boost productivity.
            </p>

            <div className="flex justify-center items-center mb-12">
                          <button
              onClick={() => router.push('/create')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-12 py-6 text-xl font-semibold rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 flex items-center"
            >
                <svg className="mr-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start Building Now - It's Free
                <svg className="ml-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>30-day money-back guarantee</span>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    </>
  );
} 