'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  SwitchCamera,
  RotateCcw,
  Send,
  Trash2,
  Download,
  Image as ImageIcon,
  AlertCircle,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';

export interface SnapCaptureResult {
  type: 'photo' | 'video';
  mediaUrl: string; // base64 data URL
  duration?: number; // seconds for video
  thumbnailUrl?: string; // thumbnail for video
  fileSize?: number;
}

export interface SnapCameraProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (snap: SnapCaptureResult) => void;
  accentColor?: string; // default purple or snap yellow
  maxVideoDuration?: number; // in seconds, default 30
}

function getSupportedVideoMimeType(): string {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return 'video/webm';
  }
  const candidateTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4;codecs=avc1',
    'video/mp4',
  ];
  for (const t of candidateTypes) {
    if (MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return '';
}

export const SnapCamera: React.FC<SnapCameraProps> = ({
  isOpen,
  onClose,
  onSend,
  accentColor = '#8B5CF6',
  maxVideoDuration = 30,
}) => {
  // State
  const [cameraState, setCameraState] = useState<
    'initializing' | 'ready' | 'recording' | 'preview' | 'error'
  >('initializing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(true);

  // Recording timer
  const [recordDuration, setRecordDuration] = useState<number>(0);
  const [isMutedPreview, setIsMutedPreview] = useState<boolean>(false);
  const [shutterFlash, setShutterFlash] = useState<boolean>(false);

  // Preview data
  const [previewSnap, setPreviewSnap] = useState<SnapCaptureResult | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to stop all camera streams
  const stopCameraStream = useCallback(() => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // Check available cameras
  useEffect(() => {
    if (!isOpen || typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      })
      .catch(() => {
        // keep default true
      });
  }, [isOpen]);

  // Start live camera stream
  const startCamera = useCallback(async () => {
    stopCameraStream();
    setErrorMessage('');
    setCameraState('initializing');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this browser.');
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
      } catch (firstErr) {
        console.warn('Video+Audio failed, trying video-only fallback', firstErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      }

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.warn('Autoplay failed', err);
        });
      }
      setCameraState('ready');
    } catch (err: unknown) {
      setCameraState('error');
      const errorObj = err as Error;
      if (errorObj.name === 'NotAllowedError' || errorObj.name === 'PermissionDeniedError') {
        setErrorMessage(
          'Camera permission was denied. Please allow camera and microphone access in your browser.'
        );
      } else if (errorObj.name === 'NotFoundError' || errorObj.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera device found on this system.');
      } else {
        setErrorMessage(errorObj.message || 'Unable to access camera.');
      }
    }
  }, [facingMode, stopCameraStream]);

  // Lifecycle when modal opens/closes
  useEffect(() => {
    let cancel = false;
    if (isOpen) {
      const timer = setTimeout(() => {
        if (!cancel) {
          startCamera();
        }
      }, 0);
      return () => {
        cancel = true;
        clearTimeout(timer);
        stopCameraStream();
      };
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, startCamera, stopCameraStream]);

  // Flip front / rear camera
  const switchCameraFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Instant Photo Capture
  const takePhotoSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    // Flash animation
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 200);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setPreviewSnap({
      type: 'photo',
      mediaUrl: dataUrl,
      fileSize: Math.round(dataUrl.length * 0.75),
    });
    setCameraState('preview');
  };

  // Start Video Recording
  const startVideoRecording = () => {
    if (!mediaStreamRef.current || cameraState === 'recording') return;

    videoChunksRef.current = [];
    setRecordDuration(0);

    const bestMime = getSupportedVideoMimeType();
    const options: MediaRecorderOptions = {};
    if (bestMime) {
      options.mimeType = bestMime;
    }

    try {
      const recorder = new MediaRecorder(mediaStreamRef.current, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          videoChunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      setCameraState('recording');

      let elapsed = 0;
      recordTimerRef.current = setInterval(() => {
        elapsed += 1;
        setRecordDuration(elapsed);
        if (elapsed >= maxVideoDuration) {
          stopVideoRecording();
        }
      }, 1000);
    } catch (e) {
      console.error('Failed to start video recording', e);
    }
  };

  // Stop Video Recording & generate snapshot thumbnail
  const stopVideoRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }

    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return;
    }

    const recorder = mediaRecorderRef.current;
    const elapsed = Math.max(1, recordDuration);

    let thumbnailUrl = '';
    if (videoRef.current) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(640, videoRef.current.videoWidth || 640);
        canvas.height = Math.min(360, videoRef.current.videoHeight || 360);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        }
      } catch {
        // ignore thumbnail error
      }
    }

    recorder.onstop = () => {
      const mime = recorder.mimeType || 'video/webm';
      const videoBlob = new Blob(videoChunksRef.current, { type: mime });

      const reader = new FileReader();
      reader.onloadend = () => {
        const videoDataUrl = reader.result as string;
        setPreviewSnap({
          type: 'video',
          mediaUrl: videoDataUrl,
          duration: elapsed,
          thumbnailUrl: thumbnailUrl || undefined,
          fileSize: videoBlob.size,
        });
        setCameraState('preview');
      };
      reader.readAsDataURL(videoBlob);
    };

    try {
      recorder.stop();
    } catch (e) {
      console.error('Error stopping recorder', e);
    }
  };

  // Shutter button Touch & Mouse Handlers (Tap = Photo, Hold = Video)
  const handleShutterPressStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (cameraState !== 'ready') return;

    isHoldingRef.current = false;
    holdTimeoutRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      startVideoRecording();
    }, 320);
  };

  const handleShutterPressEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    if (cameraState === 'recording' || isHoldingRef.current) {
      isHoldingRef.current = false;
      stopVideoRecording();
    } else if (cameraState === 'ready') {
      takePhotoSnap();
    }
  };

  // Upload fallback from device camera roll / file picker
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = () => {
      const resultUrl = reader.result as string;
      if (isVideo) {
        const tempVideo = document.createElement('video');
        tempVideo.src = resultUrl;
        tempVideo.muted = true;
        tempVideo.playsInline = true;
        tempVideo.onloadeddata = () => {
          const duration = Math.round(tempVideo.duration) || 5;
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(640, tempVideo.videoWidth || 640);
          canvas.height = Math.min(360, tempVideo.videoHeight || 360);
          const ctx = canvas.getContext('2d');
          let thumb = '';
          if (ctx) {
            ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
            thumb = canvas.toDataURL('image/jpeg', 0.8);
          }
          setPreviewSnap({
            type: 'video',
            mediaUrl: resultUrl,
            duration,
            thumbnailUrl: thumb || undefined,
            fileSize: file.size,
          });
          setCameraState('preview');
        };
        tempVideo.onerror = () => {
          setPreviewSnap({
            type: 'video',
            mediaUrl: resultUrl,
            duration: 5,
            fileSize: file.size,
          });
          setCameraState('preview');
        };
      } else {
        setPreviewSnap({
          type: 'photo',
          mediaUrl: resultUrl,
          fileSize: file.size,
        });
        setCameraState('preview');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Discard preview and return to camera
  const handleRetake = () => {
    setPreviewSnap(null);
    startCamera();
  };

  // Download snap to device
  const handleDownload = () => {
    if (!previewSnap) return;
    const a = document.createElement('a');
    a.href = previewSnap.mediaUrl;
    a.download = `snap_${Date.now()}.${previewSnap.type === 'video' ? 'webm' : 'jpg'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Send Snap
  const handleSendSnap = () => {
    if (!previewSnap) return;
    onSend(previewSnap);
    setPreviewSnap(null);
    onClose();
  };

  const handleClose = () => {
    setPreviewSnap(null);
    stopCameraStream();
    onClose();
  };

  if (!isOpen) return null;

  // SVG Progress Ring calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.min(1, recordDuration / maxVideoDuration);
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between select-none overflow-hidden animate-in fade-in duration-200">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {shutterFlash && (
        <div className="absolute inset-0 bg-white z-40 pointer-events-none transition-opacity duration-150 opacity-90" />
      )}

      {/* Top Header Controls */}
      <div className="relative z-30 w-full flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <button
          onClick={handleClose}
          type="button"
          aria-label="Close Camera"
          className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        {cameraState === 'recording' ? (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600/90 text-white shadow-lg animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span className="font-mono text-xs font-bold tracking-wider">
              {recordDuration}s / {maxVideoDuration}s
            </span>
          </div>
        ) : cameraState === 'preview' ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/80 text-zinc-200 text-xs font-medium border border-zinc-700/50">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Snap Preview</span>
          </div>
        ) : (
          <div
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: accentColor }}
          >
            Couple Snap
          </div>
        )}

        {cameraState !== 'preview' ? (
          <button
            onClick={switchCameraFacing}
            disabled={!hasMultipleCameras}
            type="button"
            aria-label="Switch Camera"
            className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition active:scale-95 disabled:opacity-40"
          >
            <SwitchCamera className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleDownload}
            type="button"
            title="Save to Device"
            className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition active:scale-95"
          >
            <Download className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Viewport Container */}
      <div className="relative flex-1 w-full max-w-md h-full flex items-center justify-center overflow-hidden">
        {cameraState === 'error' && (
          <div className="z-20 max-w-xs mx-auto p-6 bg-zinc-900/95 border border-zinc-800 rounded-3xl text-center shadow-2xl flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-base mb-1">Camera Permission</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">{errorMessage}</p>
            </div>
            <div className="flex flex-col gap-2 w-full pt-2">
              <button
                onClick={startCamera}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition active:scale-95 shadow-md flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Try Again
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <ImageIcon className="w-3.5 h-3.5" /> Pick from Camera Roll
              </button>
            </div>
          </div>
        )}

        {cameraState !== 'preview' && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              cameraState === 'ready' || cameraState === 'recording' ? 'opacity-100' : 'opacity-0'
            } ${facingMode === 'user' ? '-scale-x-100' : ''}`}
          />
        )}

        {cameraState === 'preview' && previewSnap && (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            {previewSnap.type === 'photo' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewSnap.mediaUrl}
                alt="Captured Snap"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  src={previewSnap.mediaUrl}
                  autoPlay
                  loop
                  playsInline
                  muted={isMutedPreview}
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={() => setIsMutedPreview((prev) => !prev)}
                  type="button"
                  className="absolute bottom-6 right-6 p-2.5 rounded-full bg-black/60 text-white backdrop-blur-md transition active:scale-90"
                >
                  {isMutedPreview ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="relative z-30 w-full max-w-md p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-around">
        {cameraState === 'preview' ? (
          <div className="flex items-center justify-between w-full px-4">
            <button
              onClick={handleRetake}
              type="button"
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 font-medium text-sm transition active:scale-95 backdrop-blur-md"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Retake</span>
            </button>

            <button
              onClick={handleSendSnap}
              type="button"
              className="flex items-center gap-2 px-7 py-3 rounded-full text-black font-semibold text-sm shadow-xl transition active:scale-95 hover:brightness-110"
              style={{
                backgroundColor: '#FFFC00',
              }}
            >
              <span>Send Snap</span>
              <Send className="w-4 h-4 fill-black" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full px-6">
            <button
              onClick={() => fileInputRef.current?.click()}
              type="button"
              title="Upload from Camera Roll"
              className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-black/40 hover:bg-black/60 text-zinc-300 border border-zinc-800/80 transition active:scale-90 backdrop-blur-md"
            >
              <ImageIcon className="w-5 h-5 text-zinc-200" />
              <span className="text-[10px] text-zinc-400 font-medium">Upload</span>
            </button>

            <div className="relative flex items-center justify-center">
              <svg className="w-24 h-24 -rotate-90 pointer-events-none" viewBox="0 0 96 96">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="5"
                  fill="none"
                />
                {cameraState === 'recording' && (
                  <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    stroke="#EF4444"
                    strokeWidth="5"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-200"
                  />
                )}
              </svg>

              <button
                type="button"
                aria-label="Capture Snap"
                onMouseDown={handleShutterPressStart}
                onMouseUp={handleShutterPressEnd}
                onTouchStart={handleShutterPressStart}
                onTouchEnd={handleShutterPressEnd}
                className={`absolute w-16 h-16 rounded-full transition-all duration-200 active:scale-90 shadow-2xl flex items-center justify-center ${
                  cameraState === 'recording'
                    ? 'bg-red-500 scale-110'
                    : 'bg-white hover:bg-zinc-100'
                }`}
              >
                {cameraState === 'recording' ? (
                  <div className="w-5 h-5 rounded-sm bg-white" />
                ) : (
                  <div className="w-14 h-14 rounded-full border-2 border-black/20" />
                )}
              </button>
            </div>

            <div className="flex flex-col items-center justify-center w-14 text-center">
              <span className="text-[10px] text-zinc-400 font-medium leading-tight">
                {cameraState === 'recording' ? 'Recording' : 'Tap photo\nHold video'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SnapCamera;
