import { useState } from 'react';

type Props = {
  onCreated?: () => void;
};

export const PollComposer = ({ onCreated }: Props) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((opt, idx) => (idx === index ? value : opt)));
  };

  const addOption = () => {
    if (options.length >= 6) return;
    setOptions((prev) => [...prev, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, options })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Umfrage konnte nicht erstellt werden');
      }
      setQuestion('');
      setOptions(['', '']);
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Umfrage</h3>
      <textarea
        placeholder="Frage"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        style={{ width: '100%', minHeight: 70, marginBottom: '1rem', padding: '0.75rem' }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
        {options.map((option, index) => (
          <div key={index} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={option}
              onChange={(event) => updateOption(index, event.target.value)}
              placeholder={`Option ${index + 1}`}
              style={{ flex: 1, padding: '0.5rem' }}
            />
            {options.length > 2 && (
              <button type="button" className="icon-button" onClick={() => removeOption(index)}>
                <i className="bi bi-x-lg" />
              </button>
            )}
          </div>
        ))}
        {options.length < 6 && (
          <button type="button" className="pill-button" onClick={addOption} style={{ alignSelf: 'flex-start' }}>
            <i className="bi bi-plus-circle" />
            Option hinzufügen
          </button>
        )}
      </div>
      {error && <p style={{ color: '#d63031' }}>{error}</p>}
      <button
        type="button"
        className="pill-button"
        style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
        onClick={handleSubmit}
        disabled={isSaving}
      >
        {isSaving ? 'Wird erstellt...' : 'Umfrage veröffentlichen'}
      </button>
    </div>
  );
};

