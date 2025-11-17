import Link from 'next/link';
import { useState } from 'react';
import type { AudioNote } from '../types/audio';
import { ReportButton } from './ReportButton';
import { CommentThreadGeneric } from './CommentThreadGeneric';
import { useCurrentUser } from '../lib/hooks/useCurrentUser';
import { isAdminUser } from '../lib/auth/isAdmin';

type Props = {
  note: AudioNote;
  viewerId?: number;
  isOwner?: boolean;
};

const getMediaSrc = (path: string) => (path.startsWith('http') ? path : `/api/media?path=${encodeURIComponent(path)}`);

export const AudioCard = ({ note, viewerId, isOwner: propIsOwner }: Props) => {
  const { user } = useCurrentUser();
  const [isDeleted, setIsDeleted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
  const isOwner = propIsOwner ?? (user && note.author.id === user.id);
  const isAdmin = user ? isAdminUser({ id: user.id, email: user.email } as any) : false;

  const handleDelete = async () => {
    if (!confirm('Möchtest du diese Audio-Notiz wirklich löschen?')) return;
    try {
      const response = await fetch(`/api/audios/${note.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Löschen fehlgeschlagen');
      setIsDeleted(true);
    } catch (error) {
      console.error(error);
      alert('Fehler beim Löschen');
    }
  };

  if (isDeleted) {
    return null;
  }

  return (
    <article className="card">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link href={`/users/${note.author.id}`} style={{ textDecoration: 'none', color: 'var(--text)' }}>
            <strong>{note.author.name ?? 'Unbekannt'}</strong>
          </Link>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{new Date(note.createdAt).toLocaleString()}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {!isOwner && <ReportButton targetType="audio" targetId={note.id} authorId={note.author.id} />}
          {(isOwner || isAdmin) && (
            <button
              type="button"
              className="icon-button"
              onClick={handleDelete}
              style={{ color: '#e74c3c', borderColor: '#e74c3c' }}
              title="Audio-Notiz löschen"
            >
              <i className="bi bi-trash-fill" />
            </button>
          )}
        </div>
      </header>
      {note.caption && <p style={{ whiteSpace: 'pre-wrap' }}>{note.caption}</p>}
      <audio controls style={{ width: '100%', marginTop: '0.5rem' }} src={getMediaSrc(note.audioUrl)} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
        <button 
          type="button" 
          className="icon-button" 
          onClick={() => setShowComments((value) => !value)}
          style={{ fontSize: '0.9rem' }}
        >
          <i className="bi bi-chat-dots" />
          Kommentare
        </button>
      </div>
      {showComments && (
        <CommentThreadGeneric targetType="audio" targetId={note.id} authorId={note.author.id} />
      )}
    </article>
  );
};

