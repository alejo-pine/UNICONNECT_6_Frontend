import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@shared/components/ui/Card';
import { WallInboxItemRow } from '../components/WallInboxItem';
import { DmConversationItem } from '../components/DmConversationItem';
import { useWallInbox } from '../hooks/useWallInbox';
import { useDmInbox } from '../hooks/useDmInbox';

type Tab = 'grupos' | 'dm';

export function ChatInboxPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dm');
  const navigate = useNavigate();

  const { items: groups, loading: groupsLoading, error: groupsError } = useWallInbox();
  const { conversations, loading: dmLoading, error: dmError } = useDmInbox();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink-900">Mensajes</h1>
        <p className="mt-1 text-sm text-ink-500">
          Conversaciones directas y actividad de los muros de tus grupos.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl bg-ink-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('dm')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'dm'
              ? 'bg-white text-ink-900 shadow-sm'
              : 'text-ink-500 hover:text-ink-700'
          }`}
        >
          Mensajes directos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('grupos')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'grupos'
              ? 'bg-white text-ink-900 shadow-sm'
              : 'text-ink-500 hover:text-ink-700'
          }`}
        >
          Grupos
        </button>
      </div>

      {/* Groups tab */}
      {activeTab === 'grupos' && (
        <>
          {groupsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[72px] animate-pulse rounded-xl bg-ink-100" />
              ))}
            </div>
          ) : groupsError ? (
            <Card className="text-sm font-medium text-red-600">{groupsError}</Card>
          ) : groups.length === 0 ? (
            <Card className="py-12 text-center text-sm text-ink-500">
              No tienes grupos con actividad aún.
            </Card>
          ) : (
            <div className="space-y-3">
              {groups.map((item) => (
                <WallInboxItemRow
                  key={item.groupId}
                  item={item}
                  onClick={() => navigate(`/chat/groups/${item.groupId}/wall`)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* DM tab */}
      {activeTab === 'dm' && (
        <>
          {dmLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[72px] animate-pulse rounded-xl bg-ink-100" />
              ))}
            </div>
          ) : dmError ? (
            <Card className="text-sm font-medium text-red-600">{dmError}</Card>
          ) : conversations.length === 0 ? (
            <Card className="py-12 text-center text-sm text-ink-500">
              No tienes mensajes directos aún.
            </Card>
          ) : (
            <div className="space-y-3">
              {conversations.map((conv) => (
                <DmConversationItem
                  key={conv.id}
                  conversation={conv}
                  onClick={() =>
                    navigate(`/chat/dm/${conv.id}`, { state: { partner: conv.otherParticipant } })
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
