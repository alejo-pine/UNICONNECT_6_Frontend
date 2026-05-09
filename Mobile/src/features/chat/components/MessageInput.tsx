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
}

export const MessageInput: React.FC<Props> = ({ onSend, isSending }) => {
  const [text, setText] = useState("");
  const [file, setFile] = useState<AttachmentFile | null>(null);

  const handleSend = () => {
    if (text.trim() || file) {
      onSend(text.trim(), file || undefined);
      setText("");
      setFile(null);
    }
  };

  const hasContent = text.trim().length > 0 || file !== null;

  return (
    <View style={styles.wrapper}>
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
        <AttachmentButton onAttach={setFile} disabled={isSending} />

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#94A3B8"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            editable={!isSending}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!hasContent || isSending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!hasContent || isSending}
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
    paddingBottom: 24, // Safe area for newer phones without standard layout
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
  input: {
    flex: 1,
    fontSize: 16,
    color: "#0F172A",
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 48,
  },
  emojiButton: {
    marginLeft: 8,
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
