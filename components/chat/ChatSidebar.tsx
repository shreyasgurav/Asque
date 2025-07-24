import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelectChat: (sessionId: string, botId: string) => void;
  onStartNewChat?: () => void;
  pastChats: any[];
  loadingChats: boolean;
  currentSessionId: string;
  currentBotId: string;
  isAuthenticated: boolean;
  formatLastMessage: (msg: string) => string;
  formatTime?: (date: Date | string) => string;
  sidebarRef: React.RefObject<HTMLDivElement>;
}

const TwoLineMenuIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect y="4" width="20" height="2.5" rx="1.25" fill={color} />
    <rect y="9.25" width="20" height="2.5" rx="1.25" fill={color} />
  </svg>
);

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  onToggle,
  onSelectChat,
  onStartNewChat,
  pastChats,
  loadingChats,
  currentSessionId,
  currentBotId,
  isAuthenticated,
  formatLastMessage,
  formatTime,
  sidebarRef,
}) => {
  // Use only real pastChats
  const displayChats = pastChats;
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      <div
        ref={sidebarRef}
        className={`bg-slate-900 fixed lg:relative h-full border-r border-white/10 transition-all duration-300 ease-in-out z-50 flex flex-col ${isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:w-16 lg:translate-x-0'} ${!isOpen && 'lg:overflow-hidden'}`}
      >
        <div className="flex flex-col h-full">
          <div className="p-3">
            <div className="flex items-center">
              <button
                onClick={onToggle}
                className="p-2 rounded-full text-[var(--sidebar-toggle-text)] hover:bg-[var(--sidebar-toggle-hover-bg)] hover:text-white transition-colors"
                aria-label="Toggle sidebar"
              >
                {isOpen ? <ChevronLeft size={20} /> : <TwoLineMenuIcon size={20} />}
              </button>
              {isOpen && (
                <h2 className="ml-3 text-lg font-semibold text-[var(--sidebar-header-text)]">Chat History</h2>
              )}
            </div>
          </div>
          {isOpen && (
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {loadingChats ? (
                <div className="text-center py-8">
                  <div className="w-7 h-7 border-2 border-[var(--spinner-color-light)] border-t-[var(--spinner-color-dark)] rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-[var(--sidebar-toggle-text)] text-sm">Loading chats...</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Chat List */}
                  {displayChats.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-[var(--sidebar-time-text)] text-sm">No recent chats.</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {displayChats.map((chat: any) => (
                        <button
                          key={chat.sessionId}
                          onClick={() => onSelectChat(chat.sessionId, chat.botId)}
                          className={`w-full text-left p-3 rounded-lg cursor-pointer transition-colors text-sm ${chat.sessionId === currentSessionId && chat.botId === currentBotId ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-500/50 text-white shadow-lg' : 'bg-[var(--sidebar-bg-default)] hover:bg-[var(--sidebar-hover-bg)] text-[var(--sidebar-text-default)]'} flex items-center gap-3 hover:bg-slate-700/60`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{chat.botName}</p>
                            </div>
                            <p className="text-xs text-[var(--sidebar-toggle-text)] truncate mt-1 opacity-50">{formatLastMessage(chat.lastMessage)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {/* Sidebar Bottom Section - always at the bottom */}
          {isOpen && (
            <div className="p-4 text-xs text-[var(--sidebar-time-text)] border-t border-white/10">
              <a href="/about" className="block mb-1 opacity-70 hover:opacity-100 transition-opacity">About</a>
              <a href="/contact" className="block mb-1 opacity-70 hover:opacity-100 transition-opacity">Contact</a>
              <a href="https://www.linkedin.com/in/shreyasdgurav/" target="_blank" rel="noopener noreferrer" className="block opacity-80 hover:opacity-100 transition-opacity">
                By <span className="text-blue-500 font-semibold">Shreyas Gurav</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatSidebar; 