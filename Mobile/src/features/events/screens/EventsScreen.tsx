import { colors } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useEventsFeed } from "../hooks/useEventsFeed";
import type { EventCardSummary } from "../types/events";

const formatDate = (dateValue: string): string => {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const formatTime = (timeValue: string): string => {
  const [hours, minutes] = timeValue.split(":").map((value) => Number(value));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return timeValue;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

const eventFallbackImage = require("@/assets/images/logo-ucaldas.png");

const getEventImageSource = (imageUrl: string | null | undefined) => {
  const normalized = imageUrl?.trim();
  if (normalized) {
    return { uri: normalized };
  }

  return eventFallbackImage;
};

function EventCard({
  event,
  onPress,
}: {
  event: EventCardSummary;
  onPress: (eventId: string) => void;
}) {
  return (
    <View style={styles.card}>
      <Image
        source={getEventImageSource(event.image_url)}
        style={styles.cardImage}
        contentFit="cover"
        transition={120}
      />

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{event.title}</Text>
        <Text style={styles.cardFaculty}>
          {event.faculty || "Facultad no disponible"}
        </Text>

        <Text style={styles.cardDescription} numberOfLines={3}>
          {event.description || "Sin descripción disponible."}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.gold} />
          <Text style={styles.metaText}>{formatDate(event.event_date)}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color={colors.gold} />
          <Text style={styles.metaText}>{formatTime(event.event_time)}</Text>
        </View>

        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => onPress(event.id)}
          accessibilityRole="button"
          accessibilityLabel={`Ver más del evento ${event.title}`}
        >
          <Text style={styles.moreButtonText}>Ver más</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.gold} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const EventsScreen: React.FC = () => {
  const router = useRouter();
  const { events, isLoading, isRefreshing, error, hasEvents, refreshEvents } =
    useEventsFeed(20);

  const handleOpenEvent = useCallback(
    (eventId: string) => {
      router.push(`/events/${eventId}`);
    },
    [router],
  );

  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.centerStateText}>Cargando eventos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.centerStateText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={refreshEvents}
          accessibilityRole="button"
          accessibilityLabel="Reintentar carga de eventos"
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!hasEvents) {
    return (
      <View style={styles.centerState}>
        <Ionicons name="calendar-clear-outline" size={36} color={colors.gold} />
        <Text style={styles.centerStateTitle}>No hay eventos por ahora</Text>
        <Text style={styles.centerStateText}>
          Cuando se publiquen eventos aparecerán aquí.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refreshEvents} />
      }
      ListHeaderComponent={
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Eventos</Text>
          <Text style={styles.headerSubtitle}>
            Mantente al día con los eventos de UniConnect
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <EventCard event={item} onPress={handleOpenEvent} />
      )}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 28,
    backgroundColor: colors.backgroundLight,
  },
  headerContainer: {
    marginBottom: 14,
  },
  headerTitle: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 2,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    marginBottom: 14,
    overflow: "hidden",
  },
  cardImage: {
    height: 132,
  },
  cardContent: {
    padding: 14,
  },
  cardTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "700",
  },
  cardFaculty: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 4,
    marginBottom: 10,
  },
  cardDescription: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    color: "#334155",
    fontSize: 13,
  },
  moreButton: {
    marginTop: 10,
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  moreButtonText: {
    color: colors.gold,
    fontWeight: "700",
    fontSize: 13,
    textTransform: "uppercase",
  },
  centerState: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  centerStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
    textAlign: "center",
  },
  centerStateText: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
