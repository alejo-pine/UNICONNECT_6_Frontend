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
}

const DURATION_OPTIONS = [
  { label: "5 min", value: 5 },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 h", value: 60 },
  { label: "2 h", value: 120 },
  { label: "24 h", value: 1440 },
];

export const WallInput: React.FC<Props> = ({ onSend, onSendPoll, isSending }) => {
  const [text, setText] = useState("");
  const [file, setFile] = useState<AttachmentFile | null>(null);

  // Poll modal state
  const [pollModalVisible, setPollModalVisible] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollDuration, setPollDuration] = useState(15);
  const [pollError, setPollError] = useState<string | null>(null);
  const [sendingPoll, setSendingPoll] = useState(false);

  const handleSend = () => {
    if (text.trim() || file) {
      onSend(text.trim(), file || undefined);
      setText("");
      setFile(null);
    }
  };

  const hasContent = text.trim().length > 0 || file !== null;

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
          <AttachmentButton onAttach={setFile} disabled={isSending} />

          {onSendPoll && (
            <TouchableOpacity
              onPress={openPollModal}
              disabled={isSending}
              style={styles.pollButton}
            >
              <Ionicons name="bar-chart-outline" size={22} color={isSending ? "#CBD5E1" : "#64748B"} />
            </TouchableOpacity>
          )}

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Escribe una publicación..."
              placeholderTextColor="#94A3B8"
              value={text}
              onChangeText={setText}
              multiline
              maxLength={1000}
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
