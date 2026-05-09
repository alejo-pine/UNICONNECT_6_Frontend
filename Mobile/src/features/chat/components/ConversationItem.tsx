import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Conversation } from "../types/chat.types";

interface Props {
  conversation: Conversation;
  onPress: () => void;
}

export const ConversationItem: React.FC<Props> = ({
  conversation,
  onPress,
}) => {
  const { otherParticipant } = conversation;

  const formattedDate = new Date(conversation.createdAt).toLocaleDateString(
    [],
    {
      month: "short",
      day: "numeric",
    },
  );

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {otherParticipant.avatarUrl ? (
        <Image source={{ uri: otherParticipant.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={24} color="#FFFFFF" />
        </View>
      )}
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {otherParticipant.name || "Usuario Uniconnect"}
        </Text>
        <Text style={styles.date}>{formattedDate}</Text>
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
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E2E8F0",
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#00284D",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  date: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
});
