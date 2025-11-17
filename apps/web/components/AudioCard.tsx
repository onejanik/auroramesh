import type { AudioNote } from '../types/audio';
import { ReportButton } from './ReportButton';

type Props = {
  note: AudioNote;
};

const getMediaSrc = (path: string) => (path.startsWith('http') ? path : `/api/media?path=${encodeURIComponent(path)}`);

export const AudioCard = ({ note }: Props) => (
  <article className="card">
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <strong>{note.author.name ?? 'Unbekannt'}</strong>
        <p style={{ margin: 0, color: 'var(--muted)' }}>{new Date(note.createdAt).toLocaleString()}</p>
      </div>
      <ReportButton targetType="audio" targetId={note.id} />
    </header>
    {note.caption && <p style={{ whiteSpace: 'pre-wrap' }}>{note.caption}</p>}
    <audio controls style={{ width: '100%', marginTop: '0.5rem' }} src={getMediaSrc(note.audioUrl)} />
  </article>
);

