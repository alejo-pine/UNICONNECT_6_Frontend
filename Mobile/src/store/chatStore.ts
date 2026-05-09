import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import { create } from "zustand";
import {
    ChatAttachment,
    ChatMessage,
    Conversation,
} from "../features/chat/types/chat.types";
import chatApi from "../services/chatApi";
import { supabase } from "../services/supabase";

interface ChatState {
  conversations: Conversation[];
  messages: ChatMessage[];
  loadingConversations: boolean;
  loadingMessages: boolean;
  loadingMore: boolean;
  hasMoreMessages: boolean;
  error: string | null;

  loadConversations: () => Promise<void>;
  getOrCreateConversation: (targetUserId: string) => Promise<string | null>;
  loadMessages: (conversationId: string) => Promise<void>;
  loadMoreMessages: (conversationId: string) => Promise<void>;
  sendMessage: (
    conversationId: string,
    content?: string,
    attachments?: ChatAttachment[],
  ) => Promise<void>;
  receiveMessage: (message: ChatMessage) => void;
  uploadAndSendAttachment: (
    conversationId: string,
    fileUri: string,
    fileName: string,
    fileType: string,
    fileSize: number,
  ) => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: [],
  loadingConversations: false,
  loadingMessages: false,
  loadingMore: false,
  hasMoreMessages: true,
  error: null,

  loadConversations: async () => {
    set({ loadingConversations: true, error: null });
    try {
      const response = await chatApi.get<Conversation[]>("/api/conversations");
      set({ conversations: response.data || [] });
    } catch (error: any) {
      console.error("Error loading conversations:", error);
      set({ error: error.message || "Error cargando conversaciones" });
    } finally {
      set({ loadingConversations: false });
    }
  },

  getOrCreateConversation: async (targetUserId: string) => {
    try {
      const response = await chatApi.post<Conversation>("/api/conversations", {
        targetUserId,
      });
      return response.data.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  },

  loadMessages: async (conversationId: string) => {
    set({
      loadingMessages: true,
      error: null,
      messages: [],
      hasMoreMessages: true,
    });
    try {
      const response = await chatApi.get<ChatMessage[]>(
        `/api/conversations/${conversationId}/messages?limit=20`,
      );
      // Retain API order or transform? Usually APIs return recent first.
      // If we use inverted FlatList, messages should be ordered freshest at index 0.
      const data = response.data || [];
      set({
        messages: data,
        hasMoreMessages: data.length === 20,
      });
    } catch (error: any) {
      console.error("Error loading messages:", error);
      set({ error: error.message || "Error cargando mensajes" });
    } finally {
      set({ loadingMessages: false });
    }
  },

  loadMoreMessages: async (conversationId: string) => {
    const { messages, loadingMore, hasMoreMessages } = get();
    if (loadingMore || messages.length === 0 || !hasMoreMessages) return;

    set({ loadingMore: true });
    try {
      // The oldest message is usually at the end of the array if newest is first (index 0)
      // Wait, let's assume API returns chronological desc (idx 0 is newest).
      const oldestMessageId = messages[messages.length - 1].id;
      const response = await chatApi.get<ChatMessage[]>(
        `/api/conversations/${conversationId}/messages?limit=20&before=${oldestMessageId}`,
      );

      const newData = response.data || [];
      if (newData.length > 0) {
        set({
          messages: [...messages, ...newData],
          hasMoreMessages: newData.length === 20,
        });
      } else {
        set({ hasMoreMessages: false });
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      set({ loadingMore: false });
    }
  },

  sendMessage: async (conversationId, content, attachments) => {
    try {
      const response = await chatApi.post<ChatMessage>(
        `/api/conversations/${conversationId}/messages`,
        {
          content,
          attachments,
        },
      );
      // Actualización optimista: inyecta el mensaje apenas lo envía la API
      const { receiveMessage } = get();
      receiveMessage(response.data);
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  receiveMessage: (message: ChatMessage) => {
    const { messages } = get();
    const isDuplicate = messages.some((m) => m.id === message.id);
    if (!isDuplicate) {
      // If inverted FlatList, newest is at index 0
      set({ messages: [message, ...messages] });
    }
  },

  uploadAndSendAttachment: async (
    conversationId,
    fileUri,
    fileName,
    fileType,
    fileSize,
  ) => {
    const storagePath = `${conversationId}/${Date.now()}/${fileName}`;

    // Step 1: read file as base64 (fetch(fileUri).blob() fails in React Native)
    let base64: string;
    try {
      base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } catch (e: any) {
      throw new Error(`Error leyendo el archivo local: ${e?.message ?? e}`);
    }

    // Step 2: upload ArrayBuffer to Supabase Storage
    try {
      const { error } = await supabase.storage
        .from("dm-attachments")
        .upload(storagePath, decode(base64), {
          contentType: fileType,
        });
      if (error) {
        throw new Error(`Error subiendo a Supabase Storage: ${error.message}`);
      }
    } catch (e: any) {
      throw new Error(e?.message ?? `Error en la subida a Storage`);
    }

    // Step 3: notify the chat microservice with the attachment metadata
    try {
      await get().sendMessage(conversationId, undefined, [
        { fileName, fileType, fileSize, storagePath },
      ]);
    } catch (e: any) {
      throw new Error(`Archivo subido pero falló el envío al microservicio: ${e?.message ?? e}`);
    }
  },

  clearMessages: () => set({ messages: [] }),
}));
