import { useState } from 'react';

type Props = {
  onCreated?: () => void;
};

export const SlideshowComposer = ({ onCreated }: Props) => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [caption, setCaption] = useState('');
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!files?.length) {
      setError('Bitte wähle mindestens ein Bild');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const uploads = [];
      for (let i = 0; i < files.length; i += 1) {
        const formData = new FormData();
        formData.append('file', files[i]);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) throw new Error('Upload fehlgeschlagen');
        const { storagePath } = await uploadRes.json();
        uploads.push(storagePath);
      }
      const response = await fetch('/api/slideshows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaUrls: uploads, caption })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Slideshow konnte nicht gespeichert werden');
      }
      setFiles(null);
      setCaption('');
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Bilder-Slideshow</h3>
      <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Beschreibung (optional)" style={{ width: '100%', minHeight: 80, padding: 8 }} />
      <input type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} style={{ marginTop: '1rem' }} />
      {error && <p style={{ color: '#d63031' }}>{error}</p>}
      <button
        type="button"
        className="pill-button"
        style={{ background: 'var(--accent)', color: 'var(--accent-contrast)', marginTop: '1rem' }}
        onClick={handleSubmit}
        disabled={isSaving}
      >
        {isSaving ? 'Wird erstellt...' : 'Slideshow teilen'}
      </button>
    </div>
  );
};

