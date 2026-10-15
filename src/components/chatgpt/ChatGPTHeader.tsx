'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatGPTHeaderProps, ChatGPTModel } from './types';
import {
  PanelLeft,
  ChevronDown,
  Share2,
  SquarePen,
  Sun,
  Moon,
  Sparkles,
  Zap,
  BrainCircuit,
  Check,
  MoreHorizontal,
} from 'lucide-react';

export const ChatGPTHeader: React.FC<ChatGPTHeaderProps> = ({
  selectedModel,
  onSelectModel,
  onToggleSidebar,
  onNewChat,
  isSidebarOpen,
  theme,
  onToggleTheme,
  onSecretTriggerClick,
}) => {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Triple-click secret trigger state
  const clickCountRef = useRef<number>(0);
  const lastClickTimeRef = useRef<number>(0);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastClickTimeRef.current < 500) {
      clickCountRef.current += 1;
    } else {
      clickCountRef.current = 1;
    }
    lastClickTimeRef.current = now;

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      onSecretTriggerClick?.();
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const modelLabels: Record<ChatGPTModel, { name: string; tag: string; desc: string; icon: typeof Sparkles }> = {
    'gpt-4o': {
      name: 'ChatGPT 4o',
      tag: '4o',
      desc: 'Our smartest & fastest multimodal flagship model',
      icon: Sparkles,
    },
    'gpt-4o-mini': {
      name: 'ChatGPT 4o mini',
      tag: 'mini',
      desc: 'Affordable, low latency for everyday tasks',
      icon: Zap,
    },
    'o1-preview': {
      name: 'ChatGPT o1',
      tag: 'o1',
      desc: 'Advanced reasoning for complex code, math and science',
      icon: BrainCircuit,
    },
  };

  const isDark = theme === 'dark';

  return (
    <header
      className={`sticky top-0 z-30 flex h-14 w-full items-center justify-between px-3 transition-colors ${
        isDark ? 'bg-[#212121] text-zinc-200' : 'bg-white text-zinc-800'
      }`}
    >
      {/* Left Section: Sidebar Toggle & New Chat (mobile/closed) */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
            isDark
              ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
          }`}
        >
          <PanelLeft className="h-5 w-5" />
        </button>

        <button
          onClick={onNewChat}
          aria-label="New chat"
          className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
            isDark
              ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
          }`}
        >
          <SquarePen className="h-5 w-5" />
        </button>
      </div>

      {/* Center Section: Model Switcher with Triple-Click Secret Camouflage */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-base font-semibold transition-colors ${
            isDark
              ? 'text-zinc-200 hover:bg-zinc-800/80 active:bg-zinc-800'
              : 'text-zinc-800 hover:bg-zinc-100 active:bg-zinc-200'
          }`}
        >
          {/* Logo with 3-click stealth trigger */}
          <span
            onClick={(e) => {
              e.stopPropagation();
              handleLogoClick();
            }}
            className="cursor-pointer select-none"
            title="ChatGPT"
          >
            ChatGPT
          </span>
          <span
            className={`text-sm font-normal ${
              isDark ? 'text-zinc-400' : 'text-zinc-500'
            }`}
          >
            {modelLabels[selectedModel].tag}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isDark ? 'text-zinc-400' : 'text-zinc-500'
            } ${isModelDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Model Switcher Dropdown */}
        {isModelDropdownOpen && (
          <div
            className={`absolute left-1/2 top-full mt-2 w-72 -translate-x-1/2 rounded-2xl p-1.5 shadow-2xl border transition-all z-50 animate-in fade-in zoom-in-95 duration-150 ${
              isDark
                ? 'bg-[#2f2f2f] border-zinc-700/80 text-zinc-100'
                : 'bg-white border-zinc-200 text-zinc-800'
            }`}
          >
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Model
            </div>

            {(['gpt-4o', 'gpt-4o-mini', 'o1-preview'] as ChatGPTModel[]).map((modelKey) => {
              const item = modelLabels[modelKey];
              const Icon = item.icon;
              const isSelected = selectedModel === modelKey;

              return (
                <button
                  key={modelKey}
                  onClick={() => {
                    onSelectModel(modelKey);
                    setIsModelDropdownOpen(false);
                  }}
                  className={`flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors ${
                    isDark
                      ? isSelected
                        ? 'bg-zinc-800 text-white'
                        : 'hover:bg-zinc-800/60 text-zinc-300'
                      : isSelected
                      ? 'bg-zinc-100 text-zinc-900'
                      : 'hover:bg-zinc-50 text-zinc-700'
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      isDark ? 'bg-zinc-700/80 text-emerald-400' : 'bg-zinc-200 text-emerald-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.name}</span>
                      {isSelected && <Check className="h-4 w-4 text-emerald-500" />}
                    </div>
                    <p
                      className={`text-xs mt-0.5 line-clamp-1 ${
                        isDark ? 'text-zinc-400' : 'text-zinc-500'
                      }`}
                    >
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}

            <div
              className={`my-1.5 h-px ${isDark ? 'bg-zinc-700/60' : 'bg-zinc-100'}`}
            />

            <div
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs ${
                isDark ? 'text-zinc-400' : 'text-zinc-500'
              }`}
            >
              <span>Temporary chat</span>
              <span className="text-[10px] rounded bg-zinc-700/50 px-1.5 py-0.5 text-zinc-300">
                Off
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right Section: Share, Theme Toggle, Profile */}
      <div className="flex items-center gap-1.5">
        {/* Theme Toggle (Dark/Light) */}
        <button
          onClick={onToggleTheme}
          aria-label="Toggle dark/light mode"
          title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
            isDark
              ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
          }`}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Share Button */}
        <button
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
              navigator.clipboard.writeText(window.location.href);
            }
          }}
          aria-label="Share chat"
          title="Share link to chat"
          className={`hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            isDark
              ? 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200'
          }`}
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>Share</span>
        </button>

        {/* More Options / Ellipsis */}
        <button
          aria-label="More options"
          className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
            isDark
              ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
          }`}
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};
