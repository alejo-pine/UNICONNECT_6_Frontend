import { colors } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
    Alert,
    TextInput
} from "react-native";

function HighlightText({ text, search, style, numberOfLines }: { text: string; search: string; style?: any; numberOfLines?: number }) {
  if (!search || search.length < 3) return <Text style={style} numberOfLines={numberOfLines}>{text}</Text>;
  const parts = text.split(new RegExp(`(${search})`, 'gi'));
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, i) =>
        part.toLowerCase() === search.toLowerCase() ? (
          <Text key={i} style={{ backgroundColor: '#fef08a', color: '#0f172a' }}>{part}</Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
}
import { useEventsFeed } from "../hooks/useEventsFeed";
import { useEventSubscription } from "../hooks/useEventSubscription";
import type { EventCardSummary } from "../types/events";
import { CreateEventModal } from "../components/CreateEventModal";

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
  search,
  onPress,
}: {
  event: EventCardSummary;
  search: string;
  onPress: (eventId: string) => void;
}) {
  const isSoldOut = event.available_spots <= 0;

  return (
    <View style={styles.card}>
      <View style={{ position: 'relative' }}>
        <Image
          source={getEventImageSource(event.image_url)}
          style={[styles.cardImage, isSoldOut && { opacity: 0.6 }]}
          contentFit="cover"
          transition={120}
        />
        {isSoldOut && (
          <View style={styles.soldOutBadge}>
            <Text style={styles.soldOutText}>CUPO AGOTADO</Text>
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <HighlightText text={event.title} search={search} style={styles.cardTitle} />
        <Text style={styles.cardFaculty}>
          {event.faculty || "Facultad no disponible"}
        </Text>

        <HighlightText 
          text={event.description || "Sin descripción disponible."} 
          search={search} 
          style={styles.cardDescription} 
          numberOfLines={3} 
        />

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

const CATEGORIES = ["Académico", "Deportivo", "Cultural", "Social"];

export const EventsScreen: React.FC = () => {
  const router = useRouter();
  const limit = 10;
  const { 
    events, total, isLoading, isRefreshing, error, hasEvents, refreshEvents,
    page, setPage, search, setSearch, categories, handleCategoryToggle
  } = useEventsFeed(limit);
  const { subscribedCategories, loadingInit, isSubscribed, subscribe, unsubscribe, isSubmitting } = useEventSubscription();
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);

  const handleOpenEvent = useCallback(
    (eventId: string) => {
      router.push(`/events/${eventId}`);
    },
    [router],
  );

  const toggleSubscription = async (category: string) => {
    if (isSubscribed(category)) {
      const success = await unsubscribe(category);
      if (!success) {
        Alert.alert("Error", "No se pudo cancelar la suscripción");
      }
    } else {
      const success = await subscribe(category);
      if (success) {
        Alert.alert("Suscrito", `Te has suscrito a eventos de categoría ${category}`);
      } else {
        Alert.alert("Error", "No se pudo suscribir a la categoría");
      }
    }
  };

  if (!events.length && isLoading && !isRefreshing) {
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

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTopRow}>
        <View>
          <Text style={styles.headerTitle}>Eventos</Text>
          <Text style={styles.headerSubtitle}>
            Mantente al día con los eventos de UniConnect
          </Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setCreateModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.createButtonText}>Crear</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.categoriesTitle}>Suscríbete a Categorías:</Text>
      {loadingInit ? (
        <View style={styles.categoriesLoaderContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.categoriesLoaderText}>Cargando categorías...</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          {CATEGORIES.map((category) => {
            const subscribed = isSubscribed(category);
            return (
              <TouchableOpacity
                key={category}
                style={[styles.categoryBadge, subscribed && styles.categoryBadgeSubscribed]}
                onPress={() => toggleSubscription(category)}
                disabled={isSubmitting}
              >
                <Ionicons 
                  name={subscribed ? "notifications" : "notifications-outline"} 
                  size={14} 
                  color={subscribed ? "#FFF" : colors.primary} 
                />
                <Text style={[styles.categoryText, subscribed && styles.categoryTextSubscribed]}>
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <Text style={[styles.categoriesTitle, { marginTop: 16 }]}>Filtros y Búsqueda:</Text>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar evento... (mín 3 car.)"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94A3B8"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
        {CATEGORIES.map((cat) => {
          const isSelected = categories.includes(cat);
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryBadge, isSelected && styles.categoryBadgeSubscribed]}
              onPress={() => handleCategoryToggle(cat)}
            >
              <Text style={[styles.categoryText, isSelected && styles.categoryTextSubscribed]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.paginationContainer}>
      <TouchableOpacity
        style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
        onPress={() => setPage(page - 1)}
        disabled={page <= 1}
      >
        <Ionicons name="chevron-back" size={16} color={page <= 1 ? '#94A3B8' : colors.primary} />
        <Text style={[styles.pageButtonText, page <= 1 && styles.pageButtonTextDisabled]}>Anterior</Text>
      </TouchableOpacity>
      
      <Text style={styles.pageText}>
        Página {page} de {Math.ceil(total / limit) || 1}
      </Text>

      <TouchableOpacity
        style={[styles.pageButton, page >= Math.ceil(total / limit) && styles.pageButtonDisabled]}
        onPress={() => setPage(page + 1)}
        disabled={page >= Math.ceil(total / limit)}
      >
        <Text style={[styles.pageButtonText, page >= Math.ceil(total / limit) && styles.pageButtonTextDisabled]}>Siguiente</Text>
        <Ionicons name="chevron-forward" size={16} color={page >= Math.ceil(total / limit) ? '#94A3B8' : colors.primary} />
      </TouchableOpacity>
    </View>
  );

  if (!hasEvents) {
    return (
      <View style={styles.centerState}>
        {renderHeader()}
        <Ionicons name="calendar-clear-outline" size={36} color={colors.gold} style={{ marginTop: 20 }} />
        <Text style={styles.centerStateTitle}>No hay eventos por ahora</Text>
        <Text style={styles.centerStateText}>
          Cuando se publiquen eventos aparecerán aquí.
        </Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshEvents} />
        }
        ListHeaderComponent={
          <>
            {renderHeader()}
            {isLoading && !isRefreshing && (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ textAlign: 'center', color: '#64748B', marginTop: 8, fontSize: 13 }}>Buscando eventos...</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <EventCard event={item} search={search} onPress={handleOpenEvent} />
        )}
        ListFooterComponent={events.length > 0 ? renderFooter : null}
      />
      <CreateEventModal
        visible={isCreateModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={() => {
          setCreateModalVisible(false);
          refreshEvents();
        }}
      />
    </>
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
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  createButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13,
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
    marginBottom: 12,
  },
  categoriesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 8,
  },
  categoriesScroll: {
    gap: 8,
    paddingBottom: 8,
  },
  categoriesLoaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  categoriesLoaderText: {
    color: '#64748B',
    fontSize: 13,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  categoryBadgeSubscribed: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "500",
  },
  categoryTextSubscribed: {
    color: "#FFF",
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.primary,
  },
  soldOutBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  soldOutText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFF',
    gap: 4,
  },
  pageButtonDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
  },
  pageButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  pageButtonTextDisabled: {
    color: '#94A3B8',
  },
  pageText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
