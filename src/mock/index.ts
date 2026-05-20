import { User, Chat, Message, Notification } from "@/types";

export const mockUsers: User[] = [
  {
    id: "user-1",
    name: "Alex Johnson",
    username: "alexj",
    email: "alex@example.com",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    bio: "Frontend Developer | Design Enthusiast",
    status: "online",
    lastSeen: new Date(),
    socialLinks: { twitter: "@alexj", github: "alexj" },
  },
  {
    id: "user-2",
    name: "Sarah Parker",
    username: "sarahp",
    email: "sarah@example.com",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    bio: "Coffee addict. Code wizard.",
    status: "online",
    lastSeen: new Date(),
  },
  {
    id: "user-3",
    name: "Mike Ross",
    username: "miker",
    email: "mike@example.com",
    avatar: "https://i.pravatar.cc/150?u=a04258114e29026702d",
    bio: "Lawyer by day, gamer by night.",
    status: "idle",
    lastSeen: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
  },
  {
    id: "user-4",
    name: "Jessica Pearson",
    username: "jessp",
    email: "jessica@example.com",
    avatar: "https://i.pravatar.cc/150?u=a048581f4e29026701d",
    bio: "Managing Partner",
    status: "offline",
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: "user-5",
    name: "David Smith",
    username: "davids",
    email: "david@example.com",
    avatar: "https://i.pravatar.cc/150?u=a04258a2462d826712d",
    bio: "UI/UX Designer",
    status: "dnd",
    lastSeen: new Date(),
  },
];

export const mockCurrentUser = mockUsers[0];

const now = new Date();

export const mockChats: Chat[] = [
  {
    id: "chat-1",
    type: "direct",
    participants: [mockUsers[0], mockUsers[1]],
    unreadCount: 2,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 5),
    lastMessage: {
      id: "msg-2",
      chatId: "chat-1",
      senderId: "user-2",
      content: "Sure, let me check the PR and get back to you.",
      timestamp: new Date(now.getTime() - 1000 * 60 * 5),
      status: "delivered",
    },
  },
  {
    id: "chat-2",
    type: "direct",
    participants: [mockUsers[0], mockUsers[2]],
    unreadCount: 0,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 1),
    lastMessage: {
      id: "msg-4",
      chatId: "chat-2",
      senderId: "user-1",
      content: "Are we still on for the game tonight?",
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 1),
      status: "seen",
    },
  },
  {
    id: "chat-3",
    type: "group",
    name: "Design Team",
    avatar: "https://i.pravatar.cc/150?u=team-design",
    participants: [mockUsers[0], mockUsers[1], mockUsers[4]],
    unreadCount: 5,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 30),
    lastMessage: {
      id: "msg-6",
      chatId: "chat-3",
      senderId: "user-5",
      content: "I've uploaded the new Figma files to the drive.",
      timestamp: new Date(now.getTime() - 1000 * 60 * 30),
      status: "delivered",
    },
  },
];

export const mockMessages: Record<string, Message[]> = {
  "chat-1": [
    {
      id: "msg-1",
      chatId: "chat-1",
      senderId: "user-1",
      content: "Hey Sarah! Could you review the new dashboard UI PR?",
      timestamp: new Date(now.getTime() - 1000 * 60 * 10),
      status: "seen",
    },
    {
      id: "msg-2",
      chatId: "chat-1",
      senderId: "user-2",
      content: "Sure, let me check the PR and get back to you.",
      timestamp: new Date(now.getTime() - 1000 * 60 * 5),
      status: "delivered",
    },
  ],
  "chat-2": [
    {
      id: "msg-3",
      chatId: "chat-2",
      senderId: "user-2",
      content: "Did you finish the proposal?",
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2),
      status: "seen",
    },
    {
      id: "msg-4",
      chatId: "chat-2",
      senderId: "user-1",
      content: "Are we still on for the game tonight?",
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 1),
      status: "seen",
    },
  ],
  "chat-3": [
    {
      id: "msg-5",
      chatId: "chat-3",
      senderId: "user-1",
      content: "Has anyone seen the new design assets?",
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 4),
      status: "seen",
    },
    {
      id: "msg-6",
      chatId: "chat-3",
      senderId: "user-5",
      content: "I've uploaded the new Figma files to the drive.",
      timestamp: new Date(now.getTime() - 1000 * 60 * 30),
      status: "delivered",
      attachments: [
        {
          id: "att-1",
          type: "image",
          url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
          name: "design-preview.png",
        }
      ]
    },
  ],
};

export const mockNotifications: Notification[] = [
  {
    id: "notif-1",
    type: "friend_request",
    content: "Jessica Pearson sent you a friend request.",
    isRead: false,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2),
  },
  {
    id: "notif-2",
    type: "system",
    content: "Welcome to Chatify! Try out the new dark mode.",
    isRead: true,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
  },
];
