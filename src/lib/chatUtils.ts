/**
 * Utility functions for date formatting, streak calculation, and media helpers.
 */

export function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatMessageDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function formatLastSeen(lastActive: number): string {
  if (!lastActive) return 'Offline';
  const diffMs = Date.now() - lastActive;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 20) return 'Active now';
  if (diffMin < 1) return 'Active just now';
  if (diffMin === 1) return 'Active 1m ago';
  if (diffMin < 60) return `Active ${diffMin}m ago`;
  if (diffHour === 1) return 'Active 1h ago';
  if (diffHour < 24) return `Active ${diffHour}h ago`;
  return 'Active today';
}

export function calculateStreakDays(startDateStr: string): number {
  try {
    const start = new Date(startDateStr);
    const now = new Date();
    // Normalize to midnight
    const startUTC = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const nowUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.floor((nowUTC - startUTC) / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays + 1);
  } catch {
    return 1;
  }
}

export function formatDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
