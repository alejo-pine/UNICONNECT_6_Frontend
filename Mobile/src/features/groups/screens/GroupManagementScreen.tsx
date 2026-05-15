import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { groupsColors } from '../constants/colors';
import { useGroupDetail } from '../hooks/useGroupDetail';
import type { GroupUser } from '../types/groups';

const colors = groupsColors;

type RouteParams = {
  id: string;
  name?: string;
  subjectName?: string;
  description?: string;
  isAdmin?: string;
  isMember?: string;
};

const MemberRow = ({ member }: { member: GroupUser }) => (
  <View style={styles.memberRow}>
    <View style={[styles.memberAvatar, { backgroundColor: colors.primary }]}>
      <Text style={styles.memberAvatarText}>
        {(member.name ?? member.email ?? '?').charAt(0).toUpperCase()}
      </Text>
    </View>
    <View style={styles.memberInfo}>
      <Text style={[styles.memberName, { color: colors.text }]} numberOfLines={1}>
        {member.name ?? 'Estudiante'}
      </Text>
      {member.email ? (
        <Text style={[styles.memberEmail, { color: colors.label }]} numberOfLines={1}>
          {member.email}
        </Text>
      ) : null}
    </View>
  </View>
);

export function GroupManagementScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<RouteParams>();

  const groupId = params.id ?? '';
  const paramName = params.name ? decodeURIComponent(params.name) : '';
  const paramSubject = params.subjectName ? decodeURIComponent(params.subjectName) : '';
  const paramDescription = params.description ? decodeURIComponent(params.description) : '';

  const { group, loading, error, reload, joinGroup, leaveGroup } = useGroupDetail(groupId);

  const [actionLoading, setActionLoading] = useState(false);

  const displayName = group?.name ?? paramName ?? 'Grupo';
  const displaySubject = group?.subject?.name ?? paramSubject ?? '';
  const displayDescription = group?.description ?? paramDescription ?? '';
  const isAdmin = group?.is_admin ?? false;
  const isMember = group?.is_member ?? false;
  const memberCount = group?.member_count ?? group?.members?.length ?? 0;
  const members: GroupUser[] = group?.members ?? [];
  const pendingRequests: GroupUser[] = group?.pendingRequests ?? [];

  const handleJoin = useCallback(async () => {
    setActionLoading(true);
    const result = await joinGroup();
    setActionLoading(false);
    if (!result.success) {
      Alert.alert('Error', result.error ?? 'No se pudo unir al grupo');
    }
  }, [joinGroup]);

  const handleLeave = useCallback(() => {
    Alert.alert(
      'Salir del grupo',
      `¿Estás seguro de que quieres salir de "${displayName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            const result = await leaveGroup();
            setActionLoading(false);
            if (result.success) {
              router.back();
            } else {
              Alert.alert('Error', result.error ?? 'No se pudo salir del grupo');
            }
          },
        },
      ]
    );
  }, [displayName, leaveGroup, router]);

  const renderContent = () => {
    if (loading && !group) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.label }]}>Cargando grupo...</Text>
        </View>
      );
    }

    if (error && !group) {
      return (
        <View style={styles.centerContainer}>
          <MaterialIcons name="error-outline" size={56} color={colors.danger} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Error al cargar</Text>
          <Text style={[styles.errorMessage, { color: colors.label }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={reload}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.groupIconContainer, { backgroundColor: colors.primary }]}>
            <MaterialIcons name="group" size={32} color="#FFFFFF" />
          </View>

          <Text style={[styles.groupName, { color: colors.primary }]}>{displayName}</Text>

          {displaySubject ? (
            <View style={styles.subjectBadge}>
              <MaterialIcons name="book" size={14} color={colors.accent} />
              <Text style={[styles.subjectBadgeText, { color: colors.accent }]}>
                {displaySubject}
              </Text>
            </View>
          ) : null}

          {displayDescription ? (
            <Text style={[styles.description, { color: colors.label }]}>{displayDescription}</Text>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialIcons name="people" size={20} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{memberCount}</Text>
              <Text style={[styles.statLabel, { color: colors.label }]}>Miembros</Text>
            </View>

            {isAdmin && pendingRequests.length > 0 && (
              <View style={styles.statItem}>
                <MaterialIcons name="pending" size={20} color={colors.accent} />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {pendingRequests.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.label }]}>Pendientes</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {!isMember && !isAdmin && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleJoin}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialIcons name="group-add" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Solicitar ingreso</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {isMember && !isAdmin && (
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={handleLeave}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : (
                <>
                  <MaterialIcons name="exit-to-app" size={20} color={colors.danger} />
                  <Text style={[styles.actionButtonText, { color: colors.danger }]}>
                    Salir del grupo
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {isAdmin && (
            <View style={[styles.adminBadgeContainer, { backgroundColor: '#EEF2FF' }]}>
              <MaterialIcons name="admin-panel-settings" size={18} color={colors.primary} />
              <Text style={[styles.adminBadgeText, { color: colors.primary }]}>
                Eres administrador de este grupo
              </Text>
            </View>
          )}
        </View>

        {/* Members List */}
        {members.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Miembros ({members.length})
            </Text>
            {members.map((member) => (
              <MemberRow key={member.id} member={member} />
            ))}
          </View>
        )}

        {/* Pending Requests — admin only */}
        {isAdmin && pendingRequests.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Solicitudes pendientes ({pendingRequests.length})
            </Text>
            {pendingRequests.map((member) => (
              <MemberRow key={member.id} member={member} />
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.lightBg }]}
      edges={['left', 'right', 'bottom']}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.primary }]} numberOfLines={1}>
          {displayName}
        </Text>
        <TouchableOpacity onPress={reload} style={styles.backButton} activeOpacity={0.7}>
          <MaterialIcons name="refresh" size={22} color={loading ? colors.border : colors.label} />
        </TouchableOpacity>
      </View>

      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    borderRadius: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    marginHorizontal: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    gap: 12,
  },
  groupIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  groupName: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subjectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: '#FEF9EC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  subjectBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginTop: 4,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsContainer: {
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  dangerButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  adminBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  adminBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
  },
  memberEmail: {
    fontSize: 12,
    marginTop: 2,
  },
});
