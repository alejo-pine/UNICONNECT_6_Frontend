import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useChatStore } from "../../../store/chatStore";
import { useWallStore } from "../../../store/wallStore";
import { WallInboxItem } from "../../wall-chat/components/WallInboxItem";
import { ConversationItem } from "../components/ConversationItem";

type Tab = "dm" | "groups";

export const InboxScreen: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("dm");

  const { conversations, loadingConversations, loadConversations, error: dmError } =
    useChatStore();
  const { walls, loadingWalls, loadWalls } = useWallStore();

  useEffect(() => {
    loadConversations();
    loadWalls();
  }, [loadConversations, loadWalls]);

  const handleRefresh = useCallback(() => {
    if (activeTab === "dm") {
      loadConversations();
    } else {
      loadWalls();
    }
  }, [activeTab, loadConversations, loadWalls]);

  const handlePressConversation = (
    conversationId: string,
    partnerName?: string,
    partnerAvatar?: string,
  ) => {
    router.push({
      pathname: `/chat/${conversationId}` as any,
      params: {
        partnerName: partnerName || "Usuario",
        partnerAvatar: partnerAvatar || "",
      },
    });
  };

  const handlePressWall = (groupId: string, groupName: string) => {
    router.push(
      `/study-groups/wall?groupId=${groupId}&groupName=${encodeURIComponent(groupName)}` as any,
    );
  };

  const isRefreshing = activeTab === "dm" ? loadingConversations : loadingWalls;

  const renderDmTab = () => {
    if (loadingConversations && conversations.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00284D" />
          <Text style={styles.stateText}>Cargando mensajes...</Text>
        </View>
      );
    }
    if (dmError && conversations.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#94A3B8" />
          <Text style={styles.errorText}>{dmError}</Text>
        </View>
      );
    }
    if (!loadingConversations && conversations.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="chatbox-ellipses-outline" size={64} color="#94A3B8" />
          <Text style={styles.stateText}>No tienes conversaciones activas</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationItem
            conversation={item}
            onPress={() =>
              handlePressConversation(
                item.id,
                item.otherParticipant?.name,
                item.otherParticipant?.avatarUrl,
              )
            }
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#00284D"
          />
        }
        contentContainerStyle={styles.listContent}
      />
    );
  };

  const renderGroupsTab = () => {
    if (loadingWalls && walls.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00284D" />
          <Text style={styles.stateText}>Cargando muros...</Text>
        </View>
      );
    }
    if (!loadingWalls && walls.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="people-circle-outline" size={64} color="#94A3B8" />
          <Text style={styles.stateText}>No perteneces a ningún grupo aún</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={walls}
        keyExtractor={(item) => item.groupId}
        renderItem={({ item }) => (
          <WallInboxItem
            item={item}
            onPress={() => handlePressWall(item.groupId, item.groupName)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#00284D"
          />
        }
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "dm" && styles.tabActive]}
          onPress={() => setActiveTab("dm")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === "dm" && styles.tabTextActive]}>
            Directos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "groups" && styles.tabActive]}
          onPress={() => setActiveTab("groups")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === "groups" && styles.tabTextActive]}>
            Grupos
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "dm" ? renderDmTab() : renderGroupsTab()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#00284D",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
  },
  tabTextActive: {
    color: "#00284D",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 32,
  },
  stateText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748B",
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 24,
  },
});
