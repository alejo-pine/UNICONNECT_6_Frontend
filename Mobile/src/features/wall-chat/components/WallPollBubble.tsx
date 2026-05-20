import React from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { Poll } from "../types/wall.types";

interface Props {
  poll: Poll;
  isOwnPost: boolean;
  onVote: (pollId: string, optionId: string) => void;
  onClose?: (pollId: string) => void;
}

export const WallPollBubble: React.FC<Props> = ({ poll, isOwnPost, onVote, onClose }) => {
  const hasVoted = poll.options.some((o) => o.votedByMe);
  const locked = poll.closed;
  const showResults = locked || hasVoted || poll.totalVotes > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>📊</Text>
        <Text style={styles.headerLabel}>
          {poll.closed ? "Encuesta cerrada" : "Encuesta"}
        </Text>
      </View>

      <Text style={[styles.question, isOwnPost && styles.questionOwn]}>
        {poll.question}
      </Text>

      <View style={styles.optionsContainer}>
        {poll.options.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            onPress={() => {
              if (hasVoted) {
                Alert.alert('Voto no permitido', 'Ya registraste tu voto en esta encuesta.');
                return;
              }
              if (!locked) onVote(poll.id, opt.id);
            }}
            disabled={locked}
            activeOpacity={locked ? 1 : 0.7}
            style={[
              styles.optionButton,
              isOwnPost ? styles.optionButtonOwn : styles.optionButtonPartner,
              opt.votedByMe && styles.optionButtonVoted,
            ]}
          >
            {/* Progress bar behind option */}
            {showResults && (
              <View
                style={[
                  styles.progressBar,
                  isOwnPost ? styles.progressBarOwn : styles.progressBarPartner,
                  { width: `${opt.percentage}%` },
                ]}
              />
            )}
            <View style={styles.optionRow}>
              <Text
                style={[
                  styles.optionText,
                  isOwnPost ? styles.optionTextOwn : styles.optionTextPartner,
                  opt.votedByMe && styles.optionTextVoted,
                ]}
                numberOfLines={2}
              >
                {opt.text}
              </Text>
              {showResults && (
                <Text
                  style={[
                    styles.percentage,
                    isOwnPost ? styles.percentageOwn : styles.percentagePartner,
                  ]}
                >
                  {opt.percentage}%
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.totalVotes, isOwnPost && styles.totalVotesOwn]}>
          {poll.totalVotes} {poll.totalVotes === 1 ? "voto" : "votos"}
        </Text>
        {onClose && !poll.closed && isOwnPost && (
          <TouchableOpacity onPress={() => onClose(poll.id)} activeOpacity={0.7}>
            <Text style={styles.closeButton}>Cerrar encuesta</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 4,
  },
  headerIcon: {
    fontSize: 13,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#C5A059",
  },
  question: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 10,
  },
  questionOwn: {
    color: "#FFFFFF",
  },
  optionsContainer: {
    gap: 6,
  },
  optionButton: {
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  optionButtonOwn: {
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  optionButtonPartner: {
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  optionButtonVoted: {
    borderColor: "#C5A059",
  },
  progressBar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 10,
  },
  progressBarOwn: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  progressBarPartner: {
    backgroundColor: "#EDE9FE",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionText: {
    fontSize: 13,
    flex: 1,
  },
  optionTextOwn: {
    color: "#FFFFFF",
  },
  optionTextPartner: {
    color: "#0F172A",
  },
  optionTextVoted: {
    fontWeight: "600",
  },
  percentage: {
    fontSize: 12,
    marginLeft: 8,
    minWidth: 32,
    textAlign: "right",
  },
  percentageOwn: {
    color: "rgba(255,255,255,0.7)",
  },
  percentagePartner: {
    color: "#64748B",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  totalVotes: {
    fontSize: 11,
    color: "#94A3B8",
  },
  totalVotesOwn: {
    color: "rgba(255,255,255,0.5)",
  },
  closeButton: {
    fontSize: 11,
    color: "#94A3B8",
    textDecorationLine: "underline",
  },
});
