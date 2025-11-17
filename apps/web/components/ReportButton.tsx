import { useState } from 'react';

type Props = {
  targetType: 'post' | 'poll' | 'event' | 'slideshow' | 'audio' | 'story';
  targetId: number;
};

export const ReportButton = ({ targetType, targetId }: Props) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, reason })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Meldung fehlgeschlagen');
      }
      setReason('');
      setFeedback('Danke für dein Feedback.');
      setTimeout(() => {
        setFeedback(null);
        setOpen(false);
      }, 2000);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Fehler beim Melden');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="report-control">
      <button type="button" className="icon-button" onClick={() => setOpen((value) => !value)}>
        <i className="bi bi-flag" />
        Melden
      </button>
      {open && (
        <div className="report-popover">
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: 'var(--text)' }}>Inhalt melden</h4>
          <textarea 
            value={reason} 
            onChange={(e) => setReason(e.target.value)} 
            placeholder="Bitte beschreibe, warum du diesen Inhalt meldest..." 
          />
          {feedback && <small style={{ display: 'block', marginBottom: '0.5rem', color: feedback.includes('Danke') ? 'var(--accent)' : 'var(--muted)' }}>{feedback}</small>}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="pill-button small" 
              onClick={() => setOpen(false)}
              style={{ background: 'var(--border)', color: 'var(--text)' }}
            >
              Abbrechen
            </button>
            <button 
              type="button" 
              className="pill-button small" 
              onClick={submit} 
              disabled={isSubmitting || !reason.trim()}
              style={{ background: '#e74c3c', color: '#fff' }}
            >
              {isSubmitting ? 'Wird gemeldet...' : 'Melden'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

