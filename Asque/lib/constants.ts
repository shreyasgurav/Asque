// App Configuration
export const APP_CONFIG = {
  name: 'AsQue',
  tagline: 'AI Chatbot Platform',
  description: 'Create Smart Chatbots by Simply Chatting',
  version: '1.0.0',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

// Navigation Links
export const NAVIGATION = {
  home: '/',
  login: '/login',
  createBot: '/create',
  myBots: '/my-bots',
} as const;

// Footer Links
export const FOOTER_LINKS = {
  product: [
    { name: 'Features', href: '#' },
    { name: 'Templates', href: '#' },
    { name: 'Integrations', href: '#' },
  ],
  support: [
    { name: 'Help Center', href: '#' },
    { name: 'Contact Us', href: '#' },
    { name: 'API Docs', href: '#' },
    { name: 'Status', href: '#' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
    { name: 'Cookie Policy', href: '#' },
  ],
} as const;

// Trust Indicators
export const TRUST_INDICATORS = [
  {
    icon: 'shield',
    text: 'Enterprise Security',
    color: 'text-green-400',
  },
  {
    icon: 'lightning',
    text: '30-Second Setup',
    color: 'text-yellow-400',
  },
  {
    icon: 'users',
    text: 'No Code Required',
    color: 'text-blue-400',
  },
] as const;

// How It Works Steps
export const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Create & Name Your Bot',
    description: 'Takes just 30 seconds to set up your new chatbot with a custom name and purpose.',
    icon: '💬',
    color: 'from-blue-500 to-blue-600',
    badge: '30 seconds',
    badgeColor: 'bg-green-500/20 text-green-300 border-green-500/30',
  },
  {
    step: '02',
    title: 'Train by Chatting',
    description: 'Simply have a conversation and tell your bot everything it needs to know. No coding required.',
    icon: '🧠',
    color: 'from-purple-500 to-purple-600',
    badge: 'No Code Required',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  {
    step: '03',
    title: 'Share & Deploy',
    description: 'Get an instant shareable link to deploy your chatbot anywhere, anytime.',
    icon: '🌐',
    color: 'from-green-500 to-green-600',
    badge: 'Instant Deploy',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
] as const;

// Use Cases
export const USE_CASES = [
  {
    icon: '🏪',
    title: 'Shop Owner',
    description: 'Handle customer questions about store hours, closures, and policies instantly.',
    example: 'Why is the shop closed today?',
    color: 'from-orange-500 to-red-500',
    bgColor: 'from-orange-500/10 to-red-500/10',
  },
  {
    icon: '📚',
    title: 'Student Helper',
    description: 'Get personalized help with specific homework assignments and course materials.',
    example: 'Help me with Chapter 5 calculus problems',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'from-green-500/10 to-emerald-500/10',
  },
  {
    icon: '🎫',
    title: 'Event Organizer',
    description: 'Share wedding details, event schedules, and instructions with all guests.',
    example: 'What\'s the dress code for the wedding?',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'from-purple-500/10 to-pink-500/10',
  },
  {
    icon: '🏠',
    title: 'Hostel Manager',
    description: 'Provide guests with comprehensive rules, guidelines, and facility information.',
    example: 'What are the check-in procedures?',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'from-blue-500/10 to-cyan-500/10',
  },
] as const;

// Trust Indicators for CTA
export const CTA_TRUST_INDICATORS = [
  { text: 'Free to start', icon: 'check' },
  { text: 'No credit card required', icon: 'check' },
  { text: '30-day money-back guarantee', icon: 'check' },
] as const; 