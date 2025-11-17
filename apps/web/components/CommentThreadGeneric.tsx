import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import type { Comment } from '../types/comment';
import { fetcher } from '../lib/fetcher';
import { useCurrentUser } from '../lib/hooks/useCurrentUser';

type Props = {
  targetType: 'post' | 'poll' | 'event' | 'slideshow' | 'audio';
  targetId: number;
  authorId: number;
};

const CommentItem = ({ 
  comment, 
  onReply, 
  onDelete, 
  currentUserId, 
  authorId 
}: { 
  comment: Comment; 
  onReply: (parentId: number) => void;
  onDelete: (commentId: number) => void;
  currentUserId?: number;
  authorId: number;
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const targetId = comment.targetId ?? comment.postId;
  const targetType = comment.targetType ?? 'post';
  
  const { data } = useSWR<{ comments: Comment[] }>(
    showReplies && targetId ? `/api/comments?targetType=${targetType}&targetId=${targetId}&parentId=${comment.id}` : null,
    fetcher
  );
  
  const canDelete = currentUserId === comment.author.id || currentUserId === authorId;

  return (
    <div className="comment-item">
      <div className="comment-meta">
        <strong>{comment.author.name ?? 'Unbekannt'}</strong>
        <small>{new Date(comment.createdAt).toLocaleString()}</small>
      </div>
      <p style={{ margin: '0.25rem 0', whiteSpace: 'pre-wrap' }}>
        {comment.content.split(/(@\w+)/g).map((part, idx) => {
          if (part.startsWith('@')) {
            const username = part.substring(1);
            return (
              <Link key={idx} href={`/users/${encodeURIComponent(username)}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                {part}
              </Link>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </p>
      <div className="comment-actions">
        {comment.repliesCount > 0 && (
          <button type="button" className="link-button" onClick={() => setShowReplies((value) => !value)}>
            {showReplies ? 'Replies verbergen' : `${comment.repliesCount} Replies anzeigen`}
          </button>
        )}
        <button type="button" className="link-button" onClick={() => onReply(comment.id)}>
          Antworten
        </button>
        {canDelete && (
          <button 
            type="button" 
            className="link-button" 
            onClick={() => onDelete(comment.id)}
            style={{ color: '#e74c3c' }}
          >
            Löschen
          </button>
        )}
      </div>
      {showReplies && data?.comments?.length ? (
        <div className="comment-replies">
          {data.comments.map((reply) => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              onReply={onReply} 
              onDelete={onDelete}
              currentUserId={currentUserId}
              authorId={authorId}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export const CommentThreadGeneric = ({ targetType, targetId, authorId }: Props) => {
  const { user } = useCurrentUser();
  const { data, mutate } = useSWR<{ comments: Comment[] }>(
    `/api/comments?targetType=${targetType}&targetId=${targetId}`,
    fetcher
  );
  const [content, setContent] = useState('');
  const [parentId, setParentId] = useState<number | undefined>(undefined);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          targetType, 
          targetId, 
          content, 
          parentCommentId: parentId 
        })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Kommentar fehlgeschlagen');
      }
      setContent('');
      setParentId(undefined);
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDelete = async (commentId: number) => {
    if (!confirm('Möchtest du diesen Kommentar wirklich löschen?')) return;
    try {
      const response = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Löschen fehlgeschlagen');
      mutate();
    } catch (err) {
      alert('Fehler beim Löschen');
    }
  };

  return (
    <div className="comments" style={{ marginTop: '1rem', padding: '0 1rem 1rem' }}>
      <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Kommentare</h4>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentId ? 'Antwort verfassen…' : 'Kommentar verfassen…'}
        style={{ width: '100%', minHeight: 80, marginBottom: '0.5rem', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--border)' }}
      />
      {parentId && (
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          Du antwortest auf Kommentar #{parentId}{' '}
          <button type="button" className="link-button" onClick={() => setParentId(undefined)}>
            (Abbrechen)
          </button>
        </p>
      )}
      {error && <p style={{ color: '#d63031', fontSize: '0.9rem' }}>{error}</p>}
      <button type="button" className="pill-button" onClick={submit} disabled={isSubmitting}>
        {isSubmitting ? 'Sendet...' : 'Absenden'}
      </button>
      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {data?.comments?.map((comment) => (
          <CommentItem 
            key={comment.id} 
            comment={comment} 
            onReply={(id) => setParentId(id)}
            onDelete={handleDelete}
            currentUserId={user?.id}
            authorId={authorId}
          />
        ))}
      </div>
    </div>
  );
};

