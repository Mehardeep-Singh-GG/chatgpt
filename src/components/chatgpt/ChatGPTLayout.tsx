'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChatGPTProps,
  ChatGPTModel,
} from './types';
import {
  INITIAL_MOCK_CONVERSATIONS,
  MockConversation,
  MockChatMessage,
  streamMockAiResponse,
} from '@/lib/mockAi';
import { ChatGPTHeader } from './ChatGPTHeader';
import { ChatGPTSidebar } from './ChatGPTSidebar';
import { ChatGPTMain } from './ChatGPTMain';
import { SecretTrigger } from './SecretTrigger';

export const ChatGPTLayout: React.FC<ChatGPTProps> = ({
  onEnterPrivateMode,
  passcodeEnabled = false,
  correctPasscode = '1234',
  onPanic,
  userName = 'Alex',
  initialTheme = 'dark',
}) => {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(initialTheme);

  // Conversation & chat state
  const [conversations, setConversations] = useState<MockConversation[]>(INITIAL_MOCK_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [newChatMessages, setNewChatMessages] = useState<MockChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<ChatGPTModel>('gpt-4o');

  // Sidebar toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);

  // Secret Camouflage Trigger State
  const [isSecretTriggerOpen, setIsSecretTriggerOpen] = useState<boolean>(false);

  // Stream cancellation controller
  const abortControllerRef = useRef<AbortController | null>(null);

  // Global Panic key listener (e.g. double Escape)
  const lastEscPressRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const now = Date.now();
        if (now - lastEscPressRef.current < 450) {
          // Double Escape pressed -> Trigger Panic callback if in private mode
          onPanic?.();
        }
        lastEscPressRef.current = now;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPanic]);

  // Current active conversation
  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;
  const currentMessages = activeConversation ? activeConversation.messages : newChatMessages;

  // Handler for starting a new chat
  const handleNewChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setActiveConversationId(null);
    setNewChatMessages([]);
  }, []);

  // Handler for selecting an existing conversation
  const handleSelectConversation = useCallback((id: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setActiveConversationId(id);
  }, []);

  // Handler for deleting a conversation
  const handleDeleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        handleNewChat();
      }
    },
    [activeConversationId, handleNewChat]
  );

  // Stop current AI generation
  const handleStopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  // Send message and stream realistic response
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (isGenerating) return;

      const userMessage: MockChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        createdAt: Date.now(),
      };

      const assistantMessageId = `asst-${Date.now()}`;
      const placeholderAssistantMessage: MockChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
      };

      // Create abort controller for streaming
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsGenerating(true);

      if (!activeConversationId) {
        // Create new conversation entry
        const summaryTitle =
          text.length > 28 ? `${text.slice(0, 26).trim()}...` : text.charAt(0).toUpperCase() + text.slice(1);
        const newConvId = `conv-${Date.now()}`;

        const newConv: MockConversation = {
          id: newConvId,
          title: summaryTitle,
          category: 'Today',
          updatedAt: Date.now(),
          messages: [userMessage, placeholderAssistantMessage],
        };

        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(newConvId);
        setNewChatMessages([]);

        try {
          await streamMockAiResponse(
            text,
            (accumulated) => {
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id !== newConvId) return c;
                  return {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantMessageId ? { ...m, content: accumulated } : m
                    ),
                  };
                })
              );
            },
            () => {
              setIsGenerating(false);
              abortControllerRef.current = null;
            },
            controller.signal
          );
        } catch {
          setIsGenerating(false);
        }
      } else {
        // Append to existing active conversation
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== activeConversationId) return c;
            return {
              ...c,
              updatedAt: Date.now(),
              messages: [...c.messages, userMessage, placeholderAssistantMessage],
            };
          })
        );

        try {
          await streamMockAiResponse(
            text,
            (accumulated) => {
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id !== activeConversationId) return c;
                  return {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantMessageId ? { ...m, content: accumulated } : m
                    ),
                  };
                })
              );
            },
            () => {
              setIsGenerating(false);
              abortControllerRef.current = null;
            },
            controller.signal
          );
        } catch {
          setIsGenerating(false);
        }
      }
    },
    [activeConversationId, isGenerating]
  );

  return (
    <div
      className={`relative flex h-screen w-screen overflow-hidden font-sans select-text ${
        theme === 'dark' ? 'bg-[#212121] text-zinc-100 dark' : 'bg-white text-zinc-900'
      }`}
    >
      {/* Sidebar (Desktop Collapsible & Mobile Slide-in Drawer) */}
      {isSidebarOpen && (
        <ChatGPTSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onDeleteConversation={handleDeleteConversation}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
          userName={userName}
          theme={theme}
          onSecretLogoClick={() => setIsSecretTriggerOpen(true)}
        />
      )}

      {/* Main Content Area: Header + Main Chat View */}
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <ChatGPTHeader
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          onToggleSidebar={() => {
            // If on mobile, open mobile drawer
            if (window.innerWidth < 768) {
              setIsSidebarOpenMobile(true);
            } else {
              setIsSidebarOpen(!isSidebarOpen);
            }
          }}
          onNewChat={handleNewChat}
          isSidebarOpen={isSidebarOpen}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onSecretTriggerClick={() => setIsSecretTriggerOpen(true)}
        />

        <ChatGPTMain
          conversation={activeConversation}
          messages={currentMessages}
          isGenerating={isGenerating}
          onSendMessage={handleSendMessage}
          onStopGenerating={handleStopGenerating}
          onVoiceTriggerClick={() => setIsSecretTriggerOpen(true)}
          theme={theme}
        />
      </div>

      {/* Secret Camouflage Gateway */}
      <SecretTrigger
        isOpen={isSecretTriggerOpen}
        onClose={() => setIsSecretTriggerOpen(false)}
        onUnlockSuccess={() => {
          setIsSecretTriggerOpen(false);
          onEnterPrivateMode();
        }}
        passcodeEnabled={passcodeEnabled}
        correctPasscode={correctPasscode}
      />
    </div>
  );
};
