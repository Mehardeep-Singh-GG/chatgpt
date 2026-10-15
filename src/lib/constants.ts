import { AppConfig } from '@/types';

export const DEFAULT_CONFIG: AppConfig = {
  roomId: 'our-secret-lounge',
  roomSecret: 'love-and-snaps-2026',
  partner1: {
    id: 'partner1',
    name: 'Me',
    avatarColor: '#8B5CF6',
    avatarEmoji: '👑',
    streakDays: 42,
    streakStartDate: '2026-03-04',
  },
  partner2: {
    id: 'partner2',
    name: 'My Love',
    avatarColor: '#EC4899',
    avatarEmoji: '✨',
    streakDays: 42,
    streakStartDate: '2026-03-04',
  },
  disguisePasscodeEnabled: false,
  disguisePasscode: '1234',
};
