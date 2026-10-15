import { ChatMessage, RoomPresence, AppConfig, PartnerRole } from '@/types';
import fs from 'fs';
import path from 'path';

import { DEFAULT_CONFIG } from './constants';
export { DEFAULT_CONFIG };

// In-memory cache for fast serverless responses
const memoryStore = {
  messages: new Map<string, ChatMessage[]>(), // roomId -> messages
  presence: new Map<string, RoomPresence>(), // roomId -> presence
  config: new Map<string, AppConfig>(),
};

// File persistence for local dev / persistent disk if available
const DATA_DIR = path.join(process.cwd(), '.chat-data');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // Read-only serverless environment fallback to memoryStore
  }
}

function getRoomFilePath(roomId: string) {
  return path.join(DATA_DIR, `room_${roomId}.json`);
}

function loadRoomData(roomId: string): { messages: ChatMessage[]; config: AppConfig } {
  // Check memory first
  const cachedMessages = memoryStore.messages.get(roomId);
  const cachedConfig = memoryStore.config.get(roomId);

  if (cachedMessages && cachedConfig) {
    return { messages: cachedMessages, config: cachedConfig };
  }

  // Try file read
  try {
    const filePath = getRoomFilePath(roomId);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      memoryStore.messages.set(roomId, data.messages || []);
      memoryStore.config.set(roomId, data.config || DEFAULT_CONFIG);
      return { messages: data.messages || [], config: data.config || DEFAULT_CONFIG };
    }
  } catch {
    // Fall back to default
  }

  const initial = { messages: [], config: { ...DEFAULT_CONFIG, roomId } };
  memoryStore.messages.set(roomId, initial.messages);
  memoryStore.config.set(roomId, initial.config);
  return initial;
}

function saveRoomData(roomId: string, messages: ChatMessage[], config: AppConfig) {
  memoryStore.messages.set(roomId, messages);
  memoryStore.config.set(roomId, config);

  try {
    ensureDataDir();
    const filePath = getRoomFilePath(roomId);
    fs.writeFileSync(filePath, JSON.stringify({ messages, config }, null, 2), 'utf-8');
  } catch {
    // Vercel serverless / read-only filesystem: memoryStore holds state during instance life
  }
}

export function getMessages(roomId: string): ChatMessage[] {
  const { messages } = loadRoomData(roomId);
  return messages;
}

export function addMessage(roomId: string, message: ChatMessage): ChatMessage {
  const { messages, config } = loadRoomData(roomId);
  // Avoid duplicates
  const existingIndex = messages.findIndex((m) => m.id === message.id);
  if (existingIndex >= 0) {
    messages[existingIndex] = message;
  } else {
    messages.push(message);
  }
  saveRoomData(roomId, messages, config);
  return message;
}

export function toggleSaveMessage(roomId: string, messageId: string): ChatMessage | null {
  const { messages, config } = loadRoomData(roomId);
  const msg = messages.find((m) => m.id === messageId);
  if (!msg) return null;
  msg.savedInChat = !msg.savedInChat;
  saveRoomData(roomId, messages, config);
  return msg;
}

export function toggleReaction(
  roomId: string,
  messageId: string,
  sender: PartnerRole,
  emoji: string
): ChatMessage | null {
  const { messages, config } = loadRoomData(roomId);
  const msg = messages.find((m) => m.id === messageId);
  if (!msg) return null;
  if (!msg.reactions) msg.reactions = {};
  if (msg.reactions[sender] === emoji) {
    delete msg.reactions[sender];
  } else {
    msg.reactions[sender] = emoji;
  }
  saveRoomData(roomId, messages, config);
  return msg;
}

export function getPresence(roomId: string): RoomPresence {
  const now = Date.now();
  const presence = memoryStore.presence.get(roomId) || {
    partner1Online: false,
    partner1Typing: false,
    partner1LastActive: 0,
    partner2Online: false,
    partner2Typing: false,
    partner2LastActive: 0,
  };

  // Treat inactive for > 15s as offline
  return {
    ...presence,
    partner1Online: now - presence.partner1LastActive < 15000,
    partner2Online: now - presence.partner2LastActive < 15000,
  };
}

export function updatePresence(
  roomId: string,
  role: PartnerRole,
  isTyping: boolean
): RoomPresence {
  const current = getPresence(roomId);
  const now = Date.now();

  if (role === 'partner1') {
    current.partner1Online = true;
    current.partner1LastActive = now;
    current.partner1Typing = isTyping;
  } else {
    current.partner2Online = true;
    current.partner2LastActive = now;
    current.partner2Typing = isTyping;
  }

  memoryStore.presence.set(roomId, current);
  return current;
}

export function getConfig(roomId: string): AppConfig {
  const { config } = loadRoomData(roomId);
  return config;
}

export function updateConfig(roomId: string, newConfig: Partial<AppConfig>): AppConfig {
  const { messages, config } = loadRoomData(roomId);
  const updated: AppConfig = { ...config, ...newConfig };
  saveRoomData(roomId, messages, updated);
  return updated;
}
