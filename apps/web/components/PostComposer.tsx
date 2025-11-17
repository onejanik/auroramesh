import { FormEvent, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
  onCreated?: () => void;
};

export const PostComposer = ({ onCreated }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isUploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      if (!file) {
        setError('Bitte wähle eine Datei aus');
        return;
      }
      if (caption.length > 2200) {
        setError('Maximal 2200 Zeichen');
        return;
      }
      setUploading(true);

      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        throw new Error('Upload fehlgeschlagen');
      }

      const { storagePath, mediaType } = await uploadRes.json();

      const createRes = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaUrl: storagePath,
          mediaType,
          caption,
          tags: tagsInput
            .split(',')
            .map((tag) => tag.trim().toLowerCase())
            .filter(Boolean)
        })
      });

      if (!createRes.ok) {
        throw new Error('Speichern fehlgeschlagen');
      }

      setCaption('');
      setTagsInput('');
      setFile(null);
      onCreated?.();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h3 style={{ marginTop: 0 }}>Bild oder Video teilen</h3>
      <textarea
        placeholder="Was möchtest du erzählen?"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        style={{ width: '100%', minHeight: 80, marginBottom: '1rem', padding: '0.75rem' }}
      />
      <small style={{ color: 'var(--muted)', display: 'block', marginBottom: '0.5rem' }}>
        Markdown wird unterstützt (fett, Listen, Links usw.).
      </small>
      <input
        type="text"
        placeholder="Tags (kommagetrennt, z.B. vegan,travel)"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        style={{ width: '100%', padding: '0.6rem', marginBottom: '1rem', border: '1px solid var(--border)', borderRadius: 12 }}
      />
      <input
        type="file"
        accept="image/*,video/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        style={{ marginBottom: '1rem' }}
      />
      {error && (
        <p style={{ color: '#d63031', marginBottom: '1rem' }}>
          {error}
        </p>
      )}
      {caption && (
        <div className="markdown-preview">
          <small style={{ color: 'var(--muted)' }}>Markdown Vorschau</small>
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{caption}</ReactMarkdown>
          </div>
        </div>
      )}
      <button
        type="submit"
        disabled={isUploading || !file}
        style={{
          padding: '0.75rem 1.5rem',
          borderRadius: 999,
          border: 'none',
          background: 'var(--accent)',
          color: 'var(--accent-contrast)',
          fontWeight: 600,
          cursor: isUploading ? 'not-allowed' : 'pointer'
        }}
      >
        {isUploading ? 'Lädt hoch...' : 'Posten'}
      </button>
    </form>
  );
};

