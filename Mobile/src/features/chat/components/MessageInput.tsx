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
  ruleExplanation?: string | null;
  escalated?: boolean;
}

export const MessageInput: React.FC<Props> = ({
  onSend,
  isSending,
  moderationMessage,
  isBlocked = false,
  onTyping,
  ruleExplanation,
  escalated = false,
}) => {
  const [text, setText] = useState("");
  const [file, setFile] = useState<AttachmentFile | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);

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
          {/* Main message row */}
          <View style={styles.moderationRow}>
            <Ionicons
              name={isBlocked ? "time-outline" : "alert-circle-outline"}
              size={14}
              color={isBlocked ? "#92400E" : "#991B1B"}
              style={styles.moderationIcon}
            />
            <Text style={[styles.moderationText, isBlocked ? styles.moderationTextSpam : styles.moderationTextError]}>
              {moderationMessage}
            </Text>
            {ruleExplanation ? (
              <TouchableOpacity onPress={() => setWhyOpen((v) => !v)} style={styles.whyButton}>
                <Text style={[styles.whyText, isBlocked ? styles.moderationTextSpam : styles.moderationTextError]}>
                  ¿Por qué?
                </Text>
                <Ionicons
                  name={whyOpen ? "chevron-up" : "chevron-down"}
                  size={11}
                  color={isBlocked ? "#92400E" : "#991B1B"}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Rule explanation — collapsible */}
          {whyOpen && ruleExplanation ? (
            <Text style={[styles.ruleExplanation, isBlocked ? styles.moderationTextSpam : styles.moderationTextError]}>
              {ruleExplanation}
            </Text>
          ) : null}

          {/* Escalation notice */}
          {escalated ? (
            <View style={styles.escalationRow}>
              <Ionicons name="shield-half-outline" size={12} color="#92400E" style={{ marginTop: 1, marginRight: 4 }} />
              <Text style={styles.escalationText}>
                Tu caso fue escalado a revisión humana. Un administrador lo revisará pronto.
              </Text>
            </View>
          ) : null}
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  moderationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
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
  whyButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 6,
    flexShrink: 0,
    gap: 2,
  },
  whyText: {
    fontSize: 11,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  ruleExplanation: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#FDE68A",
    opacity: 0.9,
  },
  escalationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#FDE68A",
  },
  escalationText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "500",
    color: "#92400E",
    lineHeight: 16,
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
