"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useInView, easeOut } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

import {
  Sparkles,
  Zap,
  Shield,
  Clock,
  Code,
  MessageSquare,
  Brain,
  Globe,
  Store,
  BookOpen,
  Calendar,
  Home,
  ArrowRight,
  ChevronDown,
  Check,
  Star,
  Users,
  Rocket,
  Target,
  ArrowLeft,
  User,
} from "lucide-react"

import React from "react";
import Header from "@/components/layout/Header";
import SEO from "@/components/ui/SEO";

export default function AsQueLanding() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Refs for scroll animations
  const heroRef = useRef(null)
  const howItWorksRef = useRef(null)
  const exampleRef = useRef(null)
  const useCasesRef = useRef(null)
  const ctaRef = useRef(null)

  // InView hooks for sections
  const heroInView = useInView(heroRef, { once: true })
  const howItWorksInView = useInView(howItWorksRef, { once: true })
  const exampleInView = useInView(exampleRef, { once: true })
  const useCasesInView = useInView(useCasesRef, { once: true })
  const ctaInView = useInView(ctaRef, { once: true })

  // Individual step refs for Apple-style steps animation
  const step1Ref = useRef(null)
  const step2Ref = useRef(null)
  const step3Ref = useRef(null)

  // Step InView hooks
  const step1InView = useInView(step1Ref)
  const step2InView = useInView(step2Ref)
  const step3InView = useInView(step3Ref)

  useEffect(() => {
    setIsVisible(true)
    // Auto-cycle through steps
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3)
    }, 4000)
    
    // Mouse move handler for interactive background
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      clearInterval(interval)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Update active step based on scroll position
  useEffect(() => {
    if (step1InView) setActiveStep(0)
    else if (step2InView) setActiveStep(1)
    else if (step3InView) setActiveStep(2)
  }, [step1InView, step2InView, step3InView])

  const handleGetStarted = () => {
    // Mock navigation - replace with actual navigation logic
    console.log("Navigate to create page")
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: easeOut
      }
    }
  }

  // Enhanced Button Component
  type EnhancedButtonProps = {
    variant?: "primary" | "secondary" | "success" | "outline" | "ghost";
    size?: "sm" | "md" | "lg" | "xl";
    children?: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    className?: string;
    icon?: React.ElementType;
    iconPosition?: "left" | "right";
    loading?: boolean;
    disabled?: boolean;
    [key: string]: any;
  };

  const EnhancedButton = ({
    variant = "primary",
    size = "md",
    children,
    onClick,
    className = "",
    icon: Icon,
    iconPosition = "left",
    loading = false,
    disabled = false,
    ...props
  }: EnhancedButtonProps) => {
    const baseClasses = "relative inline-flex items-center justify-center font-semibold transition-all duration-300 group overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    
    const variants: Record<string, string> = {
      primary: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/20 focus:ring-blue-500 shadow-lg hover:shadow-blue-500/30",
      secondary: "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border border-purple-400/20 focus:ring-purple-500 shadow-lg hover:shadow-purple-500/30",
      success: "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border border-emerald-400/20 focus:ring-emerald-500 shadow-lg hover:shadow-emerald-500/30",
      outline: "border-2 border-blue-500/50 text-blue-300 hover:bg-blue-500/10 hover:border-blue-400 backdrop-blur-sm focus:ring-blue-500",
      ghost: "text-slate-300 hover:text-white hover:bg-slate-700/50 focus:ring-slate-500"
    };
    
    const sizes: Record<string, string> = {
      sm: "px-3 py-2 text-sm rounded-lg",
      md: "px-4 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base rounded-xl",
      lg: "px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg rounded-xl",
      xl: "px-8 py-4 text-lg sm:px-10 sm:py-5 sm:text-xl rounded-2xl"
    };

    const variantClass = variants[variant] || variants.primary;
    const sizeClass = sizes[size] || sizes.md;

    return (
      <button
        className={`${baseClasses} ${variantClass} ${sizeClass} ${className}`}
        onClick={onClick}
        disabled={disabled || loading}
        {...props}
      >
        {/* Shimmer effect for gradient buttons */}
        {(variant === "primary" || variant === "secondary" || variant === "success") && (
          <div className="absolute inset-0 -top-1 -bottom-1 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        )}
        
        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Content */}
        <span className={`relative z-10 flex items-center gap-2 ${loading ? 'opacity-0' : 'opacity-100'}`}>
          {Icon && iconPosition === "left" && <Icon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />}
          {children}
          {Icon && iconPosition === "right" && <Icon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />}
        </span>
      </button>
    )
  }

  // Update steps array to include details
  const steps = [
    {
      step: "01",
      title: "Create & Name Your Bot",
      description: "Takes just 30 seconds to set up your new chatbot with a custom name and purpose. Choose from our pre-built templates or start from scratch.",
      icon: MessageSquare,
      color: "from-blue-500 to-blue-600",
      badge: "30 seconds",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      details: [
        "Choose a meaningful name for your bot",
        "Select the purpose and tone",
        "Pick from templates or start fresh",
        "Set up basic personality traits"
      ]
    },
    {
      step: "02",
      title: "Train by Chatting",
      description: "Simply have a conversation and tell your bot everything it needs to know. No coding required, just natural conversation.",
      icon: Brain,
      color: "from-purple-500 to-purple-600",
      badge: "No Code Required",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      details: [
        "Chat naturally with your bot",
        "Provide examples and scenarios",
        "Correct responses in real-time",
        "Build knowledge through conversation"
      ]
    },
    {
      step: "03",
      title: "Share & Deploy",
      description: "Get an instant shareable link to deploy your chatbot anywhere, anytime. Works on websites, messaging apps, and more.",
      icon: Globe,
      color: "from-emerald-500 to-emerald-600",
      badge: "Instant Deploy",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      details: [
        "Generate shareable links instantly",
        "Embed on any website",
        "Deploy to messaging platforms",
        "Monitor performance in real-time"
      ]
    },
  ]

  const useCases = [
    {
      icon: Store,
      title: "Shop Owner",
      description: "Handle customer questions about store hours, closures, and policies instantly.",
      example: "Why is the shop closed today?",
      color: "from-orange-500 to-red-500",
      bgColor: "from-orange-500/10 to-red-500/10",
    },
    {
      icon: BookOpen,
      title: "Student Helper",
      description: "Get personalized help with specific homework assignments and course materials.",
      example: "Help me with Chapter 5 calculus problems",
      color: "from-emerald-500 to-teal-500",
      bgColor: "from-emerald-500/10 to-teal-500/10",
    },
    {
      icon: Calendar,
      title: "Event Organizer",
      description: "Share wedding details, event schedules, and instructions with all guests.",
      example: "What's the dress code for the wedding?",
      color: "from-purple-500 to-pink-500",
      bgColor: "from-purple-500/10 to-pink-500/10",
    },
    {
      icon: Home,
      title: "Hostel Manager",
      description: "Provide guests with comprehensive rules, guidelines, and facility information.",
      example: "What are the check-in procedures?",
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-500/10 to-cyan-500/10",
    }
  ];

  return (
    <>
      <SEO
        title="About AsQue - AI Chatbot Platform"
        description="Learn about AsQue, the AI chatbot platform that lets you create smart chatbots by simply chatting. AsQue makes it easy to build, train, and deploy chatbots for your business or personal use. Try AsQue at asque.app."
        keywords={["AsQue", "AI chatbot", "chatbot platform", "asque.app", "smart chatbot", "create chatbot", "train chatbot", "AI assistant"]}
        ogUrl="https://asque.app/about"
      />
      <Header />
      <div className="dark">
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden pt-20">
          {/* Interactive Background */}
          <motion.div 
            className="fixed inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59,130,246,0.1), transparent 40%)`
            }}
          />
          
          {/* Static Background Elements */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              className="absolute top-1/4 left-1/4 w-48 h-48 md:w-96 md:h-96 bg-blue-500/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div 
              className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-96 md:h-96 bg-purple-500/10 rounded-full blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.6, 0.3, 0.6]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
            />
            <motion.div 
              className="absolute top-3/4 left-3/4 w-32 h-32 md:w-64 md:h-64 bg-emerald-500/10 rounded-full blur-2xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />
          </div>

          {/* Hero Section */}
          <motion.section 
            ref={heroRef}
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={containerVariants}
            className="relative pt-12 md:pt-20 pb-12 md:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto relative z-10">
              <div className="text-center max-w-5xl mx-auto">
                {/* Top Badge */}
                <motion.div
                  className={`inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/30 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm mb-6 md:mb-8 transition-all duration-1000 backdrop-blur-sm ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  variants={itemVariants}
                >
                  <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Create Smart Chatbots by Simply Chatting</span>
                  <span className="sm:hidden">Smart Chatbots Made Easy</span>
                </motion.div>

                {/* Main Headline */}
                <motion.div
                  className={`transition-all duration-1000 delay-200 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  variants={itemVariants}
                >
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 md:mb-8 leading-tight">
                    <span className="bg-gradient-to-r from-white via-slate-200 to-slate-300 bg-clip-text text-transparent">
                      Create Chatbots That
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 bg-clip-text text-transparent animate-pulse">
                      Know Exactly
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-white via-slate-200 to-slate-300 bg-clip-text text-transparent">
                      What You Teach Them
                    </span>
                  </h1>
                </motion.div>

                {/* Subheading */}
                <motion.div
                  className={`transition-all duration-1000 delay-400 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  variants={itemVariants}
                >
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-300 mb-8 md:mb-12 leading-relaxed max-w-4xl mx-auto px-4 sm:px-0">
                    Train your AI by simply chatting. Perfect for situations where regular AI doesn't know your{" "}
                    <span className="text-blue-400 font-semibold bg-blue-400/10 px-2 py-1 rounded">
                      specific information
                    </span>
                    .
                  </p>

                  {/* Trust Indicators */}
                  <motion.div className="mb-6 md:mb-8" variants={itemVariants}>
                    <div className="flex flex-wrap justify-center items-center gap-3 md:gap-6 text-xs md:text-sm text-slate-400 mb-4 md:mb-6">
                      <Badge
                        variant="outline"
                        className="border-emerald-500/30 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                      >
                        <Shield className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                        Enterprise Security
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-yellow-500/30 text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors"
                      >
                        <Zap className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                        30-Second Setup
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-blue-500/30 text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                      >
                        <Code className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                        No Code Required
                      </Badge>
                    </div>
                  </motion.div>
                </motion.div>

                {/* CTA Button */}
                <motion.div
                  className={`transition-all duration-1000 delay-600 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  variants={itemVariants}
                >
                  <div className="flex justify-center items-center mb-8 md:mb-12">
                    <EnhancedButton
                      variant="primary"
                      size="md"
                      onClick={handleGetStarted}
                      icon={Zap}
                      className="w-full max-w-xs sm:w-auto"
                    >
                      Create Your First Bot
                    </EnhancedButton>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Scroll Indicator */}
            <motion.div 
              className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce"
              variants={itemVariants}
            >
              <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
            </motion.div>
          </motion.section>

          {/* How It Works */}
          <motion.section 
            ref={howItWorksRef}
            id="how-it-works"
            className="py-16 md:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-800/30 to-slate-900/30 relative"
            initial="hidden"
            animate={howItWorksInView ? "visible" : "hidden"}
            variants={containerVariants}
          >
            <div className="max-w-7xl mx-auto">
              {/* Section Header */}
              <motion.div className="text-center mb-16 md:mb-32" variants={itemVariants}>
                <Badge
                  variant="outline"
                  className="border-blue-500/30 text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 transition-colors mb-6"
                >
                  Simple Process
                </Badge>
                <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  How It Works
                </h2>
                <p className="text-base md:text-lg xl:text-xl text-slate-300 max-w-3xl mx-auto">
                  Get your intelligent chatbot ready in just 3 simple steps
                </p>
              </motion.div>

              {/* Steps Container */}
              <div className="relative">
                {/* Progress Line - Hidden on mobile */}
                <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/30 via-purple-500/30 to-emerald-500/30 transform -translate-x-1/2" />
                
                {/* Steps */}
                <div className="space-y-8 md:space-y-32">
                  {steps.map((step, index) => {
                    const IconComponent = step.icon
                    const isEven = index % 2 === 0
                    const stepRef = index === 0 ? step1Ref : index === 1 ? step2Ref : step3Ref
                    return (
                      <motion.div
                        key={index}
                        ref={stepRef}
                        className="relative"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                        variants={{ hidden: { opacity: 0, y: 100 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } } }}
                      >
                        {/* Mobile Layout */}
                        <div className="block md:hidden">
                          <div className="text-left">
                            {/* Step Number */}
                            <motion.div 
                              className="mb-4"
                              initial={{ opacity: 0, scale: 0.8 }}
                              whileInView={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                            >
                              <span className="text-4xl font-bold bg-gradient-to-r from-slate-600 to-slate-400 bg-clip-text text-transparent">
                                {step.step}
                              </span>
                            </motion.div>
                            
                            {/* Badge */}
                            <motion.div 
                              className="mb-4"
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: 0.3 }}
                            >
                              <Badge className={`${step.badgeColor} font-medium text-xs`}>
                                <Clock className="w-3 h-3 mr-2" />
                                {step.badge}
                              </Badge>
                            </motion.div>
                            
                            {/* Title */}
                            <motion.h3 
                              className="text-xl font-bold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent"
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: 0.4 }}
                            >
                              {step.title}
                            </motion.h3>
                            
                            {/* Description */}
                            <motion.p 
                              className="text-sm text-slate-300 mb-6 leading-relaxed"
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: 0.5 }}
                            >
                              {step.description}
                            </motion.p>
                            
                            {/* Details List */}
                            <motion.ul 
                              className="space-y-2 text-slate-400"
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: 0.6 }}
                            >
                              {step.details.map((detail, detailIndex) => (
                                <motion.li
                                  key={detailIndex}
                                  className="flex items-center gap-3 text-sm"
                                  initial={{ opacity: 0, x: -20 }}
                                  whileInView={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.3, delay: 0.7 + detailIndex * 0.1 }}
                                >
                                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                  <span>{detail}</span>
                                </motion.li>
                              ))}
                            </motion.ul>
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className={`hidden md:flex items-center ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                          {/* Content Side */}
                          <div className={`w-full lg:w-1/2 ${isEven ? 'lg:pr-8 xl:pr-16' : 'lg:pl-8 xl:pl-16'}`}> 
                            <div className={`${isEven ? 'lg:text-right' : 'lg:text-left'} text-center lg:text-left`}>
                              {/* Step Number */}
                              <motion.div 
                                className="inline-block mb-4"
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                              >
                                <span className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-slate-600 to-slate-400 bg-clip-text text-transparent">
                                  {step.step}
                                </span>
                              </motion.div>
                              
                              {/* Badge */}
                              <motion.div 
                                className={`mb-4 md:mb-6 ${isEven ? 'lg:justify-end' : 'lg:justify-start'} flex justify-center`}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                              >
                                <Badge className={`${step.badgeColor} font-medium text-xs md:text-sm`}>
                                  <Clock className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                                  {step.badge}
                                </Badge>
                              </motion.div>
                              
                              {/* Title */}
                              <motion.h3 
                                className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                              >
                                {step.title}
                              </motion.h3>
                              
                              {/* Description */}
                              <motion.p 
                                className="text-base md:text-lg xl:text-xl text-slate-300 mb-6 md:mb-8 leading-relaxed"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.5 }}
                              >
                                {step.description}
                              </motion.p>
                              
                              {/* Details List */}
                              <motion.ul 
                                className="space-y-2 md:space-y-3 text-slate-400"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.6 }}
                              >
                                {step.details.map((detail, detailIndex) => (
                                  <motion.li
                                    key={detailIndex}
                                    className="flex items-center gap-3 text-sm md:text-base"
                                    initial={{ opacity: 0, x: isEven ? 20 : -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: 0.7 + detailIndex * 0.1 }}
                                  >
                                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    <span>{detail}</span>
                                  </motion.li>
                                ))}
                              </motion.ul>
                            </div>
                          </div>
                          
                          {/* Visual Side - Hidden on mobile */}
                          <div className={`w-full lg:w-1/2 ${isEven ? 'lg:pl-8 xl:pl-16' : 'lg:pr-8 xl:pr-16'}`}>
                            <motion.div
                              className="relative"
                              initial={{ opacity: 0, scale: 0.8 }}
                              whileInView={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.8, delay: 0.3 }}
                            >
                              {/* Icon Container */}
                              <div className="relative mx-auto w-64 h-64 lg:w-80 lg:h-80">
                                {/* Background Circle */}
                                <motion.div
                                  className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-full opacity-10`}
                                  animate={{
                                    scale: [1, 1.05, 1],
                                    opacity: [0.1, 0.2, 0.1]
                                  }}
                                  transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                />
                                
                                {/* Main Icon */}
                                <div className={`absolute inset-0 flex items-center justify-center`}>
                                  <motion.div
                                    className={`w-32 h-32 bg-gradient-to-br ${step.color} rounded-3xl flex items-center justify-center shadow-2xl`}
                                    whileHover={{ scale: 1.1 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <IconComponent className="w-16 h-16 text-white" />
                                  </motion.div>
                                </div>
                                
                                {/* Floating Elements */}
                                <motion.div
                                  className="absolute -top-4 -right-4 w-8 h-8 bg-blue-500/20 rounded-full"
                                  animate={{
                                    y: [0, -10, 0],
                                    opacity: [0.5, 1, 0.5]
                                  }}
                                  transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                />
                                <motion.div
                                  className="absolute -bottom-4 -left-4 w-6 h-6 bg-purple-500/20 rounded-full"
                                  animate={{
                                    y: [0, 10, 0],
                                    opacity: [0.5, 1, 0.5]
                                  }}
                                  transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: 1
                                  }}
                                />
                              </div>
                            </motion.div>
                          </div>
                          
                          {/* Center Dot for Progress Line */}
                          <div className="hidden lg:block absolute left-1/2 top-1/2 w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-10" />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.section>

          {/* Example Chat Conversation */}
          <motion.section 
            ref={exampleRef}
            initial="hidden"
            animate={exampleInView ? "visible" : "hidden"}
            variants={containerVariants}
            className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-800/50 to-slate-900/50"
          >
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 md:mb-20">
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors mb-6"
                >
                  See It In Action
                </Badge>
                <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Example Chat Conversation
                </h2>
                <p className="text-base md:text-lg xl:text-xl text-slate-300 max-w-4xl mx-auto">
                  Here's how a trained chatbot handles specific questions about{" "}
                  <span className="text-emerald-400 font-semibold bg-emerald-400/10 px-2 py-1 rounded">your business</span>
                </p>
              </div>

              <div className="max-w-4xl mx-auto">
                <Card className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 border-slate-600/50 backdrop-blur-sm hover:border-slate-500/50 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-500">
                  <div className="p-4 md:p-8">
                    {/* Chat Header */}
                    <div className="flex items-center gap-3 mb-4 md:mb-6 pb-4 border-b border-slate-600/50">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base md:text-lg font-semibold text-white">Coffee Shop Assistant</h3>
                        <p className="text-xs md:text-sm text-slate-400">Trained with specific store information</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="text-xs md:text-sm text-slate-400">Online</span>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                      {/* User Message */}
                      <div className="flex justify-end">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 md:px-4 py-2 md:py-3 rounded-2xl rounded-br-md max-w-xs md:max-w-md shadow-lg hover:shadow-blue-500/20 transition-shadow">
                          <p className="text-xs md:text-sm">Hi! What are your opening hours today?</p>
                        </div>
                      </div>

                      {/* Bot Message */}
                      <div className="flex justify-start">
                        <div className="bg-slate-700/80 text-slate-200 px-3 md:px-4 py-2 md:py-3 rounded-2xl rounded-bl-md max-w-xs md:max-w-md shadow-lg border border-slate-600/50 hover:border-slate-500/50 hover:shadow-slate-500/10 transition-all">
                          <p className="text-xs md:text-sm">
                            Hello! We're open from 7:00 AM to 8:00 PM today (Monday). We're located at 123 Main Street.
                            Would you like to know about our current specials?
                          </p>
                        </div>
                      </div>

                      {/* User Message */}
                      <div className="flex justify-end">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 md:px-4 py-2 md:py-3 rounded-2xl rounded-br-md max-w-xs md:max-w-md shadow-lg hover:shadow-blue-500/20 transition-shadow">
                          <p className="text-xs md:text-sm">Yes, what specials do you have?</p>
                        </div>
                      </div>

                      {/* Bot Message */}
                      <div className="flex justify-start">
                        <div className="bg-slate-700/80 text-slate-200 px-3 md:px-4 py-2 md:py-3 rounded-2xl rounded-bl-md max-w-xs md:max-w-md shadow-lg border border-slate-600/50 hover:border-slate-500/50 hover:shadow-slate-500/10 transition-all">
                          <p className="text-xs md:text-sm">Great! Today we have:</p>
                          <ul className="text-xs md:text-sm mt-2 space-y-1">
                            <li className="flex items-center gap-2">
                              <Star className="w-2 h-2 md:w-3 md:h-3 text-yellow-400 flex-shrink-0" />
                              <span className="text-yellow-300 font-medium">Happy Hour</span>: 50% off all drinks from 2-5 PM
                            </li>
                            <li className="flex items-center gap-2">
                              <Star className="w-2 h-2 md:w-3 md:h-3 text-yellow-400 flex-shrink-0" />
                              <span className="text-yellow-300 font-medium">Student Discount</span>: 15% off with valid ID
                            </li>
                            <li className="flex items-center gap-2">
                              <Star className="w-2 h-2 md:w-3 md:h-3 text-yellow-400 flex-shrink-0" />
                              <span className="text-yellow-300 font-medium">New Menu Item</span>: Try our seasonal pumpkin spice latte
                            </li>
                          </ul>
                          <p className="text-xs md:text-sm mt-2">
                            We also offer free WiFi and have plenty of seating for remote work!
                          </p>
                        </div>
                      </div>

                      {/* Typing Indicator */}
                      <div className="flex justify-start">
                        <div className="bg-slate-700/80 px-3 md:px-4 py-2 md:py-3 rounded-2xl rounded-bl-md border border-slate-600/50">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Chat Footer */}
                    <div className="pt-4 border-t border-slate-600/50">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs md:text-sm text-slate-400">
                        <span>This bot was trained with specific store information</span>
                        <div className="flex items-center gap-2">
                          <Zap className="w-3 h-3 md:w-4 md:h-4" />
                          <span>Powered by AsQue</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Call to Action */}
                <motion.div 
                  className="text-center mt-6 md:mt-8"
                  variants={itemVariants}
                >
                  <p className="text-slate-300 mb-4 text-sm md:text-base">Create your own chatbot with specific knowledge</p>
                  <EnhancedButton
                    variant="success"
                    size="md"
                    onClick={handleGetStarted}
                    icon={MessageSquare}
                    className="w-full max-w-xs sm:w-auto"
                  >
                    Create Your Own Bot
                  </EnhancedButton>
                </motion.div>
              </div>
            </div>
          </motion.section>

          {/* Use Cases */}
          <motion.section 
            ref={useCasesRef}
            id="use-cases"
            initial="hidden"
            animate={useCasesInView ? "visible" : "hidden"}
            variants={containerVariants}
            className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50"
          >
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-10 md:mb-16">
                <Badge
                  variant="outline"
                  className="border-purple-500/30 text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 transition-colors mb-6"
                >
                  Versatile Applications
                </Badge>
                <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Perfect For Any Situation
                </h2>
                <p className="text-base md:text-lg xl:text-xl text-slate-300 max-w-4xl mx-auto">
                  Where Google and ChatGPT don't have your{" "}
                  <span className="text-blue-400 font-semibold bg-blue-400/10 px-2 py-1 rounded">specific answers</span>
                </p>
              </div>
              
              {/* Carousel Container */}
              <div className="relative overflow-hidden">
                <div
                  className="flex space-x-4 md:space-x-6 will-change-transform"
                  style={{
                    animation: 'scroll-carousel 32s linear infinite',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.animationPlayState = 'paused')}
                  onMouseLeave={e => (e.currentTarget.style.animationPlayState = 'running')}
                >
                  {[...useCases, ...useCases].map((useCase, index) => {
                    const IconComponent = useCase.icon
                    return (
                      <Card
                        key={index}
                        className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 border-slate-600/50 backdrop-blur-sm hover:border-slate-500/50 hover:shadow-xl transition-all duration-500 group overflow-hidden relative flex-shrink-0 w-64 md:w-80"
                      >
                        <div className="p-4 md:p-6 relative z-10">
                          {/* Background Gradient */}
                          <div
                            className={`absolute inset-0 bg-gradient-to-br ${useCase.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                          ></div>

                          <div className="relative z-10">
                            {/* Icon */}
                            <div
                              className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${useCase.color} rounded-xl flex items-center justify-center mb-3 md:mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300`}
                            >
                              <IconComponent className="w-4 h-4 md:w-5 md:h-5 text-white group-hover:animate-pulse" />
                            </div>

                            {/* Content */}
                            <h3 className="text-base md:text-lg font-bold mb-2 md:mb-3 text-white group-hover:text-blue-300 transition-colors">
                              {useCase.title}
                            </h3>
                            <p className="text-slate-300 text-xs md:text-sm mb-3 md:mb-4 leading-relaxed group-hover:text-slate-200 transition-colors">
                              {useCase.description}
                            </p>

                            {/* Example */}
                            <div className="bg-slate-900/70 rounded-lg p-2 md:p-3 border border-slate-700/50 group-hover:border-slate-600/50 group-hover:bg-slate-900/90 transition-all">
                              <p className="text-xs text-slate-400 mb-1">Example question:</p>
                              <p className="text-xs md:text-sm text-slate-200 italic">"{useCase.example}"</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
                
                <style jsx global>{`
                  @keyframes scroll-carousel {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                  }
                `}</style>
              </div>
            </div>
          </motion.section>

          {/* Final CTA */}
          <motion.section 
            ref={ctaRef}
            initial="hidden"
            animate={ctaInView ? "visible" : "hidden"}
            variants={containerVariants}
            className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-slate-950 relative overflow-hidden"
          >
            {/* Background Effects */}
            <div className="absolute inset-0">
              <div className="absolute top-1/4 left-1/4 w-48 h-48 md:w-96 md:h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-96 md:h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="max-w-5xl mx-auto text-center relative z-10">
              <Badge
                variant="outline"
                className="border-blue-500/30 text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 transition-colors mb-6 md:mb-8"
              >
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                Join the AI Revolution
              </Badge>

              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 md:mb-8 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent leading-tight">
                Ready to Create Your First Intelligent Chatbot?
              </h2>

              <p className="text-base md:text-lg xl:text-xl text-slate-300 mb-8 md:mb-12 leading-relaxed max-w-4xl mx-auto">
                Use AsQue to solve specific communication needs and boost productivity.
              </p>

              <div className="flex justify-center items-center mb-8 md:mb-12">
                <EnhancedButton
                  variant="primary"
                  size="md"
                  onClick={handleGetStarted}
                  icon={Zap}
                  className="w-full max-w-sm sm:w-auto"
                >
                  Start Building Now - It's Free
                </EnhancedButton>
              </div>

              {/* Trust Indicators */}
              <motion.div 
                className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 md:gap-8 text-xs md:text-sm text-slate-400"
                variants={itemVariants}
              >
                <div className="flex items-center gap-2 hover:text-emerald-300 transition-colors cursor-default">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                  <span>Free to start</span>
                </div>
                <div className="flex items-center gap-2 hover:text-emerald-300 transition-colors cursor-default">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2 hover:text-emerald-300 transition-colors cursor-default">
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                  <span>30-day money-back guarantee</span>
                </div>
              </motion.div>
            </div>
          </motion.section>
        </div>
      </div>
    </>
  )
}