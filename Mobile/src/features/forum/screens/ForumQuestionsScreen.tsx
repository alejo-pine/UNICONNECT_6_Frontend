import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuthStore } from '@/src/store/authStore';
import { useForumQuestions } from '@/src/features/forum/hooks/useForumQuestions';
import { forumHttpService } from '@/src/features/forum/services/forumHttpService';

const PRIMARY = '#00284D';
const GOLD = '#C5A059';
const TITLE_MIN = 5;
const CONTENT_MIN = 10;

const formatDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export function ForumQuestionsScreen() {
  const { subjectId } = useLocalSearchParams<{
    subjectId: string;
    subjectName: string;
  }>();
  const router = useRouter();
  const { token } = useAuthStore();
  const { questions, status, error, reload } = useForumQuestions(subjectId ?? '');

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (title.trim().length < TITLE_MIN) {
      Alert.alert('Título muy corto', `El título debe tener al menos ${TITLE_MIN} caracteres.`);
      return;
    }
    if (content.trim().length < CONTENT_MIN) {
      Alert.alert(
        'Contenido muy corto',
        `El contenido debe tener al menos ${CONTENT_MIN} caracteres.`,
      );
      return;
    }
    if (!token || !subjectId) return;

    setSubmitting(true);
    const result = await forumHttpService.createQuestion(
      { subject_id: subjectId, title: title.trim(), content: content.trim() },
      token,
    );
    setSubmitting(false);

    if (result.success) {
      setTitle('');
      setContent('');
      setModalVisible(false);
      await reload();
    } else {
      Alert.alert('Error', result.error ?? 'No se pudo publicar la pregunta.');
    }
  };

  if (status === 'loading' || status === 'idle') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Cargando preguntas...</Text>
      </View>
    );
  }

  if (status === 'forbidden') {
    return (
      <View style={styles.centered}>
        <Ionicons name="lock-closed-outline" size={44} color="#94a3b8" />
        <Text style={styles.forbiddenTitle}>Acceso restringido</Text>
        <Text style={styles.forbiddenText}>
          Debes estar matriculado o asignado como docente en esta asignatura para acceder al foro.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={reload}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      {status === 'empty' ? (
        <View style={styles.centered}>
          <Ionicons name="help-circle-outline" size={48} color={GOLD} />
          <Text style={styles.emptyTitle}>Aún no hay preguntas</Text>
          <Text style={styles.emptySubtitle}>¡Sé el primero en preguntar algo!</Text>
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={reload}
          refreshing={status === 'loading'}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.75}
              onPress={() =>
                router.push({
                  pathname: '/forum/question/[questionId]',
                  params: {
                    questionId: item.id,
                    subjectId,
                    questionTitle: item.title,
                  },
                })
              }
            >
              <View style={styles.cardHeader}>
                <View style={styles.statusDot}>
                  <Ionicons
                    name={item.is_resolved ? 'checkmark-circle' : 'ellipse-outline'}
                    size={18}
                    color={item.is_resolved ? '#22c55e' : '#cbd5e1'}
                  />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardPreview} numberOfLines={2}>
                    {item.content}
                  </Text>
                  <View style={styles.cardMeta}>
                    <Ionicons name="person-circle-outline" size={14} color="#94a3b8" />
                    <Text style={styles.cardMetaText}>{item.author_name}</Text>
                    <Text style={styles.cardMetaDot}>·</Text>
                    <Text style={styles.cardMetaText}>{formatDate(item.created_at)}</Text>
                    <Text style={styles.cardMetaDot}>·</Text>
                    <Ionicons name="chatbubble-outline" size={12} color="#94a3b8" />
                    <Text style={styles.cardMetaText}>{item.answer_count}</Text>
                    {item.is_resolved && (
                      <>
                        <Text style={styles.cardMetaDot}>·</Text>
                        <Text style={styles.resolvedBadge}>Resuelta</Text>
                      </>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Create question modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nueva pregunta</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.inputLabel}>TÍTULO *</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Resume tu pregunta en pocas palabras"
              placeholderTextColor="#94a3b8"
              maxLength={200}
            />
            {title.trim().length > 0 && title.trim().length < TITLE_MIN && (
              <Text style={styles.validationError}>Mínimo {TITLE_MIN} caracteres</Text>
            )}

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>CONTENIDO *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={content}
              onChangeText={setContent}
              placeholder="Describe tu pregunta con detalle..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            {content.trim().length > 0 && content.trim().length < CONTENT_MIN && (
              <Text style={styles.validationError}>Mínimo {CONTENT_MIN} caracteres</Text>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.disabledButton]}
              onPress={handleCreate}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={16} color="#fff" />
              )}
              <Text style={styles.submitButtonText}>
                {submitting ? 'Publicando...' : 'Publicar'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: '#F8F9FA',
  },
  list: { padding: 16, gap: 10, paddingBottom: 100 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  statusDot: { marginTop: 2 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: PRIMARY, lineHeight: 21 },
  cardPreview: { fontSize: 13, color: '#64748b', marginTop: 4, lineHeight: 18 },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  cardMetaText: { fontSize: 12, color: '#94a3b8' },
  cardMetaDot: { fontSize: 12, color: '#cbd5e1' },
  resolvedBadge: { fontSize: 12, color: '#16a34a', fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    zIndex: 10,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  loadingText: { fontSize: 14, color: '#64748b', marginTop: 8 },
  errorText: { fontSize: 14, color: '#ef4444', textAlign: 'center' },
  forbiddenTitle: { fontSize: 18, fontWeight: '700', color: PRIMARY, textAlign: 'center' },
  forbiddenText: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: PRIMARY, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20 },
  retryButton: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: PRIMARY },
  modalBody: { flex: 1, padding: 20 },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: PRIMARY,
    backgroundColor: '#fafafa',
  },
  textArea: { minHeight: 120, paddingTop: 12 },
  validationError: { fontSize: 12, color: '#ef4444', marginTop: 4 },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 12,
  },
  submitButtonText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  disabledButton: { opacity: 0.6 },
});
