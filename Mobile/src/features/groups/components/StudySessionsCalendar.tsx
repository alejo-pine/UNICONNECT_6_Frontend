import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { groupsColors } from '../constants/colors';
import { groupsHttpService } from '../services/groupsHttpService';
import { useAuthStore } from '@/src/store/authStore';
import { CreateSessionModal } from './CreateSessionModal';

const colors = groupsColors;

interface SessionAttendance {
  userId: string;
  status: 'attending' | 'declined' | 'pending';
  updatedAt: string;
}

interface StudySession {
  id: string;
  creatorId?: string;
  name: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  recurrenceType?: string;
  seriesId?: string;
  attendances?: SessionAttendance[];
}

interface Props {
  sessions: StudySession[];
  isAdmin: boolean;
  groupId: string;
  onRefresh?: () => void;
}

const DAYS_OF_WEEK = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

const formatTime = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const RECURRENCE_LABELS: Record<string, string> = {
  none: 'Sin recurrencia',
  daily: 'Diaria',
  weekly: 'Semanal',
  monthly: 'Mensual',
};

export function StudySessionsCalendar({ sessions, isAdmin, groupId, onRefresh }: Props) {
  const { token, user } = useAuthStore();
  const currentUserId = user?.id;
  const today = new Date();

  // Calendar navigation
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);

  // Detail modal
  const [detailSession, setDetailSession] = useState<StudySession | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Edit modal (step 1 – form)
  const [editSession, setEditSession] = useState<StudySession | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [showEdit, setShowEdit] = useState(false);

  // Edit step 2 – scope choice
  const [showScope, setShowScope] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Sessions map ────────────────────────────────────────────────────────────
  const sessionsByDay = useMemo(() => {
    const map: Record<string, StudySession[]> = {};
    sessions.forEach(s => {
      const d = new Date(s.startTime);
      if (isNaN(d.getTime())) return;
      const key = toDateKey(d);
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [sessions]);

  // ── Calendar grid ───────────────────────────────────────────────────────────
  const cells = useMemo(() => {
    const firstDow = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const total = Math.ceil((firstDow + daysInMonth) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const day = i - firstDow + 1;
      return day >= 1 && day <= daysInMonth ? day : null;
    });
  }, [calYear, calMonth]);

  const todayKey = toDateKey(today);

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1); } else setCalMonth(m => m-1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1); } else setCalMonth(m => m+1); };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleDayPress = (key: string) => {
    const list = sessionsByDay[key] ?? [];
    if (!list.length) return;
    setSelectedKey(key);
    if (list.length === 1) {
      openDetail(list[0]);
    } else {
      // Show list in detail modal (handled in the day-sessions panel below)
    }
  };

  const openDetail = (s: StudySession) => {
    setDetailSession(s);
    setShowDetail(true);
  };

  const openEdit = (s: StudySession) => {
    setShowDetail(false);
    setEditSession(s);
    setEditName(s.name);
    setEditDesc(s.description ?? '');
    setEditLocation(s.location ?? '');
    setShowScope(false);
    setShowEdit(true);
  };

  const handleEditNext = () => {
    if (!editName.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return; }
    const isRecurring = editSession?.recurrenceType && editSession.recurrenceType !== 'none';
    if (isRecurring) {
      setShowScope(true);
    } else {
      void submitEdit('this');
    }
  };

  const submitEdit = async (scope: 'this' | 'future') => {
    if (!editSession || !token) return;
    setSaving(true);
    const res = await groupsHttpService.updateSession(editSession.id, {
      name: editName,
      description: editDesc,
      location: editLocation,
      updateMode: scope,
      fromDate: scope === 'future' ? editSession.startTime : undefined,
    }, token);
    setSaving(false);
    if (res.success) {
      setShowEdit(false);
      setShowScope(false);
      setEditSession(null);
      Alert.alert('Éxito', scope === 'future' ? 'Sesión y las siguientes actualizadas' : 'Sesión actualizada');
      onRefresh?.();
    } else {
      Alert.alert('Error', res.error ?? 'No se pudo actualizar');
    }
  };

  const updateAttendance = async (sessionId: string, status: 'attending' | 'declined') => {
    if (!token) return;
    const res = await groupsHttpService.updateSessionAttendance(groupId, sessionId, status, token);
    if (res.success) {
      onRefresh?.();
      setShowDetail(false);
      Alert.alert('Éxito', status === 'attending' ? 'Asistencia confirmada' : 'Asistencia declinada');
    } else {
      Alert.alert('Error', res.error ?? 'Error al actualizar asistencia');
    }
  };

  const getMyAttendance = (session: StudySession) => {
    if (!session.attendances) return 'pending';
    const profileId = useAuthStore.getState().user?.id;
    const att = session.attendances.find(a => a.userId === profileId);
    return att ? att.status : 'pending';
  };

  // ─────────────────────────────────────────────────────────────────────────────
  const selectedSessions = selectedKey ? (sessionsByDay[selectedKey] ?? []) : [];

  return (
    <View>
      {/* Create button for admins */}
      {isAdmin && (
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowCreate(true)}
        >
          <MaterialIcons name="add" size={18} color="#fff" />
          <Text style={styles.createBtnText}>Nueva sesión</Text>
        </TouchableOpacity>
      )}
      {/* Month navigation */}
      <View style={styles.calHeader}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
          <MaterialIcons name="chevron-left" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: colors.text }]}>
          {MONTHS[calMonth]} {calYear}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
          <MaterialIcons name="chevron-right" size={26} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Day names */}
      <View style={styles.dayNamesRow}>
        {DAYS_OF_WEEK.map(d => (
          <View key={d} style={styles.dayNameCell}>
            <Text style={[styles.dayNameText, { color: colors.label }]}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`e-${i}`} style={styles.cell} />;
          const key = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const hasSessions = Boolean(sessionsByDay[key]);
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;

          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.cell,
                hasSessions && !isSelected && !isToday && { backgroundColor: '#FFF9E6', borderWidth: 2, borderColor: colors.accent },
                isToday && { backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.primary },
                isSelected && hasSessions && !isToday && { backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.accent },
                !hasSessions && !isToday && { borderWidth: 2, borderColor: 'transparent' },
              ]}
              activeOpacity={hasSessions ? 0.7 : 1}
              onPress={() => handleDayPress(key)}
            >
              <Text style={[
                styles.dayNum,
                hasSessions ? { fontWeight: 'bold', fontSize: 13 } : { fontWeight: '500', fontSize: 12 },
                { color: (isToday || (isSelected && hasSessions)) ? '#fff' : colors.text },
              ]}>
                {day}
              </Text>
              {hasSessions && (
                <View style={[
                  styles.badge,
                  { backgroundColor: isToday || (isSelected && hasSessions) ? '#fff' : colors.accent },
                ]}>
                  <Text style={{ 
                    color: isToday || (isSelected && hasSessions) ? colors.accent : '#fff', 
                    fontSize: 8,
                    lineHeight: 10
                  }}>★</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      {sessions.length === 0 ? (
        <View style={styles.emptyRow}>
          <MaterialIcons name="event-busy" size={28} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.label }]}>Sin sesiones este mes</Text>
        </View>
      ) : (
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.label }]}>
            {sessions.length} sesión{sessions.length !== 1 ? 'es' : ''}
          </Text>
        </View>
      )}

      {/* Sessions of selected day */}
      {selectedKey && selectedSessions.length > 1 && (
        <View style={[styles.dayPanel, { borderColor: colors.border }]}>
          <Text style={[styles.dayPanelTitle, { color: colors.label }]}>
            Sesiones del {selectedKey.split('-').reverse().join('/')}
          </Text>
          {selectedSessions.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.sessionRow, { borderLeftColor: colors.primary }]}
              onPress={() => openDetail(s)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.sessionRowName, { color: colors.text }]} numberOfLines={1}>{s.name}</Text>
                <Text style={[styles.sessionRowTime, { color: colors.label }]}>
                  {formatTime(s.startTime)} – {formatTime(s.endTime)}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color={colors.label} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Detail modal ─────────────────────────────────────────────────── */}
      <Modal visible={showDetail} transparent animationType="slide" onRequestClose={() => setShowDetail(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Detalle de sesión</Text>
              <TouchableOpacity onPress={() => setShowDetail(false)}>
                <MaterialIcons name="close" size={22} color={colors.label} />
              </TouchableOpacity>
            </View>

            {detailSession && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[styles.detailCard, { borderLeftColor: colors.primary }]}>
                  <View style={styles.detailNameRow}>
                    <MaterialIcons name="event" size={18} color={colors.primary} />
                    <Text style={[styles.detailName, { color: colors.text }]}>{detailSession.name}</Text>
                  </View>
                  {detailSession.description ? (
                    <Text style={[styles.detailDesc, { color: colors.label }]}>{detailSession.description}</Text>
                  ) : null}
                  {detailSession.location ? (
                    <View style={styles.detailMeta}>
                      <MaterialIcons name="place" size={14} color="#3b5bdb" />
                      <Text style={[styles.detailMetaText, { color: '#3b5bdb' }]}>{detailSession.location}</Text>
                    </View>
                  ) : null}
                  <View style={styles.detailMeta}>
                    <MaterialIcons name="access-time" size={14} color={colors.label} />
                    <Text style={[styles.detailMetaText, { color: colors.label }]}>
                      {formatTime(detailSession.startTime)} – {formatTime(detailSession.endTime)}
                    </Text>
                  </View>
                  {detailSession.recurrenceType && detailSession.recurrenceType !== 'none' && (
                    <View style={styles.detailMeta}>
                      <MaterialIcons name="repeat" size={14} color={colors.accent} />
                      <Text style={[styles.detailMetaText, { color: colors.accent }]}>
                        {RECURRENCE_LABELS[detailSession.recurrenceType] ?? detailSession.recurrenceType}
                      </Text>
                    </View>
                  )}
                  
                  {/* Attendance Controls */}
                  {(!isAdmin && detailSession.creatorId !== currentUserId) ? (
                    <View style={[styles.detailMeta, { marginTop: 8 }]}>
                      <Text style={[styles.detailMetaText, { color: colors.text, fontWeight: 'bold' }]}>Asistencia:</Text>
                      <TouchableOpacity 
                        style={[styles.attBtn, getMyAttendance(detailSession) === 'attending' && { backgroundColor: '#e2fadb', borderColor: '#2b8a3e' }]}
                        onPress={() => updateAttendance(detailSession.id, 'attending')}
                      >
                        <Text style={[styles.attBtnText, getMyAttendance(detailSession) === 'attending' && { color: '#2b8a3e' }]}>Asistiré</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.attBtn, getMyAttendance(detailSession) === 'declined' && { backgroundColor: '#ffe3e3', borderColor: '#e03131' }]}
                        onPress={() => updateAttendance(detailSession.id, 'declined')}
                      >
                        <Text style={[styles.attBtnText, getMyAttendance(detailSession) === 'declined' && { color: '#e03131' }]}>Declinar</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={[styles.detailMeta, { marginTop: 8 }]}>
                      <MaterialIcons name="group" size={14} color={colors.primary} />
                      <Text style={[styles.detailMetaText, { color: colors.text, fontWeight: 'bold' }]}>
                        {detailSession.attendances?.filter(a => a.status === 'attending').length || 0} confirmados
                      </Text>
                    </View>
                  )}
                </View>

                {(isAdmin || detailSession.creatorId === currentUserId) && (
                  <View style={{ gap: 8, marginTop: 4 }}>
                    <TouchableOpacity
                      style={[styles.editBtn, { backgroundColor: colors.primary }]}
                      onPress={() => openEdit(detailSession)}
                    >
                      <MaterialIcons name="edit" size={16} color="#fff" />
                      <Text style={styles.editBtnText}>Editar sesión</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.editBtn, { backgroundColor: '#dc3545' }]}
                      onPress={() => {
                        Alert.alert(
                          'Cancelar sesión',
                          '¿Seguro que deseas cancelar esta sesión? Si es parte de una serie, solo se eliminará esta instancia.',
                          [
                            { text: 'No', style: 'cancel' },
                            { text: 'Sí, cancelar', style: 'destructive', onPress: async () => {
                              if (!token) return;
                              const res = await groupsHttpService.deleteSession(groupId, detailSession.id, token);
                              if (res.success) {
                                setShowDetail(false);
                                onRefresh?.();
                                Alert.alert('Éxito', 'Sesión cancelada');
                              } else {
                                Alert.alert('Error', res.error ?? 'No se pudo cancelar');
                              }
                            }}
                          ]
                        );
                      }}
                    >
                      <MaterialIcons name="delete" size={16} color="#fff" />
                      <Text style={styles.editBtnText}>Cancelar sesión</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Edit form modal ──────────────────────────────────────────────── */}
      <Modal visible={showEdit && !showScope} transparent animationType="slide" onRequestClose={() => setShowEdit(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Editar sesión</Text>
              <TouchableOpacity onPress={() => { setShowEdit(false); setEditSession(null); }}>
                <MaterialIcons name="close" size={22} color={colors.label} />
              </TouchableOpacity>
            </View>

            {editSession && (
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Info pill */}
                {editSession.recurrenceType && editSession.recurrenceType !== 'none' && (
                  <View style={[styles.infoPill, { backgroundColor: '#e7f5ff' }]}>
                    <MaterialIcons name="repeat" size={14} color="#1971c2" />
                    <Text style={[styles.infoPillText, { color: '#1971c2' }]}>
                      Serie {RECURRENCE_LABELS[editSession.recurrenceType]}
                    </Text>
                  </View>
                )}

                <Text style={[styles.inputLabel, { color: colors.text }]}>Nombre</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Nombre de la sesión"
                  placeholderTextColor={colors.label}
                />

                <Text style={[styles.inputLabel, { color: colors.text }]}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.inputMulti, { color: colors.text, borderColor: colors.border }]}
                  value={editDesc}
                  onChangeText={setEditDesc}
                  placeholder="Descripción (opcional)"
                  placeholderTextColor={colors.label}
                  multiline
                  numberOfLines={3}
                />

                <Text style={[styles.inputLabel, { color: colors.text }]}>Lugar o enlace</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  value={editLocation}
                  onChangeText={setEditLocation}
                  placeholder="Sala B-204, https://meet.google.com/..."
                  placeholderTextColor={colors.label}
                />

                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={[styles.editActionBtn, { borderColor: colors.border }]}
                    onPress={() => { setShowEdit(false); setEditSession(null); }}
                  >
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editActionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={handleEditNext}
                  >
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Siguiente</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Scope choice modal (Criterio 5) ─────────────────────────────── */}
      <Modal visible={showScope} transparent animationType="fade" onRequestClose={() => setShowScope(false)}>
        <View style={[styles.overlay, { justifyContent: 'center', paddingHorizontal: 24 }]}>
          <View style={[styles.scopeCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.scopeTitle, { color: colors.text }]}>
              ¿A qué sesiones aplica el cambio?
            </Text>
            <Text style={[styles.scopeSubtitle, { color: colors.label }]}>
              Esta sesión forma parte de una serie recurrente.
            </Text>

            <TouchableOpacity
              style={[styles.scopeOption, { borderColor: colors.border }]}
              disabled={saving}
              onPress={() => void submitEdit('this')}
            >
              <MaterialIcons name="event" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.scopeOptionTitle, { color: colors.text }]}>Solo esta sesión</Text>
                <Text style={[styles.scopeOptionDesc, { color: colors.label }]}>
                  Las demás sesiones de la serie no cambian.
                </Text>
              </View>
              {saving ? <ActivityIndicator size="small" color={colors.primary} /> : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.scopeOption, { borderColor: colors.border }]}
              disabled={saving}
              onPress={() => void submitEdit('future')}
            >
              <MaterialIcons name="repeat" size={20} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.scopeOptionTitle, { color: colors.text }]}>Esta y las siguientes</Text>
                <Text style={[styles.scopeOptionDesc, { color: colors.label }]}>
                  Aplica el cambio a todas las sesiones futuras de la serie.
                </Text>
              </View>
              {saving ? <ActivityIndicator size="small" color={colors.accent} /> : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={{ alignItems: 'center', paddingTop: 8 }}
              onPress={() => setShowScope(false)}
            >
              <Text style={{ color: colors.label, fontSize: 13 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Create session modal ─────────────────────────────────────────── */}
      <CreateSessionModal
        visible={showCreate}
        groupId={groupId}
        onClose={() => setShowCreate(false)}
        onCreated={() => { onRefresh?.(); }}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navBtn: { padding: 4, borderRadius: 8 },
  monthLabel: { fontSize: 15, fontWeight: '700' },
  dayNamesRow: { flexDirection: 'row', marginBottom: 2 },
  dayNameCell: { flex: 1, alignItems: 'center', paddingVertical: 3 },
  dayNameText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100/7}%` as any,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    position: 'relative',
  },
  dayNum: { fontSize: 12, fontWeight: '500' },
  badge: { width: 14, height: 14, borderRadius: 7, position: 'absolute', top: -2, right: -2, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1, elevation: 2 },
  emptyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  emptyText: { fontSize: 13 },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, marginBottom: 10 },
  createBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingHorizontal: 2 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 12 },
  dayPanel: { marginTop: 12, borderTopWidth: 1, paddingTop: 12, gap: 8 },
  dayPanelTitle: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    gap: 8,
  },
  sessionRowName: { fontSize: 13, fontWeight: '600' },
  sessionRowTime: { fontSize: 11, marginTop: 2 },
  // Sheet / modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 17, fontWeight: '700' },
  // Detail
  detailCard: { borderLeftWidth: 3, borderRadius: 10, backgroundColor: '#F9FAFB', padding: 14, gap: 6, marginBottom: 16 },
  detailNameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  detailName: { fontSize: 15, fontWeight: '700', flex: 1 },
  detailDesc: { fontSize: 13, lineHeight: 18, marginLeft: 26 },
  detailMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 26 },
  detailMetaText: { fontSize: 12 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  editBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  // Edit form
  infoPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'flex-start', marginBottom: 16 },
  infoPillText: { fontSize: 12, fontWeight: '600' },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, marginBottom: 16 },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  editActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  editActionBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1.5 },
  // Scope card
  scopeCard: { borderRadius: 20, padding: 24, gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 10 },
  scopeTitle: { fontSize: 17, fontWeight: '700' },
  scopeSubtitle: { fontSize: 13, marginTop: -8 },
  scopeOption: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1.5, borderRadius: 14, padding: 14 },
  scopeOptionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  scopeOptionDesc: { fontSize: 12, lineHeight: 16 },
  // Attendance
  attBtn: { borderWidth: 1, borderColor: '#ced4da', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginLeft: 6 },
  attBtnText: { fontSize: 12, color: '#495057', fontWeight: '600' },
});
