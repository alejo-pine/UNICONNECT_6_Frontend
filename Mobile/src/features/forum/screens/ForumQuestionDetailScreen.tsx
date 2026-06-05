import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/authStore';
import { useForumAnswers } from '@/src/features/forum/hooks/useForumAnswers';
import { forumHttpService } from '@/src/features/forum/services/forumHttpService';
import type { ForumAnswer } from '@/src/features/forum/types/forum';

const PRIMARY = '#00284D';
const GOLD = '#C5A059';
const GREEN = '#16a34a';

const formatDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

function AnswerCard({
  answer,
  votingId,
  acceptingId,
  onVote,
  onAccept,
}: {
  answer: ForumAnswer;
  votingId: string | null;
  acceptingId: string | null;
  onVote: (id: string) => void;
  onAccept: (id: string, current: boolean) => void;
}) {
  return (
    <View style={[styles.answerCard, answer.is_accepted && styles.answerCardAccepted]}>
      {answer.is_accepted && (
        <View style={styles.acceptedBadge}>
          <Ionicons name="ribbon" size={14} color={GREEN} />
          <Text style={styles.acceptedBadgeText}>Respuesta aceptada</Text>
        </View>
      )}

      <View style={styles.authorRow}>
        {answer.author_avatar ? (
          <Image
            source={{ uri: answer.author_avatar }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Ionicons name="person-circle-outline" size={28} color="#94a3b8" />
          </View>
        )}
        <View>
          <Text style={styles.authorName}>{answer.author_name}</Text>
          <Text style={styles.authorDate}>{formatDate(answer.created_at)}</Text>
        </View>
      </View>

      <Text style={styles.answerContent}>{answer.content}</Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[
            styles.voteButton,
            answer.has_voted && styles.voteButtonActive,
            votingId === answer.id && styles.buttonDisabled,
          ]}
          onPress={() => onVote(answer.id)}
          disabled={votingId === answer.id}
          activeOpacity={0.75}
        >
          {votingId === answer.id ? (
            <ActivityIndicator size="small" color={answer.has_voted ? '#fff' : PRIMARY} />
          ) : (
            <Ionicons
              name="thumbs-up-outline"
              size={14}
              color={answer.has_voted ? '#fff' : '#64748b'}
            />
          )}
          <Text style={[styles.voteCount, answer.has_voted && styles.voteCountActive]}>
            {answer.vote_count} {answer.vote_count === 1 ? 'voto' : 'votos'}
          </Text>
        </TouchableOpacity>

        {!answer.is_accepted ? (
          <TouchableOpacity
            style={[styles.acceptButton, acceptingId === answer.id && styles.buttonDisabled]}
            onPress={() => onAccept(answer.id, answer.is_accepted)}
            disabled={acceptingId === answer.id}
            activeOpacity={0.75}
          >
            {acceptingId === answer.id ? (
              <ActivityIndicator size="small" color={GREEN} />
            ) : (
              <Ionicons name="checkmark-circle-outline" size={14} color={GREEN} />
            )}
            <Text style={styles.acceptButtonText}>Aceptar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.unacceptButton, acceptingId === answer.id && styles.buttonDisabled]}
            onPress={() => onAccept(answer.id, answer.is_accepted)}
            disabled={acceptingId === answer.id}
            activeOpacity={0.75}
          >
            {acceptingId === answer.id ? (
              <ActivityIndicator size="small" color={GREEN} />
            ) : (
              <Ionicons name="checkmark-circle" size={14} color={GREEN} />
            )}
            <Text style={styles.unacceptButtonText}>Desmarcar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export function ForumQuestionDetailScreen() {
  const { questionId, questionTitle } = useLocalSearchParams<{
    questionId: string;
    questionTitle: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuthStore();

  const { answers, status, error, votingId, acceptingId, reload, vote, accept } =
    useForumAnswers(questionId ?? '');

  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /**
   * Escuchamos el teclado manualmente en lugar de usar KeyboardAvoidingView.
   * Con edgeToEdgeEnabled:true en Android, adjustResize no funciona y KAV
   * tampoco resuelve el problema. El listener del API Keyboard devuelve la
   * altura exacta del teclado y la aplicamos como paddingBottom al contenedor.
   */
  const [keyboardPadding, setKeyboardPadding] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardPadding(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardPadding(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const isResolved = answers.some((a) => a.is_accepted);

  const handleVote = (answerId: string) => void vote(answerId);

  const handleAccept = (answerId: string, currentlyAccepted: boolean) => {
    void (async () => {
      const err = await accept(answerId, currentlyAccepted);
      if (err) Alert.alert('Sin permiso', err);
    })();
  };

  const handleSubmitAnswer = () => {
    if (!answerText.trim()) {
      Alert.alert('Campo vacío', 'La respuesta no puede estar vacía.');
      return;
    }
    if (!token || !questionId) return;
    void (async () => {
      setSubmitting(true);
      const result = await forumHttpService.createAnswer(
        questionId,
        { content: answerText.trim() },
        token,
      );
      setSubmitting(false);
      if (result.success) {
        setAnswerText('');
        await reload();
      } else {
        Alert.alert('Error', result.error ?? 'No se pudo publicar la respuesta.');
      }
    })();
  };

  return (
    <View style={[styles.screen, { paddingBottom: keyboardPadding }]}>
      {/* Header propio — headerShown:false en el route file, igual que ChatScreen */}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top > 0 ? insets.top + 8 : 48, 48) },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Detalle de pregunta
        </Text>
        <View style={styles.headerRight} />
      </View>

      {status === 'loading' || status === 'idle' ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Cargando respuestas...</Text>
        </View>
      ) : status === 'forbidden' ? (
        <View style={styles.centered}>
          <Ionicons name="lock-closed-outline" size={44} color="#94a3b8" />
          <Text style={styles.forbiddenTitle}>Acceso restringido</Text>
          <Text style={styles.forbiddenText}>
            Debes estar matriculado o asignado como docente para acceder a este foro.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      ) : status === 'error' ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={reload}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={answers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onRefresh={reload}
            refreshing={false}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <View style={styles.questionHeader}>
                {questionTitle ? (
                  <Text style={styles.questionTitle}>{questionTitle}</Text>
                ) : null}
                <View style={styles.statusRow}>
                  <Ionicons
                    name={isResolved ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={isResolved ? GREEN : '#cbd5e1'}
                  />
                  <Text style={[styles.statusText, { color: isResolved ? GREEN : '#94a3b8' }]}>
                    {isResolved ? 'Pregunta resuelta' : 'Abierta · sin respuesta aceptada'}
                  </Text>
                </View>
                <Text style={styles.answersTitle}>
                  {answers.length === 0
                    ? 'Sin respuestas aún'
                    : `${answers.length} ${answers.length === 1 ? 'respuesta' : 'respuestas'}`}
                </Text>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyAnswers}>
                <Ionicons name="chatbubble-outline" size={36} color={GOLD} />
                <Text style={styles.emptyText}>Aún no hay respuestas. ¡Sé el primero!</Text>
              </View>
            }
            renderItem={({ item }) => (
              <AnswerCard
                answer={item}
                votingId={votingId}
                acceptingId={acceptingId}
                onVote={handleVote}
                onAccept={handleAccept}
              />
            )}
          />

          <View style={styles.answerForm}>
            <TextInput
              style={styles.answerInput}
              value={answerText}
              onChangeText={setAnswerText}
              placeholder="Escribe tu respuesta..."
              placeholderTextColor="#94a3b8"
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!answerText.trim() || submitting) && styles.sendButtonDisabled,
              ]}
              onPress={handleSubmitAnswer}
              disabled={!answerText.trim() || submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: { padding: 8 },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  headerRight: { width: 40 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  list: { padding: 16, paddingBottom: 8, gap: 12 },
  questionHeader: { marginBottom: 8 },
  questionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PRIMARY,
    lineHeight: 26,
    marginBottom: 8,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  statusText: { fontSize: 13, fontWeight: '600' },
  answersTitle: { fontSize: 16, fontWeight: '700', color: PRIMARY },
  emptyAnswers: { alignItems: 'center', gap: 10, paddingVertical: 32 },
  emptyText: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20 },
  answerCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  answerCardAccepted: {
    borderWidth: 1.5,
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  acceptedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  acceptedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: GREEN,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f1f5f9' },
  avatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: { fontSize: 14, fontWeight: '600', color: PRIMARY },
  authorDate: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  answerContent: { fontSize: 14, color: '#334155', lineHeight: 21, marginBottom: 12 },
  actionsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  voteButtonActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  voteCount: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  voteCountActive: { color: '#fff' },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  acceptButtonText: { fontSize: 12, fontWeight: '600', color: GREEN },
  unacceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  unacceptButtonText: { fontSize: 12, fontWeight: '600', color: GREEN },
  buttonDisabled: { opacity: 0.5 },
  answerForm: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  answerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: PRIMARY,
    maxHeight: 100,
    backgroundColor: '#fafafa',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
  loadingText: { fontSize: 14, color: '#64748b', marginTop: 8 },
  errorText: { fontSize: 14, color: '#ef4444', textAlign: 'center' },
  forbiddenTitle: { fontSize: 18, fontWeight: '700', color: PRIMARY, textAlign: 'center' },
  forbiddenText: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20 },
  retryButton: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
