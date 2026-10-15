export type PartnerRole = 'partner1' | 'partner2';

export interface UserProfile {
  id: PartnerRole;
  name: string;
  avatarColor: string; // Hex or gradient
  avatarEmoji: string; // e.g. 🦊, 🐰, 👑, ✨
  customAvatarUrl?: string;
  streakDays: number;
  streakStartDate: string;
}

export type MessageType = 'text' | 'voice' | 'video' | 'photo';

export interface MediaPayload {
  url: string; // base64 or blob URL
  duration?: number; // in seconds for voice/video
  waveform?: number[]; // normalized waveform bars for audio
  thumbnailUrl?: string; // thumbnail for video
  fileName?: string;
  fileSize?: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  sender: PartnerRole;
  senderName: string;
  type: MessageType;
  text?: string;
  media?: MediaPayload;
  createdAt: number;
  savedInChat: boolean; // Snapchat "Save in Chat" feature
  opened: boolean;
  openedAt?: number;
  reactions?: Record<string, string>; // userId -> emoji
}

export interface RoomPresence {
  partner1Online: boolean;
  partner1Typing: boolean;
  partner1LastActive: number;
  partner2Online: boolean;
  partner2Typing: boolean;
  partner2LastActive: number;
}

export interface AppConfig {
  roomId: string;
  roomSecret: string;
  partner1: UserProfile;
  partner2: UserProfile;
  disguisePasscodeEnabled: boolean;
  disguisePasscode?: string; // optional PIN to enter private room
}
