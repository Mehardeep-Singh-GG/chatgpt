'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatGPTLayout } from '@/components/chatgpt';
import {
  SnapchatHeader,
  MessageList,
  PairingModal,
  MediaGalleryModal,
} from '@/components/snapchat';
import {
  SnapCamera,
  SnapViewer,
  VoiceRecorder,
  VoiceRecordingResult,
  SnapCaptureResult,
} from '@/components/media';
import {
  ChatMessage,
  AppConfig,
  PartnerRole,
  RoomPresence,
  MediaPayload,
  MessageType,
} from '@/types';
import { DEFAULT_CONFIG } from '@/lib/constants';
import { Camera, Mic, Image as ImageIcon, Send } from 'lucide-react';

export default function Home() {
  // Disguise Camouflage mode vs Private Snapchat mode
  // ALWAYS defaults to 'stealth' on initial load or browser refresh for 100% security!
  const [mode, setMode] = useState<'stealth' | 'private'>('stealth');

  // App Configuration & Partner Profiles
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [currentRole, setCurrentRole] = useState<PartnerRole>(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const userParam = (params.get('user') || params.get('role') || '').toLowerCase();
        if (['partner2', 'her', 'girlfriend', 'babe'].includes(userParam)) {
          localStorage.setItem('stealth_chat_role', 'partner2');
          return 'partner2';
        }
        if (['partner1', 'him', 'me', 'boyfriend'].includes(userParam)) {
          localStorage.setItem('stealth_chat_role', 'partner1');
          return 'partner1';
        }
        const savedRole = localStorage.getItem('stealth_chat_role') as PartnerRole;
        if (savedRole === 'partner1' || savedRole === 'partner2') {
          return savedRole;
        }
      } catch {
        // localStorage not available
      }
    }
    return 'partner1';
  });

  // Messages & Presence
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [presence, setPresence] = useState<RoomPresence>({
    partner1Online: false,
    partner1Typing: false,
    partner1LastActive: 0,
    partner2Online: false,
    partner2Typing: false,
    partner2LastActive: 0,
  });

  // Private Chat Input state
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modals & Camera/Voice overlays
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [viewerSnap, setViewerSnap] = useState<{
    type: 'photo' | 'video';
    mediaUrl: string;
    senderName?: string;
    duration?: number;
    createdAt?: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastEscPressRef = useRef<number>(0);

  // Store secret token if passed in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const secretParam = params.get('secret') || params.get('token');
        if (secretParam) {
          localStorage.setItem('stealth_chat_secret', secretParam);
        }
      } catch {
        // localStorage disabled
      }
    }
  }, []);

  // Fetch initial config
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`/api/config?roomId=${config.roomId}`);
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
      }
    } catch {
      // Fallback to local default
    }
  }, [config.roomId]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?roomId=${config.roomId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch {
      // Ignore network errors in polling
    }
  }, [config.roomId]);

  // Heartbeat / presence ping
  const pingPresence = useCallback(async () => {
    try {
      const res = await fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: config.roomId,
          role: currentRole,
          isTyping,
        }),
      });
      const data = await res.json();
      if (data.success && data.presence) {
        setPresence(data.presence);
      }
    } catch {
      // Ignore
    }
  }, [config.roomId, currentRole, isTyping]);

  // Poll messages and presence when in private mode
  useEffect(() => {
    let isSubscribed = true;

    const initData = async () => {
      if (!isSubscribed) return;
      await fetchConfig();
      await fetchMessages();
      await pingPresence();
    };

    void initData();

    const interval = setInterval(() => {
      if (mode === 'private') {
        void fetchMessages();
        void pingPresence();
      }
    }, 3000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [fetchConfig, fetchMessages, pingPresence, mode]);

  // Instant Panic Switch Listener (Double Escape hotkey or window blur)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const now = Date.now();
        if (now - lastEscPressRef.current < 450) {
          // Double tap Escape: INSTANT PANIC TO CHATGPT
          setMode('stealth');
          setIsCameraOpen(false);
          setIsVoiceOpen(false);
          setViewerSnap(null);
          setIsGalleryOpen(false);
          setIsPairingOpen(false);
        }
        lastEscPressRef.current = now;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update Config
  const handleUpdateConfig = async (newConfig: Partial<AppConfig>) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: config.roomId, config: newConfig }),
      });
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
      }
    } catch {
      setConfig((prev) => ({ ...prev, ...newConfig }));
    }
  };

  // Send message helper
  const handleSendMessage = async (msgPayload: Partial<ChatMessage>) => {
    const myProfile = currentRole === 'partner1' ? config.partner1 : config.partner2;

    const fullMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      roomId: config.roomId,
      sender: currentRole,
      senderName: myProfile.name,
      type: msgPayload.type || 'text',
      text: msgPayload.text,
      media: msgPayload.media,
      createdAt: Date.now(),
      savedInChat: false,
      opened: false,
      reactions: {},
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, fullMessage]);

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: config.roomId, message: fullMessage }),
      });
    } catch {
      // Revert or retry handled in next poll
    }
  };

  // Toggle Save in Chat
  const handleToggleSave = async (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, savedInChat: !m.savedInChat } : m))
    );
    try {
      await fetch(`/api/messages/${messageId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: config.roomId }),
      });
    } catch {
      // Fallback
    }
  };

  // Toggle Reaction
  const handleReact = async (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const currentReactions = { ...(m.reactions || {}) };
        if (currentReactions[currentRole] === emoji) {
          delete currentReactions[currentRole];
        } else {
          currentReactions[currentRole] = emoji;
        }
        return { ...m, reactions: currentReactions };
      })
    );

    try {
      await fetch(`/api/messages/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: config.roomId, sender: currentRole, emoji }),
      });
    } catch {
      // Fallback
    }
  };

  // Open Media in Snap Viewer
  const handleOpenMedia = (media: MediaPayload, type: MessageType) => {
    if (type === 'photo' || type === 'video') {
      setViewerSnap({
        type: type,
        mediaUrl: media.url,
        duration: media.duration || 10,
        createdAt: Date.now(),
      });
    }
  };

  // Photo / Video Snap Captured
  const handleSnapCaptured = (snap: SnapCaptureResult) => {
    setIsCameraOpen(false);
    handleSendMessage({
      type: snap.type,
      media: {
        url: snap.mediaUrl,
        duration: snap.duration,
        thumbnailUrl: snap.thumbnailUrl,
        fileSize: snap.fileSize,
      },
    });
  };

  // Voice recording finished
  const handleVoiceSend = (result: VoiceRecordingResult) => {
    setIsVoiceOpen(false);
    handleSendMessage({
      type: 'voice',
      media: {
        url: result.audioUrl,
        duration: result.duration,
        waveform: result.waveform,
      },
    });
  };

  // File input change (photo upload from device)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const isVideo = file.type.startsWith('video');
      handleSendMessage({
        type: isVideo ? 'video' : 'photo',
        media: {
          url: base64,
          fileName: file.name,
          fileSize: file.size,
        },
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Typing indicator trigger
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const handleSendText = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    handleSendMessage({ type: 'text', text: trimmed });
    setInputText('');
    setIsTyping(false);
  };

  const myProfile = currentRole === 'partner1' ? config.partner1 : config.partner2;
  const partnerProfile = currentRole === 'partner1' ? config.partner2 : config.partner1;

  // ----------------------------------------------------
  // MODE 1: CHATGPT CAMOUFLAGE DISGUISE (DEFAULT)
  // ----------------------------------------------------
  if (mode === 'stealth') {
    return (
      <ChatGPTLayout
        onEnterPrivateMode={() => setMode('private')}
        passcodeEnabled={config.disguisePasscodeEnabled}
        correctPasscode={config.disguisePasscode || '1234'}
        onPanic={() => setMode('stealth')}
        userName={myProfile.name || 'User'}
        initialTheme="dark"
      />
    );
  }

  // ----------------------------------------------------
  // MODE 2: PRIVATE SNAPCHAT COUPLE CHAT
  // ----------------------------------------------------
  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-zinc-950 font-sans text-white select-none">
      {/* Hidden File Input for uploading photos/videos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Snapchat Top Header */}
      <SnapchatHeader
        currentRole={currentRole}
        partnerProfile={partnerProfile}
        myProfile={myProfile}
        presence={presence}
        streakDays={partnerProfile.streakDays || 42}
        onPanic={() => setMode('stealth')}
        onOpenPairing={() => setIsPairingOpen(true)}
        onOpenGallery={() => setIsGalleryOpen(true)}
      />

      {/* Message Stream */}
      <div className="flex-1 overflow-hidden relative">
        <MessageList
          messages={messages}
          currentRole={currentRole}
          partnerProfile={partnerProfile}
          myProfile={myProfile}
          partnerTyping={
            currentRole === 'partner1' ? presence.partner2Typing : presence.partner1Typing
          }
          onToggleSave={handleToggleSave}
          onReact={handleReact}
          onOpenMedia={handleOpenMedia}
          onSendQuickPrompt={(text) => handleSendMessage({ type: 'text', text })}
        />
      </div>

      {/* Snapchat Bottom Input Bar */}
      <div className="w-full bg-zinc-900/90 backdrop-blur-md px-3 py-2 border-t border-zinc-800/80">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          {/* Snap Camera Button */}
          <button
            onClick={() => setIsCameraOpen(true)}
            title="Take a Snap"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400 text-black shadow-lg shadow-amber-400/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Camera className="h-5 w-5 fill-black" />
          </button>

          {/* Voice Record Button */}
          <button
            onClick={() => setIsVoiceOpen(true)}
            title="Record Voice Note"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 active:scale-95 transition-all"
          >
            <Mic className="h-5 w-5" />
          </button>

          {/* Device Media Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Upload Photo / Video"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:scale-95 transition-all"
          >
            <ImageIcon className="h-5 w-5" />
          </button>

          {/* Text Message Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendText();
                }
              }}
              placeholder={`Send a chat to ${partnerProfile.name}...`}
              className="w-full rounded-full bg-zinc-800/80 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-pink-500/40 transition-all"
            />
          </div>

          {/* Send / Quick Action Button */}
          {inputText.trim() ? (
            <button
              onClick={handleSendText}
              title="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-600 text-white hover:bg-pink-500 active:scale-95 transition-all shadow-md shadow-pink-600/30"
            >
              <Send className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => handleSendMessage({ type: 'text', text: '❤️' })}
              title="Send Quick Heart"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-pink-400 hover:bg-zinc-700 active:scale-125 transition-all"
            >
              ❤️
            </button>
          )}
        </div>
      </div>

      {/* Overlays & Modals */}
      {/* 1. Snap Camera */}
      <SnapCamera
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onSend={handleSnapCaptured}
        accentColor="#EC4899"
      />

      {/* 2. Fullscreen Snap Viewer */}
      <SnapViewer
        isOpen={!!viewerSnap}
        onClose={() => setViewerSnap(null)}
        snap={viewerSnap}
      />

      {/* 3. Voice Recorder Modal Tray */}
      {isVoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-zinc-900 p-6 border border-zinc-800 shadow-2xl">
            <div className="mb-4 text-center">
              <h3 className="text-base font-semibold text-white">Record Voice Note</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Hold or tap to record</p>
            </div>
            <VoiceRecorder
              onSend={handleVoiceSend}
              onCancel={() => setIsVoiceOpen(false)}
              accentColor="#EC4899"
            />
          </div>
        </div>
      )}

      {/* 4. Pairing & Disguise Settings Modal */}
      <PairingModal
        isOpen={isPairingOpen}
        onClose={() => setIsPairingOpen(false)}
        config={config}
        onUpdateConfig={handleUpdateConfig}
        currentRole={currentRole}
        onSwitchRole={(role) => {
          setCurrentRole(role);
          try {
            localStorage.setItem('stealth_chat_role', role);
          } catch {
            // ignore
          }
        }}
      />

      {/* 5. Saved Media Gallery Modal */}
      <MediaGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        messages={messages}
        currentRole={currentRole}
        onToggleSave={handleToggleSave}
      />
    </div>
  );
}
