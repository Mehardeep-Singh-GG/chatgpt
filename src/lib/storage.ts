import { ChatMessage, RoomPresence, AppConfig, PartnerRole } from '@/types';
import fs from 'fs';
import path from 'path';
import os from 'os';

import { DEFAULT_CONFIG } from './constants';
export { DEFAULT_CONFIG };

interface MemoryStoreType {
  messages: Map<string, ChatMessage[]>;
  presence: Map<string, RoomPresence>;
  config: Map<string, AppConfig>;
}

const globalForChat = globalThis as unknown as {
  __stealthChatMemoryStore?: MemoryStoreType;
};

// In-memory cache preserved across hot reloads and warm serverless invocations
const memoryStore: MemoryStoreType = globalForChat.__stealthChatMemoryStore || {
  messages: new Map<string, ChatMessage[]>(),
  presence: new Map<string, RoomPresence>(),
  config: new Map<string, AppConfig>(),
};

globalForChat.__stealthChatMemoryStore = memoryStore;

// File persistence: uses local .chat-data in dev, or /tmp/.chat-data on Vercel serverless
function getWritableDataDir(): string {
  const localDir = path.join(process.cwd(), '.chat-data');
  if (!process.env.VERCEL) {
    try {
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      return localDir;
    } catch {
      // Fallback to tmpdir
    }
  }
  const tmpDir = path.join(os.tmpdir(), '.chat-data');
  try {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
  } catch {
    // Ignore
  }
  return tmpDir;
}

function getRoomFilePath(roomId: string) {
  const safeRoomId = roomId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(getWritableDataDir(), `room_${safeRoomId}.json`);
}

function loadRoomData(roomId: string): { messages: ChatMessage[]; config: AppConfig } {
  const cachedMessages = memoryStore.messages.get(roomId);
  const cachedConfig = memoryStore.config.get(roomId);

  if (cachedMessages && cachedConfig) {
    return { messages: cachedMessages, config: cachedConfig };
  }

  try {
    const filePath = getRoomFilePath(roomId);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const msgs = Array.isArray(data.messages) ? data.messages : [];
      const cfg = data.config || { ...DEFAULT_CONFIG, roomId };
      memoryStore.messages.set(roomId, msgs);
      memoryStore.config.set(roomId, cfg);
      return { messages: msgs, config: cfg };
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
    const filePath = getRoomFilePath(roomId);
    fs.writeFileSync(filePath, JSON.stringify({ messages, config }, null, 2), 'utf-8');
  } catch {
    // Read-only fallback: memoryStore holds state
  }
}

export function getMessages(roomId: string): ChatMessage[] {
  const { messages } = loadRoomData(roomId);
  return messages;
}

export function addMessage(roomId: string, message: ChatMessage): ChatMessage {
  const { messages, config } = loadRoomData(roomId);
  const existingIndex = messages.findIndex((m) => m.id === message.id);
  if (existingIndex >= 0) {
    messages[existingIndex] = message;
  } else {
    messages.push(message);
    messages.sort((a, b) => a.createdAt - b.createdAt);
  }
  saveRoomData(roomId, messages, config);
  return message;
}

export function syncMessages(roomId: string, clientMessages: ChatMessage[]): ChatMessage[] {
  const { messages, config } = loadRoomData(roomId);
  let changed = false;
  for (const incoming of clientMessages) {
    if (!incoming || !incoming.id) continue;
    const existingIndex = messages.findIndex((m) => m.id === incoming.id);
    if (existingIndex === -1) {
      messages.push(incoming);
      changed = true;
    }
  }
  if (changed) {
    messages.sort((a, b) => a.createdAt - b.createdAt);
    saveRoomData(roomId, messages, config);
  }
  return messages;
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
