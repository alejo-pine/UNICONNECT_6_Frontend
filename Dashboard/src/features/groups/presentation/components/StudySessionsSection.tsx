import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@shared/store/authStore';
import { useToast } from '@shared/components/ui/ToastProvider';
import type { StudySession, CreateStudySessionPayload, UpdateStudySessionPayload } from '../../domain/groups';
import { groupsHttpService } from '../../infrastructure/groupsHttpService';
import { Card } from '@shared/components/ui/Card';
import { Button } from '@shared/components/ui/Button';
import { Modal } from '@shared/components/ui/Modal';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

const DURATION_OPTIONS = [
  { label: '30 minutos', minutes: 30 },
  { label: '1 hora', minutes: 60 },
  { label: '1 hora 30 min', minutes: 90 },
  { label: '2 horas', minutes: 120 },
  { label: '2 horas 30 min', minutes: 150 },
  { label: '3 horas', minutes: 180 },
  { label: '4 horas', minutes: 240 },
];

const RECURRENCE_LABELS: Record<string, string> = {
  none: 'Sin recurrencia',
  daily: 'Diaria',
  weekly: 'Semanal',
  monthly: 'Mensual',
};

const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
};

// Compute min allowed datetime-local string (now + 20 min)
const minStartValue = () => {
  const d = new Date(Date.now() + 20 * 60 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

const addMinutes = (datetimeLocal: string, minutes: number): string => {
  if (!datetimeLocal) return '';
  const d = new Date(datetimeLocal);
  if (isNaN(d.getTime())) return '';
  d.setMinutes(d.getMinutes() + minutes);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

interface FormState {
  name: string;
  description: string;
  location: string;
  startTime: string;
  durationMinutes: number;
  recurrenceType: string;
  recurrenceEndDate: string;
}

const emptyForm = (): FormState => ({
  name: '',
  description: '',
  location: '',
  startTime: '',
  durationMinutes: 60,
  recurrenceType: 'none',
  recurrenceEndDate: '',
});

export function StudySessionsSection({ groupId, isAdmin }: { groupId: string; isAdmin: boolean }) {
  const token = useAuthStore((s) => s.token);
  const toast = useToast();

  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', location: '' });
  const [showScope, setShowScope] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchSessions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const base = import.meta.env.VITE_BACKEND_PUBLIC_URL || 'http://localhost:3000';
      const res = await fetch(`${base}/study-groups/${groupId}/sessions`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) setSessions(json.data);
    } catch (e) { console.error(e); }
    finally { if (!silent) setLoading(false); }
  }, [groupId, token]);

  useEffect(() => { 
    fetchSessions();
    const interval = setInterval(() => {
      fetchSessions(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  // ── Calendar ────────────────────────────────────────────────────────────────
  const sessionsByDay: Record<string, StudySession[]> = {};
  sessions.forEach(s => {
    const d = new Date(s.startTime);
    if (isNaN(d.getTime())) return;
    const k = toDateKey(d);
    (sessionsByDay[k] = sessionsByDay[k] ?? []).push(s);
  });

  const firstDow = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstDow + daysInMonth) / 7) * 7 }, (_, i) => {
    const d = i - firstDow + 1;
    return d >= 1 && d <= daysInMonth ? d : null;
  });

  const todayKey = toDateKey(today);
  const selectedSessions = selectedKey ? (sessionsByDay[selectedKey] ?? []).slice().sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) : [];

  const prevMonth = () => calMonth === 0 ? (setCalMonth(11), setCalYear(y=>y-1)) : setCalMonth(m=>m-1);
  const nextMonth = () => calMonth === 11 ? (setCalMonth(0), setCalYear(y=>y+1)) : setCalMonth(m=>m+1);

  // ── Create ──────────────────────────────────────────────────────────────────
  const validateForm = (): string => {
    if (!form.name.trim()) return 'El nombre es obligatorio.';
    if (!form.startTime) return 'Debes indicar la fecha y hora de inicio.';
    const start = new Date(form.startTime);
    const minStart = new Date(Date.now() + 20 * 60 * 1000);
    if (start < minStart) return 'La sesión debe comenzar al menos 20 minutos desde ahora.';
    if (form.recurrenceType !== 'none' && !form.recurrenceEndDate) return 'Debes indicar hasta cuándo se repite.';
    return '';
  };

  const handleCreate = async () => {
    const err = validateForm();
    if (err) { setFormError(err); return; }
    setFormError('');
    setCreating(true);
    const endTime = addMinutes(form.startTime, form.durationMinutes);
    const payload: CreateStudySessionPayload = {
      name: form.name,
      description: form.description,
      location: form.location || undefined,
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      recurrenceType: form.recurrenceType as any,
      recurrenceEndDate: form.recurrenceType !== 'none' ? new Date(form.recurrenceEndDate).toISOString() : undefined,
    };
    const res = await groupsHttpService.createSession(groupId, payload, token);
    setCreating(false);
    if (res.success) {
      toast.push('Sesiones creadas correctamente', 'success');
      setShowCreate(false);
      setForm(emptyForm());
      fetchSessions();
    } else {
      setFormError(res.error || 'Error al crear la sesión');
    }
  };

  // ── Edit ────────────────────────────────────────────────────────────────────
  const openEdit = (s: StudySession) => {
    setEditingSession(s);
    setEditForm({ name: s.name, description: s.description ?? '', location: s.location ?? '' });
    setShowScope(false);
  };

  const closeEdit = () => { setEditingSession(null); setShowScope(false); setSubmittingEdit(false); };

  const handleEditNext = () => {
    if (!editForm.name.trim()) { toast.push('El nombre es obligatorio', 'error'); return; }
    const isRecurring = editingSession?.recurrenceType && editingSession.recurrenceType !== 'none';
    if (isRecurring) setShowScope(true);
    else void submitEdit('this');
  };

  const submitEdit = async (scope: 'this' | 'future') => {
    if (!editingSession) return;
    setSubmittingEdit(true);
    const payload: UpdateStudySessionPayload = { name: editForm.name, description: editForm.description, location: editForm.location, updateMode: scope, fromDate: scope === 'future' ? editingSession.startTime : undefined };
    const res = await groupsHttpService.updateSession(editingSession.id, payload, token);
    setSubmittingEdit(false);
    if (res.success) {
      toast.push(scope === 'future' ? 'Serie actualizada' : 'Sesión actualizada', 'success');
      closeEdit();
      fetchSessions();
    } else {
      toast.push(res.error || 'Error al actualizar', 'error');
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    if (!window.confirm('¿Seguro que deseas cancelar esta sesión? Si es parte de una serie, solo se eliminará esta instancia.')) return;
    
    try {
      const base = import.meta.env.VITE_BACKEND_PUBLIC_URL || 'http://localhost:3000';
      const res = await fetch(`${base}/study-groups/${groupId}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (res.ok) {
        toast.push('Sesión cancelada', 'success');
        fetchSessions();
      } else {
        const err = await res.json();
        toast.push(err.error || 'Error al cancelar', 'error');
      }
    } catch (e) {
      toast.push('Error de red al cancelar', 'error');
    }
  };

  const updateAttendance = async (sessionId: string, status: 'attending' | 'declined') => {
    try {
      const base = import.meta.env.VITE_BACKEND_PUBLIC_URL || 'http://localhost:3000';
      const res = await fetch(`${base}/study-groups/${groupId}/sessions/${sessionId}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.push(status === 'attending' ? 'Asistencia confirmada' : 'Asistencia declinada', 'success');
        fetchSessions();
      } else {
        const err = await res.json();
        toast.push(err.error || 'Error al actualizar asistencia', 'error');
      }
    } catch (e) {
      toast.push('Error de red', 'error');
    }
  };

  const getMyAttendance = (session: StudySession) => {
    // @ts-ignore
    if (!session.attendances) return 'pending';
    // @ts-ignore
    const profileId = useAuthStore.getState().user?.id;
    // @ts-ignore
    const att = session.attendances.find((a: any) => a.userId === profileId);
    return att ? att.status : 'pending';
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Card className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-lg" style={{ color: '#00132a' }}>Sesiones de Estudio</h2>
          <p className="text-sm mt-0.5" style={{ color: '#73777f' }}>Toca un día marcado para ver las sesiones.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setShowCreate(true); setForm(emptyForm()); setFormError(''); }}
            style={{ background: '#D4AF37', color: '#fff' }}>
            + Nueva sesión
          </Button>
        )}
      </div>

      {/* Calendar nav */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="px-2 py-1 rounded hover:bg-gray-100 text-lg font-bold" style={{ color: '#00132a' }}>‹</button>
        <span className="font-semibold text-sm" style={{ color: '#00132a' }}>{MONTHS[calMonth]} {calYear}</span>
        <button onClick={nextMonth} className="px-2 py-1 rounded hover:bg-gray-100 text-lg font-bold" style={{ color: '#00132a' }}>›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#73777f' }}>{d}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const key = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const hasSessions = Boolean(sessionsByDay[key]);
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;
          return (
            <button key={key}
              onClick={() => hasSessions && setSelectedKey(p => p === key ? null : key)}
              className="relative flex items-center justify-center aspect-square rounded-full transition-all"
              style={{
                background: isSelected ? '#D4AF37' : isToday ? '#001c39' : hasSessions ? '#FFF9E6' : 'transparent',
                color: (isSelected || isToday) ? '#fff' : '#00132a',
                border: hasSessions && !isSelected && !isToday ? '2px solid #D4AF37' : '2px solid transparent',
                cursor: hasSessions ? 'pointer' : 'default',
                opacity: hasSessions || isToday ? 1 : 0.55,
              }}>
              <span className={`leading-none ${hasSessions ? 'font-bold text-sm' : 'font-medium text-xs'}`}>{day}</span>
              {hasSessions && (
                <span 
                  className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full shadow-md"
                  style={{ 
                    background: (isSelected || isToday) ? '#fff' : '#D4AF37',
                    color: (isSelected || isToday) ? '#D4AF37' : '#fff',
                    fontSize: '10px'
                  }}
                >
                  ★
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading
        ? <p className="text-xs text-center" style={{ color: '#73777f' }}>Cargando sesiones...</p>
        : sessions.length === 0
          ? <p className="text-xs text-center" style={{ color: '#73777f' }}>No hay sesiones programadas aún.</p>
          : <p className="text-xs text-center" style={{ color: '#73777f' }}>{sessions.length} sesión{sessions.length !== 1 ? 'es' : ''} · Toca un día marcado</p>}

      {/* Selected-day sessions */}
      {selectedKey && selectedSessions.length > 0 && (
        <div className="border-t pt-4 space-y-2" style={{ borderColor: '#e9ecef' }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#73777f' }}>
            Sesiones del {selectedKey.split('-').reverse().join('/')}
          </p>
          {selectedSessions.map(s => (
            <div key={s.id} className="flex items-start justify-between rounded-xl p-3 gap-3"
              style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: '#00132a' }}>{s.name}</p>
                {s.description && <p className="text-xs mt-0.5" style={{ color: '#73777f' }}>{s.description}</p>}
                <p className="text-xs mt-1" style={{ color: '#73777f' }}>🕐 {formatTime(s.startTime)} – {formatTime(s.endTime)}</p>
                {s.location && <p className="text-xs mt-0.5" style={{ color: '#3b5bdb' }}>📍 {s.location}</p>}
                {s.recurrenceType && s.recurrenceType !== 'none' && (
                  <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1"
                    style={{ background: '#d3e3ff', color: '#001c39' }}>
                    🔁 {RECURRENCE_LABELS[s.recurrenceType]}
                  </span>
                )}
              </div>
              {(isAdmin || s.creatorId === (useAuthStore.getState() as any).user?.id) && (
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(s)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-80 transition"
                    style={{ background: '#001c39', color: '#fff' }}>
                    Editar
                  </button>
                  <button onClick={() => handleCancelSession(s.id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-80 transition"
                    style={{ background: '#dc3545', color: '#fff' }}>
                    Cancelar
                  </button>
                </div>
              )}
              {!(isAdmin || s.creatorId === (useAuthStore.getState() as any).user?.id) ? (
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <p className="text-xs font-medium text-center" style={{ color: '#73777f' }}>Asistencia:</p>
                  <button onClick={() => updateAttendance(s.id, 'attending')}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-80 transition"
                    style={{ 
                      background: getMyAttendance(s) === 'attending' ? '#e2fadb' : '#f8f9fa', 
                      color: getMyAttendance(s) === 'attending' ? '#2b8a3e' : '#495057',
                      border: '1px solid',
                      borderColor: getMyAttendance(s) === 'attending' ? '#2b8a3e' : '#ced4da'
                    }}>
                    Asistiré
                  </button>
                  <button onClick={() => updateAttendance(s.id, 'declined')}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-80 transition"
                    style={{ 
                      background: getMyAttendance(s) === 'declined' ? '#ffe3e3' : '#f8f9fa', 
                      color: getMyAttendance(s) === 'declined' ? '#e03131' : '#495057',
                      border: '1px solid',
                      borderColor: getMyAttendance(s) === 'declined' ? '#e03131' : '#ced4da'
                    }}>
                    Declinar
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 flex-shrink-0 items-center justify-center bg-gray-50 rounded-lg p-2 border border-gray-100">
                  <span className="text-lg">👥</span>
                  <p className="text-xs font-bold text-center" style={{ color: '#00132a' }}>
                    {/* @ts-ignore */}
                    {(s as any).attendances?.filter((a: any) => a.status === 'attending').length || 0} confirmados
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Create Modal ─────────────────────────────────────────────────── */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Programar sesión de estudio"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button className="flex-1" disabled={creating} style={{ background: '#D4AF37', color: '#fff' }} onClick={handleCreate}>
              {creating ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        }>
        <div className="space-y-4">
          {formError && (
            <div className="rounded-lg px-3 py-2 text-sm" style={{ background: '#fff0f0', color: '#c92a2a', border: '1px solid #ffc9c9' }}>
              ⚠ {formError}
            </div>
          )}

          <label className="block">
            <span className="text-sm font-medium" style={{ color: '#00132a' }}>Nombre *</span>
            <input type="text" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </label>

          <label className="block">
            <span className="text-sm font-medium" style={{ color: '#00132a' }}>Descripción</span>
            <input type="text" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </label>

          <label className="block">
            <span className="text-sm font-medium" style={{ color: '#00132a' }}>Lugar o enlace de sesión</span>
            <input type="text" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Ej: Sala B-204, https://meet.google.com/..."
              value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </label>

          <label className="block">
            <span className="text-sm font-medium" style={{ color: '#00132a' }}>Fecha y hora de inicio *</span>
            <input type="datetime-local" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              min={minStartValue()}
              value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
            <p className="text-xs mt-1" style={{ color: '#73777f' }}>Mínimo 20 minutos desde ahora.</p>
          </label>

          <label className="block">
            <span className="text-sm font-medium" style={{ color: '#00132a' }}>Duración *</span>
            <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              value={form.durationMinutes}
              onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))}>
              {DURATION_OPTIONS.map(o => (
                <option key={o.minutes} value={o.minutes}>{o.label}</option>
              ))}
            </select>
            {form.startTime && (
              <p className="text-xs mt-1" style={{ color: '#73777f' }}>
                Fin calculado: {addMinutes(form.startTime, form.durationMinutes).replace('T', ' ')}
              </p>
            )}
          </label>

          <label className="block">
            <span className="text-sm font-medium" style={{ color: '#00132a' }}>Recurrencia</span>
            <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              value={form.recurrenceType}
              onChange={e => setForm(f => ({ ...f, recurrenceType: e.target.value, recurrenceEndDate: '' }))}>
              <option value="none">Sin recurrencia (solo una vez)</option>
              <option value="daily">Diaria</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
          </label>

          {form.recurrenceType !== 'none' && (
            <label className="block">
              <span className="text-sm font-medium" style={{ color: '#00132a' }}>Repetir hasta *</span>
              <input type="datetime-local" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                min={form.startTime || minStartValue()}
                value={form.recurrenceEndDate}
                onChange={e => setForm(f => ({ ...f, recurrenceEndDate: e.target.value }))} />
            </label>
          )}
        </div>
      </Modal>

      {/* ── Edit form modal ──────────────────────────────────────────────── */}
      <Modal isOpen={Boolean(editingSession) && !showScope} onClose={closeEdit} title="Editar sesión"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={closeEdit}>Cancelar</Button>
            <Button className="flex-1" style={{ background: '#001c39', color: '#fff' }} onClick={handleEditNext}>Siguiente</Button>
          </div>
        }>
        {editingSession && (
          <div className="space-y-4">
            <div className="rounded-xl p-3 text-sm" style={{ background: '#f0f4ff', border: '1px solid #c7d7ff' }}>
              <p style={{ color: '#001c39' }}>📅 {formatDateTime(editingSession.startTime)} – {formatTime(editingSession.endTime)}</p>
              {editingSession.location && <p className="mt-1 text-xs" style={{ color: '#3b5bdb' }}>📍 {editingSession.location}</p>}
              {editingSession.recurrenceType !== 'none' && (
                <p className="mt-1 text-xs font-medium" style={{ color: '#3b5bdb' }}>
                  🔁 Serie {RECURRENCE_LABELS[editingSession.recurrenceType]}
                </p>
              )}
            </div>
            <label className="block">
              <span className="text-sm font-medium" style={{ color: '#00132a' }}>Nombre</span>
              <input type="text" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </label>
            <label className="block">
              <span className="text-sm font-medium" style={{ color: '#00132a' }}>Descripción</span>
              <input type="text" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
            </label>
            <label className="block">
              <span className="text-sm font-medium" style={{ color: '#00132a' }}>Lugar o enlace</span>
              <input type="text" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Ej: Sala B-204, https://meet.google.com/..."
                value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} />
            </label>
          </div>
        )}
      </Modal>

      {/* ── Scope modal (Criterio 5) ─────────────────────────────────────── */}
      <Modal isOpen={showScope} onClose={closeEdit} title="¿A qué sesiones aplica el cambio?" footer={null}>
        <div className="space-y-3 pb-2">
          <p className="text-sm" style={{ color: '#73777f' }}>Esta sesión es parte de una serie recurrente.</p>
          <button disabled={submittingEdit} onClick={() => void submitEdit('this')}
            className="w-full text-left rounded-xl p-4 border-2 hover:border-yellow-400 transition"
            style={{ borderColor: '#e9ecef', background: '#fff' }}>
            <p className="font-semibold text-sm" style={{ color: '#00132a' }}>Solo esta sesión</p>
            <p className="text-xs mt-1" style={{ color: '#73777f' }}>El resto de la serie no cambia.</p>
          </button>
          <button disabled={submittingEdit} onClick={() => void submitEdit('future')}
            className="w-full text-left rounded-xl p-4 border-2 hover:border-blue-400 transition"
            style={{ borderColor: '#e9ecef', background: '#fff' }}>
            <p className="font-semibold text-sm" style={{ color: '#00132a' }}>Esta y las siguientes</p>
            <p className="text-xs mt-1" style={{ color: '#73777f' }}>Aplica el cambio a todas las sesiones futuras de la serie.</p>
          </button>
          {submittingEdit && <p className="text-xs text-center" style={{ color: '#73777f' }}>Guardando...</p>}
        </div>
      </Modal>
    </Card>
  );
}
