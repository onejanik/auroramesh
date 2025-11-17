import Link from 'next/link';
import { useState } from 'react';
import type { Story } from '../types/story';

type Props = {
  stories: Story[];
  currentUser?: {
    name: string | null;
    avatar_url: string | null;
  } | null;
};

export const StoryRail = ({ stories, currentUser }: Props) => {
  const [active, setActive] = useState<Story | null>(null);
  const hasStories = stories.length > 0;

  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2>Stories</h2>
      <div className="story-rail">
        {!hasStories && (
          <Link href="/upload" className="story-chip story-chip--cta">
            <div className="story-avatar story-avatar--cta">
              {currentUser?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentUser.avatar_url} alt={currentUser.name ?? 'Avatar'} />
              ) : (
                <span>{currentUser?.name?.[0] ?? '+'}</span>
              )}
              <span className="story-avatar__plus">
                <i className="bi bi-plus" />
              </span>
            </div>
            <small>Story erstellen</small>
          </Link>
        )}
        {stories.map((story) => (
          <button key={story.id} type="button" className="story-chip" onClick={() => setActive(story)}>
            <div className="story-avatar">
              {story.author.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={story.author.avatarUrl} alt={story.author.name ?? 'Avatar'} />
              ) : (
                <span>{story.author.name?.[0] ?? '?'}</span>
              )}
            </div>
            <small>{story.author.name ?? 'Unbekannt'}</small>
          </button>
        ))}
      </div>
      {active && (
        <div className="story-modal" role="dialog" aria-modal="true">
          <div className="story-modal__content">
            <button type="button" className="story-modal__close icon-button" onClick={() => setActive(null)}>
              <i className="bi bi-x-lg" />
            </button>
            <div className="story-modal__media">
              {active.mediaType === 'video' ? (
                <video autoPlay controls src={`/api/media?path=${encodeURIComponent(active.mediaUrl)}`} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/media?path=${encodeURIComponent(active.mediaUrl)}`} alt={active.caption ?? 'Story'} />
              )}
            </div>
            {active.caption && <p>{active.caption}</p>}
            <small>Sichtbar bis {new Date(active.expiresAt).toLocaleString()}</small>
          </div>
        </div>
      )}
    </section>
  );
};

