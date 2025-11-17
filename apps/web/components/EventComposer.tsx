import { useState, FormEvent } from 'react';

type Props = {
  onCreated?: () => void;
};

export const EventComposer = ({ onCreated }: Props) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, location, startsAt })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Event konnte nicht erstellt werden');
      }
      setTitle('');
      setDescription('');
      setLocation('');
      setStartsAt('');
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h3 style={{ marginTop: 0 }}>Event</h3>
      <label>
        Titel
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: '100%', padding: 8 }} />
      </label>
      <label>
        Datum & Zeit
        <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required style={{ width: '100%', padding: 8 }} />
      </label>
      <label>
        Ort
        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required style={{ width: '100%', padding: 8 }} />
      </label>
      <label>
        Beschreibung
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', minHeight: 120, padding: 8 }} />
      </label>
      {error && <p style={{ color: '#d63031' }}>{error}</p>}
      <button type="submit" className="pill-button" style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }} disabled={isSaving}>
        {isSaving ? 'Wird erstellt...' : 'Event veröffentlichen'}
      </button>
    </form>
  );
};

