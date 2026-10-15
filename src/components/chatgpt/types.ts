import { MockConversation, MockChatMessage } from '@/lib/mockAi';

export type ChatGPTModel = 'gpt-4o' | 'gpt-4o-mini' | 'o1-preview';

export interface ChatGPTProps {
  /** Called when the secret trigger is successfully activated */
  onEnterPrivateMode: () => void;
  /** Whether disguise passcode is enabled */
  passcodeEnabled?: boolean;
  /** Passcode required to enter private chat (default '1234') */
  correctPasscode?: string;
  /** Optional callback for panic switch back to stealth */
  onPanic?: () => void;
  /** Current user profile name to display in ChatGPT sidebar */
  userName?: string;
  /** Initial theme mode */
  initialTheme?: 'dark' | 'light';
}

export interface ChatGPTSidebarProps {
  conversations: MockConversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  userName?: string;
  theme: 'dark' | 'light';
  onSecretLogoClick?: () => void;
}

export interface ChatGPTHeaderProps {
  selectedModel: ChatGPTModel;
  onSelectModel: (model: ChatGPTModel) => void;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  isSidebarOpen: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onSecretTriggerClick?: () => void;
}

export interface ChatGPTMainProps {
  conversation: MockConversation | null;
  messages: MockChatMessage[];
  isGenerating: boolean;
  onSendMessage: (text: string) => void;
  onStopGenerating: () => void;
  onVoiceTriggerClick: () => void;
  theme: 'dark' | 'light';
}

export interface SecretTriggerProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: () => void;
  passcodeEnabled?: boolean;
  correctPasscode?: string;
}
