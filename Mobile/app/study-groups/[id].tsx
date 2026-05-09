/**
 * Ruta: /study-groups/[id]
 * UI Shell temporal para el detalle del grupo
 */

import { groupsColors } from '@/src/features/groups/constants/colors';
import { useGroupDetail } from '@/src/features/groups/hooks/useGroupDetail';
import { useAuthStore } from '@/src/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const colors = groupsColors;

const tabs = ['Miembros', 'Horarios', 'Archivos'];

export default function StudyGroupDetailScreen() {
  const { id, name, subjectName, description, isAdmin: isAdminParam, isMember: isMemberParam } = useLocalSearchParams();
  const groupId = typeof id === 'string' ? id : id?.[0];
  const router = useRouter();
  const { group, loading, joinGroup } = useGroupDetail(groupId ?? '');
  const { userId } = useAuthStore();
  const [localIsMember, setLocalIsMember] = React.useState<boolean | null>(null);
  const [localIsAdmin, setLocalIsAdmin] = React.useState<boolean | null>(null);
  const [isJoining, setIsJoining] = React.useState(false);

  const groupNameFromParams = typeof name === 'string' ? name : name?.[0];
  const rawSubjectLabel = typeof subjectName === 'string' ? subjectName : subjectName?.[0];
  const subjectLabel = group?.subject?.name || rawSubjectLabel?.trim() || 'Sin materia';
  const groupDescriptionFromParams = typeof description === 'string' ? description : description?.[0];
  const groupName = group?.name || groupNameFromParams;
  const groupDescription = group?.description || groupDescriptionFromParams;

  React.useEffect(() => {
    setLocalIsMember(group?.is_member ?? null);
  }, [group?.is_member]);

  React.useEffect(() => {
    const parseBoolParam = (value: unknown): boolean | undefined => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true') return true;
        if (normalized === 'false') return false;
      }
      return undefined;
    };

    const parsedMember = parseBoolParam(isMemberParam);
    const parsedAdmin = parseBoolParam(isAdminParam);

    if (parsedMember !== undefined) {
      setLocalIsMember(parsedMember);
    }
    if (parsedAdmin !== undefined) {
      setLocalIsAdmin(parsedAdmin);
    }

    if (__DEV__) {
      console.log(
        '[StudyGroupDetailScreen] groupId:',
        groupId,
        'isAdmin (param):',
        parsedAdmin,
        'isMember (param):',
        parsedMember,
        'isAdmin (api):',
        group?.is_admin,
        'isMember (api):',
        group?.is_member
      );
    }
  }, [groupId, group?.is_admin, group?.is_member, isAdminParam, isMemberParam]);

  const isCreator = Boolean(group?.creator_id && group?.creator_id === userId);
  const isAdmin = Boolean(isCreator || (localIsAdmin !== null ? localIsAdmin : group?.is_admin));
  const isMember = Boolean(isCreator || (localIsMember !== null ? localIsMember : group?.is_member));
  const memberCount = group?.member_count;
  const memberCountLabel = typeof memberCount === 'number'
    ? `${memberCount} miembro${memberCount === 1 ? '' : 's'}`
    : '';

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const result = await joinGroup();
      if (result.success) {
        setLocalIsMember(true);
        Alert.alert('¡Listo!', 'Ahora eres miembro de este grupo.');
      } else {
        Alert.alert('No se pudo unir', 'Intenta de nuevo más tarde.');
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = () => {
    Alert.alert(
      'Acción no disponible',
      'Por ahora no es posible salir de un grupo. Intenta de nuevo más tarde.'
    );
  };

  const handleGoToWall = () => {
    router.push(
      `/study-groups/wall?groupId=${groupId}&groupName=${encodeURIComponent(groupName || '')}`
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.lightBg }]}
      edges={['left', 'right', 'bottom']}
    >
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Card principal */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.groupName, { color: colors.primary }]}> 
                {groupName || 'Cargando detalle...'}
              </Text>
              {memberCountLabel ? (
                <Text style={[styles.memberCount, { color: colors.label }]}> 
                  {memberCountLabel}
                </Text>
              ) : null}
            </View>

            {isAdmin ? (
              <View style={styles.infoRow}>
                <Text style={[styles.infoText, { color: colors.primary }]}>Eres el administrador de este grupo.</Text>
              </View>
            ) : isMember ? (
              <View style={styles.infoRow}>
                <Text style={[styles.infoText, { color: colors.success }]}>Ya estás en este grupo.</Text>
              </View>
            ) : null}

            <View style={styles.subjectPill}>
              <Text style={[styles.subjectPillText, { color: colors.primary }]}>
                {subjectLabel}
              </Text>
            </View>

            <Text style={[styles.description, { color: colors.label }]}> 
              {groupDescription || 'Cargando detalle...'}
            </Text>
            <Text style={styles.groupIdText}>ID: {groupId || 'N/A'}</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {tabs.map((tab, index) => (
              <View key={tab} style={[styles.tabItem, index === 0 && styles.tabItemActive]}>
                <Text
                  style={[
                    styles.tabText,
                    index === 0 ? styles.tabTextActive : styles.tabTextInactive,
                  ]}
                >
                  {tab}
                </Text>
              </View>
            ))}
          </View>

          {/* Spacer so content isn't hidden behind footer */}
          <View style={styles.footerSpacer} />
        </ScrollView>

        {/* Footer action */}
        <View style={styles.footer}>
          {isAdmin || isMember ? (
            <>
              <TouchableOpacity
                style={styles.wallButton}
                activeOpacity={0.8}
                onPress={handleGoToWall}
              >
                <Ionicons name="chatbubbles-outline" size={18} color="#FFFFFF" style={styles.wallButtonIcon} />
                <Text style={styles.actionButtonText}>MURO DEL GRUPO</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonDanger, styles.leaveButton]}
                activeOpacity={0.7}
                onPress={handleLeave}
              >
                <Text style={styles.actionButtonText}>
                  {isAdmin ? 'ABANDONAR' : 'SALIR DEL GRUPO'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={loading || isJoining ? [styles.actionButton, styles.actionButtonDisabled] : styles.actionButton}
              activeOpacity={0.7}
              onPress={handleJoin}
              disabled={loading || isJoining}
            >
              {isJoining ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" style={styles.actionButtonSpinner} />
                  <Text style={[styles.actionButtonText, styles.actionButtonTextWithIcon]}>
                    UNIRME AL GRUPO
                  </Text>
                </>
              ) : (
                <Text style={styles.actionButtonText}>UNIRME AL GRUPO</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  footerSpacer: {
    height: 120,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeaderRow: {
    marginBottom: 12,
  },
  groupName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  memberCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionButton: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 0,
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  actionButtonSpinner: {
    marginRight: 8,
  },
  actionButtonTextWithIcon: {
    marginLeft: 4,
  },
  actionButtonDanger: {
    backgroundColor: colors.danger,
  },
  wallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  wallButtonIcon: {
    marginRight: 8,
  },
  leaveButton: {
    marginTop: 8,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  subjectPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 33, 71, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 8,
  },
  subjectPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  groupIdText: {
    marginTop: 12,
    fontSize: 12,
    color: colors.label,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabItemActive: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary,
  },
  tabTextInactive: {
    color: colors.label,
  },
});
