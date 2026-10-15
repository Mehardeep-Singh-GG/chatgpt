"use client";

import React, { useState, useMemo } from 'react';
import {
  X,
  Image as ImageIcon,
  Video,
  Mic,
  Bookmark,
  Play,
  Sparkles
} from 'lucide-react';
import { ChatMessage, PartnerRole } from '@/types';
import { formatMessageDate, formatDuration } from '@/lib/chatUtils';
import { VoicePlayer } from '@/components/media/VoicePlayer';

export interface MediaGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  currentRole?: PartnerRole;
  onToggleSave?: (messageId: string) => void;
}

type GalleryTab = 'all' | 'photos' | 'videos' | 'voice' | 'saved';

export const MediaGalleryModal: React.FC<MediaGalleryModalProps> = ({
  isOpen,
  onClose,
  messages,
  onToggleSave,
}) => {
  const [activeTab, setActiveTab] = useState<GalleryTab>('all');
  const [selectedMedia, setSelectedMedia] = useState<ChatMessage | null>(null);

  // Filter media items
  const mediaMessages = useMemo(() => {
    return messages
      .filter((m) => m.media && (m.type === 'photo' || m.type === 'video' || m.type === 'voice'))
      .sort((a, b) => b.createdAt - a.createdAt); // newest first in gallery
  }, [messages]);

  const filteredItems = useMemo(() => {
    switch (activeTab) {
      case 'photos':
        return mediaMessages.filter((m) => m.type === 'photo');
      case 'videos':
        return mediaMessages.filter((m) => m.type === 'video');
      case 'voice':
        return mediaMessages.filter((m) => m.type === 'voice');
      case 'saved':
        return mediaMessages.filter((m) => m.savedInChat);
      case 'all':
      default:
        return mediaMessages;
    }
  }, [activeTab, mediaMessages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl h-[88vh] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Shared Memories & Gallery
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {mediaMessages.length} shared snaps, videos, and voice memos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto scrollbar-none bg-zinc-50/30 dark:bg-zinc-900">
          {[
            { id: 'all', label: 'All', icon: Sparkles },
            { id: 'photos', label: 'Snaps & Photos', icon: ImageIcon },
            { id: 'videos', label: 'Videos', icon: Video },
            { id: 'voice', label: 'Voice Memos', icon: Mic },
            { id: 'saved', label: 'Saved in Chat', icon: Bookmark },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as GalleryTab)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${tab.id === 'saved' && isSelected ? 'fill-white' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Gallery Grid Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                No memories found in this tab
              </p>
              <p className="text-xs text-zinc-500 max-w-xs">
                Send snaps, record voice memos, or save messages in chat to build your shared gallery.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {filteredItems.map((item) => {
                const isVoice = item.type === 'voice';
                const isVideo = item.type === 'video';
                const isPhoto = item.type === 'photo';

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedMedia(item)}
                    className="group relative rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 aspect-square flex flex-col justify-end cursor-pointer shadow-xs hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                  >
                    {/* Visual Preview */}
                    {isPhoto && item.media?.url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.media.url}
                        alt="Snap"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}

                    {isVideo && (
                      <>
                        {item.media?.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.media.thumbnailUrl}
                            alt="Video Thumbnail"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={item.media?.url}
                            className="absolute inset-0 w-full h-full object-cover"
                            preload="metadata"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-white/90 text-zinc-900 flex items-center justify-center shadow-md">
                            <Play className="w-5 h-5 fill-zinc-900 ml-0.5" />
                          </div>
                        </div>
                      </>
                    )}

                    {isVoice && (
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 to-indigo-900/60 flex flex-col items-center justify-center p-3 text-white">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center mb-2">
                          <Mic className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-mono font-bold">
                          {formatDuration(item.media?.duration || 0)}
                        </span>
                        <span className="text-[10px] text-white/70">Voice Note</span>
                      </div>
                    )}

                    {/* Gradient Overlay for metadata */}
                    <div className="relative z-10 p-2.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between text-white text-[10px]">
                      <span className="truncate font-medium">{formatMessageDate(item.createdAt)}</span>
                      <div className="flex items-center gap-1">
                        {item.savedInChat && (
                          <Bookmark className="w-3 h-3 fill-amber-400 text-amber-400" />
                        )}
                        {isVideo && item.media?.duration && (
                          <span className="font-mono bg-black/60 px-1 rounded">
                            {formatDuration(item.media.duration)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lightbox / Fullscreen Viewer Modal */}
        {selectedMedia && (
          <div
            className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setSelectedMedia(null)}
          >
            {/* Viewer Top Bar */}
            <div
              className="w-full max-w-3xl flex items-center justify-between text-white mb-3 px-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{selectedMedia.senderName}</span>
                <span className="text-xs text-white/60">
                  {formatMessageDate(selectedMedia.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {onToggleSave && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleSave(selectedMedia.id);
                      setSelectedMedia((prev) =>
                        prev ? { ...prev, savedInChat: !prev.savedInChat } : null
                      );
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      selectedMedia.savedInChat
                        ? 'bg-amber-400 text-zinc-950'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${selectedMedia.savedInChat ? 'fill-zinc-950' : ''}`} />
                    <span>{selectedMedia.savedInChat ? 'Saved' : 'Save in Chat'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedMedia(null)}
                  className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors cursor-pointer"
                  aria-label="Close Viewer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Media Container */}
            <div
              className="relative max-w-3xl max-h-[75vh] flex items-center justify-center overflow-hidden rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedMedia.type === 'photo' && selectedMedia.media?.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedMedia.media.url}
                  alt="Snap"
                  className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
                />
              )}

              {selectedMedia.type === 'video' && selectedMedia.media?.url && (
                <video
                  src={selectedMedia.media.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl bg-black"
                />
              )}

              {selectedMedia.type === 'voice' && selectedMedia.media?.url && (
                <div className="p-6 bg-zinc-900 rounded-3xl border border-zinc-800 flex flex-col items-center gap-4 text-white min-w-[280px]">
                  <VoicePlayer
                    audioUrl={selectedMedia.media.url}
                    duration={selectedMedia.media.duration}
                    waveform={selectedMedia.media.waveform}
                    senderName={selectedMedia.senderName}
                    accentColor="#A855F7"
                  />
                </div>
              )}
            </div>

            {selectedMedia.text && (
              <p
                className="mt-3 text-white text-sm max-w-xl text-center bg-black/60 px-4 py-2 rounded-xl backdrop-blur-xs"
                onClick={(e) => e.stopPropagation()}
              >
                {selectedMedia.text}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
