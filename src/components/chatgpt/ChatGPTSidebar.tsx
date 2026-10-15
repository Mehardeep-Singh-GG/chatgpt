'use client';

import React, { useRef, useState } from 'react';
import { ChatGPTSidebarProps } from './types';
import {
  SquarePen,
  Search,
  Sparkles,
  MessageSquare,
  Trash2,
  MoreVertical,
  X,
  Settings,
  LogOut,
  Sliders,
  ChevronRight,
} from 'lucide-react';

export const ChatGPTSidebar: React.FC<ChatGPTSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  isOpenMobile,
  onCloseMobile,
  userName = 'User',
  theme,
  onSecretLogoClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Triple-click trigger on sidebar logo
  const logoClickCountRef = useRef(0);
  const lastLogoClickRef = useRef(0);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastLogoClickRef.current < 500) {
      logoClickCountRef.current += 1;
    } else {
      logoClickCountRef.current = 1;
    }
    lastLogoClickRef.current = now;

    if (logoClickCountRef.current >= 3) {
      logoClickCountRef.current = 0;
      onSecretLogoClick?.();
    }
  };

  const isDark = theme === 'dark';

  // Group conversations by category
  const categories: Array<'Today' | 'Yesterday' | 'Previous 7 Days' | 'Previous 30 Days'> = [
    'Today',
    'Yesterday',
    'Previous 7 Days',
    'Previous 30 Days',
  ];

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sidebarContent = (
    <div
      className={`flex h-full w-[260px] flex-col justify-between transition-colors ${
        isDark ? 'bg-[#171717] text-zinc-200' : 'bg-[#f9f9f9] text-zinc-800'
      }`}
    >
      {/* Top Header & Actions */}
      <div className="flex flex-col p-3 pb-2">
        {/* Logo and New Chat */}
        <div className="flex items-center justify-between pb-3">
          <div
            onClick={handleLogoClick}
            className="flex items-center gap-2 cursor-pointer select-none group"
            title="ChatGPT"
          >
            {/* OpenAI Logo SVG */}
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm group-hover:scale-105 transition-transform">
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a10 10 0 0 1 10 10c0 4.41-2.87 8.16-6.84 9.48l-.66-.46V18a2 2 0 0 0-2-2h-1v-2h2a2 2 0 0 0 2-2V9.83l.88-.88A7.97 7.97 0 0 0 12 4a8 8 0 0 0-7.88 6.64l.88.88V12a2 2 0 0 0 2 2h2v2h-1a2 2 0 0 0-2 2v2.98l-.66.46A10.003 10.003 0 0 1 12 2z" />
              </svg>
            </div>
            <span className="font-semibold text-sm tracking-tight">ChatGPT</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onNewChat();
                onCloseMobile();
              }}
              title="New chat"
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                isDark
                  ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  : 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
              }`}
            >
              <SquarePen className="h-4 w-4" />
            </button>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              title="Close sidebar"
              className={`md:hidden flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                isDark
                  ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  : 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div
          className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs transition-colors ${
            isDark ? 'bg-zinc-800/60 text-zinc-400' : 'bg-zinc-200/60 text-zinc-600'
          }`}
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none placeholder:text-zinc-500 text-xs"
          />
        </div>
      </div>

      {/* Middle: Scrollable Chat History */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 py-2 scrollbar-thin">
        {categories.map((category) => {
          const categoryChats = filteredConversations.filter((c) => c.category === category);
          if (categoryChats.length === 0) return null;

          return (
            <div key={category} className="space-y-1">
              <div className="px-2 py-1 text-[11px] font-semibold text-zinc-500 tracking-wider">
                {category}
              </div>

              {categoryChats.map((conv) => {
                const isActive = activeConversationId === conv.id;
                const isMenuOpen = activeMenuId === conv.id;

                return (
                  <div
                    key={conv.id}
                    className={`group relative flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-colors cursor-pointer ${
                      isActive
                        ? isDark
                          ? 'bg-zinc-800 text-white font-medium'
                          : 'bg-zinc-200 text-zinc-900 font-medium'
                        : isDark
                        ? 'text-zinc-300 hover:bg-zinc-800/50'
                        : 'text-zinc-700 hover:bg-zinc-100'
                    }`}
                    onClick={() => {
                      onSelectConversation(conv.id);
                      onCloseMobile();
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <MessageSquare
                        className={`h-3.5 w-3.5 shrink-0 ${
                          isActive
                            ? 'text-emerald-500'
                            : isDark
                            ? 'text-zinc-500'
                            : 'text-zinc-400'
                        }`}
                      />
                      <span className="truncate">{conv.title}</span>
                    </div>

                    {/* Options / Delete on Hover */}
                    <div
                      className={`relative flex items-center gap-1 ${
                        isMenuOpen || isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      } transition-opacity`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setActiveMenuId(isMenuOpen ? null : conv.id)}
                        className={`rounded p-1 transition-colors ${
                          isDark
                            ? 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                            : 'text-zinc-500 hover:bg-zinc-300 hover:text-zinc-900'
                        }`}
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>

                      {/* Dropdown for item actions */}
                      {isMenuOpen && (
                        <div
                          className={`absolute right-0 top-6 z-50 w-32 rounded-xl p-1 shadow-xl border text-xs ${
                            isDark
                              ? 'bg-zinc-900 border-zinc-700 text-zinc-200'
                              : 'bg-white border-zinc-200 text-zinc-800'
                          }`}
                        >
                          <button
                            onClick={() => {
                              onDeleteConversation(conv.id);
                              setActiveMenuId(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {filteredConversations.length === 0 && (
          <div className="p-4 text-center text-xs text-zinc-500">
            No matching conversations found
          </div>
        )}
      </div>

      {/* Bottom Section: Upgrade Banner & User Profile */}
      <div
        className={`p-2 border-t transition-colors ${
          isDark ? 'border-zinc-800/80' : 'border-zinc-200'
        }`}
      >
        {/* Upgrade Plan Banner */}
        <div
          className={`mb-2 flex items-center justify-between rounded-xl p-2.5 cursor-pointer transition-all ${
            isDark
              ? 'bg-zinc-800/40 hover:bg-zinc-800 text-zinc-200'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 text-black shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-semibold">Upgrade plan</div>
              <div className="text-[10px] text-zinc-400">More access to the best models</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-400" />
        </div>

        {/* User Profile Bar */}
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={`flex w-full items-center justify-between rounded-xl p-2 text-xs transition-colors ${
              isDark
                ? 'hover:bg-zinc-800/70 text-zinc-200'
                : 'hover:bg-zinc-200/70 text-zinc-800'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-bold text-white text-xs shadow-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="truncate text-left">
                <div className="font-medium truncate">{userName}</div>
                <div className="text-[10px] text-zinc-400">Free Plan</div>
              </div>
            </div>
            <MoreVertical className="h-4 w-4 text-zinc-400 shrink-0" />
          </button>

          {/* Profile Menu Popover */}
          {isProfileMenuOpen && (
            <div
              className={`absolute bottom-full left-0 mb-2 w-full rounded-2xl p-1.5 shadow-2xl border text-xs z-50 animate-in fade-in zoom-in-95 duration-150 ${
                isDark
                  ? 'bg-[#212121] border-zinc-700/80 text-zinc-200'
                  : 'bg-white border-zinc-200 text-zinc-800'
              }`}
            >
              <div className="px-3 py-2 border-b border-zinc-700/50">
                <div className="font-semibold">{userName}</div>
                <div className="text-[11px] text-zinc-400">user@example.com</div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => setIsProfileMenuOpen(false)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors ${
                    isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-700'
                  }`}
                >
                  <Sliders className="h-4 w-4 text-zinc-400" />
                  <span>Custom instructions</span>
                </button>

                <button
                  onClick={() => setIsProfileMenuOpen(false)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors ${
                    isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-700'
                  }`}
                >
                  <Settings className="h-4 w-4 text-zinc-400" />
                  <span>Settings</span>
                </button>
              </div>

              <div className="border-t border-zinc-700/50 pt-1">
                <button
                  onClick={() => setIsProfileMenuOpen(false)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-red-400 transition-colors ${
                    isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
                  }`}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Persistent) */}
      <aside className="hidden md:flex md:shrink-0 h-full border-r border-zinc-800/40">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide-in) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
          />
          {/* Drawer container */}
          <div className="relative z-10 h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
