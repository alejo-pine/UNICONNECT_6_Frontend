import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ChatAttachment, ChatMessage } from "../types/chat.types";

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

interface Props {
  message: ChatMessage;
  isOwnMessage: boolean;
  onAttachmentPress: (attachment: ChatAttachment) => void;
}

export const MessageBubble: React.FC<Props> = ({
  message,
  isOwnMessage,
  onAttachmentPress,
}) => {
  const containerStyle = isOwnMessage ? styles.ownBubble : styles.partnerBubble;
  const textStyle = isOwnMessage ? styles.ownText : styles.partnerText;

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.ownContainer : styles.partnerContainer,
      ]}
    >
      <View style={containerStyle}>
        {message.content ? (
          <Text style={textStyle}>{message.content}</Text>
        ) : null}

        {message.attachments && message.attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            {message.attachments.map((att, index) => {
              const { icon, bgColor, iconColor } = getFileIconConfig(att.fileType);
              const sizeLabel = formatFileSize(att.fileSize);
              return (
                <TouchableOpacity
                  key={att.id || index}
                  style={[
                    styles.attachmentChip,
                    isOwnMessage ? styles.ownChip : styles.partnerChip,
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
                        isOwnMessage ? styles.ownAttachmentText : styles.partnerAttachmentText,
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

        <View style={styles.timeContainer}>
          <Text
            style={[
              styles.timeText,
              isOwnMessage ? styles.ownTimeText : styles.partnerTimeText,
            ]}
          >
            {time}
          </Text>
          {isOwnMessage && (
            <Ionicons
              name="checkmark-done"
              size={14}
              color="#60A5FA"
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
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
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
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
