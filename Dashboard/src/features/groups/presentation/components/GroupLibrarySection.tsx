import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@shared/store/authStore';
import { groupsHttpService } from '../../infrastructure/groupsHttpService';
import type { GroupResource, OpenGraphData } from '../../domain/groups';
import { Button } from '@shared/components/ui/Button';
import { Modal } from '@shared/components/ui/Modal';
import { Library, Plus, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@shared/components/ui/ToastProvider';

interface GroupLibrarySectionProps {
  groupId: string;
  isAdmin: boolean;
}

export const GroupLibrarySection: React.FC<GroupLibrarySectionProps> = ({ groupId, isAdmin }) => {
  const token = useAuthStore(s => s.token);
  const userId = useAuthStore(s => s.userId);
  const toast = useToast();
  
  const [resources, setResources] = useState<GroupResource[]>([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      setOpenModal(false);
      setUrl('');
      setPreview(null);
      setRoleRequired('member');
      setEditingId(null);
      setEtiquetas([]);
      setValoracion(0);
      setComentario('');
      fetchResources();
      toast.push(`Recurso ${editingId ? 'actualizado' : 'añadido'} a la biblioteca`, 'success');
    } else {
      toast.push(result.error || 'Error al guardar el recurso', 'error');
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-ink-900">
          <Library className="w-6 h-6 text-emerald-600" />
          <h2 className="text-xl font-bold font-serif">Biblioteca</h2>
        </div>
        <Button 
          type="button"
          onClick={() => {
            setEditingId(null);
            setUrl('');
            setPreview(null);
            setRoleRequired('member');
            setEtiquetas([]);
            setValoracion(0);
            setComentario('');
            setOpenModal(true);
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-4 h-4" />
          Añadir Enlace
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : resources.length === 0 ? (
        <p className="text-ink-500 italic">Aún no hay recursos en la biblioteca. ¡Sé el primero en compartir algo!</p>
      ) : (
        <>
          <div className="mb-4">
            <select
              className="w-full sm:w-64 px-3 py-2 border border-ink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  setResources(resources.map((r: GroupResource) => ({...r, _hidden: !(r.metadata?.etiquetas?.includes(val))} as GroupResource & { _hidden: boolean })));
                } else {
                  setResources(resources.map((r: GroupResource) => ({...r, _hidden: false} as GroupResource & { _hidden: boolean })));
                }
              }}
            >
              <option value="">Todos los tipos</option>
              <option value="estudio">Estudio</option>
              <option value="importante">Importante</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.filter((r: GroupResource & { _hidden?: boolean }) => !r._hidden).map((res: GroupResource) => (
              <div key={res.id} className="flex flex-col bg-white border border-ink-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {res.image_url ? (
                  <div className="h-40 overflow-hidden bg-ink-100 flex-shrink-0">
                    <img src={res.image_url} alt={res.title || 'Recurso'} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-40 bg-ink-100 flex items-center justify-center flex-shrink-0">
                    <Library className="w-12 h-12 text-ink-300" />
                  </div>
                )}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-ink-900 truncate" title={res.title || res.url}>
                    {res.title || 'Enlace sin título'}
                  </h3>
                  <p className="text-sm text-ink-500 mt-1 line-clamp-3 flex-1">
                    {res.description || 'Sin descripción'}
                  </p>
                  
                  {res.metadata && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {res.metadata.etiquetas?.map((tag: string, i: number) => (
                        <span key={i} className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                      {res.metadata.valoracion && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                          ⭐ {res.metadata.valoracion}/5
                        </span>
                      )}
                    </div>
                  )}

                  {res.metadata?.comentario && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-900">
                      <strong>Comentario:</strong> {res.metadata.comentario}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-ink-100 flex gap-2">
                    <a 
                      href={res.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Abrir enlace
                    </a>
                    {(isAdmin || res.uploaded_by === userId) && (
                      <Button
                        variant="secondary"
                        onClick={() => {
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
                          setOpenModal(true);
                        }}
                      >
                        Editar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal Añadir Enlace */}
      <Modal
        isOpen={openModal}
        onClose={() => !saving && setOpenModal(false)}
        title="Añadir Recurso a la Biblioteca"
        footer={
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpenModal(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!url || loadingPreview || saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : 'Guardar Recurso'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">
              URL del recurso
            </label>
            <input
              type="url"
              className="w-full px-3 py-2 border border-ink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={handleUrlBlur}
              disabled={saving || loadingPreview}
            />
            <p className="mt-1 text-xs text-ink-500">
              Pega el enlace y haz clic afuera para cargar la vista previa.
            </p>
          </div>

          {loadingPreview && (
            <div className="flex items-center gap-2 text-ink-600 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generando vista previa...
            </div>
          )}

          {preview && (
            <div className="border border-ink-200 rounded-lg overflow-hidden bg-ink-50">
              {preview.imageUrl && (
                <div className="h-32 overflow-hidden bg-ink-200">
                  <img src={preview.imageUrl} alt="Vista previa" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-3">
                <h4 className="font-semibold text-sm text-ink-900 truncate">
                  {preview.title || 'Sin título detectado'}
                </h4>
                <p className="text-xs text-ink-500 mt-1 line-clamp-2">
                  {preview.description || 'Sin descripción'}
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">
              Etiquetas
            </label>
            <div className="flex gap-2">
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={etiquetas.includes('estudio')} onChange={(e) => {
                  if (e.target.checked) setEtiquetas([...etiquetas, 'estudio']);
                  else setEtiquetas(etiquetas.filter(t => t !== 'estudio'));
                }} />
                Estudio
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={etiquetas.includes('importante')} onChange={(e) => {
                  if (e.target.checked) setEtiquetas([...etiquetas, 'importante']);
                  else setEtiquetas(etiquetas.filter(t => t !== 'importante'));
                }} />
                Importante
              </label>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-ink-700 mb-1">
                Valoración
              </label>
              <select
                className="w-full px-3 py-2 border border-ink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={valoracion}
                onChange={e => setValoracion(Number(e.target.value))}
                disabled={saving}
              >
                <option value={0}>Sin valoración</option>
                <option value={1}>1 Estrella</option>
                <option value={2}>2 Estrellas</option>
                <option value={3}>3 Estrellas</option>
                <option value={4}>4 Estrellas</option>
                <option value={5}>5 Estrellas</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">
              Comentario del Recurso (Decorador)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-ink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Escribe tu opinión, notas o un resumen sobre este enlace..."
              rows={3}
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              disabled={saving}
            />
          </div>

          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">
                Visibilidad / Nivel de Acceso
              </label>
              <select
                className="w-full px-3 py-2 border border-ink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                value={roleRequired}
                onChange={(e) => setRoleRequired(e.target.value as 'member' | 'admin')}
                disabled={saving}
              >
                <option value="member">Todos los miembros</option>
                <option value="admin">Solo Administradores</option>
              </select>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
