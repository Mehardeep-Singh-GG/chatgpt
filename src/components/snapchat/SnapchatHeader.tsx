"use client";

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Shield, Settings, Image as ImageIcon, Sparkles, Heart } from 'lucide-react';
import { UserProfile, PartnerRole, RoomPresence } from '@/types';
import { formatLastSeen } from '@/lib/chatUtils';

export interface SnapchatHeaderProps {
  currentRole: PartnerRole;
  partnerProfile: UserProfile;
  myProfile?: UserProfile;
  presence?: RoomPresence;
  streakDays?: number;
  onPanic: () => void;
  onOpenPairing: () => void;
  onOpenGallery?: () => void;
}

export const SnapchatHeader: React.FC<SnapchatHeaderProps> = ({
  currentRole,
  partnerProfile,
  presence,
  streakDays = 42,
  onPanic,
  onOpenPairing,
  onOpenGallery,
}) => {
  const [showCelebrationToast, setShowCelebrationToast] = useState(false);

  // Determine partner online & typing status based on role
  const isPartner1 = currentRole === 'partner1';
  const isOnline = isPartner1 ? (presence?.partner2Online ?? false) : (presence?.partner1Online ?? false);
  const isTyping = isPartner1 ? (presence?.partner2Typing ?? false) : (presence?.partner1Typing ?? false);
  const lastActive = isPartner1 ? (presence?.partner2LastActive ?? 0) : (presence?.partner1LastActive ?? 0);

  const displayStreak = streakDays || partnerProfile.streakDays || 1;

  // Streak celebration click handler
  const handleStreakClick = () => {
    // Canvas confetti burst with couple colors: pinks, golds, purples, corals
    try {
      // First burst
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.15 },
        colors: ['#FF69B4', '#FF1493', '#FF4500', '#FFD700', '#A855F7', '#EC4899'],
        ticks: 200,
        gravity: 1.2,
      });

      // Second burst for delayed fireworks effect
      setTimeout(() => {
        confetti({
          particleCount: 45,
          angle: 60,
          spread: 55,
          origin: { x: 0.2, y: 0.18 },
          colors: ['#FF2A6D', '#FFB800', '#05D9E8', '#FF69B4'],
        });
        confetti({
          particleCount: 45,
          angle: 120,
          spread: 55,
          origin: { x: 0.8, y: 0.18 },
          colors: ['#FF2A6D', '#FFB800', '#05D9E8', '#FF69B4'],
        });
      }, 150);
    } catch {
      // Confetti fallback
    }

    setShowCelebrationToast(true);
    setTimeout(() => setShowCelebrationToast(false), 3000);
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-4xl mx-auto px-3.5 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Partner Profile & Live Status */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar with Vibrant Story Ring */}
          <div className="relative flex-shrink-0 cursor-pointer group" onClick={onOpenGallery} title="View shared media">
            <div className="w-11 h-11 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 shadow-sm group-hover:scale-105 transition-transform duration-200">
              <div
                className="w-full h-full rounded-full flex items-center justify-center text-xl overflow-hidden bg-white dark:bg-zinc-900 border-2 border-white dark:border-zinc-950"
                style={{ backgroundColor: partnerProfile.avatarColor || '#EC4899' }}
              >
                {partnerProfile.customAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={partnerProfile.customAvatarUrl}
                    alt={partnerProfile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{partnerProfile.avatarEmoji || '✨'}</span>
                )}
              </div>
            </div>

            {/* Live Online/Offline Status Dot */}
            <span
              className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-zinc-950 transition-colors ${
                isOnline ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-500'
              }`}
              title={isOnline ? 'Online' : 'Offline'}
            >
              {isOnline && (
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
              )}
            </span>
          </div>

          {/* Partner Name & Subtext */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate tracking-tight">
                {partnerProfile.name || 'My Love'}
              </h1>
            </div>

            {/* Status text */}
            <div className="flex items-center gap-1.5 text-xs">
              {isTyping ? (
                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                  <span className="flex gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                  Typing...
                </span>
              ) : isOnline ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Active now
                </span>
              ) : (
                <span className="text-zinc-500 dark:text-zinc-400">
                  {formatLastSeen(lastActive)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Streak Counter (clickable for celebration) */}
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={handleStreakClick}
            className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 hover:from-amber-500/25 hover:via-orange-500/25 hover:to-rose-500/25 border border-orange-400/30 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Click to celebrate our streak! 💕"
          >
            <span className="text-base group-hover:scale-125 transition-transform duration-200">🔥</span>
            <span className="tracking-tight">{displayStreak} Days</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500 opacity-60 group-hover:opacity-100 group-hover:rotate-12 transition-all" />
          </button>

          {/* Celebration Toast Dropdown */}
          {showCelebrationToast && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 whitespace-nowrap px-3 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold shadow-xl border border-zinc-700/50 flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
              <span>{displayStreak} days together! Keep the spark glowing 🔥</span>
            </div>
          )}
        </div>

        {/* Right Actions: Media Gallery, Pairing / Settings & Stealth Panic Button */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* Media Gallery Button */}
          {onOpenGallery && (
            <button
              type="button"
              onClick={onOpenGallery}
              className="p-2 rounded-full text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Shared Snaps & Media"
              aria-label="Shared Media"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
          )}

          {/* Settings / Pairing Modal Button */}
          <button
            type="button"
            onClick={onOpenPairing}
            className="p-2 rounded-full text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Pairing Links & Settings"
            aria-label="Settings and Pairing"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Discreet Panic Button (Instant switch to ChatGPT disguise) */}
          <button
            type="button"
            onClick={onPanic}
            className="group relative flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 transition-all active:scale-90 cursor-pointer"
            title="Emergency Disguise (Switch to ChatGPT immediately)"
            aria-label="Stealth Panic Disguise"
          >
            <Shield className="w-4 h-4 fill-emerald-500/20 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold hidden sm:inline">Disguise</span>
          </button>
        </div>
      </div>
    </header>
  );
};
