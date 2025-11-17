import { useState } from 'react';
import Link from 'next/link';
import { Layout } from '../components/Layout';
import { PostComposer } from '../components/PostComposer';
import { StoryComposer } from '../components/StoryComposer';
import { PollComposer } from '../components/PollComposer';
import { EventComposer } from '../components/EventComposer';
import { SlideshowComposer } from '../components/SlideshowComposer';
import { AudioComposer } from '../components/AudioComposer';
import { requirePageAuth } from '../lib/auth/pageAuth';

type Mode = 'post' | 'story' | 'poll' | 'event' | 'slideshow' | 'audio';

const CREATION_OPTIONS: { id: Mode; label: string; description: string; icon: string }[] = [
  { id: 'post', label: 'Post', description: 'Bild oder Video im Feed', icon: 'bi-image' },
  { id: 'story', label: 'Story', description: '24h sichtbar', icon: 'bi-lightning' },
  { id: 'poll', label: 'Umfrage', description: 'Lass die Community abstimmen', icon: 'bi-bar-chart' },
  { id: 'event', label: 'Event', description: 'Organisiere Treffen', icon: 'bi-calendar-event' },
  { id: 'slideshow', label: 'Slideshow', description: 'Mehrere Bilder in einem Post', icon: 'bi-images' },
  { id: 'audio', label: 'Audio', description: 'Sprachnachricht oder Sound', icon: 'bi-mic' }
];

const UploadPage = () => {
  const [active, setActive] = useState<Mode>('post');
  const [success, setSuccess] = useState<string | null>(null);

  const handleSuccess = (message: string) => {
    setSuccess(message);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSuccess(null), 6000);
  };

  const renderComposer = () => {
    switch (active) {
      case 'story':
        return <StoryComposer onCreated={() => handleSuccess('Story live!')} />;
      case 'poll':
        return <PollComposer onCreated={() => handleSuccess('Umfrage veröffentlicht.')} />;
      case 'event':
        return <EventComposer onCreated={() => handleSuccess('Event angelegt.')} />;
      case 'slideshow':
        return <SlideshowComposer onCreated={() => handleSuccess('Slideshow geteilt.')} />;
      case 'audio':
        return <AudioComposer onCreated={() => handleSuccess('Audio-Notiz publiziert.')} />;
      default:
        return <PostComposer onCreated={() => handleSuccess('Post veröffentlicht!')} />;
    }
  };

  return (
    <Layout>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1>Was möchtest du erstellen?</h1>
        <p style={{ color: 'var(--muted)' }}>Wähle ein Format – wir zeigen dir die passende Oberfläche.</p>
      </div>
      <div className="creation-tabs">
        {CREATION_OPTIONS.map((option) => (
          <button key={option.id} type="button" className={`creation-tab ${active === option.id ? 'is-active' : ''}`} onClick={() => setActive(option.id)}>
            <i className={`bi ${option.icon}`} />
            <div>
              <strong>{option.label}</strong>
              <p>{option.description}</p>
            </div>
          </button>
        ))}
      </div>
      {success && (
        <div className="upload-notice upload-notice--success" style={{ marginTop: '1rem' }}>
          {success} <Link href="/feed">Zum Feed</Link>
        </div>
      )}
      <div style={{ marginTop: '1.5rem' }}>{renderComposer()}</div>
    </Layout>
  );
};

export default UploadPage;

export const getServerSideProps = (ctx: any) => requirePageAuth(ctx);

