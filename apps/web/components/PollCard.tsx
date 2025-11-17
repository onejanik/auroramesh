import Link from 'next/link';
import { useState } from 'react';
import type { Poll } from '../types/poll';
import { ReportButton } from './ReportButton';
import { CommentThreadGeneric } from './CommentThreadGeneric';
import { useCurrentUser } from '../lib/hooks/useCurrentUser';
import { isAdminUser } from '../lib/auth/isAdmin';

type Props = {
  poll: Poll;
  viewerId?: number;
  isOwner?: boolean;
};

export const PollCard = ({ poll, viewerId, isOwner: propIsOwner }: Props) => {
  const { user } = useCurrentUser();
  const [state, setState] = useState(poll);
  const [isVoting, setVoting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
  const isOwner = propIsOwner ?? (user && state.author.id === user.id);
  const isAdmin = user ? isAdminUser({ id: user.id, email: user.email } as any) : false;

  const totalVotes = state.options.reduce((sum, option) => sum + option.votes, 0);

  const handleDelete = async () => {
    if (!confirm('Möchtest du diese Umfrage wirklich löschen?')) return;
    try {
      const response = await fetch(`/api/polls/${state.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Löschen fehlgeschlagen');
      setIsDeleted(true);
    } catch (error) {
      console.error(error);
      alert('Fehler beim Löschen');
    }
  };

  const vote = async (optionId: string) => {
    setVoting(true);
    try {
      const response = await fetch(`/api/polls/${state.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId })
      });
      if (!response.ok) {
        throw new Error('Abstimmung fehlgeschlagen');
      }
      const updated = (await response.json()) as Poll;
      setState(updated);
    } catch (error) {
      console.error(error);
    } finally {
      setVoting(false);
    }
  };

  if (isDeleted) {
    return null;
  }

  return (
    <article className="card">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <Link href={`/users/${state.author.id}`} style={{ textDecoration: 'none', color: 'var(--text)' }}>
            <strong>{state.author.name ?? 'Unbekannt'}</strong>
          </Link>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{new Date(state.createdAt).toLocaleString()}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {!isOwner && <ReportButton targetType="poll" targetId={state.id} authorId={state.author.id} />}
          {(isOwner || isAdmin) && (
            <button
              type="button"
              className="icon-button"
              onClick={handleDelete}
              style={{ color: '#e74c3c', borderColor: '#e74c3c' }}
              title="Umfrage löschen"
            >
              <i className="bi bi-trash-fill" />
            </button>
          )}
        </div>
      </header>
      <h3>{state.question}</h3>
      <div className="poll-options">
        {state.options.map((option) => {
          const percentage = totalVotes ? Math.round((option.votes / totalVotes) * 100) : 0;
          const isSelected = state.viewerSelection === option.id;
          return (
            <button
              key={option.id}
              type="button"
              className={`poll-option ${isSelected ? 'is-selected' : ''}`}
              onClick={() => vote(option.id)}
              disabled={isVoting}
            >
              <span>{option.label}</span>
              <span>{percentage}%</span>
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
        <small style={{ color: 'var(--muted)' }}>{totalVotes} Stimmen</small>
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
        <CommentThreadGeneric targetType="poll" targetId={state.id} authorId={state.author.id} />
      )}
    </article>
  );
};

