"use client";

import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  Bookmark,
  Check,
  CheckCheck,
  Volume2,
  Maximize2
} from 'lucide-react';
import { ChatMessage, PartnerRole, MediaPayload, MessageType } from '@/types';
import { formatMessageTime, formatDuration } from '@/lib/chatUtils';

export interface MessageBubbleProps {
  message: ChatMessage;
  currentRole: PartnerRole;
  senderName?: string;
  showSenderHeader?: boolean;
  onToggleSave: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onOpenMedia?: (media: MediaPayload, type: MessageType) => void;
}

const QUICK_EMOJIS = ['❤️', '🔥', '😂', '🥺', '💋'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  currentRole,
  senderName,
  showSenderHeader = false,
  onToggleSave,
  onReact,
  onOpenMedia,
}) => {
  const isMe = message.sender === currentRole;
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Audio Playback Handler
  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch((err) => {
        console.error('Audio play error:', err);
      });
    }
  };

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const duration = audioRef.current.duration || message.media?.duration || 1;
    setCurrentTime(current);
    setAudioProgress(Math.min(100, (current / duration) * 100));
  };

  const handleAudioEnded = () => {
    setIsPlayingAudio(false);
    setAudioProgress(0);
    setCurrentTime(0);
  };

  // Generate deterministic waveform bars if not provided
  const waveformBars = React.useMemo(() => {
    if (message.media?.waveform && message.media.waveform.length > 0) {
      return message.media.waveform;
    }
    // Generate 24 pseudo-random heights based on message ID
    const bars: number[] = [];
    let hash = 0;
    for (let i = 0; i < message.id.length; i++) {
      hash = (hash << 5) - hash + message.id.charCodeAt(i);
      hash |= 0;
    }
    for (let i = 0; i < 24; i++) {
      const pseudo = Math.abs(Math.sin(hash + i * 1.618));
      bars.push(Math.max(0.2, Math.min(1.0, pseudo)));
    }
    return bars;
  }, [message.id, message.media?.waveform]);

  // Touch handlers for mobile long-press
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      onToggleSave(message.id);
    }, 550);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Count reaction aggregates
  const reactionCounts = React.useMemo(() => {
    if (!message.reactions) return {};
    const counts: Record<string, { count: number; users: string[] }> = {};
    for (const [userId, emoji] of Object.entries(message.reactions)) {
      if (!counts[emoji]) {
        counts[emoji] = { count: 0, users: [] };
      }
      counts[emoji].count += 1;
      counts[emoji].users.push(userId);
    }
    return counts;
  }, [message.reactions]);

  const hasReactions = Object.keys(reactionCounts).length > 0;

  return (
    <div
      className={`group relative flex flex-col mb-2.5 transition-all select-none ${
        isMe ? 'items-end' : 'items-start'
      }`}
      onMouseEnter={() => setShowReactionMenu(true)}
      onMouseLeave={() => setShowReactionMenu(false)}
    >
      {/* Sender Header if first in cluster */}
      {showSenderHeader && !isMe && (
        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1 ml-3">
          {senderName || message.senderName || 'Partner'}
        </span>
      )}

      {/* Main Bubble & Reactions Wrapper */}
      <div className="relative max-w-[85%] sm:max-w-[70%]">
        {/* Floating Quick Reaction Bar (on Hover/Tap) */}
        {showReactionMenu && (
          <div
            className={`absolute -top-10 z-20 flex items-center gap-1 px-2 py-1 rounded-full bg-white dark:bg-zinc-800 shadow-lg border border-zinc-200 dark:border-zinc-700 animate-in fade-in zoom-in-90 duration-150 ${
              isMe ? 'right-0' : 'left-0'
            }`}
          >
            {QUICK_EMOJIS.map((emoji) => {
              const myReaction = message.reactions?.[currentRole];
              const isSelected = myReaction === emoji;
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReact(message.id, emoji);
                  }}
                  className={`text-sm sm:text-base hover:scale-130 active:scale-95 transition-transform p-1 rounded-full cursor-pointer ${
                    isSelected ? 'bg-amber-100 dark:bg-amber-950/60 ring-1 ring-amber-400' : ''
                  }`}
                  title={`React ${emoji}`}
                >
                  {emoji}
                </button>
              );
            })}
            {/* Quick Save toggle inside reaction bar */}
            <div className="w-[1px] h-4 bg-zinc-300 dark:bg-zinc-600 mx-0.5" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(message.id);
              }}
              className={`p-1 rounded-full transition-colors cursor-pointer ${
                message.savedInChat
                  ? 'text-amber-500 hover:text-amber-600'
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
              }`}
              title={message.savedInChat ? 'Saved in Chat' : 'Save in Chat'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${message.savedInChat ? 'fill-amber-400' : ''}`} />
            </button>
          </div>
        )}

        {/* Bubble Container */}
        <div
          onClick={() => {
            // Clicking or double-tapping toggles save
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchEnd}
          className={`relative overflow-hidden transition-all duration-200 ${
            // Snapchat Save in Chat iconic left yellow bar
            message.savedInChat
              ? 'border-l-4 border-amber-400 dark:border-yellow-400 pl-3.5 pr-3 py-2.5 shadow-md bg-amber-500/10 dark:bg-amber-500/15'
              : 'p-3 shadow-xs'
          } ${
            // Sender Styling
            isMe
              ? message.savedInChat
                ? 'rounded-2xl rounded-tr-xs text-zinc-900 dark:text-zinc-100'
                : 'rounded-2xl rounded-tr-xs bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white'
              : message.savedInChat
              ? 'rounded-2xl rounded-tl-xs text-zinc-900 dark:text-zinc-100'
              : 'rounded-2xl rounded-tl-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-700/50'
          }`}
        >
          {/* Saved in Chat Pill Indicator */}
          {message.savedInChat && (
            <div className="flex items-center gap-1 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <Bookmark className="w-3 h-3 fill-amber-400 text-amber-500" />
              <span>Saved in Chat</span>
            </div>
          )}

          {/* 1. TEXT MESSAGE */}
          {message.type === 'text' && (
            <div className="text-[14.5px] leading-relaxed break-words whitespace-pre-wrap select-text">
              {message.text}
            </div>
          )}

          {/* 2. VOICE MEMO */}
          {message.type === 'voice' && (
            <div className="flex flex-col gap-2 min-w-[220px] sm:min-w-[260px]">
              {message.media?.url && (
                <audio
                  ref={audioRef}
                  src={message.media.url}
                  preload="metadata"
                  onTimeUpdate={handleAudioTimeUpdate}
                  onEnded={handleAudioEnded}
                  className="hidden"
                />
              )}

              <div className="flex items-center gap-3">
                {/* Play / Pause Round Button */}
                <button
                  type="button"
                  onClick={toggleAudio}
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-90 cursor-pointer shadow-sm ${
                    isMe && !message.savedInChat
                      ? 'bg-white text-indigo-600 hover:bg-zinc-100'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                  aria-label={isPlayingAudio ? 'Pause Voice Memo' : 'Play Voice Memo'}
                >
                  {isPlayingAudio ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>

                {/* Waveform Visualization Bars */}
                <div className="flex-1 flex items-center gap-[2.5px] h-8 overflow-hidden">
                  {waveformBars.map((height, idx) => {
                    const barPercent = (idx / waveformBars.length) * 100;
                    const isPlayed = barPercent <= audioProgress;
                    return (
                      <div
                        key={idx}
                        className={`w-1 rounded-full transition-all duration-100 ${
                          isPlayed
                            ? isMe && !message.savedInChat
                              ? 'bg-white'
                              : 'bg-purple-600 dark:bg-purple-400'
                            : isMe && !message.savedInChat
                            ? 'bg-white/40'
                            : 'bg-zinc-300 dark:bg-zinc-600'
                        }`}
                        style={{
                          height: `${Math.max(15, height * 100)}%`,
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Duration & Status */}
              <div
                className={`flex items-center justify-between text-[11px] font-mono ${
                  isMe && !message.savedInChat ? 'text-white/80' : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Volume2 className="w-3 h-3" />
                  <span>
                    {isPlayingAudio
                      ? formatDuration(currentTime)
                      : formatDuration(message.media?.duration || 0)}
                  </span>
                </div>
                <span>Voice Memo</span>
              </div>
            </div>
          )}

          {/* 3. VIDEO SNAP */}
          {message.type === 'video' && message.media && (
            <div className="flex flex-col gap-1.5 max-w-[280px]">
              <div
                onClick={() => onOpenMedia && onOpenMedia(message.media!, 'video')}
                className="relative rounded-xl overflow-hidden aspect-[9/16] max-h-[360px] bg-black cursor-pointer group/video shadow-inner"
              >
                {/* Thumbnail or Video element */}
                {message.media.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={message.media.thumbnailUrl}
                    alt="Video Snap"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={message.media.url}
                    className="w-full h-full object-cover"
                    preload="metadata"
                  />
                )}

                {/* Video Play Overlay */}
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover/video:bg-black/40 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-white/90 text-zinc-900 flex items-center justify-center shadow-lg group-hover/video:scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-zinc-900 ml-0.5" />
                  </div>
                </div>

                {/* Duration Badge */}
                {message.media.duration && (
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[11px] font-mono">
                    {formatDuration(message.media.duration)}
                  </div>
                )}

                <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover/video:opacity-100 transition-opacity">
                  <Maximize2 className="w-3.5 h-3.5" />
                </div>
              </div>

              {message.text && (
                <p className="text-[13px] leading-snug px-1 pt-1 break-words">{message.text}</p>
              )}
            </div>
          )}

          {/* 4. PHOTO SNAP */}
          {message.type === 'photo' && message.media && (
            <div className="flex flex-col gap-1.5 max-w-[280px]">
              <div
                onClick={() => onOpenMedia && onOpenMedia(message.media!, 'photo')}
                className="relative rounded-xl overflow-hidden cursor-pointer group/photo"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={message.media.url}
                  alt="Snap"
                  className="w-full h-auto max-h-[380px] object-cover rounded-xl shadow-xs group-hover/photo:scale-102 transition-transform duration-200"
                />
                <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover/photo:opacity-100 transition-opacity">
                  <Maximize2 className="w-3.5 h-3.5" />
                </div>
              </div>

              {message.text && (
                <p className="text-[13px] leading-snug px-1 pt-1 break-words">{message.text}</p>
              )}
            </div>
          )}

          {/* Subtext: Timestamp & Receipts */}
          <div
            className={`flex items-center gap-1.5 mt-1.5 text-[10px] ${
              isMe && !message.savedInChat
                ? 'text-white/80 justify-end'
                : 'text-zinc-500 dark:text-zinc-400 justify-end'
            }`}
          >
            <span>{formatMessageTime(message.createdAt)}</span>

            {/* Status Receipts for sender */}
            {isMe && (
              <span className="flex items-center gap-0.5">
                {message.savedInChat ? (
                  <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                    <Bookmark className="w-2.5 h-2.5 fill-amber-400" />
                    <span>Saved</span>
                  </span>
                ) : message.opened ? (
                  <span className="flex items-center gap-0.5 text-purple-200 font-medium">
                    <CheckCheck className="w-3 h-3 text-purple-200" />
                    <span>Opened</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-white/70">
                    <Check className="w-3 h-3 text-white/70" />
                    <span>Delivered</span>
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Existing Reactions Bar (under the bubble) */}
        {hasReactions && (
          <div
            className={`flex flex-wrap items-center gap-1 mt-1 ${
              isMe ? 'justify-end mr-1' : 'justify-start ml-1'
            }`}
          >
            {Object.entries(reactionCounts).map(([emoji, data]) => {
              const hasMyReaction = data.users.includes(currentRole);
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onReact(message.id, emoji)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shadow-xs transition-transform active:scale-90 cursor-pointer ${
                    hasMyReaction
                      ? 'bg-amber-100 dark:bg-amber-950/80 border border-amber-400/80 text-amber-900 dark:text-amber-200 ring-1 ring-amber-400/40'
                      : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
                  title={`${data.count} reaction${data.count > 1 ? 's' : ''}`}
                >
                  <span>{emoji}</span>
                  {data.count > 1 && <span className="text-[10px] font-bold">{data.count}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
