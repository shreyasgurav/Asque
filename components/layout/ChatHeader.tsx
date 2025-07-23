import React, { useRef, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/auth/AuthContext';
import { signOut } from '@/lib/auth';
import { User } from 'lucide-react';

interface ChatHeaderProps {
  leftElement?: ReactNode;
  botName?: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ leftElement, botName }) => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
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

  return (
    <nav className="fixed top-0 w-full z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Left element (toggle button or custom) */}
          {leftElement ? leftElement : <div className="w-8 h-8" />}

          {/* Logo or Bot Name in the center */}
          <div className="flex-1 flex justify-center">
            {botName ? (
              <span className="text-xl md:text-2xl font-bold text-white truncate max-w-xs md:max-w-md lg:max-w-lg" title={botName}>{botName}</span>
            ) : (
              <img 
                src="/AsQue Logo NoBG.png" 
                alt="AsQue Logo" 
                className="w-8 h-8 object-contain"
              />
            )}
          </div>

          {/* User icon/sign-in on the right */}
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <div
                  className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center cursor-pointer"
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
      </div>
    </nav>
  );
};

export default ChatHeader; 