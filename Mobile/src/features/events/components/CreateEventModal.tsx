import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { useAuthStore } from '@/src/store/authStore';
import { eventsHttpService } from '../services/eventsHttpService';

const LOCAL_CATEGORIES = ["Académico", "Deportivo", "Cultural", "Social"];
const FACULTIES = [
  "Facultad de Artes y Humanidades",
  "Facultad de Ciencias Agropecuarias",
  "Facultad de Ciencias Exactas y Naturales",
  "Facultad de Ciencias Jurídicas y Sociales",
  "Facultad de Ciencias para la Salud",
  "Facultad de Inteligencia artificial e Ingenierías"
];

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { token } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(LOCAL_CATEGORIES[0] ?? 'Académico');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0] ?? '');
  const [eventTime, setEventTime] = useState('12:00');
  const [location, setLocation] = useState('');
  const [faculty, setFaculty] = useState(FACULTIES[0] ?? '');
  const [capacity, setCapacity] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const parsedDate = eventDate ? new Date(`${eventDate}T12:00:00`) : new Date();
  const parsedTime = new Date();
  const [h, m] = eventTime.split(':');
  parsedTime.setHours(Number(h) || 12, Number(m) || 0, 0, 0);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      if (formattedDate) setEventDate(formattedDate);
    }
  };

  const onChangeTime = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      setEventTime(`${hours}:${minutes}`);
    }
  };

  const resetForm = () => {
    setTitle('');
    setCategory(LOCAL_CATEGORIES[0] ?? 'Académico');
    setDescription('');
    setImageUrl('');
    setEventDate(new Date().toISOString().split('T')[0] ?? '');
    setEventTime('12:00');
    setLocation('');
    setFaculty(FACULTIES[0] ?? '');
    setCapacity('');
  };

  const handleCreate = async () => {
    if (!token || !title.trim() || !eventDate.trim() || !eventTime.trim() || !category) {
      Alert.alert('Error', 'Por favor llena todos los campos obligatorios (Título, Fecha, Hora y Categoría).');
      return;
    }

    const eventDateTime = new Date(`${eventDate.trim()}T${eventTime.trim()}`);
    const now = new Date();
    const diffInHours = (eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      Alert.alert('Error', 'La fecha y hora del evento deben ser al menos 1 hora después de la hora actual.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      title: title.trim(),
      category,
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      eventDate: eventDate.trim(),
      eventTime: eventTime.trim(),
      location: location.trim() || undefined,
      faculty: faculty.trim() || undefined,
      capacity: capacity ? parseInt(capacity, 10) : undefined,
    };

    const response = await eventsHttpService.createEvent(payload, token);
    setIsSubmitting(false);

    if (response.success) {
      Alert.alert('Éxito', `Evento "${payload.title}" creado. Notificaciones enviadas.`);
      resetForm();
      onSuccess();
    } else {
      Alert.alert('Error', response.error ?? 'No se pudo crear el evento.');
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Crear Evento</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} disabled={isSubmitting}>
              <Ionicons name="close" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Título *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Feria de Ciencias 2025"
              value={title}
              onChangeText={setTitle}
              editable={!isSubmitting}
            />

            <Text style={styles.label}>Categoría *</Text>
            <View style={styles.categoriesContainer}>
              {LOCAL_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryBadge, category === cat && styles.categoryBadgeSelected]}
                  onPress={() => setCategory(cat)}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.categoryText, category === cat && styles.categoryTextSelected]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Detalles del evento..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              editable={!isSubmitting}
            />

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Fecha *</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                  disabled={isSubmitting}
                >
                  <Text style={styles.datePickerButtonText}>{eventDate}</Text>
                  <Ionicons name="calendar-outline" size={18} color="#64748B" />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={parsedDate}
                    mode="date"
                    display="default"
                    onChange={onChangeDate}
                  />
                )}
              </View>
              <View style={{ width: 12 }} />
              <View style={styles.flex1}>
                <Text style={styles.label}>Hora *</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowTimePicker(true)}
                  disabled={isSubmitting}
                >
                  <Text style={styles.datePickerButtonText}>{eventTime}</Text>
                  <Ionicons name="time-outline" size={18} color="#64748B" />
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={parsedTime}
                    mode="time"
                    display="default"
                    onChange={onChangeTime}
                  />
                )}
              </View>
            </View>

            <Text style={styles.label}>Ubicación</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Auditorio Principal"
              value={location}
              onChangeText={setLocation}
              editable={!isSubmitting}
            />

            <Text style={styles.label}>Facultad</Text>
            <View style={{ marginBottom: 16 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                {FACULTIES.map((fac) => (
                  <TouchableOpacity
                    key={fac}
                    style={[styles.categoryBadge, faculty === fac && styles.categoryBadgeSelected]}
                    onPress={() => setFaculty(fac)}
                    disabled={isSubmitting}
                  >
                    <Text style={[styles.categoryText, faculty === fac && styles.categoryTextSelected]}>
                      {fac}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.label}>Cupos disponibles (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 50"
              value={capacity}
              onChangeText={setCapacity}
              keyboardType="number-pad"
              editable={!isSubmitting}
            />

            <Text style={styles.label}>URL de Imagen</Text>
            <TextInput
              style={styles.input}
              placeholder="https://ejemplo.com/imagen.jpg"
              value={imageUrl}
              onChangeText={setImageUrl}
              autoCapitalize="none"
              keyboardType="url"
              editable={!isSubmitting}
            />
            
            <Text style={styles.infoText}>
              Al crear el evento, todos los estudiantes suscritos a "{category}" recibirán una notificación automáticamente.
            </Text>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, (!title.trim() || !eventDate.trim() || !eventTime.trim()) && styles.submitButtonDisabled]}
                onPress={handleCreate}
                disabled={isSubmitting || !title.trim() || !eventDate.trim() || !eventTime.trim()}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="add-circle-outline" size={18} color="#FFF" />
                    <Text style={styles.submitButtonText}>Crear Evento</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  closeBtn: {
    padding: 4,
  },
  formContainer: {
    flexGrow: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.primary,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerButtonText: {
    fontSize: 15,
    color: colors.primary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFF',
  },
  categoryBadgeSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  categoryTextSelected: {
    color: '#FFF',
  },
  infoText: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 20,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
