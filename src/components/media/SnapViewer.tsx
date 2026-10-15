'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  RotateCcw,
  Download,
  Volume2,
  VolumeX,
  Pause,
  Heart,
  ChevronDown,
} from 'lucide-react';

export interface SnapViewerProps {
  isOpen: boolean;
  onClose: () => void;
  snap: {
    type: 'photo' | 'video';
    mediaUrl: string;
    senderName?: string;
    duration?: number; // duration in seconds
    createdAt?: number;
  } | null;
  onReplay?: () => void;
  autoCloseOnFinish?: boolean;
}

export const SnapViewer: React.FC<SnapViewerProps> = ({
  isOpen,
  onClose,
  snap,
  onReplay,
  autoCloseOnFinish = false,
}) => {
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0); // 0 to 1
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [clockTime, setClockTime] = useState<number>(() =>
    typeof window !== 'undefined' ? Date.now() : 0
  );

  // Swipe-down dismiss gesture
  const [dragOffsetY, setDragOffsetY] = useState<number>(0);
  const touchStartYRef = useRef<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const photoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const photoElapsedRef = useRef<number>(0);
  const photoTotalDurationRef = useRef<number>(6); // Default 6 seconds for photos

  // Subscribe to clock updates periodically (every 30s)
  useEffect(() => {
    const interval = setInterval(() => {
      setClockTime(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Pure derived relative time
  const timeAgo = useMemo(() => {
    if (!snap?.createdAt || !clockTime) return 'Just now';
    const diff = Math.floor((clockTime - snap.createdAt) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }, [snap?.createdAt, clockTime]);

  // Reset and restart snap playback
  const restartPlayback = useCallback(() => {
    setIsFinished(false);
    setProgress(0);
    photoElapsedRef.current = 0;

    if (snap?.type === 'video' && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [snap?.type]);

  // Handle Photo Timer with Pause/Resume on Hold
  useEffect(() => {
    if (!isOpen || !snap || snap.type !== 'photo' || isFinished) {
      if (photoTimerRef.current) clearInterval(photoTimerRef.current);
      return;
    }

    if (isHolding) {
      // Pause photo timer while holding
      if (photoTimerRef.current) clearInterval(photoTimerRef.current);
      return;
    }

    const intervalMs = 50;
    const totalMs = (snap.duration || photoTotalDurationRef.current) * 1000;

    photoTimerRef.current = setInterval(() => {
      photoElapsedRef.current += intervalMs;
      const currentRatio = Math.min(1, photoElapsedRef.current / totalMs);
      setProgress(currentRatio);

      if (currentRatio >= 1) {
        clearInterval(photoTimerRef.current!);
        setIsFinished(true);
        if (autoCloseOnFinish) {
          onClose();
        }
      }
    }, intervalMs);

    return () => {
      if (photoTimerRef.current) clearInterval(photoTimerRef.current);
    };
  }, [isOpen, snap, isHolding, isFinished, autoCloseOnFinish, onClose]);

  // Video progress synchronization
  const handleVideoTimeUpdate = () => {
    if (!videoRef.current || snap?.type !== 'video') return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration || snap.duration || 1;
    setProgress(Math.min(1, current / total));
  };

  const handleVideoEnded = () => {
    setIsFinished(true);
    if (autoCloseOnFinish) {
      onClose();
    }
  };

  // Tap & Hold to Pause (Signature Snapchat mechanic)
  const handleHoldStart = (e: React.TouchEvent | React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    setIsHolding(true);
    if (snap?.type === 'video' && videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handleHoldEnd = (e: React.TouchEvent | React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    setIsHolding(false);
    if (snap?.type === 'video' && videoRef.current && !isFinished) {
      videoRef.current.play().catch(() => {});
    }
  };

  // Swipe-down dismiss handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
    handleHoldStart(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartYRef.current;
    if (diff > 0) {
      setDragOffsetY(diff);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragOffsetY > 110) {
      onClose();
    }
    setDragOffsetY(0);
    handleHoldEnd(e);
  };

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Download media
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!snap) return;
    const a = document.createElement('a');
    a.href = snap.mediaUrl;
    a.download = `snap_${snap.senderName || 'couple'}_${Date.now()}.${
      snap.type === 'video' ? 'webm' : 'jpg'
    }`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen || !snap) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between select-none overflow-hidden transition-transform duration-200"
      style={{
        transform: `translateY(${dragOffsetY}px)`,
        opacity: Math.max(0.4, 1 - dragOffsetY / 300),
      }}
      onMouseDown={handleHoldStart}
      onMouseUp={handleHoldEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Story Progress Bar */}
      <div className="relative z-30 w-full max-w-md px-3 pt-3">
        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full transition-all duration-75"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>

      {/* Header Info: Sender Avatar, Name, Timestamp, Actions */}
      <div className="relative z-30 w-full max-w-md flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
            {snap.senderName?.charAt(0).toUpperCase() || '❤️'}
          </div>
          <div>
            <div className="text-white font-semibold text-sm leading-tight flex items-center gap-1">
              <span>{snap.senderName || 'Partner'}</span>
              <Heart className="w-3 h-3 text-pink-400 fill-pink-400 inline" />
            </div>
            <div className="text-[10px] text-zinc-400 font-mono">
              {timeAgo}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {snap.type === 'video' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted((prev) => !prev);
              }}
              type="button"
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition active:scale-90"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={handleDownload}
            type="button"
            title="Save Snap to Gallery"
            className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition active:scale-90"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            type="button"
            aria-label="Close Snap"
            className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Snap Content Container */}
      <div className="relative flex-1 w-full max-w-md h-full flex items-center justify-center">
        {isHolding && !isFinished && (
          <div className="absolute top-20 z-40 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white text-xs font-semibold tracking-wider uppercase animate-in fade-in duration-100 flex items-center gap-1.5">
            <Pause className="w-3 h-3 fill-white" />
            <span>Paused</span>
          </div>
        )}

        {isFinished && (
          <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-in fade-in duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                restartPlayback();
                if (onReplay) onReplay();
              }}
              type="button"
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-semibold text-sm shadow-xl transition active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Replay Snap</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              type="button"
              className="text-xs text-zinc-400 hover:text-white transition"
            >
              Close & Return to Chat
            </button>
          </div>
        )}

        {snap.type === 'photo' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={snap.mediaUrl}
            alt="Snap"
            className="w-full h-full object-contain pointer-events-none"
          />
        ) : (
          <video
            ref={videoRef}
            src={snap.mediaUrl}
            autoPlay
            playsInline
            muted={isMuted}
            onTimeUpdate={handleVideoTimeUpdate}
            onEnded={handleVideoEnded}
            className="w-full h-full object-contain pointer-events-none"
          />
        )}
      </div>

      {/* Bottom Hint Footer */}
      <div className="relative z-30 w-full max-w-md p-4 text-center">
        <div className="flex items-center justify-center gap-1 text-[11px] text-zinc-400/80 font-medium">
          <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
          <span>Hold to pause • Swipe down to close</span>
        </div>
      </div>
    </div>
  );
};

export default SnapViewer;
