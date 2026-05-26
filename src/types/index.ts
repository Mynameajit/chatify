export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  bio?: string;
  status: "online" | "offline" | "idle" | "dnd";
  lastSeen?: Date;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    github?: string;
  };
}

export interface MessageReaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

export interface MessageAttachment {
  id: string;
  type: "image" | "video" | "audio" | "document";
  url: string;
  name: string;
  size?: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  status: "sending" | "sent" | "delivered" | "seen";
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  replyTo?: string; // ID of the message being replied to
  isEdited?: boolean;
  type?: string;
}

export interface Chat {
  id: string;
  type: "direct" | "group";
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  name?: string; // For groups
  avatar?: string; // For groups
}

export interface Notification {
  id: string;
  type: "friend_request" | "message" | "system";
  content: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}
