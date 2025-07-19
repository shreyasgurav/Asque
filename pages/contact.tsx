"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef } from "react"
import { Mail, Phone, Copy, Check, ArrowLeft, User } from "lucide-react"
import Layout from "@/components/layout/Layout"
import { useRouter } from "next/router"
import { motion } from "framer-motion"
import { useAuth } from '@/components/auth/AuthContext';
import { signOut } from '@/lib/auth';

export default function Contact() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [emailCopied, setEmailCopied] = useState(false)
  const [phoneCopied, setPhoneCopied] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleCopy = async (text: string, type: "email" | "phone") => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === "email") {
        setEmailCopied(true)
        setTimeout(() => setEmailCopied(false), 2000)
      } else {
        setPhoneCopied(true)
        setTimeout(() => setPhoneCopied(false), 2000)
      }
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const contactMethods = [
    {
      icon: Mail,
      title: "Email",
      value: "asquebusiness@gmail.com",
      description: "- Drop us a line anytime",
      color: "from-blue-500 to-cyan-500",
      copied: emailCopied,
      onCopy: () => handleCopy("contact@zestlive.in", "email"),
    },
    {
      icon: Phone,
      title: "Phone",
      value: "+91 70586 44548",
      description: "- Shreyas Gurav",
      color: "from-green-500 to-emerald-500",
      copied: phoneCopied,
      onCopy: () => handleCopy("+91 70586 44548", "phone"),
    },
  ]

  return (
    <Layout showHeader={false} showFooter={false}>
      <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
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
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
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
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
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
            className="absolute top-3/4 left-3/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl"
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

        {/* Custom Header with Centered Logo */}
        <nav className="fixed top-0 w-full z-50 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <button
                onClick={() => router.push('/')}
                className="text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 p-2 rounded-full"
              >
                <ArrowLeft size={20} />
              </button>
              <img 
                src="/AsQue Logo NoBG.png" 
                alt="AsQue Logo" 
                className="w-8 h-8 object-contain"
              />
              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <div
                    className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center cursor-pointer"
                    onClick={() => setDropdownOpen((v) => !v)}
                    onMouseEnter={() => setDropdownOpen(true)}
                  >
                    <User size={18} className="text-white" />
                  </div>
                  {dropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 animate-fade-in"
                      onMouseLeave={() => setDropdownOpen(false)}
                    >
                      <div className="px-4 py-3 border-b border-slate-800 text-xs text-slate-400 font-semibold">
                        {user?.phoneNumber ? user.phoneNumber : 'No phone'}
                      </div>
                      <button
                        className="block w-full text-left px-4 py-3 text-slate-200 hover:bg-slate-800 text-sm"
                        onClick={() => { router.push('/my-bots'); setDropdownOpen(false); }}
                      >
                        My Bots
                      </button>
                      <button
                        className="block w-full text-left px-4 py-3 text-slate-200 hover:bg-slate-800 text-sm"
                        onClick={() => { router.push('/create'); setDropdownOpen(false); }}
                      >
                        Create Bot
                      </button>
                      <div className="border-t border-slate-800 my-1" />
                      <button
                        className="block w-full text-left px-4 py-3 text-red-400 hover:bg-slate-800 text-sm"
                        onClick={() => { signOut(); setDropdownOpen(false); }}
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => router.push('/login')}
                  className="ml-2 signInButton signInButtonSmall"
                >
                  Sign In
                </button>
              )}
              <style jsx>{`
                .signInButton {
                  background: rgba(255, 255, 255, 0.1);
                  border: 0px solid rgba(255, 255, 255, 0.1);
                  border-radius: 15px;
                  padding: 7px 14px;
                  color: rgba(255, 255, 255, 0.8);
                  font-size: 13px;
                  font-weight: 500;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  backdrop-filter: blur(4px);
                }
                .signInButtonSmall {
                  padding: 3px 8px;
                  font-size: 11px;
                }
                .signInButton:hover {
                  background: rgba(255, 255, 255, 0.8);
                  border-color: rgba(255, 255, 255, 0.3);
                  color: black;
                }
              `}</style>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative z-10 h-full flex items-center justify-center">
          <div className="w-full max-w-7xl mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="transform translate-y-0 opacity-100 transition-all duration-1500 ease-out">
                {/* Main Heading */}
                <div className="mb-8">
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-none mb-4">
                    <span className="inline bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                      Let's{" "}
                    </span>
                    <span className="inline bg-gradient-to-r from-purple-400 via-purple-500 to-blue-400 bg-clip-text text-transparent animate-pulse">
                      Talk
                    </span>
                  </h1>
                  <p className="text-lg sm:text-xl lg:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    Got questions? Ideas? Just want to say hi?
                    <br />
                    <span className="text-white">We're here for it.</span>
                  </p>
                </div>

                {/* Contact Methods */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 max-w-2xl mx-auto">
                  {contactMethods.map((method, index) => (
                    <div
                      key={index}
                      className="bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-500 cursor-pointer rounded-xl hover:border-white/20 hover:scale-105 p-4 sm:p-6 md:p-8"
                      onClick={method.onCopy}
                    >
                                              <div className="flex items-center justify-between mb-2 sm:mb-4">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-r ${method.color} flex items-center justify-center transition-transform duration-300 group-hover:rotate-12`}>
                            <method.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:text-white p-1 sm:p-2 transition-colors duration-300"
                          >
                            {method.copied ? <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" /> : <Copy className="w-3 h-3 sm:w-4 sm:h-4" />}
                          </Button>
                        </div>
                        <div className="text-left">
                          <h3 className="text-xs sm:text-sm text-gray-400 mb-1">{method.title}</h3>
                          <p className="text-sm sm:text-base md:text-lg font-semibold text-white mb-1 sm:mb-2 transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-200 group-hover:bg-clip-text group-hover:text-transparent">
                            {method.value}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500">{method.description}</p>
                        </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  )
} 