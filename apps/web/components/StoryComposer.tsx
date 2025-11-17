import { useState, FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
  onCreated?: () => void;
};

const getVideoDuration = (file: File): Promise<number> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Videodauer konnte nicht ermittelt werden'));
    };
  });

export const StoryComposer = ({ onCreated }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setUploading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!file) {
      setError('Bitte wähle ein Bild oder Video aus');
      return;
    }
    try {
      setUploading(true);

      let durationSeconds: number | undefined;
      if (file.type.startsWith('video/')) {
        durationSeconds = await getVideoDuration(file);
        if (durationSeconds > 60) {
          throw new Error('Videos dürfen maximal 60 Sekunden lang sein.');
        }
      }

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

      const storyRes = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaUrl: storagePath,
          mediaType,
          caption,
          durationSeconds: durationSeconds ? Math.round(durationSeconds) : undefined
        })
      });
      if (!storyRes.ok) {
        throw new Error('Story konnte nicht gespeichert werden');
      }

      setCaption('');
      setFile(null);
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h3 style={{ marginTop: 0 }}>Story erstellen</h3>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>Stories verschwinden nach 24 Stunden.</p>
      <textarea
        placeholder="Kurztext (optional, Markdown möglich)"
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
        style={{ width: '100%', minHeight: 60, marginBottom: '1rem', padding: '0.75rem' }}
      />
      <input
        type="file"
        accept="image/*,video/*"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        style={{ marginBottom: '1rem' }}
      />
      {error && (
        <p style={{ color: '#d63031', marginTop: 0 }}>
          {error}
        </p>
      )}
      {caption && (
        <div className="markdown-preview">
          <small style={{ color: 'var(--muted)' }}>Vorschau</small>
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{caption}</ReactMarkdown>
          </div>
        </div>
      )}
      <button
        type="submit"
        className="pill-button"
        disabled={isUploading || !file}
        style={{ alignSelf: 'flex-start', background: 'var(--accent)', color: 'var(--accent-contrast)' }}
      >
        {isUploading ? 'Wird veröffentlicht...' : 'Story teilen'}
      </button>
    </form>
  );
};

