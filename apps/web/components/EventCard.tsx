import { useState } from 'react';
import type { Event } from '../types/event';
import { ReportButton } from './ReportButton';

type Props = {
  event: Event;
};

export const EventCard = ({ event }: Props) => {
  const [current, setCurrent] = useState(event);
  const [isBusy, setBusy] = useState(false);

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

  return (
    <article className="card">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong>{current.title}</strong>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{new Date(current.startsAt).toLocaleString()}</p>
        </div>
        <ReportButton targetType="event" targetId={current.id} />
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

