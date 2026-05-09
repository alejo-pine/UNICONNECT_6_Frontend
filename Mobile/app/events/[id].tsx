import { useEventDetail } from '@/src/features/events/hooks/useEventDetail';
import { colors } from '@/src/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const formatDate = (dateValue: string): string => {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateValue || 'No disponible';
  }

  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const formatTime = (timeValue: string): string => {
  const [hours, minutes] = timeValue.split(':').map((value) => Number(value));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return timeValue || 'No disponible';
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

const eventFallbackImage = require('@/assets/images/logo-ucaldas.png');

const getEventImageSource = (imageUrl: string | null | undefined) => {
  const normalized = imageUrl?.trim();
  if (normalized) {
    return { uri: normalized };
  }

  return eventFallbackImage;
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconContainer}>
        <Ionicons name={icon} size={18} color={colors.gold} />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'No disponible'}</Text>
      </View>
    </View>
  );
}

export default function EventDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const eventId = useMemo(() => (Array.isArray(id) ? id[0] : id), [id]);
  const { event, isLoading, error, retry } = useEventDetail(eventId);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerState}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.centerStateText}>Cargando detalle del evento...</Text>
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={styles.centerState}>
        <Text style={styles.centerStateText}>{error ?? 'No se encontró el evento.'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={retry}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButtonSecondary} onPress={() => router.back()}>
          <Text style={styles.backButtonSecondaryText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Detalle del Evento</Text>
        <Ionicons name="sunny" size={24} color={colors.gold} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Image
          source={getEventImageSource(event.image_url)}
          style={styles.heroImage}
          contentFit="cover"
          transition={120}
        />

        <Text style={styles.title}>{event.title}</Text>

        <View style={styles.infoGrid}>
          <InfoRow icon="school-outline" label="Facultad" value={event.faculty} />
          <InfoRow icon="pricetag-outline" label="Categoría" value={event.category} />
          <InfoRow icon="person-outline" label="Informado por" value={event.organizer_name} />
          <InfoRow icon="location-outline" label="Ubicación" value={event.location} />
          <InfoRow icon="calendar-outline" label="Fecha" value={formatDate(event.event_date)} />
          <InfoRow icon="time-outline" label="Hora" value={formatTime(event.event_time)} />
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionTitle}>Descripción</Text>
          <Text style={styles.descriptionText}>{event.description || 'Sin descripción disponible.'}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  topBar: {
    height: 56,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    paddingBottom: 28,
  },
  heroImage: {
    height: 220,
  },
  title: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 18,
    lineHeight: 30,
  },
  infoGrid: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  infoRow: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  infoIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoValue: {
    marginTop: 2,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  descriptionSection: {
    paddingHorizontal: 16,
    paddingTop: 22,
  },
  descriptionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.gold,
    marginBottom: 8,
  },
  descriptionText: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 23,
  },
  centerState: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  centerStateText: {
    color: '#475569',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 6,
    backgroundColor: colors.primary,
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  backButtonSecondary: {
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  backButtonSecondaryText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
