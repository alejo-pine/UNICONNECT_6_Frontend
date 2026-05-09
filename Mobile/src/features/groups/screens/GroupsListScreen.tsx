/**
 * Pantalla: Lista de grupos de estudio con dos pestañas
 */

import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SubjectPicker } from '../../search/components/SubjectPicker';

import { groupsColors } from '../constants/colors';
import { useSubjectGroupsSearch } from '../hooks/useSubjectGroupsSearch';
import { useUserGroups } from '../hooks/useUserGroups';
import type { StudyGroup } from '../types/groups';

const colors = groupsColors;

interface TabType {
  id: 'admin' | 'participant';
  label: string;
}

const TABS: TabType[] = [
  { id: 'admin', label: 'Grupos que Administro' },
  { id: 'participant', label: 'Grupos en los que Participo' },
];

/**
 * Componente memoizado de tarjeta de grupo para evitar re-renders innecesarios
 * cuando la lista se desplaza o se actualiza
 */
const GroupCardItem = memo<{ item: StudyGroup; onPress: (group: StudyGroup) => void }>(
  ({ item, onPress }) => {
    const handlePress = useCallback(() => onPress(item), [item, onPress]);

    return (
      <TouchableOpacity
        style={[styles.groupCard, { backgroundColor: colors.surface }]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}> 
          <MaterialIcons name="group" size={24} color="#FFFFFF" />
        </View>

        <View style={styles.groupContent}>
          <Text style={[styles.groupName, { color: colors.primary }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.groupDescription, { color: colors.label }]} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.groupMeta}>
            <View style={styles.metaItem}>
              <MaterialIcons name="book" size={14} color={colors.label} />
              <Text style={[styles.metaText, { color: colors.label }]}> 
                {item.subject?.name || 'Sin especificar'}
              </Text>
            </View>

            {(item.member_count ?? 0) > 0 && (
              <View style={styles.metaItem}>
                <MaterialIcons name="people" size={14} color={colors.label} />
                <Text style={[styles.metaText, { color: colors.label }]}> 
                  {item.member_count} miembros
                </Text>
              </View>
            )}
          </View>
        </View>

        <MaterialIcons name="chevron-right" size={24} color={colors.label} />
      </TouchableOpacity>
    );
  }
);

GroupCardItem.displayName = 'GroupCardItem';

/**
 * Componente de estado vacío para "Grupos que Administro"
 * Se muestra con botón para crear un nuevo grupo
 */
const EmptyStateAdminComponent = memo<{ onCreatePress: () => void }>(({ onCreatePress }) => (
  <View style={styles.emptyContainer}>
    <MaterialIcons name="group-work" size={64} color={colors.border} />
    <Text style={[styles.emptyTitle, { color: colors.text }]}>
      Aún no perteneces a ningún grupo de estudio
    </Text>
    <Text style={[styles.emptyMessage, { color: colors.label }]}>
      Crea tu primer grupo y empieza a colaborar con otros estudiantes.
    </Text>
    <TouchableOpacity
      style={[styles.emptyButton, { backgroundColor: colors.primary }]}
      onPress={onCreatePress}
      activeOpacity={0.7}
    >
      <Text style={styles.emptyButtonText}>Crear mi primer grupo</Text>
    </TouchableOpacity>
  </View>
));

EmptyStateAdminComponent.displayName = 'EmptyStateAdminComponent';

type ParticipantSearchState = 'idle' | 'empty';

const ParticipantEmptyStateComponent = memo<{
  type: ParticipantSearchState;
  subjectName?: string;
}>(({ type, subjectName }) => (
  <View style={styles.emptyContainer}>
    <MaterialIcons name={type === 'empty' ? 'groups' : 'search'} size={64} color={colors.border} />
    <Text style={[styles.emptyTitle, { color: colors.text }]}>
      {type === 'empty' ? 'No hay grupos disponibles' : 'No hay grupos a los que pertenezcas'}
    </Text>
    <Text style={[styles.emptyMessage, { color: colors.label }]}>
      {type === 'empty'
        ? subjectName
          ? `No hay grupos creados en "${subjectName}" por ahora.`
          : 'No hay grupos creados en esta materia por ahora.'
        : 'Puedes buscar grupos por materia para unirte a uno.'}
    </Text>
  </View>
));

ParticipantEmptyStateComponent.displayName = 'ParticipantEmptyStateComponent';

/**
 * Componente de estado de error - se muestra cuando hay un error al cargar grupos
 */
const ErrorStateComponent = memo<{ message: string; onRetry: () => void }>(({ message, onRetry }) => (
  <View style={styles.emptyContainer}>
    <MaterialIcons name="error-outline" size={64} color="#E74C3C" />
    <Text style={[styles.emptyTitle, { color: colors.text }]}>Algo salió mal</Text>
    <Text style={[styles.emptyMessage, { color: colors.label }]}>{message}</Text>
    <TouchableOpacity
      style={[styles.emptyButton, { backgroundColor: colors.primary }]}
      onPress={onRetry}
      activeOpacity={0.7}
    >
      <Text style={styles.emptyButtonText}>Reintentar</Text>
    </TouchableOpacity>
  </View>
));

ErrorStateComponent.displayName = 'ErrorStateComponent';

export function GroupsListScreen() {
  const router = useRouter();
  const { adminGroups, participantGroups, loading, error, reload } = useUserGroups();
  const {
    subjects,
    selectedSubject,
    groups,
    loadingSubjects,
    subjectsError,
    status,
    error: groupsSearchError,
    loadSubjects,
    selectSubject,
    clearSelection,
    searchGroups,
    resetResults,
  } = useSubjectGroupsSearch();
  const [activeTab, setActiveTab] = useState<'admin' | 'participant'>('admin');
  const [refreshing, setRefreshing] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const shouldResetOnNextFocusRef = useRef(false);
  const navigatingToDetailRef = useRef(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  // Reset búsqueda al cambiar de pestaña
  useEffect(() => {
    if (activeTab !== 'participant') {
      clearSelection();
      resetResults();
      setShowValidation(false);
    }
  }, [activeTab, clearSelection, resetResults]);

  // Recargar datos al enfocar la pantalla.
  // No se resetea la búsqueda al volver del detalle del grupo.
  useFocusEffect(
    useCallback(() => {
      if (shouldResetOnNextFocusRef.current) {
        clearSelection();
        resetResults();
        setShowValidation(false);
        shouldResetOnNextFocusRef.current = false;
      }

      reload();
      loadSubjects();

      return () => {
        // Si navegamos a detalle, no resetear al volver.
        if (navigatingToDetailRef.current) {
          navigatingToDetailRef.current = false;
        } else {
          // Si salimos a otra sección (menu, otra pestaña), el próximo focus debe resetear.
          shouldResetOnNextFocusRef.current = true;
        }
      };
    }, [clearSelection, loadSubjects, reload, resetResults])
  );

  const handleCreateGroup = useCallback(() => {
    router.push('/study-groups/create');
  }, [router]);

  const handleGroupPress = useCallback((group: StudyGroup) => {
    const subjectNameForDetail = group.subject?.name || selectedSubject?.name;
    const encodedName = encodeURIComponent(group.name);
    const encodedSubject = encodeURIComponent(subjectNameForDetail || '');
    const encodedDescription = encodeURIComponent(group.description ?? '');
    const encodedIsAdmin = encodeURIComponent(String(Boolean(group.is_admin)));
    const encodedIsMember = encodeURIComponent(String(Boolean(group.is_member)));

    navigatingToDetailRef.current = true;

    router.push(
      `/study-groups/${group.id}?name=${encodedName}&subjectName=${encodedSubject}&description=${encodedDescription}&isAdmin=${encodedIsAdmin}&isMember=${encodedIsMember}`
    );
  }, [router, selectedSubject?.name]);

  const renderGroupCard = useCallback(
    ({ item }: { item: StudyGroup }) => (
      <GroupCardItem item={item} onPress={handleGroupPress} />
    ),
    [handleGroupPress]
  );

  const handleSelectSubject = useCallback(
    (subject: { id: string; name: string }) => {
      selectSubject(subject);
      resetResults();
      setShowValidation(false);
    },
    [resetResults, selectSubject]
  );

  const handleClearSubject = useCallback(() => {
    clearSelection();
    resetResults();
    setShowValidation(false);
  }, [clearSelection, resetResults]);

  const handleSearchGroups = useCallback(async () => {
    if (!selectedSubject) {
      setShowValidation(true);
      return;
    }

    setShowValidation(false);
    await searchGroups(selectedSubject.id);
  }, [searchGroups, selectedSubject]);

  const renderErrorState = useCallback(
    () => <ErrorStateComponent message={error || 'Error desconocido'} onRetry={reload} />,
    [error, reload]
  );

  const renderParticipantResult = useCallback(() => {
    if (status === 'loading') {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.label }]}>Buscando grupos...</Text>
        </View>
      );
    }

    if (status === 'error') {
      return (
        <ErrorStateComponent
          message={groupsSearchError || 'No se pudieron cargar los grupos para esta materia.'}
          onRetry={handleSearchGroups}
        />
      );
    }

    if (status === 'empty') {
      return <ParticipantEmptyStateComponent type="empty" subjectName={selectedSubject?.name} />;
    }

    if (status === 'success') {
      const participantGroupsWithSubject = groups.map((group) => ({
        ...group,
        subject: group.subject ?? (selectedSubject
          ? { id: selectedSubject.id, name: selectedSubject.name }
          : undefined),
      }));

      return (
        <FlatList
          data={participantGroupsWithSubject}
          renderItem={renderGroupCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    // Default view (sin búsqueda activa): mostrar grupos a los que perteneces
    if (participantGroups.length > 0) {
      return (
        <FlatList
          data={participantGroups}
          renderItem={renderGroupCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    return <ParticipantEmptyStateComponent type="idle" />;
  }, [groups, groupsSearchError, handleSearchGroups, participantGroups, renderGroupCard, selectedSubject, status]);

  const renderParticipantContent = useCallback(
    () => (
      <>
        <View style={styles.searchPanel}>
          <SubjectPicker
            subjects={subjects}
            selectedSubject={selectedSubject}
            loading={loadingSubjects}
            error={subjectsError}
            onSelect={handleSelectSubject}
            onClear={handleClearSubject}
          />

          {showValidation && !selectedSubject && (
            <View style={styles.warningRow}>
              <MaterialIcons name="warning" size={14} color={colors.accent} />
              <Text style={styles.warningText}>Debes seleccionar una materia para buscar grupos.</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.searchButton, status === 'loading' && styles.searchButtonDisabled]}
            onPress={handleSearchGroups}
            disabled={status === 'loading' || loadingSubjects}
            activeOpacity={0.8}
          >
            <MaterialIcons name="search" size={18} color="#FFFFFF" />
            <Text style={styles.searchButtonText}>BUSCAR GRUPOS</Text>
          </TouchableOpacity>
        </View>

        {status === 'success' && (
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {groups.length} {groups.length === 1 ? 'grupo' : 'grupos'} encontrados
            </Text>
            <Text style={styles.resultsSubject}>{selectedSubject?.name}</Text>
          </View>
        )}

        <View style={styles.contentArea}>{renderParticipantResult()}</View>
      </>
    ),
    [
      groups.length,
      handleClearSubject,
      handleSearchGroups,
      handleSelectSubject,
      loadingSubjects,
      renderParticipantResult,
      selectedSubject,
      showValidation,
      status,
      subjects,
      subjectsError,
    ]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.lightBg }]}
      edges={['left', 'right', 'bottom']}
    >

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.surface }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab,
              activeTab === tab.id && { borderBottomColor: colors.primary },
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text
              style={[
                styles.tabLabel,
                {
                  color: activeTab === tab.id ? colors.primary : colors.label,
                  fontWeight: activeTab === tab.id ? '700' : '500',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'admin' ? (
        loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.label }]}>Cargando grupos...</Text>
          </View>
        ) : error ? (
          renderErrorState()
        ) : (
          <FlatList
            data={adminGroups}
            renderItem={renderGroupCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyStateAdminComponent onCreatePress={handleCreateGroup} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )
      ) : (
        renderParticipantContent()
      )}

      {activeTab === 'admin' && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.accent }]}
          onPress={handleCreateGroup}
          activeOpacity={0.7}
        >
          <MaterialIcons name="add" size={28} color={colors.primary} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightBg,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  searchPanel: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  searchButtonDisabled: {
    opacity: 0.45,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  resultsSubject: {
    fontSize: 12,
    color: colors.accent,
    marginTop: 2,
    fontWeight: '600',
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    padding: 12,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupContent: {
    flex: 1,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '600',
  },
  groupDescription: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  groupMeta: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  cardActionContainer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardActionButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  cardActionButtonLeave: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: 'transparent',
  },
  cardActionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  cardActionButtonTextDanger: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});
