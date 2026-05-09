import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { WallInboxEntry } from "../types/wall.types";

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `hace ${days}d`;
  return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric" });
}

interface Props {
  item: WallInboxEntry;
  onPress: () => void;
}

export const WallInboxItem: React.FC<Props> = ({ item, onPress }) => {
  const hasPost = item.lastPost !== null;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconBox}>
        <Ionicons name="chatbubbles" size={22} color="#FFFFFF" />
      </View>
      <View style={styles.infoContainer}>
        <View style={styles.topRow}>
          <Text style={styles.groupName} numberOfLines={1}>
            {item.groupName}
          </Text>
          {hasPost && (
            <Text style={styles.time}>
              {formatRelativeTime(item.lastPost!.createdAt)}
            </Text>
          )}
        </View>
        {hasPost ? (
          <Text style={styles.preview} numberOfLines={1}>
            <Text style={styles.senderName}>{item.lastPost!.senderName}: </Text>
            {item.lastPost!.content || "📎 Adjunto"}
          </Text>
        ) : (
          <Text style={styles.emptyPreview}>Sin publicaciones aún</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#00284D",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  groupName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: "#94A3B8",
    flexShrink: 0,
  },
  preview: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },
  senderName: {
    fontWeight: "600",
    color: "#475569",
  },
  emptyPreview: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 4,
    fontStyle: "italic",
  },
});
