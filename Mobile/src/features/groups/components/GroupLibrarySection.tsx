import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  ActivityIndicator, 
  Alert,
  Linking,
  Modal,
  ScrollView 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { groupsColors as colors } from '../constants/colors';
import { groupsHttpService } from '../services/groupsHttpService';
import type { GroupResource, OpenGraphData } from '../types/groups';

interface GroupLibrarySectionProps {
  groupId: string;
  isAdmin: boolean;
  token: string;
  userId: string;
}

export const GroupLibrarySection: React.FC<GroupLibrarySectionProps> = ({ groupId, isAdmin, token, userId }) => {
  const [resources, setResources] = useState<GroupResource[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState<OpenGraphData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [roleRequired, setRoleRequired] = useState<'member' | 'admin'>('member');
  const [saving, setSaving] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [valoracion, setValoracion] = useState<number>(0);
  const [comentario, setComentario] = useState<string>('');

  const fetchResources = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const result = await groupsHttpService.getGroupResources(groupId, token);
    if (result.success && result.data) {
      setResources(result.data);
    }
    setLoading(false);
  }, [groupId, token]);
  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleUrlBlur = async () => {
    if (!url || !token) return;
    setLoadingPreview(true);
    setPreview(null);
    const result = await groupsHttpService.getOpenGraphPreview(url, token);
    if (result.success && result.data) {
      setPreview(result.data);
    }
    setLoadingPreview(false);
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    const payload = {
      url: preview?.url || url,
      title: preview?.title,
      description: preview?.description,
      imageUrl: preview?.imageUrl,
      roleRequired,
      metadata: {
        etiquetas: etiquetas.length > 0 ? etiquetas : undefined,
        valoracion: valoracion > 0 ? valoracion : undefined,
        comentario: comentario.trim() ? comentario.trim() : undefined
      }
    };

    let result;
    if (editingId) {
      result = await groupsHttpService.editGroupResource(groupId, editingId, payload, token);
    } else {
      result = await groupsHttpService.createResource(groupId, payload, token);
    }
    setSaving(false);

    if (result.success) {
      setModalVisible(false);
      setUrl('');
      setPreview(null);
      setRoleRequired('member');
      setEditingId(null);
      setEtiquetas([]);
      setValoracion(0);
      setComentario('');
      fetchResources();
    } else {
      Alert.alert('Error', result.error || 'No se pudo guardar el recurso');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Biblioteca</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => {
          setEditingId(null);
          setUrl('');
          setPreview(null);
          setRoleRequired('member');
          setEtiquetas([]);
          setValoracion(0);
          setComentario('');
          setModalVisible(true);
        }}>
          <MaterialIcons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Añadir</Text>
        </TouchableOpacity>
      </View>

      {resources.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="library-books" size={48} color={colors.border} />
          <Text style={styles.emptyText}>No hay recursos todavía.</Text>
        </View>
      ) : (
        <ScrollView style={styles.list}>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 14, color: colors.label, marginBottom: 4 }}>Filtrar por etiqueta:</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['Todos', 'estudio', 'importante'].map(filter => (
                <TouchableOpacity 
                  key={filter}
                  onPress={() => {
                    if (filter === 'Todos') {
                      setResources(resources.map(r => ({...r, _hidden: false} as any)));
                    } else {
                      setResources(resources.map(r => ({...r, _hidden: !(r.metadata?.etiquetas?.includes(filter))} as any)));
                    }
                  }}
                  style={{
                    backgroundColor: colors.border,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16
                  }}
                >
                  <Text style={{ fontSize: 12, color: colors.text }}>{filter}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {resources.filter((r: any) => !r._hidden).map((res) => (
            <TouchableOpacity 
              key={res.id} 
              style={styles.card} 
              onPress={() => Linking.openURL(res.url)}
            >
              {res.image_url ? (
                <Image source={{ uri: res.image_url }} style={styles.cardImage} />
              ) : null}
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>{res.title || 'Enlace sin título'}</Text>
                <Text style={styles.cardDesc} numberOfLines={3}>{res.description || 'Sin descripción'}</Text>
                
                {res.metadata && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8, marginBottom: 8 }}>
                    {res.metadata.etiquetas?.map((tag: string, i: number) => (
                      <View key={i} style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                        <Text style={{ fontSize: 10, color: '#065F46' }}>{tag}</Text>
                      </View>
                    ))}
                    {res.metadata.valoracion && (
                      <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                        <Text style={{ fontSize: 10, color: '#92400E' }}>⭐ {res.metadata.valoracion}/5</Text>
                      </View>
                    )}
                  </View>
                )}

                {res.metadata?.comentario && (
                  <View style={{ backgroundColor: '#DBEAFE', padding: 8, borderRadius: 8, marginBottom: 8 }}>
                    <Text style={{ fontSize: 12, color: '#1E40AF', fontWeight: 'bold' }}>Comentario:</Text>
                    <Text style={{ fontSize: 12, color: '#1E40AF' }}>{res.metadata.comentario}</Text>
                  </View>
                )}

                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.openRow} onPress={() => Linking.openURL(res.url)}>
                    <MaterialIcons name="open-in-new" size={16} color={colors.primary} />
                    <Text style={styles.openText}>Abrir enlace</Text>
                  </TouchableOpacity>
                  {(isAdmin || res.uploaded_by === userId) && (
                    <TouchableOpacity style={styles.editRow} onPress={() => {
                      setEditingId(res.id);
                      setUrl(res.url);
                      setPreview({
                        url: res.url,
                        title: res.title,
                        description: res.description,
                        imageUrl: res.image_url
                      });
                      setRoleRequired(res.role_required);
                      setEtiquetas(res.metadata?.etiquetas || []);
                      setValoracion(res.metadata?.valoracion || 0);
                      setComentario(res.metadata?.comentario || '');
                      setModalVisible(true);
                    }}>
                      <MaterialIcons name="edit" size={16} color={colors.label} />
                      <Text style={styles.editText}>Editar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? 'Editar Recurso' : 'Añadir Recurso'}</Text>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.roleLabel}>URL del recurso</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingresa la URL"
                value={url}
                onChangeText={setUrl}
                onBlur={handleUrlBlur}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />

              {loadingPreview && (
                <View style={styles.previewLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.previewLoadingText}>Generando vista previa...</Text>
                </View>
              )}

              {preview && (
                <View style={styles.previewCard}>
                  {preview.imageUrl && (
                    <Image source={{ uri: preview.imageUrl }} style={styles.previewImage} />
                  )}
                  <View style={styles.previewTextContainer}>
                    <Text style={styles.previewTitle} numberOfLines={1}>{preview.title || 'Sin título'}</Text>
                    <Text style={styles.previewDesc} numberOfLines={2}>{preview.description || 'Sin descripción'}</Text>
                  </View>
                </View>
              )}

              <Text style={styles.roleLabel}>Etiquetas</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {['estudio', 'importante'].map(tag => {
                  const isSelected = etiquetas.includes(tag);
                  return (
                    <TouchableOpacity 
                      key={tag}
                      style={[styles.tagButton, isSelected && styles.tagButtonActive]}
                      onPress={() => {
                        if (isSelected) setEtiquetas(etiquetas.filter(t => t !== tag));
                        else setEtiquetas([...etiquetas, tag]);
                      }}
                    >
                      <Text style={[styles.tagButtonText, isSelected && styles.tagButtonTextActive]}>{tag}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.roleLabel}>Valoración (1 a 5)</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {[1,2,3,4,5].map(v => (
                  <TouchableOpacity 
                    key={v}
                    style={[styles.tagButton, valoracion === v && styles.tagButtonActive]}
                    onPress={() => setValoracion(v === valoracion ? 0 : v)}
                  >
                    <Text style={[styles.tagButtonText, valoracion === v && styles.tagButtonTextActive]}>
                      {v} ⭐
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.roleLabel}>Comentario</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Escribe tu opinión o resumen..."
                value={comentario}
                onChangeText={setComentario}
                multiline
                numberOfLines={3}
              />

              {isAdmin && (
              <View style={styles.roleContainer}>
                <Text style={styles.roleLabel}>Visibilidad:</Text>
                <View style={styles.roleButtons}>
                  <TouchableOpacity 
                    style={[styles.roleButton, roleRequired === 'member' && styles.roleButtonActive]}
                    onPress={() => setRoleRequired('member')}
                  >
                    <Text style={[styles.roleButtonText, roleRequired === 'member' && styles.roleButtonTextActive]}>Miembros</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.roleButton, roleRequired === 'admin' && styles.roleButtonActive]}
                    onPress={() => setRoleRequired('admin')}
                  >
                    <Text style={[styles.roleButtonText, roleRequired === 'admin' && styles.roleButtonTextActive]}>Solo Admins</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={saving}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveBtn, (!url || loadingPreview || saving) && styles.saveBtnDisabled]} 
                onPress={handleSave}
                disabled={!url || loadingPreview || saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    color: colors.label,
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: colors.label,
    marginBottom: 12,
  },
  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  openText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  previewLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  previewLoadingText: {
    color: colors.label,
    fontSize: 14,
  },
  previewCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  previewTextContainer: {
    padding: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  previewDesc: {
    fontSize: 12,
    color: colors.label,
    marginTop: 2,
  },
  roleContainer: {
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.text,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  roleButtonText: {
    color: colors.label,
    fontWeight: 'bold',
  },
  roleButtonTextActive: {
    color: colors.primary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    color: colors.label,
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editText: {
    color: colors.label,
    fontSize: 14,
    fontWeight: 'bold',
  },
  tagButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  tagButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  tagButtonText: {
    fontSize: 12,
    color: colors.label,
  },
  tagButtonTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});
