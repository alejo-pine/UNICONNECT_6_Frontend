import React, { useState } from 'react';
import {
  Alert, Modal, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View, ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { groupsColors } from '../constants/colors';
import { groupsHttpService } from '../services/groupsHttpService';
import { useAuthStore } from '@/src/store/authStore';

const C = groupsColors;

const DURATION_OPTIONS = [
  { label: '30 min', minutes: 30 },
  { label: '1 hora', minutes: 60 },
  { label: '1 h 30 min', minutes: 90 },
  { label: '2 horas', minutes: 120 },
  { label: '2 h 30 min', minutes: 150 },
  { label: '3 horas', minutes: 180 },
  { label: '4 horas', minutes: 240 },
];

const RECURRENCE_OPTIONS = [
  { label: 'Sin recurrencia', value: 'none' },
  { label: 'Diaria', value: 'daily' },
  { label: 'Semanal', value: 'weekly' },
  { label: 'Mensual', value: 'monthly' },
];

const addMinutes = (d: Date, mins: number) => new Date(d.getTime() + mins * 60000);

interface Props {
  visible: boolean;
  groupId: string;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateSessionModal({ visible, groupId, onClose, onCreated }: Props) {
  const { token } = useAuthStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState<Date>(addMinutes(new Date(), 25));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [durationIdx, setDurationIdx] = useState(1); // default 1 hora
  const [recurrenceIdx, setRecurrenceIdx] = useState(0); // default none
  const [endDate, setEndDate] = useState<Date>(addMinutes(new Date(), 25 + 7 * 24 * 60));
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName(''); setDescription(''); setLocation('');
    setStartDate(addMinutes(new Date(), 25));
    setDurationIdx(1); setRecurrenceIdx(0);
    setEndDate(addMinutes(new Date(), 25 + 7 * 24 * 60));
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return; }
    const minStart = addMinutes(new Date(), 20);
    if (startDate < minStart) {
      Alert.alert('Error', 'La sesión debe comenzar al menos 20 minutos desde ahora');
      return;
    }
    const recurrence = RECURRENCE_OPTIONS[recurrenceIdx].value;
    if (recurrence !== 'none' && endDate <= startDate) {
      Alert.alert('Error', 'La fecha de fin de recurrencia debe ser posterior al inicio');
      return;
    }

    setSaving(true);
    const endTime = addMinutes(startDate, DURATION_OPTIONS[durationIdx].minutes);
    const res = await groupsHttpService.createSession(groupId, {
      name: name.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      startTime: startDate.toISOString(),
      endTime: endTime.toISOString(),
      recurrenceType: recurrence,
      recurrenceEndDate: recurrence !== 'none' ? endDate.toISOString() : undefined,
    }, token!);
    setSaving(false);

    if (res.success) {
      Alert.alert('¡Listo!', 'Sesiones creadas correctamente');
      reset();
      onCreated();
      onClose();
    } else {
      Alert.alert('Error', res.error ?? 'No se pudo crear la sesión');
    }
  };

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtTime = (d: Date) =>
    d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  const recurrence = RECURRENCE_OPTIONS[recurrenceIdx].value;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[s.sheet, { backgroundColor: C.surface }]}>
          <View style={s.handle} />
          <View style={s.header}>
            <Text style={[s.title, { color: C.text }]}>Nueva sesión</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={22} color={C.label} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={[s.label, { color: C.text }]}>Nombre *</Text>
            <TextInput style={[s.input, { color: C.text, borderColor: C.border }]}
              value={name} onChangeText={setName} placeholder="Nombre de la sesión"
              placeholderTextColor={C.label} />

            <Text style={[s.label, { color: C.text }]}>Descripción</Text>
            <TextInput style={[s.input, { color: C.text, borderColor: C.border }]}
              value={description} onChangeText={setDescription}
              placeholder="Descripción (opcional)" placeholderTextColor={C.label} />

            <Text style={[s.label, { color: C.text }]}>Lugar o enlace</Text>
            <TextInput style={[s.input, { color: C.text, borderColor: C.border }]}
              value={location} onChangeText={setLocation}
              placeholder="Sala B-204, https://meet.google.com/..."
              placeholderTextColor={C.label} />

            <Text style={[s.label, { color: C.text }]}>Fecha de inicio *</Text>
            <TouchableOpacity style={[s.picker, { borderColor: C.border }]}
              onPress={() => setShowDatePicker(true)}>
              <MaterialIcons name="calendar-today" size={16} color={C.label} />
              <Text style={{ color: C.text, fontSize: 14, marginLeft: 8 }}>{fmtDate(startDate)}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker value={startDate} mode="date" minimumDate={addMinutes(new Date(), 20)}
                onChange={(_, d) => { setShowDatePicker(false); if (d) setStartDate(prev => { const n = new Date(d); n.setHours(prev.getHours(), prev.getMinutes()); return n; }); }} />
            )}

            <Text style={[s.label, { color: C.text }]}>Hora de inicio *</Text>
            <TouchableOpacity style={[s.picker, { borderColor: C.border }]}
              onPress={() => setShowTimePicker(true)}>
              <MaterialIcons name="access-time" size={16} color={C.label} />
              <Text style={{ color: C.text, fontSize: 14, marginLeft: 8 }}>{fmtTime(startDate)}</Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker value={startDate} mode="time"
                onChange={(_, d) => { setShowTimePicker(false); if (d) setStartDate(d); }} />
            )}
            <Text style={[s.hint, { color: C.label }]}>
              Fin: {fmtTime(addMinutes(startDate, DURATION_OPTIONS[durationIdx].minutes))}
            </Text>

            <Text style={[s.label, { color: C.text }]}>Duración *</Text>
            <View style={s.chips}>
              {DURATION_OPTIONS.map((o, i) => (
                <TouchableOpacity key={i} onPress={() => setDurationIdx(i)}
                  style={[s.chip, { borderColor: i === durationIdx ? C.primary : C.border,
                    backgroundColor: i === durationIdx ? C.primary : 'transparent' }]}>
                  <Text style={{ fontSize: 11, fontWeight: '600',
                    color: i === durationIdx ? '#fff' : C.text }}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[s.label, { color: C.text }]}>Recurrencia</Text>
            <View style={s.chips}>
              {RECURRENCE_OPTIONS.map((o, i) => (
                <TouchableOpacity key={i} onPress={() => setRecurrenceIdx(i)}
                  style={[s.chip, { borderColor: i === recurrenceIdx ? C.accent : C.border,
                    backgroundColor: i === recurrenceIdx ? C.accent : 'transparent' }]}>
                  <Text style={{ fontSize: 11, fontWeight: '600',
                    color: i === recurrenceIdx ? '#fff' : C.text }}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {recurrence !== 'none' && (
              <>
                <Text style={[s.label, { color: C.text }]}>Repetir hasta</Text>
                <TouchableOpacity style={[s.picker, { borderColor: C.border }]}
                  onPress={() => setShowEndPicker(true)}>
                  <MaterialIcons name="event-repeat" size={16} color={C.label} />
                  <Text style={{ color: C.text, fontSize: 14, marginLeft: 8 }}>{fmtDate(endDate)}</Text>
                </TouchableOpacity>
                {showEndPicker && (
                  <DateTimePicker value={endDate} mode="date" minimumDate={startDate}
                    onChange={(_, d) => { setShowEndPicker(false); if (d) setEndDate(d); }} />
                )}
              </>
            )}

            <View style={s.actions}>
              <TouchableOpacity style={[s.btn, { borderColor: C.border }]} onPress={onClose}>
                <Text style={{ color: C.text, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, { backgroundColor: C.primary, borderColor: C.primary }]}
                disabled={saving} onPress={handleSave}>
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={{ color: '#fff', fontWeight: '600' }}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, maxHeight: '92%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 17, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, marginBottom: 2 },
  picker: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  hint: { fontSize: 11, marginTop: 4, marginBottom: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { borderWidth: 1.5, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 12, borderWidth: 1.5 },
});
