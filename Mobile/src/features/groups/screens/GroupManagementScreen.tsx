import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

import { groupsColors } from '../constants/colors';
import { useGroupDetail } from '../hooks/useGroupDetail';
import type { GroupUser } from '../types/groups';
import { useAuthStore } from '@/src/store/authStore';
import { StudySessionsCalendar } from '../components/StudySessionsCalendar';
import { GroupLibrarySection } from '../components/GroupLibrarySection';

const colors = groupsColors;

type RouteParams = {
  id: string;
  name?: string;
  subjectName?: string;
  description?: string;
  isAdmin?: string;
  isMember?: string;
};

const MemberRow = ({
  member,
  isPending = false,
  showAdminTransfer = false,
  onAccept,
  onReject,
  onTransferAdmin,
  isAdminMember = false,
}: {
  member: GroupUser;
  isPending?: boolean;
  showAdminTransfer?: boolean;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onTransferAdmin?: (id: string) => void;
  isAdminMember?: boolean;
}) => (
  <View style={styles.memberRow}>
    {member.avatarUrl ? (
      <Image source={{ uri: member.avatarUrl }} style={styles.memberAvatar} />
    ) : (
      <View style={[styles.memberAvatar, { backgroundColor: colors.primary }]}>
        <Text style={styles.memberAvatarText}>
          {(member.name ?? member.email ?? '?').charAt(0).toUpperCase()}
        </Text>
      </View>
    )}
    <View style={styles.memberInfo}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={[styles.memberName, { color: colors.text }]} numberOfLines={1}>
          {member.name ?? 'Estudiante'}
        </Text>
        {isAdminMember && (
          <View style={styles.adminBadgeSmall}>
            <Text style={styles.adminBadgeSmallText}>Admin</Text>
          </View>
        )}
      </View>
      {member.email ? (
        <Text style={[styles.memberEmail, { color: colors.label }]} numberOfLines={1}>
          {member.email}
        </Text>
      ) : null}
    </View>
    {isPending && (
      <View style={styles.rowActions}>
        <TouchableOpacity style={styles.iconButton} onPress={() => onAccept?.(member.id)}>
          <MaterialIcons name="check-circle" size={24} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => onReject?.(member.id)}>
          <MaterialIcons name="cancel" size={24} color={colors.danger} />
        </TouchableOpacity>
      </View>
    )}
    {!isPending && showAdminTransfer && (
      <TouchableOpacity
        style={styles.transferBtn}
        onPress={() => onTransferAdmin?.(member.id)}
      >
        <MaterialIcons name="admin-panel-settings" size={18} color="#FFF" />
        <Text style={styles.transferBtnText}>Hacer Admin</Text>
      </TouchableOpacity>
    )}
  </View>
);

export function GroupManagementScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<RouteParams>();

  const groupId = params.id ?? '';
  const paramName = params.name ? decodeURIComponent(params.name) : '';
  const paramSubject = params.subjectName ? decodeURIComponent(params.subjectName) : '';
  const paramDescription = params.description ? decodeURIComponent(params.description) : '';

  const { userId, token } = useAuthStore();
  const { group, loading, error, reload, joinGroup, leaveGroup, transferAdminAndLeave, respondTransferAdmin, acceptRequest, rejectRequest, sessions } = useGroupDetail(groupId);

  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'requests' | 'library' | 'sessions'>('members');

  const displayName = group?.name ?? paramName ?? 'Grupo';
  const displaySubject = group?.subject?.name ?? paramSubject ?? '';
  const displayDescription = group?.description ?? paramDescription ?? '';
  
  const members: GroupUser[] = group?.members ?? [];
  const pendingRequests: GroupUser[] = group?.pendingRequests ?? [];
  
  const routeIsAdmin = params.isAdmin === 'true';
  const routeIsMember = params.isMember === 'true';

  const isAdmin = group?.is_admin || (group?.creator_id && group?.creator_id === userId) || routeIsAdmin || false;
  const isMember = group?.is_member || members.some((m) => m.id === userId) || routeIsMember || false;
  const hasRequested = pendingRequests.some((m) => m.id === userId) || false;
  const memberCount = group?.member_count ?? group?.members?.length ?? 0;
  const pendingAdminTransfer = group?.pendingAdminTransfer;

  useEffect(() => {
    // Poll for updates (e.g. attendance changes) every 5 seconds silently
    const interval = setInterval(() => {
      reload(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [reload]);

  const handleAcceptRequest = useCallback(async (id: string) => {
    setActionLoading(true);
    const result = await acceptRequest(id);
    setActionLoading(false);
    if (!result.success) Alert.alert('Error', result.error ?? 'No se pudo aceptar la solicitud');
  }, [acceptRequest]);

  const handleRejectRequest = useCallback(async (id: string) => {
    setActionLoading(true);
    const result = await rejectRequest(id);
    setActionLoading(false);
    if (!result.success) Alert.alert('Error', result.error ?? 'No se pudo rechazar la solicitud');
  }, [rejectRequest]);

  const handleTransferAdmin = useCallback((id: string, name?: string) => {
    Alert.alert(
      'Transferir Administración',
      `¿Estás seguro de transferir la administración a ${name ?? 'este usuario'}? Perderás tus privilegios y saldrás del grupo si lo deseas o te quedarás como miembro según la política.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Transferir', style: 'destructive', onPress: async () => {
            setActionLoading(true);
            const result = await transferAdminAndLeave(id);
            setActionLoading(false);
            if (!result.success) Alert.alert('Error', result.error ?? 'No se pudo transferir');
            else {
              Alert.alert('Éxito', 'Transferencia de administración iniciada.');
            }
          }
        }
      ]
    );
  }, [transferAdminAndLeave]);

  const handleRespondTransfer = useCallback(async (action: 'accept' | 'reject') => {
    setActionLoading(true);
    const result = await respondTransferAdmin(action);
    setActionLoading(false);
    if (!result.success) Alert.alert('Error', result.error ?? 'No se pudo responder');
  }, [respondTransferAdmin]);

  const handleJoin = useCallback(async () => {
    setActionLoading(true);
    const result = await joinGroup();
    setActionLoading(false);
    if (!result.success) {
      Alert.alert('Error', result.error ?? 'No se pudo unir al grupo');
    }
  }, [joinGroup]);

  const handleLeave = useCallback(() => {
    if (isAdmin) {
      Alert.alert(
        'Transferir Administración',
        'Eres el administrador del grupo. Debes transferir la administración a otro miembro antes de poder salir. Selecciona a un miembro de la lista usando el botón "Hacer Admin".',
        [{ text: 'Entendido', onPress: () => setActiveTab('members') }]
      );
      return;
    }

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
        refreshControl={
          <RefreshControl
            refreshing={loading && !!group}
            onRefresh={reload}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <Stack.Screen options={{ title: displayName }} />

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
          {!isMember && !isAdmin && !hasRequested && (
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

          {!isMember && !isAdmin && hasRequested && (
            <View style={[styles.adminBadgeContainer, { backgroundColor: '#F3F4F6' }]}>
              <MaterialIcons name="access-time" size={18} color={colors.label} />
              <Text style={[styles.adminBadgeText, { color: colors.label }]}>
                Solicitud pendiente de aprobación
              </Text>
            </View>
          )}

          {(isMember || isAdmin) && (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary, flex: 1 }]}
                onPress={() => router.push({ pathname: '/study-groups/wall', params: { groupId, groupName: group?.name } })}
                disabled={actionLoading}
                activeOpacity={0.8}
              >
                <MaterialIcons name="chat" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Ir al chat</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton, { flex: 1 }]}
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
            </View>
          )}

          {isAdmin && (
            <View style={[styles.adminBadgeContainer, { backgroundColor: '#EEF2FF' }]}>
              <MaterialIcons name="admin-panel-settings" size={18} color={colors.primary} />
              <Text style={[styles.adminBadgeText, { color: colors.primary }]}>
                Eres administrador de este grupo
              </Text>
            </View>
          )}

          {pendingAdminTransfer && pendingAdminTransfer.status === 'pending' && pendingAdminTransfer.toUserId === userId && (
            <View style={[styles.card, { backgroundColor: '#FFF4E5', borderColor: '#FFB020', borderWidth: 1, marginTop: 16 }]}>
              <Text style={[styles.sectionTitle, { color: '#B27B16' }]}>Transferencia de Administración</Text>
              <Text style={{ color: '#B27B16', marginBottom: 12 }}>El administrador actual te ha invitado a ser el nuevo administrador del grupo.</Text>
              <View style={styles.rowActions}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary, flex: 1 }]} onPress={() => handleRespondTransfer('accept')}>
                  <Text style={styles.actionButtonText}>Aceptar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.dangerButton, { flex: 1 }]} onPress={() => handleRespondTransfer('reject')}>
                  <Text style={[styles.actionButtonText, { color: colors.danger }]}>Rechazar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {pendingAdminTransfer && pendingAdminTransfer.status === 'pending' && pendingAdminTransfer.fromUserId === userId && (
            <View style={[styles.card, { backgroundColor: '#EEF2FF', marginTop: 16 }]}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>Transferencia en progreso</Text>
              <Text style={{ color: colors.primary }}>Has solicitado transferir la administración. Esperando respuesta.</Text>
            </View>
          )}
        </View>

        {/* Tabs Selection */}
        {(isMember || isAdmin) && (
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'members' && styles.tabButtonActive]}
              onPress={() => setActiveTab('members')}
            >
              <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>Miembros</Text>
            </TouchableOpacity>
            
            {isAdmin && (
              <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'requests' && styles.tabButtonActive]}
                onPress={() => setActiveTab('requests')}
              >
                <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>Solicitudes</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'sessions' && styles.tabButtonActive]}
              onPress={() => setActiveTab('sessions')}
            >
              <Text style={[styles.tabText, activeTab === 'sessions' && styles.tabTextActive]}>Sesiones</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'library' && styles.tabButtonActive]}
              onPress={() => setActiveTab('library')}
            >
              <Text style={[styles.tabText, activeTab === 'library' && styles.tabTextActive]}>Biblioteca</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab Content */}
        {activeTab === 'members' && (isMember || isAdmin) && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {members.length === 0 ? (
              <Text style={styles.emptyText}>No hay miembros en este grupo.</Text>
            ) : (
              members.map((member) => (
                <MemberRow 
                  key={member.id} 
                  member={member} 
                  isAdminMember={member.id === group?.creator_id}
                  showAdminTransfer={isAdmin && member.id !== userId && (!pendingAdminTransfer || pendingAdminTransfer.status !== 'pending')}
                  onTransferAdmin={(id) => handleTransferAdmin(id, member.name)}
                />
              ))
            )}
          </View>
        )}

        {activeTab === 'requests' && isAdmin && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {pendingRequests.length === 0 ? (
              <Text style={styles.emptyText}>No hay solicitudes pendientes.</Text>
            ) : (
              pendingRequests.map((member) => (
                <MemberRow 
                  key={member.id} 
                  member={member} 
                  isPending={true}
                  onAccept={handleAcceptRequest}
                  onReject={handleRejectRequest}
                />
              ))
            )}
          </View>
        )}

        {activeTab === 'sessions' && (isMember || isAdmin) && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.sectionTitle}>Sesiones de Estudio</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="calendar-today" size={16} color={colors.primary} />
                <Text style={{ fontSize: 12, color: colors.label }}>Toca un día con sesión</Text>
              </View>
            </View>
            <StudySessionsCalendar sessions={sessions} isAdmin={isAdmin} groupId={group?.id ?? ''} onRefresh={reload} />
          </View>
        )}

        {activeTab === 'library' && (isMember || isAdmin) && (
          <GroupLibrarySection 
            groupId={group?.id ?? ''} 
            isAdmin={isAdmin} 
            token={token ?? ''} 
            userId={userId ?? ''}
          />
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.lightBg }]}
      edges={['left', 'right', 'bottom']}
    >
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
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  transferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  transferBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  adminBadgeSmall: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminBadgeSmallText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#EEF2FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.label,
  },
  tabTextActive: {
    color: colors.primary,
  },
  emptyText: {
    fontSize: 15,
    color: colors.label,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
