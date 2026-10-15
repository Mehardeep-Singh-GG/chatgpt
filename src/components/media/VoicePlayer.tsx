'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Play, Pause, Loader2, Volume2 } from 'lucide-react';

export interface VoicePlayerProps {
  audioUrl: string;
  duration?: number; // duration in seconds
  waveform?: number[]; // 20-40 numbers between 0.1 and 1.0
  accentColor?: string;
  senderName?: string;
  isSelf?: boolean;
  className?: string;
}

const SPEED_OPTIONS = [1, 1.5, 2] as const;

export const VoicePlayer: React.FC<VoicePlayerProps> = ({
  audioUrl,
  duration: initialDuration = 0,
  waveform: providedWaveform,
  accentColor = '#8B5CF6',
  senderName,
  isSelf = false,
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [loadedDuration, setLoadedDuration] = useState<number>(0);
  const [speedIndex, setSpeedIndex] = useState<number>(0);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformContainerRef = useRef<HTMLDivElement | null>(null);

  // Derived effective duration without cascading setState effects
  const totalDuration = initialDuration > 0 ? initialDuration : loadedDuration;

  // Fallback procedural waveform if none is supplied
  const waveformBars = useMemo<number[]>(() => {
    if (providedWaveform && providedWaveform.length > 5) {
      return providedWaveform;
    }
    // Generate an organic, voice-like pseudo-random waveform
    const count = 30;
    const bars: number[] = [];
    for (let i = 0; i < count; i++) {
      // Harmonic shape that looks like speech with natural pauses and peaks
      const t = i / count;
      const envelope = Math.sin(t * Math.PI);
      const noise = (Math.sin(i * 1.7) + Math.cos(i * 2.3) + 2) / 4;
      const height = Math.max(0.18, Math.min(0.95, envelope * noise * 0.9 + 0.15));
      bars.push(Number(height.toFixed(2)));
    }
    return bars;
  }, [providedWaveform]);

  // Format mm:ss
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Handle speed changes
  const toggleSpeed = () => {
    const nextIndex = (speedIndex + 1) % SPEED_OPTIONS.length;
    setSpeedIndex(nextIndex);
    const newSpeed = SPEED_OPTIONS[nextIndex];
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  // Play / Pause toggle
  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      try {
        setIsLoading(true);
        // If at end, rewind to start
        if (currentTime >= totalDuration - 0.2) {
          audio.currentTime = 0;
          setCurrentTime(0);
        }
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Audio playback failed', err);
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Scrubbing on waveform click / drag
  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformContainerRef.current || !audioRef.current) return;
    const rect = waveformContainerRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const ratio = clickX / rect.width;
    const targetDuration = totalDuration > 0 ? totalDuration : (audioRef.current.duration || 1);
    const newTime = ratio * targetDuration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformContainerRef.current) return;
    const rect = waveformContainerRef.current.getBoundingClientRect();
    const hoverX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setHoverProgress(hoverX / rect.width);
  };

  const handleMouseLeave = () => {
    setHoverProgress(null);
  };

  // Calculate current progress (0.0 to 1.0)
  const currentRatio = totalDuration > 0 ? Math.min(1, Math.max(0, currentTime / totalDuration)) : 0;

  return (
    <div
      className={`inline-flex flex-col gap-1.5 p-3 rounded-3xl select-none transition-all duration-200 shadow-md ${
        isSelf
          ? 'bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 text-white border border-zinc-800'
          : 'bg-zinc-900/90 text-zinc-100 border border-zinc-800/80 backdrop-blur-md'
      } ${className}`}
      style={{ minWidth: '240px', maxWidth: '340px' }}
    >
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const dur = e.currentTarget.duration;
          if (dur && !isNaN(dur) && isFinite(dur)) {
            setLoadedDuration(dur);
          }
          setIsLoading(false);
        }}
        onTimeUpdate={(e) => {
          setCurrentTime(e.currentTarget.currentTime);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(totalDuration);
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setIsPlaying(false);
        }}
      />

      {/* Main Pill Controls */}
      <div className="flex items-center gap-3 w-full">
        {/* Play / Pause circular button */}
        <button
          onClick={togglePlayPause}
          disabled={isLoading}
          type="button"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="relative flex items-center justify-center w-10 h-10 rounded-full shrink-0 shadow-lg transition-transform active:scale-90 hover:scale-105"
          style={{
            backgroundColor: accentColor,
            color: '#FFFFFF',
          }}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4 fill-white" />
          ) : (
            <Play className="w-4 h-4 fill-white translate-x-[1.5px]" />
          )}
        </button>

        {/* Dynamic Interactive Waveform Bars */}
        <div
          ref={waveformContainerRef}
          onClick={handleWaveformClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative flex-1 flex items-center gap-[2.5px] h-9 cursor-pointer py-1 group"
          title="Click to scrub audio"
        >
          {waveformBars.map((heightNorm, idx) => {
            const barRatio = idx / waveformBars.length;
            const isPlayed = barRatio <= currentRatio;
            const isHovered = hoverProgress !== null && barRatio <= hoverProgress;

            // Height scaling: between 16% and 100%
            const heightPercent = Math.max(16, Math.round(heightNorm * 100));

            return (
              <div
                key={idx}
                className="relative flex-1 rounded-full transition-all duration-100 group-hover:opacity-90"
                style={{
                  height: `${heightPercent}%`,
                  backgroundColor: isPlayed
                    ? accentColor
                    : isHovered
                    ? '#F59E0B' // snap gold preview on hover
                    : 'rgba(161, 161, 170, 0.3)', // muted gray zinc-400
                  boxShadow: isPlayed
                    ? `0 0 6px ${accentColor}60`
                    : 'none',
                }}
              />
            );
          })}
        </div>

        {/* Speed Multiplier Button (1x -> 1.5x -> 2x) */}
        <button
          onClick={toggleSpeed}
          type="button"
          title="Playback speed"
          className="shrink-0 px-2 py-1 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white rounded-lg text-[11px] font-mono font-semibold transition active:scale-95 border border-zinc-700/50"
        >
          {SPEED_OPTIONS[speedIndex]}x
        </button>
      </div>

      {/* Footer Info: Current Time / Total Duration */}
      <div className="flex items-center justify-between px-1 text-[11px] font-mono text-zinc-400">
        <div className="flex items-center gap-1.5">
          <Volume2 className="w-3 h-3 text-zinc-500" />
          <span>
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
        </div>
        {senderName && (
          <span className="text-[10px] text-zinc-500 truncate max-w-[100px]">
            {senderName}
          </span>
        )}
      </div>
    </div>
  );
};

export default VoicePlayer;
