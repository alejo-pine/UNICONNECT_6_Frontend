import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import chatApi from "../../../services/chatApi";
import { MessageBubble } from "../components/MessageBubble";
import { MessageInput } from "../components/MessageInput";
import { useChat } from "../hooks/useChat";
import {
  extractModerationError,
  useModerationFeedback,
} from "../hooks/useModerationFeedback";

export const ChatScreen: React.FC = () => {
  const router = useRouter();
  const { conversationId, partnerName, partnerAvatar } = useLocalSearchParams<{
    conversationId: string;
    partnerName?: string;
    partnerAvatar?: string;
  }>();
  const insets = useSafeAreaInsets();

  const {
    messages,
    loadingMessages,
    loadingMore,
    hasMoreMessages,
    error,
    loadMoreMessages,
    sendMessage,
    uploadAndSendAttachment,
    userId,
  } = useChat(conversationId);

  const [isSending, setIsSending] = useState(false);
  const { isBlocked, displayMessage, handleModerationError, clearError } =
    useModerationFeedback();

  const handleSend = async (content?: string, file?: any) => {
    if (!conversationId || isBlocked) return;
    setIsSending(true);
    clearError();
    try {
      if (file) {
        await uploadAndSendAttachment(
          conversationId,
          file.uri,
          file.name,
          file.mimeType,
          file.size,
        );
      } else if (content) {
        await sendMessage(conversationId, content);
      }
    } catch (e) {
      const { code, detail } = extractModerationError(e);
      if (code) {
        handleModerationError(code, detail);
      } else {
        console.error("Failed to send:", e);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachmentPress = async (attachment: any) => {
    try {
      const response = await chatApi.get(
        `/api/attachments/dm/${attachment.id}/url`,
      );
      if (response.data.url) {
        await WebBrowser.openBrowserAsync(response.data.url);
      }
    } catch (e) {
      console.error("Failed to open attachment:", e);
    }
  };

  const handleEndReached = () => {
    if (conversationId && hasMoreMessages && !loadingMore && !loadingMessages) {
      loadMoreMessages(conversationId);
    }
  };

  const Container = KeyboardAvoidingView;
  const containerProps = {
    behavior: "padding" as const,
    keyboardVerticalOffset: 0,
  };

  return (
    <Container style={styles.mainContainer} {...containerProps}>
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top > 0 ? insets.top + 8 : 48, 48) },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {partnerAvatar ? (
            <Image
              source={{ uri: partnerAvatar }}
              style={styles.avatarPlaceholder}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color="#00284D" />
            </View>
          )}
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {partnerName || "Chat"}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="call" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.container}>
        {loadingMessages && messages.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#00284D" />
          </View>
        ) : error && messages.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item, index) => String(item.id || index)}
            inverted
            shouldRasterizeIOS={true}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isOwnMessage={item.senderId === userId}
                onAttachmentPress={handleAttachmentPress}
              />
            )}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.2}
            contentContainerStyle={{ paddingVertical: 10 }}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator
                  style={styles.loadingMore}
                  size="small"
                  color="#00284D"
                />
              ) : null
            }
          />
        )}
        <MessageInput
          onSend={handleSend}
          isSending={isSending}
          moderationMessage={displayMessage}
          isBlocked={isBlocked}
          onTyping={clearError}
        />
      </View>
    </Container>
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
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
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
  headerSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#EF4444",
  },
  loadingMore: {
    marginVertical: 16,
  },
});
