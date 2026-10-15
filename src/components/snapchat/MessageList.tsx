"use client";

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ChevronDown, Heart, Sparkles, Flame } from 'lucide-react';
import { ChatMessage, PartnerRole, UserProfile, MediaPayload, MessageType } from '@/types';
import { formatMessageDate } from '@/lib/chatUtils';
import { MessageBubble } from './MessageBubble';

export interface MessageListProps {
  messages: ChatMessage[];
  currentRole: PartnerRole;
  partnerProfile: UserProfile;
  myProfile?: UserProfile;
  partnerTyping?: boolean;
  onToggleSave: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onOpenMedia?: (media: MediaPayload, type: MessageType) => void;
  onSendQuickPrompt?: (text: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentRole,
  partnerProfile,
  myProfile,
  partnerTyping = false,
  onToggleSave,
  onReact,
  onOpenMedia,
  onSendQuickPrompt,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const prevMessagesLength = useRef(messages.length);

  // Group messages chronologically and by date
  const groupedMessages = useMemo(() => {
    // Sort chronologically ascending
    const sorted = [...messages].sort((a, b) => a.createdAt - b.createdAt);

    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = '';
    let currentGroup: ChatMessage[] = [];

    sorted.forEach((msg) => {
      const msgDate = formatMessageDate(msg.createdAt);
      if (msgDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = msgDate;
        currentGroup = [msg];
      } else {
        currentGroup.push(msg);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  }, [messages]);

  // Handle scroll detection
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const isScrolledUp = distanceToBottom > 150;
    setShowScrollBottom(isScrolledUp);
  };

  const scrollDomToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  // Scroll to bottom on mount and on new message arrivals if near bottom
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;

    if (messages.length > prevMessagesLength.current) {
      if (isNearBottom) {
        scrollDomToBottom(true);
      }
    } else if (prevMessagesLength.current === 0 && messages.length > 0) {
      // First load
      scrollDomToBottom(false);
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length]);

  // Auto-scroll when partner starts typing if near bottom
  useEffect(() => {
    if (partnerTyping && !showScrollBottom) {
      scrollDomToBottom(true);
    }
  }, [partnerTyping, showScrollBottom]);

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden flex flex-col bg-zinc-50 dark:bg-black">
      {/* Scrollable Message Feed */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 w-full overflow-y-auto px-3.5 py-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700"
      >
        {/* Empty State when chat has no messages */}
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 max-w-md mx-auto my-auto animate-in fade-in duration-300">
            {/* Romantic Avatars Facing Each Other */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg ring-4 ring-purple-400/30"
                style={{ backgroundColor: myProfile?.avatarColor || '#8B5CF6' }}
              >
                <span>{myProfile?.avatarEmoji || '👑'}</span>
              </div>
              <div className="relative">
                <Heart className="w-7 h-7 text-rose-500 fill-rose-500 animate-pulse" />
                <Sparkles className="w-4 h-4 text-amber-400 absolute -top-2 -right-2 animate-bounce" />
              </div>
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg ring-4 ring-pink-400/30"
                style={{ backgroundColor: partnerProfile.avatarColor || '#EC4899' }}
              >
                <span>{partnerProfile.avatarEmoji || '✨'}</span>
              </div>
            </div>

            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-1">
              Your Private Sanctuary
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 max-w-xs">
              End-to-end discreet lounge for you and {partnerProfile.name || 'your love'}. Send snaps, voice notes, or sweet texts.
            </p>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold mb-6 border border-orange-500/20">
              <Flame className="w-3.5 h-3.5" />
              <span>Day {partnerProfile.streakDays || 42} streak ready to continue!</span>
            </div>

            {/* Quick Starter Prompts */}
            {onSendQuickPrompt && (
              <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                {[
                  'Thinking of you ❤️',
                  'Miss you babe ✨',
                  'Send me a snap 📸',
                  'Hey gorgeous 🥰',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => onSendQuickPrompt(prompt)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors shadow-2xs active:scale-95 cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Render Chronological Message Feed with Date Grouping */
          groupedMessages.map((group) => (
            <div key={group.date} className="space-y-1">
              {/* Date Separator Pill */}
              <div className="sticky top-2 z-10 flex justify-center my-3 pointer-events-none">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-200/80 dark:bg-zinc-800/80 backdrop-blur-xs border border-zinc-300/40 dark:border-zinc-700/40 shadow-xs uppercase tracking-wider">
                  {group.date}
                </span>
              </div>

              {/* Messages in this date */}
              {group.messages.map((message, idx) => {
                const prevMsg = group.messages[idx - 1];
                const isDifferentSender = !prevMsg || prevMsg.sender !== message.sender;
                const isTimeDiverged =
                  !prevMsg || Math.abs(message.createdAt - prevMsg.createdAt) > 4 * 60 * 1000;
                const isClusterStart = isDifferentSender || isTimeDiverged;

                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    currentRole={currentRole}
                    senderName={
                      message.sender === 'partner1'
                        ? myProfile?.name || 'Me'
                        : partnerProfile.name || 'My Love'
                    }
                    showSenderHeader={isClusterStart}
                    onToggleSave={onToggleSave}
                    onReact={onReact}
                    onOpenMedia={onOpenMedia}
                  />
                );
              })}
            </div>
          ))
        )}

        {/* Live Partner Typing Indicator Bubble */}
        {partnerTyping && (
          <div className="flex items-center gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white shadow-xs flex-shrink-0"
              style={{ backgroundColor: partnerProfile.avatarColor || '#EC4899' }}
            >
              {partnerProfile.avatarEmoji || '✨'}
            </div>
            <div className="flex items-center gap-1 px-3.5 py-2 rounded-2xl rounded-tl-xs bg-zinc-200/90 dark:bg-zinc-800 border border-zinc-300/50 dark:border-zinc-700 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* Bottom Anchor */}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollDomToBottom(true)}
          className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 px-3 py-2 rounded-full bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-lg border border-zinc-200 dark:border-zinc-700 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:translate-y-0.5 transition-transform" />
          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
            Latest Snaps
          </span>
        </button>
      )}
    </div>
  );
};
