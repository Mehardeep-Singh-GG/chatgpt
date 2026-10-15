'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatGPTMainProps } from './types';
import {
  ArrowUp,
  Square,
  Plus,
  Globe,
  Headphones,
  Copy,
  Check,
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  FileUp,
  Image as ImageIcon,
} from 'lucide-react';

export const ChatGPTMain: React.FC<ChatGPTMainProps> = ({
  messages,
  isGenerating,
  onSendMessage,
  onStopGenerating,
  onVoiceTriggerClick,
  theme,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isWebSearchActive, setIsWebSearchActive] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  // Auto-scroll to bottom on new messages / streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  // Close attach menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setIsAttachMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isGenerating) return;
    onSendMessage(trimmed);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Suggestion prompt chips for landing page
  const suggestionChips = [
    {
      title: 'Help me write',
      desc: 'a polite email requesting an urgent repair',
      prompt: 'Help me write a polite email to my landlord requesting an urgent plumbing repair.',
    },
    {
      title: 'Summarize text',
      desc: 'key takeaways from an article or report',
      prompt: 'Summarize the core principles of effective team communication in 3 bullet points.',
    },
    {
      title: 'Code',
      desc: 'a reusable React component with hooks',
      prompt: 'Write an idiomatic React 19 component with TypeScript and Tailwind styling.',
    },
    {
      title: 'Brainstorm',
      desc: 'creative gift and anniversary ideas',
      prompt: 'Give me 5 unique, thoughtful date night and weekend getaway ideas.',
    },
  ];

  // Helper to format assistant markdown nicely with headers, bold, bullet points, and code blocks
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // Code Block
        const lines = part.slice(3, -3).trim().split('\n');
        const language = lines[0].match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : '';
        const code = language ? lines.slice(1).join('\n') : lines.join('\n');

        return (
          <div
            key={index}
            className="my-3 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 text-xs font-mono text-zinc-100"
          >
            <div className="flex items-center justify-between bg-zinc-900 px-4 py-1.5 text-zinc-400">
              <span className="text-[11px] font-medium lowercase">
                {language || 'code'}
              </span>
              <button
                onClick={() => handleCopy(`code-${index}`, code)}
                className="flex items-center gap-1 hover:text-zinc-200 transition-colors"
              >
                {copiedId === `code-${index}` ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-[11px] text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span className="text-[11px]">Copy code</span>
                  </>
                )}
              </button>
            </div>
            <pre className="overflow-x-auto p-4 leading-relaxed font-mono">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Normal text with markdown elements
      const paragraphs = part.split('\n\n');
      return (
        <div key={index} className="space-y-2.5">
          {paragraphs.map((p, pIdx) => {
            const trimmed = p.trim();
            if (!trimmed) return null;

            // Header 3: ### ...
            if (trimmed.startsWith('### ')) {
              return (
                <h4 key={pIdx} className="text-base font-semibold pt-2 text-zinc-100">
                  {trimmed.replace(/^###\s+/, '')}
                </h4>
              );
            }

            // Horizontal Rule: ---
            if (trimmed === '---') {
              return <hr key={pIdx} className="my-3 border-zinc-800" />;
            }

            // Bullet List
            if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
              const items = trimmed.split('\n');
              return (
                <ul key={pIdx} className="list-disc pl-5 space-y-1 my-1">
                  {items.map((item, itemIdx) => (
                    <li key={itemIdx} className="text-sm leading-relaxed">
                      {renderInlineFormatting(item.replace(/^[\*\-]\s+/, ''))}
                    </li>
                  ))}
                </ul>
              );
            }

            // Numbered List
            if (/^\d+\.\s+/.test(trimmed)) {
              const items = trimmed.split('\n');
              return (
                <ol key={pIdx} className="list-decimal pl-5 space-y-1 my-1">
                  {items.map((item, itemIdx) => (
                    <li key={itemIdx} className="text-sm leading-relaxed">
                      {renderInlineFormatting(item.replace(/^\d+\.\s+/, ''))}
                    </li>
                  ))}
                </ol>
              );
            }

            return (
              <p key={pIdx} className="text-sm leading-relaxed whitespace-pre-wrap">
                {renderInlineFormatting(trimmed)}
              </p>
            );
          })}
        </div>
      );
    });
  };

  // Helper for inline bold, italics, code
  const renderInlineFormatting = (text: string) => {
    const tokens = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
    return tokens.map((token, i) => {
      if (token.startsWith('**') && token.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-zinc-100">
            {token.slice(2, -2)}
          </strong>
        );
      }
      if (token.startsWith('`') && token.endsWith('`')) {
        return (
          <code
            key={i}
            className="rounded bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[12px] text-emerald-300"
          >
            {token.slice(1, -1)}
          </code>
        );
      }
      if (token.startsWith('*') && token.endsWith('*')) {
        return <em key={i}>{token.slice(1, -1)}</em>;
      }
      return token;
    });
  };

  const hasMessages = messages.length > 0;

  return (
    <div
      className={`relative flex h-full flex-1 flex-col overflow-hidden transition-colors ${
        isDark ? 'bg-[#212121] text-zinc-100' : 'bg-white text-zinc-900'
      }`}
    >
      {/* Scrollable Message Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Landing State: Greeting & Suggestion Chips */}
          {!hasMessages && (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
              {/* ChatGPT Spiral Icon */}
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600/90 text-white shadow-lg shadow-emerald-600/20">
                <svg
                  viewBox="0 0 24 24"
                  width="30"
                  height="30"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a10 10 0 0 1 10 10c0 4.41-2.87 8.16-6.84 9.48l-.66-.46V18a2 2 0 0 0-2-2h-1v-2h2a2 2 0 0 0 2-2V9.83l.88-.88A7.97 7.97 0 0 0 12 4a8 8 0 0 0-7.88 6.64l.88.88V12a2 2 0 0 0 2 2h2v2h-1a2 2 0 0 0-2 2v2.98l-.66.46A10.003 10.003 0 0 1 12 2z" />
                </svg>
              </div>

              <h2
                className={`text-2xl font-bold tracking-tight md:text-3xl ${
                  isDark ? 'text-zinc-100' : 'text-zinc-800'
                }`}
              >
                What can I help with today?
              </h2>

              {/* Prompt Suggestion Cards */}
              <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                {suggestionChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputText(chip.prompt);
                      textareaRef.current?.focus();
                    }}
                    className={`flex flex-col items-start rounded-2xl p-4 text-left border transition-all ${
                      isDark
                        ? 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-zinc-700 text-zinc-300'
                        : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300 text-zinc-700'
                    }`}
                  >
                    <span className="text-sm font-semibold text-zinc-100">{chip.title}</span>
                    <span className="text-xs text-zinc-400 mt-0.5">{chip.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Conversation Messages */}
          {hasMessages && (
            <div className="space-y-6 pb-24 pt-2">
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                const isLast = index === messages.length - 1;

                return (
                  <div key={msg.id || index} className="flex flex-col gap-2">
                    {/* User message */}
                    {isUser ? (
                      <div className="flex justify-end">
                        <div
                          className={`max-w-[85%] rounded-3xl px-5 py-3 text-sm leading-relaxed ${
                            isDark
                              ? 'bg-[#2f2f2f] text-zinc-100'
                              : 'bg-zinc-100 text-zinc-900'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                      </div>
                    ) : (
                      /* Assistant message */
                      <div className="flex items-start gap-3.5">
                        {/* Assistant Avatar */}
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm mt-0.5">
                          <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 2a10 10 0 0 1 10 10c0 4.41-2.87 8.16-6.84 9.48l-.66-.46V18a2 2 0 0 0-2-2h-1v-2h2a2 2 0 0 0 2-2V9.83l.88-.88A7.97 7.97 0 0 0 12 4a8 8 0 0 0-7.88 6.64l.88.88V12a2 2 0 0 0 2 2h2v2h-1a2 2 0 0 0-2 2v2.98l-.66.46A10.003 10.003 0 0 1 12 2z" />
                          </svg>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="text-zinc-200">
                            {renderFormattedContent(msg.content)}
                            {isLast && isGenerating && (
                              <span className="inline-block h-4 w-2 bg-emerald-400 animate-pulse ml-0.5 align-middle" />
                            )}
                          </div>

                          {/* Action Toolbar underneath response */}
                          {!isGenerating && (
                            <div className="mt-3 flex items-center gap-1 text-zinc-400">
                              <button
                                onClick={() => handleCopy(msg.id, msg.content)}
                                title="Copy"
                                className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                              >
                                {copiedId === msg.id ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <button
                                title="Good response"
                                className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                title="Bad response"
                                className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                              >
                                <ThumbsDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                title="Read aloud"
                                className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                              >
                                <Volume2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                title="Regenerate"
                                onClick={() => onSendMessage('Regenerate response')}
                                className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                              >
                                <RotateCw className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Input Area Container */}
      <div className="w-full px-4 pb-4 md:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Input Box Pill */}
          <div
            className={`relative rounded-3xl border shadow-lg transition-all ${
              isDark
                ? 'bg-[#2f2f2f] border-zinc-700/80 focus-within:border-zinc-500'
                : 'bg-[#f4f4f4] border-zinc-200 focus-within:border-zinc-400'
            }`}
          >
            {/* Textarea */}
            <div className="px-4 pt-3 pb-1">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message ChatGPT..."
                rows={1}
                className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-zinc-400 text-zinc-100 max-h-48"
              />
            </div>

            {/* Bottom Bar: Attach +, Search Globe, Reasoning, and Voice Secret Trigger / Send */}
            <div className="flex items-center justify-between px-3 pb-2 pt-1">
              {/* Left Actions */}
              <div className="flex items-center gap-1.5 relative">
                {/* Attach Button */}
                <div ref={attachMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                    aria-label="Add attachment"
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                      isDark
                        ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                        : 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>

                  {/* Mock Attachment Menu */}
                  {isAttachMenuOpen && (
                    <div
                      className={`absolute bottom-full left-0 mb-2 w-48 rounded-2xl p-1.5 shadow-2xl border text-xs z-50 animate-in fade-in zoom-in-95 duration-150 ${
                        isDark
                          ? 'bg-[#212121] border-zinc-700 text-zinc-200'
                          : 'bg-white border-zinc-200 text-zinc-800'
                      }`}
                    >
                      <button
                        onClick={() => setIsAttachMenuOpen(false)}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors ${
                          isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
                        }`}
                      >
                        <FileUp className="h-4 w-4 text-emerald-400" />
                        <span>Upload from computer</span>
                      </button>
                      <button
                        onClick={() => setIsAttachMenuOpen(false)}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors ${
                          isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
                        }`}
                      >
                        <ImageIcon className="h-4 w-4 text-sky-400" />
                        <span>Add photos & images</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Web Search Globe Toggle */}
                <button
                  type="button"
                  onClick={() => setIsWebSearchActive(!isWebSearchActive)}
                  title="Search the web"
                  className={`flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors ${
                    isWebSearchActive
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                      : isDark
                      ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      : 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>

              {/* Right Actions: Voice Secret Trigger and Send / Stop button */}
              <div className="flex items-center gap-2">
                {/* PROMINENT VOICE BUTTON: THE SECRET CAMOUFLAGE TRIGGER */}
                <button
                  type="button"
                  onClick={onVoiceTriggerClick}
                  title="Start Voice mode"
                  className="group relative flex h-8 items-center gap-1.5 rounded-full bg-emerald-600/90 px-3 text-xs font-semibold text-white shadow-md shadow-emerald-950/40 transition-all hover:bg-emerald-500 active:scale-95"
                >
                  <Headphones className="h-3.5 w-3.5 animate-pulse" />
                  <span className="tracking-wide">Voice</span>
                  {/* Subtle waveform decoration */}
                  <span className="flex items-center gap-0.5 ml-0.5">
                    <span className="h-2 w-0.5 rounded-full bg-white/70 animate-pulse" />
                    <span className="h-3 w-0.5 rounded-full bg-white animate-pulse [animation-delay:150ms]" />
                    <span className="h-1.5 w-0.5 rounded-full bg-white/70 animate-pulse [animation-delay:300ms]" />
                  </span>
                </button>

                {/* Send / Stop Generating Button */}
                {isGenerating ? (
                  <button
                    type="button"
                    onClick={onStopGenerating}
                    title="Stop generating"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black hover:bg-zinc-200 transition-all active:scale-95 shadow-md"
                  >
                    <Square className="h-3.5 w-3.5 fill-black" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    aria-label="Send message"
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                      inputText.trim()
                        ? 'bg-white text-black hover:bg-zinc-200 active:scale-95 shadow-md'
                        : isDark
                        ? 'bg-zinc-700/60 text-zinc-500 cursor-not-allowed'
                        : 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ChatGPT Disclaimer */}
          <p className="mt-2 text-center text-[11px] text-zinc-500">
            ChatGPT can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
};
