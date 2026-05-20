import { create } from "zustand";
import { Chat, Message } from "@/types";

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  messages: Record<string, Message[]>; // chatId -> messages mapping
  cursors: Record<string, string | null>; // chatId -> nextCursor mapping
  hasMore: Record<string, boolean>; // chatId -> boolean
  isLoadingFirstPage: Record<string, boolean>; // chatId -> boolean
  isLoadingMore: Record<string, boolean>; // chatId -> boolean
  
  setChats: (chats: Chat[]) => void;
  setActiveChatId: (chatId: string | null) => void;
  setMessages: (chatId: string, messages: Message[]) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, data: Partial<Message>) => void;
  markChatAsRead: (chatId: string) => void;
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  loadMoreMessages: (chatId: string) => Promise<void>;
  markMessagesAsSeen: (chatId: string) => Promise<void>;
  updateMessagesStatus: (chatId: string, messageIds: string[], status: 'seen' | 'sent') => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  activeChatId: null,
  messages: {},
  cursors: {},
  hasMore: {},
  isLoadingFirstPage: {},
  isLoadingMore: {},

  setChats: (chats) => set({ chats }),
  setActiveChatId: (activeChatId) => set({ activeChatId }),
  setMessages: (chatId, chatMessages) =>
    set((state) => ({
      messages: { ...state.messages, [chatId]: chatMessages },
    })),
  addMessage: (chatId, message) =>
    set((state) => {
      const chatMessages = state.messages[chatId] || [];
      if (chatMessages.some((m) => m.id === message.id)) {
        return state;
      }
      const updatedMessages = [...chatMessages, message];
      
      // Compute unread count increment if chat is NOT active
      const isActive = state.activeChatId === chatId;
      const isFromMe = message.senderId === require('./useAuthStore').useAuthStore.getState().user?.id;
      
      return {
        messages: {
          ...state.messages,
          [chatId]: updatedMessages,
        },
        // Update last message and unreadCount in chats array
        chats: state.chats.map((c) =>
          c.id === chatId 
            ? { 
                ...c, 
                lastMessage: message, 
                updatedAt: message.timestamp,
                unreadCount: (!isActive && !isFromMe) ? (c.unreadCount + 1) : c.unreadCount
              } 
            : c
        ).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
      };
    }),
  updateMessage: (chatId, messageId, data) =>
    set((state) => {
      const chatMessages = state.messages[chatId] || [];
      return {
        messages: {
          ...state.messages,
          [chatId]: chatMessages.map((m) =>
            m.id === messageId ? { ...m, ...data } : m
          ),
        },
      };
    }),
  markChatAsRead: (chatId) =>
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId ? { ...c, unreadCount: 0 } : c
      ),
    })),
  updateMessagesStatus: (chatId, messageIds, status) =>
    set((state) => {
      const chatMessages = state.messages[chatId] || [];
      return {
        messages: {
          ...state.messages,
          [chatId]: chatMessages.map((m) =>
            messageIds.includes(m.id) ? { ...m, status } : m
          ),
        },
      };
    }),
  markMessagesAsSeen: async (chatId) => {
    try {
      const { default: api } = await import('@/lib/api');
      await api.post('/messages/seen', { conversationId: chatId });
      
      // Update local state: mark all messages from others as seen
      set((state) => {
        const chatMessages = state.messages[chatId] || [];
        const currentUserId = require('./useAuthStore').useAuthStore.getState().user?.id;
        
        const updatedMessages = chatMessages.map((m) =>
          m.senderId !== currentUserId ? { ...m, status: 'seen' as const } : m
        );
        return {
          messages: {
            ...state.messages,
            [chatId]: updatedMessages,
          },
          // Clear unreadCount for this chat in sidebar
          chats: state.chats.map((c) =>
            c.id === chatId ? { ...c, unreadCount: 0 } : c
          ),
        };
      });
    } catch (error) {
      console.error('Failed to mark messages as seen', error);
    }
  },
  fetchChats: async () => {
    try {
      const { default: api } = await import('@/lib/api');
      const response = await api.get('/conversations');
      const rawChats = response.data.data || [];
      
      const formattedChats = rawChats.map((c: any) => {
        const participants = c.members
          .filter((m: any) => m && m.user)
          .map((m: any) => ({
            id: m.user.id,
            name: m.user.name,
            username: m.user.email ? m.user.email.split('@')[0] : 'user', // generate a fallback username
            email: m.user.email || '',
            avatar: m.user.profilePhoto || `https://i.pravatar.cc/150?u=${m.user.id}`,
            status: m.user.isOnline ? 'online' : 'offline',
            lastSeen: m.user.lastSeen,
            createdAt: m.user.createdAt || new Date(),
          }));
        
        const lastDbMessage = c.messages?.[0];
        const lastMessage = lastDbMessage ? {
          id: lastDbMessage.id,
          chatId: c.id,
          senderId: lastDbMessage.senderId,
          content: lastDbMessage.content || '',
          timestamp: new Date(lastDbMessage.createdAt),
          status: 'seen' as const, // default
          attachments: lastDbMessage.attachments,
        } : undefined;

        const chatUpdatedAt = lastMessage ? lastMessage.timestamp : new Date(c.updatedAt);

        return {
          id: c.id,
          type: c.isGroup ? ('group' as const) : ('direct' as const),
          participants,
          lastMessage,
          unreadCount: c.unreadCount || 0,
          createdAt: new Date(c.createdAt),
          updatedAt: chatUpdatedAt,
          name: c.name || undefined,
          avatar: c.avatar || undefined,
        };
      });

      // Sort chats by updatedAt desc
      formattedChats.sort((a: any, b: any) => b.updatedAt.getTime() - a.updatedAt.getTime());

      set({ chats: formattedChats });
    } catch (error) {
      console.error('Failed to fetch chats', error);
    }
  },
  fetchMessages: async (chatId) => {
    set((state) => ({
      isLoadingFirstPage: { ...state.isLoadingFirstPage, [chatId]: true }
    }));
    try {
      const { default: api } = await import('@/lib/api');
      const response = await api.get(`/messages/${chatId}`);
      const rawMessages = response.data.data?.messages || [];
      const nextCursor = response.data.data?.nextCursor || null;
      
      const mappedMessages = rawMessages.map((msg: any) => {
        const isSeenByOthers = msg.seenBy?.some((s: any) => s.userId !== msg.senderId);
        return {
          id: msg.id,
          chatId: msg.conversationId,
          senderId: msg.senderId,
          content: msg.content || '',
          timestamp: new Date(msg.createdAt),
          status: isSeenByOthers ? ('seen' as const) : ('sent' as const),
          attachments: msg.attachments?.map((att: any) => ({
            id: att.id,
            type: att.type.toLowerCase(),
            url: att.url,
            name: att.name || 'attachment',
            size: att.size,
          })),
          replyTo: msg.replyToId || undefined,
        };
      });

      set((state) => ({
        messages: { ...state.messages, [chatId]: mappedMessages.reverse() },
        cursors: { ...state.cursors, [chatId]: nextCursor },
        hasMore: { ...state.hasMore, [chatId]: !!nextCursor },
        isLoadingFirstPage: { ...state.isLoadingFirstPage, [chatId]: false }
      }));
    } catch (error) {
      console.error('Failed to fetch messages', error);
      set((state) => ({
        isLoadingFirstPage: { ...state.isLoadingFirstPage, [chatId]: false }
      }));
    }
  },
  loadMoreMessages: async (chatId) => {
    const state = useChatStore.getState();
    const cursor = state.cursors[chatId];
    const hasMore = state.hasMore[chatId];
    const isLoadingMore = state.isLoadingMore[chatId];

    if (!cursor || !hasMore || isLoadingMore) return;

    set((state) => ({
      isLoadingMore: { ...state.isLoadingMore, [chatId]: true }
    }));

    try {
      const { default: api } = await import('@/lib/api');
      const response = await api.get(`/messages/${chatId}?cursor=${cursor}`);
      const rawMessages = response.data.data?.messages || [];
      const nextCursor = response.data.data?.nextCursor || null;

      // Filter out boundaries if already included
      const filteredRaw = rawMessages.filter((m: any) => m.id !== cursor);

      const mappedMessages = filteredRaw.map((msg: any) => {
        const isSeenByOthers = msg.seenBy?.some((s: any) => s.userId !== msg.senderId);
        return {
          id: msg.id,
          chatId: msg.conversationId,
          senderId: msg.senderId,
          content: msg.content || '',
          timestamp: new Date(msg.createdAt),
          status: isSeenByOthers ? ('seen' as const) : ('sent' as const),
          attachments: msg.attachments?.map((att: any) => ({
            id: att.id,
            type: att.type.toLowerCase(),
            url: att.url,
            name: att.name || 'attachment',
            size: att.size,
          })),
          replyTo: msg.replyToId || undefined,
        };
      });

      set((state) => {
        const existingMessages = state.messages[chatId] || [];
        const updatedMessages = [...mappedMessages.reverse(), ...existingMessages];

        return {
          messages: { ...state.messages, [chatId]: updatedMessages },
          cursors: { ...state.cursors, [chatId]: nextCursor },
          hasMore: { ...state.hasMore, [chatId]: !!nextCursor },
          isLoadingMore: { ...state.isLoadingMore, [chatId]: false }
        };
      });
    } catch (error) {
      console.error('Failed to load more messages', error);
      set((state) => ({
        isLoadingMore: { ...state.isLoadingMore, [chatId]: false }
      }));
    }
  },
}));
