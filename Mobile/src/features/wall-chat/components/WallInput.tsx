import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AttachmentButton } from "../../chat/components/AttachmentButton";

interface AttachmentFile {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

interface PollPayload {
  question: string;
  options: string[];
  durationMinutes: number;
}

interface Props {
  onSend: (text: string, file?: AttachmentFile) => void;
  onSendPoll?: (payload: PollPayload) => Promise<void>;
  isSending: boolean;
  moderationMessage?: string | null;
  isBlocked?: boolean;
  onTyping?: () => void;
  ruleExplanation?: string | null;
  escalated?: boolean;
}

const DURATION_OPTIONS = [
  { label: "5 min", value: 5 },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 h", value: 60 },
  { label: "2 h", value: 120 },
  { label: "24 h", value: 1440 },
];

export const WallInput: React.FC<Props> = ({
  onSend,
  onSendPoll,
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

  // Poll modal state
  const [pollModalVisible, setPollModalVisible] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollDuration, setPollDuration] = useState(15);
  const [pollError, setPollError] = useState<string | null>(null);
  const [sendingPoll, setSendingPoll] = useState(false);

  const handleSend = () => {
    if ((text.trim() || file) && !isBlocked) {
      onSend(text.trim(), file || undefined);
      setText("");
      setFile(null);
    }
  };

  const hasContent = text.trim().length > 0 || file !== null;
  const inputDisabled = isSending || isBlocked;

  // ── Poll modal handlers ────────────────────────────────────────────────

  const openPollModal = () => {
    setPollQuestion("");
    setPollOptions(["", ""]);
    setPollDuration(15);
    setPollError(null);
    setPollModalVisible(true);
  };

  const closePollModal = () => {
    setPollModalVisible(false);
  };

  const setPollOption = (index: number, value: string) => {
    setPollOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const addPollOption = () => {
    if (pollOptions.length >= 5) return;
    setPollOptions((prev) => [...prev, ""]);
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length <= 2) return;
    setPollOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendPoll = async () => {
    if (!onSendPoll) return;

    const question = pollQuestion.trim();
    const validOptions = pollOptions.map((o) => o.trim()).filter(Boolean);

    if (!question) {
      setPollError("La pregunta no puede estar vacía.");
      return;
    }
    if (validOptions.length < 2) {
      setPollError("Debes ingresar al menos 2 opciones.");
      return;
    }

    setSendingPoll(true);
    setPollError(null);

    try {
      await onSendPoll({ question, options: validOptions, durationMinutes: pollDuration });
      closePollModal();
    } catch {
      setPollError("No se pudo publicar la encuesta. Inténtalo de nuevo.");
    } finally {
      setSendingPoll(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Poll creation modal ── */}
      <Modal
        visible={pollModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closePollModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nueva encuesta</Text>
            <TouchableOpacity onPress={closePollModal} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Pregunta</Text>
            <TextInput
              style={styles.questionInput}
              placeholder="¿Cuál es tu pregunta?"
              placeholderTextColor="#94A3B8"
              value={pollQuestion}
              onChangeText={setPollQuestion}
              maxLength={200}
              multiline
            />

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Opciones</Text>
            {pollOptions.map((opt, idx) => (
              <View key={idx} style={styles.optionRow}>
                <TextInput
                  style={styles.optionInput}
                  placeholder={`Opción ${idx + 1}`}
                  placeholderTextColor="#94A3B8"
                  value={opt}
                  onChangeText={(v) => setPollOption(idx, v)}
                  maxLength={100}
                />
                {pollOptions.length > 2 && (
                  <TouchableOpacity
                    onPress={() => removePollOption(idx)}
                    style={styles.removeOptionBtn}
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {pollOptions.length < 5 && (
              <TouchableOpacity onPress={addPollOption} style={styles.addOptionBtn}>
                <Ionicons name="add-circle-outline" size={18} color="#00284D" />
                <Text style={styles.addOptionText}>Agregar opción</Text>
              </TouchableOpacity>
            )}

            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Duración</Text>
            <View style={styles.durationRow}>
              {DURATION_OPTIONS.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  onPress={() => setPollDuration(d.value)}
                  style={[
                    styles.durationChip,
                    pollDuration === d.value && styles.durationChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.durationChipText,
                      pollDuration === d.value && styles.durationChipTextActive,
                    ]}
                  >
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.customDurationRow}>
              <Text style={styles.customDurationLabel}>Personalizado:</Text>
              <TextInput
                style={styles.customDurationInput}
                keyboardType="number-pad"
                value={String(pollDuration)}
                onChangeText={(v) => {
                  const n = parseInt(v, 10);
                  if (!isNaN(n) && n > 0) setPollDuration(n);
                }}
                maxLength={5}
                selectTextOnFocus
              />
              <Text style={styles.customDurationLabel}>min</Text>
            </View>

            {pollError ? (
              <Text style={styles.errorText}>{pollError}</Text>
            ) : null}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.publishButton, sendingPoll && styles.publishButtonDisabled]}
              onPress={() => void handleSendPoll()}
              disabled={sendingPoll}
            >
              {sendingPoll ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.publishButtonText}>Publicar encuesta</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Main input bar ── */}
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
              <Text
                style={[
                  styles.moderationText,
                  isBlocked ? styles.moderationTextSpam : styles.moderationTextError,
                ]}
              >
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
            <TouchableOpacity onPress={() => setFile(null)} style={styles.removeButton}>
              <Ionicons name="close-circle" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.container}>
          <AttachmentButton onAttach={setFile} disabled={inputDisabled} />

          {onSendPoll && (
            <TouchableOpacity
              onPress={openPollModal}
              disabled={inputDisabled}
              style={styles.pollButton}
            >
              <Ionicons name="bar-chart-outline" size={22} color={inputDisabled ? "#CBD5E1" : "#64748B"} />
            </TouchableOpacity>
          )}

          <View style={[styles.inputWrapper, inputDisabled && styles.inputWrapperDisabled]}>
            <TextInput
              style={styles.input}
              placeholder={isBlocked ? "Espera antes de escribir de nuevo…" : "Escribe una publicación..."}
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
              <Ionicons name="send" size={20} color="#FFFFFF" style={styles.sendIcon} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
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
  inputWrapperDisabled: {
    opacity: 0.6,
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
  pollButton: {
    width: 40,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
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
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  questionInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0F172A",
    minHeight: 56,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  optionInput: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0F172A",
  },
  removeOptionBtn: {
    marginLeft: 8,
    padding: 4,
  },
  addOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  addOptionText: {
    fontSize: 13,
    color: "#00284D",
    fontWeight: "500",
  },
  durationRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  durationChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  durationChipActive: {
    borderColor: "#00284D",
    backgroundColor: "#EFF6FF",
  },
  durationChipText: {
    fontSize: 13,
    color: "#64748B",
  },
  durationChipTextActive: {
    color: "#00284D",
    fontWeight: "600",
  },
  customDurationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  customDurationLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  customDurationInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: "#0F172A",
    minWidth: 60,
    textAlign: "center",
  },
  errorText: {
    marginTop: 12,
    fontSize: 13,
    color: "#EF4444",
  },
  modalFooter: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  publishButton: {
    backgroundColor: "#00284D",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  publishButtonDisabled: {
    backgroundColor: "#94A3B8",
  },
  publishButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
