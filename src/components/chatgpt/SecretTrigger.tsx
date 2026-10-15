'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SecretTriggerProps } from './types';
import { Mic, X, ShieldCheck, AlertCircle, Headphones, Volume2 } from 'lucide-react';

const SecretTriggerModal: React.FC<Omit<SecretTriggerProps, 'isOpen'>> = ({
  onClose,
  onUnlockSuccess,
  passcodeEnabled = false,
  correctPasscode = '1234',
}) => {
  const [pin, setPin] = useState<string[]>(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isConnectingVoice, setIsConnectingVoice] = useState(!passcodeEnabled);

  const input0 = useRef<HTMLInputElement>(null);
  const input1 = useRef<HTMLInputElement>(null);
  const input2 = useRef<HTMLInputElement>(null);
  const input3 = useRef<HTMLInputElement>(null);

  // Auto transition when passcode is disabled
  useEffect(() => {
    if (!passcodeEnabled) {
      const timer = setTimeout(() => {
        setIsConnectingVoice(false);
        onUnlockSuccess();
      }, 350);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        input0.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [passcodeEnabled, onUnlockSuccess]);

  const getInputRef = (index: number) => {
    if (index === 0) return input0;
    if (index === 1) return input1;
    if (index === 2) return input2;
    return input3;
  };

  const handleDigitChange = (index: number, value: string) => {
    const cleanDigit = value.replace(/\D/g, '').slice(-1);
    const newPin = [...pin];
    newPin[index] = cleanDigit;
    setPin(newPin);
    setError(null);

    if (cleanDigit && index < 3) {
      getInputRef(index + 1).current?.focus();
    }

    if (newPin.every((d) => d !== '')) {
      const entered = newPin.join('');
      setIsVerifying(true);

      setTimeout(() => {
        if (entered === correctPasscode) {
          setIsVerifying(false);
          onUnlockSuccess();
        } else {
          setIsVerifying(false);
          setError('Microphone session auth failed (Error 401). Try again.');
          setPin(['', '', '', '']);
          getInputRef(0).current?.focus();
        }
      }, 300);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      getInputRef(index - 1).current?.focus();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      const digits = pasted.split('');
      setPin(digits);
      setIsVerifying(true);
      setTimeout(() => {
        if (pasted === correctPasscode) {
          setIsVerifying(false);
          onUnlockSuccess();
        } else {
          setIsVerifying(false);
          setError('Microphone session auth failed (Error 401). Try again.');
          setPin(['', '', '', '']);
          getInputRef(0).current?.focus();
        }
      }, 300);
    }
  };

  // When no passcode is needed, show rapid voice connecting simulation before entering
  if (!passcodeEnabled && isConnectingVoice) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-[#212121] p-8 text-white shadow-2xl border border-white/10 max-w-sm w-full mx-4">
          <div className="relative flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 animate-ping absolute" />
            <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center text-white relative z-10 shadow-lg shadow-emerald-500/30">
              <Headphones className="h-8 w-8 animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold tracking-tight text-zinc-100">
              Connecting Voice...
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Initializing neural audio model</p>
          </div>
          <div className="flex items-center gap-1.5 pt-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl bg-[#212121] text-zinc-100 p-6 shadow-2xl border border-zinc-700/80 transition-all transform animate-in zoom-in-95 duration-200"
      >
        {/* Top Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Realistic Disguise Icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-emerald-400 border border-zinc-700 shadow-inner">
          <Mic className="h-7 w-7" />
        </div>

        {/* Camouflage Header */}
        <div className="text-center">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Voice Mode Security
          </h2>
          <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed px-4">
            Enter your 4-digit voice access PIN to initialize neural microphone audio streaming.
          </p>
        </div>

        {/* 4-digit PIN Inputs */}
        <div className="my-6 flex justify-center gap-3" onPaste={handlePaste}>
          {[0, 1, 2, 3].map((idx) => (
            <input
              key={idx}
              ref={getInputRef(idx)}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={pin[idx]}
              disabled={isVerifying}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="h-14 w-12 rounded-xl border border-zinc-700 bg-zinc-900/90 text-center text-2xl font-bold text-white shadow-inner outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
            />
          ))}
        </div>

        {/* Error / Verifying Banner */}
        {error ? (
          <div className="mb-4 flex items-center justify-center gap-2 text-xs text-red-400 bg-red-950/40 py-2 px-3 rounded-lg border border-red-800/40 animate-in shake">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : isVerifying ? (
          <div className="mb-4 flex items-center justify-center gap-2 text-xs text-emerald-400 bg-emerald-950/30 py-2 px-3 rounded-lg border border-emerald-800/30">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Verifying voice token...</span>
          </div>
        ) : (
          <div className="mb-4 flex items-center justify-center gap-1.5 text-xs text-zinc-500">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>End-to-end encrypted audio stream</span>
          </div>
        )}

        {/* Discreet Numeric Pad for Mobile Convenience */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => {
                const emptyIdx = pin.findIndex((d) => d === '');
                if (emptyIdx !== -1) {
                  handleDigitChange(emptyIdx, num.toString());
                }
              }}
              className="h-11 rounded-xl bg-zinc-800/70 hover:bg-zinc-700/80 active:bg-zinc-700 text-sm font-semibold text-zinc-200 transition-colors"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setPin(['', '', '', '']);
              setError(null);
              getInputRef(0).current?.focus();
            }}
            className="h-11 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-xs font-medium text-zinc-400 transition-colors"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => {
              const emptyIdx = pin.findIndex((d) => d === '');
              if (emptyIdx !== -1) {
                handleDigitChange(emptyIdx, '0');
              }
            }}
            className="h-11 rounded-xl bg-zinc-800/70 hover:bg-zinc-700/80 active:bg-zinc-700 text-sm font-semibold text-zinc-200 transition-colors"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => {
              let lastFilledIdx = -1;
              for (let i = pin.length - 1; i >= 0; i--) {
                if (pin[i] !== '') {
                  lastFilledIdx = i;
                  break;
                }
              }
              if (lastFilledIdx !== -1) {
                const newPin = [...pin];
                newPin[lastFilledIdx] = '';
                setPin(newPin);
                getInputRef(lastFilledIdx).current?.focus();
              }
            }}
            className="h-11 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-xs font-medium text-zinc-400 transition-colors"
          >
            ⌫
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-500 pt-2">
          <span className="flex items-center gap-1">
            <Volume2 className="h-3 w-3" /> Audio Engine v4.2
          </span>
          <button
            type="button"
            onClick={onClose}
            className="hover:text-zinc-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export const SecretTrigger: React.FC<SecretTriggerProps> = ({ isOpen, ...props }) => {
  if (!isOpen) return null;
  return <SecretTriggerModal key={isOpen ? 'active' : 'idle'} {...props} />;
};
