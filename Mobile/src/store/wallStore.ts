import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import { create } from "zustand";
import { wallHttpService } from "../features/wall-chat/services/wallHttpService";
import type { WallInboxEntry, WallPost, WallPostAttachment } from "../features/wall-chat/types/wall.types";
import { supabase } from "../services/supabase";

interface WallState {
  posts: WallPost[];
  loadingPosts: boolean;
  loadingMore: boolean;
  hasMorePosts: boolean;
  error: string | null;

  walls: WallInboxEntry[];
  loadingWalls: boolean;

  loadPosts: (groupId: string) => Promise<void>;
  loadMorePosts: (groupId: string) => Promise<void>;
  sendPost: (
    groupId: string,
    content?: string,
    attachments?: WallPostAttachment[],
  ) => Promise<void>;
  receivePost: (post: WallPost) => void;
  uploadAndSendPost: (
    groupId: string,
    fileUri: string,
    fileName: string,
    fileType: string,
    fileSize: number,
  ) => Promise<void>;
  clearPosts: () => void;
  loadWalls: () => Promise<void>;
}

export const useWallStore = create<WallState>((set, get) => ({
  posts: [],
  loadingPosts: false,
  loadingMore: false,
  hasMorePosts: true,
  error: null,

  walls: [],
  loadingWalls: false,

  loadPosts: async (groupId) => {
    set({ loadingPosts: true, error: null, posts: [], hasMorePosts: true });
    try {
      const data = await wallHttpService.getPosts(groupId, 20);
      set({ posts: data, hasMorePosts: data.length === 20 });
    } catch (e: any) {
      set({ error: e?.message || "Error cargando publicaciones" });
    } finally {
      set({ loadingPosts: false });
    }
  },

  loadMorePosts: async (groupId) => {
    const { posts, loadingMore, hasMorePosts } = get();
    if (loadingMore || posts.length === 0 || !hasMorePosts) return;
    set({ loadingMore: true });
    try {
      const oldestId = posts[posts.length - 1].id;
      const newData = await wallHttpService.getPosts(groupId, 20, oldestId);
      if (newData.length > 0) {
        set({
          posts: [...posts, ...newData],
          hasMorePosts: newData.length === 20,
        });
      } else {
        set({ hasMorePosts: false });
      }
    } catch (e) {
      console.error("Error loading more posts:", e);
    } finally {
      set({ loadingMore: false });
    }
  },

  sendPost: async (groupId, content, attachments) => {
    try {
      const post = await wallHttpService.createPost(groupId, content, attachments);
      get().receivePost(post);
    } catch (e) {
      console.error("Error sending post:", e);
      throw e;
    }
  },

  receivePost: (post) => {
    const { posts } = get();
    const isDuplicate = posts.some((p) => p.id === post.id);
    if (!isDuplicate) {
      set({ posts: [post, ...posts] });
    }
  },

  uploadAndSendPost: async (groupId, fileUri, fileName, fileType, fileSize) => {
    const storagePath = `${groupId}/${Date.now()}/${fileName}`;

    let base64: string;
    try {
      base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } catch (e: any) {
      throw new Error(`Error leyendo el archivo local: ${e?.message ?? e}`);
    }

    try {
      const { error } = await supabase.storage
        .from("wall-attachments")
        .upload(storagePath, decode(base64), { contentType: fileType });
      if (error) {
        throw new Error(`Error subiendo a Supabase Storage: ${error.message}`);
      }
    } catch (e: any) {
      throw new Error(e?.message ?? "Error en la subida a Storage");
    }

    try {
      await get().sendPost(groupId, undefined, [
        { fileName, fileType, fileSize, storagePath },
      ]);
    } catch (e: any) {
      throw new Error(
        `Archivo subido pero falló el envío al microservicio: ${e?.message ?? e}`,
      );
    }
  },

  clearPosts: () => set({ posts: [] }),

  loadWalls: async () => {
    set({ loadingWalls: true });
    try {
      const data = await wallHttpService.getWalls();
      set({ walls: data });
    } catch (e) {
      console.error("Error loading walls:", e);
    } finally {
      set({ loadingWalls: false });
    }
  },
}));
