'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Trash2, Send, Pause, Play, AlertCircle, RefreshCw } from 'lucide-react';

export interface VoiceRecordingResult {
  audioUrl: string; // base64 data URL
  duration: number; // in seconds
  waveform: number[]; // 25-40 normalized values (0.1 to 1.0)
  mimeType: string;
}

export interface VoiceRecorderProps {
  onSend: (result: VoiceRecordingResult) => void;
  onCancel?: () => void;
  accentColor?: string; // e.g. '#8B5CF6' or '#EC4899'
  maxDuration?: number; // max seconds, default 120
}

/**
 * Detect best supported audio mime type for recording across modern browsers & iOS Safari
 */
function getSupportedAudioMimeType(): string {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return 'audio/webm';
  }
  const candidateTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
  ];
  for (const type of candidateTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return ''; // Browser default
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onSend,
  onCancel,
  accentColor = '#8B5CF6',
  maxDuration = 120,
}) => {
  const [recordingState, setRecordingState] = useState<
    'idle' | 'requesting' | 'recording' | 'paused' | 'processing' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [liveAmplitudes, setLiveAmplitudes] = useState<number[]>(() => new Array(28).fill(0.12));

  // Refs for audio hardware and processing
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const amplitudeHistoryRef = useRef<number[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm');
  const recordedDurationRef = useRef<number>(0);

  // Format time mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Clean up all hardware streams and contexts
  const cleanupHardware = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore already stopped
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
  }, []);

  // Normalize sampled amplitude history to a fixed 32-bar array
  const generateNormalizedWaveform = useCallback((history: number[], barCount = 32): number[] => {
    if (history.length === 0) {
      return Array.from({ length: barCount }, () => 0.2 + Math.random() * 0.4);
    }
    const result: number[] = [];
    const step = history.length / barCount;
    for (let i = 0; i < barCount; i++) {
      const startIdx = Math.floor(i * step);
      const endIdx = Math.min(Math.floor((i + 1) * step), history.length);
      let sum = 0;
      let count = 0;
      for (let j = startIdx; j < endIdx; j++) {
        sum += history[j] || 0.1;
        count++;
      }
      const avg = count > 0 ? sum / count : 0.1;
      const clamped = Math.max(0.12, Math.min(1.0, Number(avg.toFixed(3))));
      result.push(clamped);
    }
    return result;
  }, []);

  // Stop and send recording
  const stopAndSend = useCallback(async () => {
    if (!mediaRecorderRef.current) return;

    const recorder = mediaRecorderRef.current;
    const finalDuration = Math.max(1, recordedDurationRef.current || durationSeconds);
    const recordedWaveform = generateNormalizedWaveform(amplitudeHistoryRef.current, 32);

    setRecordingState('processing');

    const finishRecording = new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        const mime = mimeTypeRef.current || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mime });
        resolve(blob);
      };
      try {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      } catch {
        const mime = mimeTypeRef.current || 'audio/webm';
        resolve(new Blob(audioChunksRef.current, { type: mime }));
      }
    });

    try {
      const audioBlob = await finishRecording;
      cleanupHardware();

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result as string;
        onSend({
          audioUrl: base64Url,
          duration: finalDuration,
          waveform: recordedWaveform,
          mimeType: audioBlob.type || mimeTypeRef.current,
        });
        setRecordingState('idle');
        setDurationSeconds(0);
        recordedDurationRef.current = 0;
      };
      reader.onerror = () => {
        setErrorMessage('Failed to process recorded audio.');
        setRecordingState('error');
      };
      reader.readAsDataURL(audioBlob);
    } catch {
      cleanupHardware();
      setErrorMessage('Failed to save audio recording.');
      setRecordingState('error');
    }
  }, [cleanupHardware, durationSeconds, generateNormalizedWaveform, onSend]);

  // Keep ref to stopAndSend to avoid circular dependency in timer, updated via effect
  const stopAndSendRef = useRef<() => void>(() => {});
  useEffect(() => {
    stopAndSendRef.current = stopAndSend;
  }, [stopAndSend]);

  // Start recording
  const startRecording = useCallback(async () => {
    cleanupHardware();
    setErrorMessage('');
    setRecordingState('requesting');
    setDurationSeconds(0);
    recordedDurationRef.current = 0;
    audioChunksRef.current = [];
    amplitudeHistoryRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported by your browser.');
      }

      // 1. Request microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // 2. Setup AudioContext and AnalyserNode for live visualizer
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      analyserRef.current = analyser;

      // 3. Setup MediaRecorder with mime type detection
      const bestMime = getSupportedAudioMimeType();
      mimeTypeRef.current = bestMime || 'audio/webm';

      const options: MediaRecorderOptions = {};
      if (bestMime) {
        options.mimeType = bestMime;
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      setRecordingState('recording');

      // 4. Live Visualizer loop
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVisualizer = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / (bufferLength * 255);
        amplitudeHistoryRef.current.push(avg);

        const bars: number[] = [];
        const numBars = 28;
        for (let i = 0; i < numBars; i++) {
          const freqIndex = Math.min(
            bufferLength - 1,
            Math.floor((i / numBars) * (bufferLength * 0.75))
          );
          const rawVal = dataArray[freqIndex] / 255;
          const barHeight = Math.max(0.12, Math.min(1.0, rawVal * 0.85 + avg * 0.45));
          bars.push(Number(barHeight.toFixed(3)));
        }
        setLiveAmplitudes(bars);

        animFrameRef.current = requestAnimationFrame(updateVisualizer);
      };

      animFrameRef.current = requestAnimationFrame(updateVisualizer);

      // 5. Timer
      let elapsed = 0;
      timerIntervalRef.current = setInterval(() => {
        elapsed += 1;
        recordedDurationRef.current = elapsed;
        setDurationSeconds(elapsed);
        if (elapsed >= maxDuration) {
          stopAndSendRef.current();
        }
      }, 1000);
    } catch (err: unknown) {
      cleanupHardware();
      setRecordingState('error');
      const errObj = err as Error;
      if (errObj.name === 'NotAllowedError' || errObj.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone permission was denied. Please allow microphone access in your browser settings.');
      } else if (errObj.name === 'NotFoundError' || errObj.name === 'DevicesNotFoundError') {
        setErrorMessage('No microphone device found on this system.');
      } else {
        setErrorMessage(errObj.message || 'Unable to access microphone.');
      }
    }
  }, [cleanupHardware, maxDuration]);

  // Pause / Resume recording
  const togglePause = useCallback(() => {
    if (!mediaRecorderRef.current) return;

    if (recordingState === 'recording') {
      try {
        mediaRecorderRef.current.pause();
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        setRecordingState('paused');
      } catch (e) {
        console.error('Failed to pause recorder', e);
      }
    } else if (recordingState === 'paused') {
      try {
        mediaRecorderRef.current.resume();
        timerIntervalRef.current = setInterval(() => {
          setDurationSeconds((prev) => {
            const next = prev + 1;
            recordedDurationRef.current = next;
            if (next >= maxDuration) {
              stopAndSendRef.current();
            }
            return next;
          });
        }, 1000);
        setRecordingState('recording');
      } catch (e) {
        console.error('Failed to resume recorder', e);
      }
    }
  }, [recordingState, maxDuration]);

  // Cancel recording
  const handleCancel = useCallback(() => {
    cleanupHardware();
    setRecordingState('idle');
    setDurationSeconds(0);
    recordedDurationRef.current = 0;
    audioChunksRef.current = [];
    amplitudeHistoryRef.current = [];
    if (onCancel) onCancel();
  }, [cleanupHardware, onCancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupHardware();
    };
  }, [cleanupHardware]);

  return (
    <div className="w-full select-none">
      {/* Error state */}
      {recordingState === 'error' && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between text-xs text-red-400 gap-2 mb-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage || 'Microphone error'}</span>
          </div>
          <button
            onClick={startRecording}
            className="flex items-center gap-1 px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg font-medium transition"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* Idle state - Initial Mic button */}
      {recordingState === 'idle' && (
        <button
          onClick={startRecording}
          type="button"
          title="Record Voice Memo"
          className="relative group p-3 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
          style={{
            backgroundColor: `${accentColor}20`,
            color: accentColor,
            border: `1px solid ${accentColor}40`,
          }}
        >
          <Mic className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="sr-only">Record voice note</span>
        </button>
      )}

      {/* Requesting permission spinner */}
      {recordingState === 'requesting' && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-full shadow-lg text-sm text-zinc-300">
          <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          <span>Accessing microphone...</span>
        </div>
      )}

      {/* Active recording / paused / processing studio bar */}
      {(recordingState === 'recording' ||
        recordingState === 'paused' ||
        recordingState === 'processing') && (
        <div className="relative flex items-center justify-between gap-2.5 px-3.5 py-2 bg-zinc-950/95 border border-zinc-800/90 rounded-full shadow-2xl backdrop-blur-xl w-full max-w-lg transition-all duration-300">
          {/* Left: Blinking Rec indicator & Timer */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex items-center justify-center">
              <span
                className={`w-3 h-3 rounded-full ${
                  recordingState === 'recording'
                    ? 'bg-red-500 animate-ping opacity-75'
                    : 'bg-amber-400 opacity-60'
                } absolute`}
              />
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  recordingState === 'recording' ? 'bg-red-500' : 'bg-amber-400'
                } relative`}
              />
            </div>
            <span className="font-mono text-xs font-semibold text-zinc-200 tracking-wider">
              {formatTime(durationSeconds)}
            </span>
          </div>

          {/* Center: Live Audio Visualizer Bars */}
          <div className="flex-1 flex items-center justify-center gap-[2.5px] h-9 px-2 overflow-hidden">
            {liveAmplitudes.map((amp, idx) => {
              const heightPercent = Math.max(12, Math.round(amp * 100));
              const isPaused = recordingState === 'paused';
              return (
                <div
                  key={idx}
                  className="w-[3px] rounded-full transition-all duration-75"
                  style={{
                    height: isPaused ? '14%' : `${heightPercent}%`,
                    backgroundColor: isPaused
                      ? '#71717a'
                      : amp > 0.55
                      ? '#F59E0B'
                      : accentColor,
                    opacity: isPaused ? 0.4 : 0.85 + amp * 0.15,
                  }}
                />
              );
            })}
          </div>

          {/* Right Action buttons: Cancel, Pause/Resume, Send */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Cancel (Trash) */}
            <button
              onClick={handleCancel}
              type="button"
              title="Discard Recording"
              className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition active:scale-90"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Pause / Resume */}
            <button
              onClick={togglePause}
              type="button"
              title={recordingState === 'recording' ? 'Pause' : 'Resume'}
              className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-full transition active:scale-90"
            >
              {recordingState === 'recording' ? (
                <Pause className="w-4 h-4 text-amber-400" />
              ) : (
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              )}
            </button>

            {/* Send Pill */}
            <button
              onClick={stopAndSend}
              disabled={recordingState === 'processing'}
              type="button"
              title="Send Voice Memo"
              className="flex items-center justify-center w-9 h-9 rounded-full text-white shadow-lg transition-transform active:scale-95 hover:brightness-110 disabled:opacity-50"
              style={{
                backgroundColor: accentColor,
              }}
            >
              {recordingState === 'processing' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4 fill-white translate-x-[1px]" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
