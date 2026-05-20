import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { WallPost, WallPostAttachment } from "../types/wall.types";
import { WallPollBubble } from "./WallPollBubble";

function getFileIconConfig(mimeType: string): {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  bgColor: string;
  iconColor: string;
} {
  if (mimeType?.startsWith("image/")) {
    return { icon: "image", bgColor: "#DCFCE7", iconColor: "#16A34A" };
  }
  if (mimeType === "application/pdf") {
    return { icon: "file-pdf-box", bgColor: "#FEE2E2", iconColor: "#DC2626" };
  }
  if (mimeType?.includes("excel") || mimeType?.includes("spreadsheet")) {
    return { icon: "microsoft-excel", bgColor: "#D1FAE5", iconColor: "#059669" };
  }
  return { icon: "file-document-outline", bgColor: "#E2E8F0", iconColor: "#475569" };
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fallbackSenderLabel(senderId: string): string {
  return senderId ? `@${senderId.slice(0, 8)}` : "Miembro";
}

function displaySenderName(post: WallPost): string {
  const name = post.senderName?.trim();
  if (name) return name;
  return fallbackSenderLabel(post.senderId);
}

interface Props {
  post: WallPost;
  isOwnPost: boolean;
  onAttachmentPress: (attachment: WallPostAttachment) => void;
  onPollVote?: (pollId: string, optionId: string) => void;
  onPollClose?: (pollId: string) => void;
}

export const WallPostBubble: React.FC<Props> = ({
  post,
  isOwnPost,
  onAttachmentPress,
  onPollVote,
  onPollClose,
}) => {
  const senderLabel = displaySenderName(post);
  const time = new Date(post.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View
      style={[
        styles.container,
        isOwnPost ? styles.ownContainer : styles.partnerContainer,
      ]}
    >
      <View style={isOwnPost ? styles.ownBubble : styles.partnerBubble}>
        <Text
          style={[styles.senderLabel, isOwnPost && styles.senderLabelOwn]}
          numberOfLines={1}
        >
          {senderLabel}
        </Text>

        {/* No mostrar content en posts de encuesta (el backend lo llena con la pregunta) */}
        {post.content && !post.poll ? (
          <Text style={isOwnPost ? styles.ownText : styles.partnerText}>
            {post.content}
          </Text>
        ) : null}

        {post.attachments && post.attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            {post.attachments.map((att, index) => {
              const { icon, bgColor, iconColor } = getFileIconConfig(att.fileType);
              const sizeLabel = formatFileSize(att.fileSize);
              return (
                <TouchableOpacity
                  key={att.id || index}
                  style={[
                    styles.attachmentChip,
                    isOwnPost ? styles.ownChip : styles.partnerChip,
                  ]}
                  onPress={() => onAttachmentPress(att)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.chipIconBox, { backgroundColor: bgColor }]}>
                    <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
                  </View>
                  <View style={styles.chipTextBox}>
                    <Text
                      style={[
                        styles.chipFileName,
                        isOwnPost ? styles.ownAttachmentText : styles.partnerAttachmentText,
                      ]}
                      numberOfLines={1}
                    >
                      {att.fileName}
                    </Text>
                    {sizeLabel ? (
                      <Text style={styles.chipFileSize}>{sizeLabel}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {post.poll && onPollVote && (
          <WallPollBubble
            poll={post.poll}
            isOwnPost={isOwnPost}
            onVote={onPollVote}
            onClose={onPollClose}
          />
        )}

        <Text
          style={[
            styles.timeText,
            isOwnPost ? styles.ownTimeText : styles.partnerTimeText,
          ]}
        >
          {time}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 16,
    flexDirection: "row",
  },
  ownContainer: {
    justifyContent: "flex-end",
  },
  partnerContainer: {
    justifyContent: "flex-start",
  },
  ownBubble: {
    backgroundColor: "#00284D",
    borderRadius: 20,
    borderBottomRightRadius: 4,
    padding: 12,
    paddingHorizontal: 16,
    maxWidth: "85%",
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  partnerBubble: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    padding: 12,
    paddingHorizontal: 16,
    maxWidth: "85%",
    minWidth: 180,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  senderLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#C5A059",
    marginBottom: 4,
  },
  senderLabelOwn: {
    color: "rgba(255, 255, 255, 0.85)",
  },
  ownText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 22,
  },
  partnerText: {
    color: "#0F172A",
    fontSize: 15,
    lineHeight: 22,
  },
  timeText: {
    fontSize: 11,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  ownTimeText: {
    color: "rgba(255,255,255,0.6)",
  },
  partnerTimeText: {
    color: "#94A3B8",
  },
  attachmentsContainer: {
    marginTop: 6,
    gap: 4,
  },
  attachmentChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignSelf: "stretch",
  },
  ownChip: {
    backgroundColor: "rgba(255,255,255,0.13)",
  },
  partnerChip: {
    backgroundColor: "#F1F5F9",
  },
  chipIconBox: {
    width: 32,
    height: 32,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    flexShrink: 0,
  },
  chipTextBox: {
    flex: 1,
    minWidth: 0,
  },
  chipFileName: {
    fontSize: 13,
    fontWeight: "500",
  },
  chipFileSize: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1,
  },
  ownAttachmentText: {
    color: "#FFFFFF",
  },
  partnerAttachmentText: {
    color: "#0F172A",
  },
});
