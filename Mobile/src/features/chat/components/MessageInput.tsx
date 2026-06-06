import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AttachmentButton } from "./AttachmentButton";

interface AttachmentFile {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

interface Props {
  onSend: (text: string, file?: AttachmentFile) => void;
  isSending: boolean;
  moderationMessage?: string | null;
  isBlocked?: boolean;
  onTyping?: () => void;
}

export const MessageInput: React.FC<Props> = ({
  onSend,
  isSending,
  moderationMessage,
  isBlocked = false,
  onTyping,
}) => {
  const [text, setText] = useState("");
  const [file, setFile] = useState<AttachmentFile | null>(null);

  const handleSend = () => {
    if ((text.trim() || file) && !isBlocked) {
      onSend(text.trim(), file || undefined);
      setText("");
      setFile(null);
    }
  };

  const hasContent = text.trim().length > 0 || file !== null;
  const inputDisabled = isSending || isBlocked;

  return (
    <View style={styles.wrapper}>
      {moderationMessage ? (
        <View
          style={[
            styles.moderationBanner,
            isBlocked ? styles.moderationBannerSpam : styles.moderationBannerError,
          ]}
        >
          <Ionicons
            name={isBlocked ? "time-outline" : "alert-circle-outline"}
            size={14}
            color={isBlocked ? "#92400E" : "#991B1B"}
            style={styles.moderationIcon}
          />
          <Text style={[styles.moderationText, isBlocked ? styles.moderationTextSpam : styles.moderationTextError]}>
            {moderationMessage}
          </Text>
        </View>
      ) : null}

      {file && (
        <View style={styles.attachmentPreview}>
          <Ionicons name="document-attach" size={16} color="#00284D" />
          <Text style={styles.attachmentName} numberOfLines={1}>
            {file.name}
          </Text>
          <TouchableOpacity
            onPress={() => setFile(null)}
            style={styles.removeButton}
          >
            <Ionicons name="close-circle" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.container}>
        <AttachmentButton onAttach={setFile} disabled={inputDisabled} />

        <View style={[styles.inputWrapper, inputDisabled && styles.inputWrapperDisabled]}>
          <TextInput
            style={styles.input}
            placeholder={isBlocked ? "Espera antes de escribir de nuevo…" : "Escribe un mensaje..."}
            placeholderTextColor="#94A3B8"
            value={text}
            onChangeText={(val) => { setText(val); onTyping?.(); }}
            multiline
            maxLength={1000}
            editable={!inputDisabled}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!hasContent || inputDisabled) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!hasContent || inputDisabled}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons
              name="send"
              size={20}
              color="#FFFFFF"
              style={styles.sendIcon}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 10,
    paddingBottom: 24,
  },
  moderationBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  moderationBannerError: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  moderationBannerSpam: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  moderationIcon: {
    marginTop: 1,
    marginRight: 6,
    flexShrink: 0,
  },
  moderationText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  moderationTextError: {
    color: "#991B1B",
  },
  moderationTextSpam: {
    color: "#92400E",
  },
  attachmentPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E2E8F0",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    marginHorizontal: 8,
  },
  attachmentName: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: "#0F172A",
  },
  removeButton: {
    marginLeft: 8,
  },
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 24,
    marginHorizontal: 8,
    paddingHorizontal: 16,
    minHeight: 48,
    maxHeight: 120,
  },
  inputWrapperDisabled: {
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#0F172A",
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 48,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#00284D",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#94A3B8",
  },
  sendIcon: {
    marginLeft: 4,
  },
});
