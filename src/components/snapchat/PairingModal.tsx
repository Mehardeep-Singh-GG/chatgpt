"use client";

import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Link2,
  Heart,
  Shield,
  User,
  Lock,
  Smartphone,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { AppConfig, PartnerRole } from '@/types';
import { calculateStreakDays } from '@/lib/chatUtils';

export interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onUpdateConfig: (newConfig: Partial<AppConfig>) => Promise<void> | void;
  currentRole: PartnerRole;
  onSwitchRole?: (role: PartnerRole) => void;
}

const EMOJI_OPTIONS = [
  '👑', '✨', '🦊', '🐰', '🐱', '🐻',
  '🍓', '💖', '🦁', '🐼', '🦋', '🌹',
  '🔥', '💎', '🌸', '🥑', '🌙', '💍'
];

interface PairingFormProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: Partial<AppConfig>) => Promise<void> | void;
  currentRole: PartnerRole;
  onSwitchRole?: (role: PartnerRole) => void;
  onClose: () => void;
}

const PairingForm: React.FC<PairingFormProps> = ({
  config,
  onUpdateConfig,
  currentRole,
  onSwitchRole,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'links' | 'profile' | 'security'>('links');
  const [copiedMy, setCopiedMy] = useState(false);
  const [copiedHer, setCopiedHer] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form state initialized directly from config
  const [p1Name, setP1Name] = useState(config.partner1.name || 'Me');
  const [p1Emoji, setP1Emoji] = useState(config.partner1.avatarEmoji || '👑');
  const [p2Name, setP2Name] = useState(config.partner2.name || 'My Love');
  const [p2Emoji, setP2Emoji] = useState(config.partner2.avatarEmoji || '✨');
  const [streakDate, setStreakDate] = useState(
    config.partner1.streakStartDate || '2026-03-04'
  );
  const [passcodeEnabled, setPasscodeEnabled] = useState(config.disguisePasscodeEnabled ?? false);
  const [passcode, setPasscode] = useState(config.disguisePasscode || '1234');

  // Resolve links
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://chat.example.com';
  const partner1Url = `${origin}/?user=partner1&secret=${config.roomSecret || 'love-and-snaps-2026'}`;
  const partner2Url = `${origin}/?user=partner2&secret=${config.roomSecret || 'love-and-snaps-2026'}`;

  const isCurrentP1 = currentRole === 'partner1';
  const myLink = isCurrentP1 ? partner1Url : partner2Url;
  const herLink = isCurrentP1 ? partner2Url : partner1Url;
  const myLabel = isCurrentP1 ? `Your Link (${p1Name})` : `Your Link (${p2Name})`;
  const herLabel = isCurrentP1 ? `Her Link (${p2Name})` : `His Link (${p1Name})`;

  const copyToClipboard = async (text: string, type: 'my' | 'her') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'my') {
        setCopiedMy(true);
        setTimeout(() => setCopiedMy(false), 2000);
      } else {
        setCopiedHer(true);
        setTimeout(() => setCopiedHer(false), 2000);
      }
    } catch (e) {
      console.error('Clipboard copy failed:', e);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const newStreakDays = calculateStreakDays(streakDate);

    const updatedConfig: Partial<AppConfig> = {
      partner1: {
        ...config.partner1,
        name: p1Name.trim() || 'Me',
        avatarEmoji: p1Emoji,
        streakStartDate: streakDate,
        streakDays: newStreakDays,
      },
      partner2: {
        ...config.partner2,
        name: p2Name.trim() || 'My Love',
        avatarEmoji: p2Emoji,
        streakStartDate: streakDate,
        streakDays: newStreakDays,
      },
      disguisePasscodeEnabled: passcodeEnabled,
      disguisePasscode: passcode.trim(),
    };

    try {
      await onUpdateConfig(updatedConfig);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Tab Bar */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-6 pt-2 bg-zinc-50/30 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => setActiveTab('links')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'links'
              ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Access Links</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'profile'
              ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Couple Profile</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'security'
              ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Stealth PIN</span>
        </button>
      </div>

      {/* Modal Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* TAB 1: PAIRING LINKS */}
        {activeTab === 'links' && (
          <div className="space-y-5">
            {/* Instructional Notice */}
            <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60">
              <div className="flex items-start gap-2.5">
                <Smartphone className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-purple-950 dark:text-purple-200 leading-relaxed font-medium">
                  <strong className="font-bold">How to use:</strong> Open her link on her phone and bookmark it or add to home screen. When she clicks <span className="underline decoration-purple-400">“Voice”</span> on the ChatGPT screen, she enters directly as Her!
                </p>
              </div>
            </div>

            {/* 1. Her Access Link (Highlighted) */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pink-600 dark:text-pink-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <span>✨</span> {herLabel}
                </span>
                <span className="text-[11px] text-zinc-400">Send this to her</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={herLink}
                  className="flex-1 text-xs font-mono bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-zinc-700 dark:text-zinc-300 select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(herLink, 'her')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-xs active:scale-95 flex-shrink-0 ${
                    copiedHer
                      ? 'bg-emerald-600'
                      : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700'
                  }`}
                >
                  {copiedHer ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Her Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 2. Your Access Link */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <span>👑</span> {myLabel}
                </span>
                <span className="text-[11px] text-zinc-400">For your browser</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={myLink}
                  className="flex-1 text-xs font-mono bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-zinc-700 dark:text-zinc-300 select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(myLink, 'my')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-xs active:scale-95 flex-shrink-0 ${
                    copiedMy
                      ? 'bg-emerald-600'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                  }`}
                >
                  {copiedMy ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy My Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Secret Room Identifier & Quick Role Switcher */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
              <div>
                Room ID: <span className="font-mono text-zinc-600 dark:text-zinc-400">{config.roomId}</span>
              </div>
              {onSwitchRole && (
                <button
                  type="button"
                  onClick={() => onSwitchRole(isCurrentP1 ? 'partner2' : 'partner1')}
                  className="px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white text-zinc-700 dark:text-zinc-300 font-medium transition-colors cursor-pointer"
                >
                  Switch test view to {isCurrentP1 ? p2Name : p1Name}
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: COUPLE PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-5">
            {/* Partner 1 (You) */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                <User className="w-4 h-4 text-purple-600" />
                <span>Partner 1 (You)</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    Your Nickname
                  </label>
                  <input
                    type="text"
                    value={p1Name}
                    onChange={(e) => setP1Name(e.target.value)}
                    placeholder="e.g. Me or Alex"
                    className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    Emoji
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-xl p-1 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
                      {p1Emoji}
                    </span>
                    <select
                      value={p1Emoji}
                      onChange={(e) => setP1Emoji(e.target.value)}
                      className="text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-1.5 text-zinc-800 dark:text-zinc-200"
                    >
                      {EMOJI_OPTIONS.map((em) => (
                        <option key={em} value={em}>
                          {em}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Partner 2 (Her) */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                <Heart className="w-4 h-4 text-pink-500 fill-pink-500/20" />
                <span>Partner 2 (Her)</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    Her Nickname
                  </label>
                  <input
                    type="text"
                    value={p2Name}
                    onChange={(e) => setP2Name(e.target.value)}
                    placeholder="e.g. Babe or My Love"
                    className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    Emoji
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-xl p-1 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
                      {p2Emoji}
                    </span>
                    <select
                      value={p2Emoji}
                      onChange={(e) => setP2Emoji(e.target.value)}
                      className="text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-1.5 text-zinc-800 dark:text-zinc-200"
                    >
                      {EMOJI_OPTIONS.map((em) => (
                        <option key={em} value={em}>
                          {em}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Couple Streak Start Date */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>Streak Start Date</span>
                </div>
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                  🔥 {calculateStreakDays(streakDate)} Days Together
                </span>
              </div>
              <input
                type="date"
                value={streakDate}
                onChange={(e) => setStreakDate(e.target.value)}
                className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* TAB 3: STEALTH SECURITY */}
        {activeTab === 'security' && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Enable Disguise PIN
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Requires a 4-digit PIN to exit ChatGPT mode
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={passcodeEnabled}
                  onChange={(e) => setPasscodeEnabled(e.target.checked)}
                  className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                />
              </div>

              {passcodeEnabled && (
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    4-Digit Passcode
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="e.g. 1234"
                    className="w-36 text-center tracking-widest text-lg font-mono bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>Stealth Disguise Architecture</span>
              </div>
              <p className="leading-relaxed">
                Anyone opening the app without credentials sees a functioning ChatGPT replica. Clicking the Voice icon or entering your secret PIN instantly reveals your private Snapchat lounge.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer with Save / Close */}
      <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50">
        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved successfully!</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Done
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </>
  );
};

export const PairingModal: React.FC<PairingModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  currentRole,
  onSwitchRole,
}) => {
  if (!isOpen) return null;

  // Use a composite key so that form resets cleanly when config updates without setState in effects
  const configKey = `${config.roomId}-${config.partner1.name}-${config.partner2.name}-${config.partner1.streakStartDate}-${config.disguisePasscodeEnabled}-${config.disguisePasscode}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Couples Hub & Pairing
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Private access links and customization
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

        <PairingForm
          key={configKey}
          config={config}
          onUpdateConfig={onUpdateConfig}
          currentRole={currentRole}
          onSwitchRole={onSwitchRole}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
