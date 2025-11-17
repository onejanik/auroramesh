import Link from 'next/link';
import { useState } from 'react';
import type { Event } from '../types/event';
import { ReportButton } from './ReportButton';
import { useCurrentUser } from '../lib/hooks/useCurrentUser';
import { isAdminUser } from '../lib/auth/isAdmin';

type Props = {
  event: Event;
  viewerId?: number;
  isOwner?: boolean;
};

export const EventCard = ({ event, viewerId, isOwner: propIsOwner }: Props) => {
  const { user } = useCurrentUser();
  const [current, setCurrent] = useState(event);
  const [isBusy, setBusy] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  
  const isOwner = propIsOwner ?? (user && current.author.id === user.id);
  const isAdmin = user ? isAdminUser({ id: user.id, email: user.email } as any) : false;

  const handleDelete = async () => {
    if (!confirm('Möchtest du dieses Event wirklich löschen?')) return;
    try {
      const response = await fetch(`/api/events/${current.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Löschen fehlgeschlagen');
      setIsDeleted(true);
    } catch (error) {
      console.error(error);
      alert('Fehler beim Löschen');
    }
  };

  const toggleRsvp = async () => {
    setBusy(true);
    try {
      const response = await fetch(`/api/events/${current.id}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attending: !current.viewerRsvp })
      });
      if (!response.ok) throw new Error('RSVP fehlgeschlagen');
      const updated = (await response.json()) as Event;
      setCurrent(updated);
    } catch (error) {
      console.error(error);
    } finally {
      setBusy(false);
    }
  };

  if (isDeleted) {
    return null;
  }

  return (
    <article className="card">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong>{current.title}</strong>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            <Link href={`/users/${current.author.id}`} style={{ textDecoration: 'none', color: 'var(--muted)' }}>
              {current.author.name ?? 'Unbekannt'}
            </Link>
            {' • '}
            {new Date(current.startsAt).toLocaleString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {!isOwner && <ReportButton targetType="event" targetId={current.id} authorId={current.author.id} />}
          {(isOwner || isAdmin) && (
            <button
              type="button"
              className="icon-button"
              onClick={handleDelete}
              style={{ color: '#e74c3c', borderColor: '#e74c3c' }}
              title="Event löschen"
            >
              <i className="bi bi-trash-fill" />
            </button>
          )}
        </div>
      </header>
      <p style={{ margin: '0.5rem 0', color: 'var(--muted)' }}>{current.location}</p>
      {current.description && <p style={{ whiteSpace: 'pre-wrap' }}>{current.description}</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <small style={{ color: 'var(--muted)' }}>{current.stats.rsvps} Zusagen</small>
        <button type="button" className="pill-button" onClick={toggleRsvp} disabled={isBusy}>
          {current.viewerRsvp ? 'Teilnahme zurückziehen' : 'Ich bin dabei'}
        </button>
      </div>
    </article>
  );
};

