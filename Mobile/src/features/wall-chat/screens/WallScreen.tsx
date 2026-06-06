import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWall } from "../hooks/useWall";
import { wallHttpService } from "../services/wallHttpService";
import { useWallStore } from "../../../store/wallStore";
import {
  extractModerationError,
  useModerationFeedback,
} from "../../chat/hooks/useModerationFeedback";
import type { WallPostAttachment } from "../types/wall.types";
import { WallInput } from "../components/WallInput";
import { WallPostBubble } from "../components/WallPostBubble";

export const WallScreen: React.FC = () => {
  const router = useRouter();
  const { groupId, groupName } = useLocalSearchParams<{
    groupId: string;
    groupName?: string;
  }>();
  const insets = useSafeAreaInsets();

  const {
    posts,
    loadingPosts,
    loadingMore,
    hasMorePosts,
    error,
    loadMorePosts,
    sendPost,
    createPoll,
    uploadAndSendPost,
    userId,
  } = useWall(groupId);

  const { updatePoll } = useWallStore();

  const [isSending, setIsSending] = useState(false);
  const { isBlocked, displayMessage, handleModerationError, clearError } =
    useModerationFeedback();

  const resolvedGroupName = groupName ? decodeURIComponent(groupName) : "Muro del Grupo";

  const handleSend = async (content?: string, file?: any) => {
    if (!groupId || isBlocked) return;
    setIsSending(true);
    clearError();
    try {
      if (file) {
        await uploadAndSendPost(groupId, file.uri, file.name, file.mimeType, file.size);
      } else if (content) {
        await sendPost(groupId, content);
      }
    } catch (e) {
      const { code, detail } = extractModerationError(e);
      if (code) {
        handleModerationError(code, detail);
      } else {
        console.error("Failed to send post:", e);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleSendPoll = async ({
    question,
    options,
    durationMinutes,
  }: {
    question: string;
    options: string[];
    durationMinutes: number;
  }) => {
    if (!groupId) return;
    await createPoll(groupId, question, options, durationMinutes);
  };

  const handleAttachmentPress = async (attachment: WallPostAttachment) => {
    if (!attachment.id) return;
    try {
      const url = await wallHttpService.getAttachmentUrl(attachment.id);
      if (url) await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      console.error("Failed to open attachment:", e);
    }
  };

  const handlePollVote = async (pollId: string, optionId: string) => {
    try {
      const poll = await wallHttpService.votePoll(pollId, optionId);
      updatePoll(poll);
    } catch (e) {
      console.error("Failed to vote:", e);
    }
  };

  const handlePollClose = async (pollId: string) => {
    try {
      const poll = await wallHttpService.closePoll(pollId);
      updatePoll(poll);
    } catch (e) {
      console.error("Failed to close poll:", e);
    }
  };

  const handleEndReached = () => {
    if (groupId && hasMorePosts && !loadingMore && !loadingPosts) {
      loadMorePosts(groupId);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.mainContainer}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top > 0 ? insets.top + 8 : 48, 48) },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {resolvedGroupName}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.container}>
        {loadingPosts && posts.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#00284D" />
          </View>
        ) : error && posts.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>Aún no hay publicaciones.</Text>
            <Text style={styles.emptySubText}>¡Sé el primero en publicar!</Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item, index) => String(item.id || index)}
            inverted
            shouldRasterizeIOS={true}
            extraData={posts}
            renderItem={({ item }) => (
              <WallPostBubble
                post={item}
                isOwnPost={item.senderId === userId}
                onAttachmentPress={handleAttachmentPress}
                onPollVote={handlePollVote}
                onPollClose={item.senderId === userId ? handlePollClose : undefined}
              />
            )}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.2}
            contentContainerStyle={{ paddingVertical: 10 }}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator style={styles.loadingMore} size="small" color="#00284D" />
              ) : null
            }
          />
        )}
        <WallInput
          onSend={handleSend}
          onSendPoll={handleSendPoll}
          isSending={isSending}
          moderationMessage={displayMessage}
          isBlocked={isBlocked}
          onTyping={clearError}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#002147",
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    color: "#EF4444",
    textAlign: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
  },
  emptySubText: {
    marginTop: 4,
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
  },
  loadingMore: {
    marginVertical: 16,
  },
});
