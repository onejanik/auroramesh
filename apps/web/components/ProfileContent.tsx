import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import { PostList } from './PostList';
import { FollowersModal } from './FollowersModal';
import { PollCard } from './PollCard';
import { EventCard } from './EventCard';
import { SlideshowCard } from './SlideshowCard';
import { AudioCard } from './AudioCard';
import { fetcher } from '../lib/fetcher';
import type { Post } from '../types/post';
import type { Poll } from '../types/poll';
import type { Event } from '../types/event';
import type { Slideshow } from '../types/slideshow';
import type { AudioNote } from '../types/audio';
import type { UserRecord, UserStats } from '../lib/models/users';

type Props = {
  user: Pick<UserRecord, 'id' | 'name' | 'bio' | 'avatar_url' | 'is_private'>;
  posts: Post[];
  polls?: Poll[];
  events?: Event[];
  slideshows?: Slideshow[];
  audios?: AudioNote[];
  stats: UserStats;
  isOwner?: boolean;
  initialFollowing?: boolean;
  initialPending?: boolean;
  canViewContent?: boolean;
};

export const ProfileContent = ({ user, posts, polls = [], events = [], slideshows = [], audios = [], stats, isOwner = false, initialFollowing = false, initialPending = false, canViewContent = true }: Props) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isPending, setIsPending] = useState(initialPending);
  const [followerCount, setFollowerCount] = useState(stats.followerCount);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showModal, setShowModal] = useState<'followers' | 'following' | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  
  const isPrivateAccount = user.is_private && !canViewContent;
  
  // Fetch saved posts only if user is owner and on saved tab
  const { data: savedPostsData } = useSWR<{ posts: Post[]; nextCursor: string | null }>(
    isOwner && activeTab === 'saved' ? '/api/posts/saved' : null,
    fetcher
  );

  const handleToggleFollow = async () => {
    if (isOwner || isUpdating) return;
    setIsUpdating(true);
    try {
      const method = (isFollowing || isPending) ? 'DELETE' : 'POST';
      const response = await fetch(`/api/users/${user.id}/follow`, {
        method
      });
      if (!response.ok) {
        throw new Error('Aktion fehlgeschlagen');
      }
      const data = (await response.json()) as { followerCount: number; isFollowing: boolean; isPending?: boolean };
      setFollowerCount(data.followerCount);
      setIsFollowing(data.isFollowing);
      setIsPending(data.isPending ?? false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div>
      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.5rem',
          alignItems: 'center',
          marginBottom: '2rem',
          padding: '1.5rem',
          background: 'var(--card-bg)',
          borderRadius: 16,
          border: '1px solid var(--border)',
          boxShadow: '0 5px 20px var(--card-shadow)'
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: 'var(--avatar-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            fontWeight: 600,
            color: 'var(--text)'
          }}
        >
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar_url.startsWith('http') ? user.avatar_url : `/api/media?path=${encodeURIComponent(user.avatar_url)}`}
              alt={user.name}
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            (user.name?.[0] ?? '?')
          )}
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h1 style={{ margin: '0 0 0.5rem 0' }}>{user.name}</h1>
            {isPrivateAccount && (
              <span 
                style={{ 
                  padding: '0.25rem 0.75rem', 
                  background: 'var(--muted)', 
                  color: 'var(--bg)', 
                  borderRadius: 12, 
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                <i className="bi bi-lock-fill" /> Privat
              </span>
            )}
            {!isOwner && (
              <button
                type="button"
                onClick={handleToggleFollow}
                className="pill-button"
                disabled={isUpdating}
                style={{
                  background: isFollowing ? 'var(--border)' : isPending ? 'var(--muted)' : 'var(--accent)',
                  color: isFollowing ? 'var(--text)' : isPending ? 'var(--bg)' : 'var(--accent-contrast)'
                }}
              >
                <i className={`bi ${isFollowing ? 'bi-person-check-fill' : isPending ? 'bi-clock' : 'bi-person-plus'}`} />
                {isFollowing ? 'Gefolgt' : isPending ? 'Angefragt' : 'Folgen'}
              </button>
            )}
          </div>
          {!isPrivateAccount && (
            <>
              <p style={{ margin: 0, color: 'var(--muted)', whiteSpace: 'pre-wrap' }}>{user.bio || 'Noch keine Bio vorhanden.'}</p>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', color: 'var(--muted)' }}>
                <Stat label="Beiträge" value={stats.postCount} />
                <Stat label="Follower" value={followerCount} onClick={() => setShowModal('followers')} clickable />
                <Stat label="Folgt" value={stats.followingCount} onClick={() => setShowModal('following')} clickable />
                <Stat label="Likes gesamt" value={stats.totalLikes} />
              </div>
            </>
          )}
          {isPrivateAccount && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
                <i className="bi bi-lock" /> Dieser Account ist privat. Folge diesem Account, um die Beiträge zu sehen.
              </p>
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', color: 'var(--muted)' }}>
                <Stat label="Follower" value={followerCount} onClick={() => setShowModal('followers')} clickable />
                <Stat label="Folgt" value={stats.followingCount} onClick={() => setShowModal('following')} clickable />
              </div>
            </div>
          )}
          {isOwner && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link href="/upload" className="pill-button">
                <i className="bi bi-upload" />
                Post erstellen
              </Link>
              <Link href="/profile" className="pill-button">
                <i className="bi bi-pencil-square" />
                Profil bearbeiten
              </Link>
            </div>
          )}
        </div>
      </section>

      {!isPrivateAccount && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>Beiträge</h2>
            {isOwner && (
              <div style={{ display: 'flex', gap: '0.5rem', border: '1px solid var(--border)', borderRadius: 12, padding: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('posts')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 8,
                    border: 'none',
                    background: activeTab === 'posts' ? 'var(--accent)' : 'transparent',
                    color: activeTab === 'posts' ? 'var(--accent-contrast)' : 'var(--text)',
                    cursor: 'pointer',
                    fontWeight: activeTab === 'posts' ? 600 : 400,
                    transition: 'all 0.2s ease'
                  }}
                >
                  Beiträge
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('saved')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 8,
                    border: 'none',
                    background: activeTab === 'saved' ? 'var(--accent)' : 'transparent',
                    color: activeTab === 'saved' ? 'var(--accent-contrast)' : 'var(--text)',
                    cursor: 'pointer',
                    fontWeight: activeTab === 'saved' ? 600 : 400,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <i className="bi bi-bookmark-fill" style={{ marginRight: '0.25rem' }} />
                  Gespeichert
                </button>
              </div>
            )}
          </div>
          {activeTab === 'saved' && isOwner ? (
            <div>
              {savedPostsData ? (
                savedPostsData.posts.length > 0 ? (
                  <PostList posts={savedPostsData.posts} isLoading={false} />
                ) : (
                  <p style={{ color: 'var(--muted)' }}>Du hast noch keine Beiträge gespeichert.</p>
                )
              ) : (
                <p style={{ color: 'var(--muted)' }}>Wird geladen...</p>
              )}
            </div>
          ) : (
            <>
              {posts.length === 0 && polls.length === 0 && events.length === 0 && slideshows.length === 0 && audios.length === 0 ? (
                <p style={{ color: 'var(--muted)' }}>
                  {isOwner ? 'Du hast noch nichts gepostet. Starte mit deinem ersten Beitrag!' : 'Noch keine Beiträge vorhanden.'}
                </p>
              ) : (
                <div>
                  {polls.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Umfragen</h3>
                      <div className="stack">
                        {polls.map((poll) => (
                          <PollCard key={poll.id} poll={poll} />
                        ))}
                      </div>
                    </div>
                  )}
                  {events.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Events</h3>
                      <div className="stack">
                        {events.map((event) => (
                          <EventCard key={event.id} event={event} />
                        ))}
                      </div>
                    </div>
                  )}
                  {slideshows.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Slideshows</h3>
                      <div className="stack">
                        {slideshows.map((slideshow) => (
                          <SlideshowCard key={slideshow.id} slideshow={slideshow} />
                        ))}
                      </div>
                    </div>
                  )}
                  {audios.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Audio-Notizen</h3>
                      <div className="stack">
                        {audios.map((audio) => (
                          <AudioCard key={audio.id} note={audio} />
                        ))}
                      </div>
                    </div>
                  )}
                  {posts.length > 0 && (
                    <div>
                      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Posts</h3>
                      <PostList posts={posts} isLoading={false} />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {showModal && <FollowersModal userId={user.id} type={showModal} onClose={() => setShowModal(null)} />}
    </div>
  );
};

const Stat = ({ label, value, onClick, clickable }: { label: string; value: number; onClick?: () => void; clickable?: boolean }) => (
  <div
    style={{
      textAlign: 'center',
      cursor: clickable ? 'pointer' : 'default',
      transition: 'opacity 0.2s ease'
    }}
    onClick={onClick}
    onMouseEnter={(e) => {
      if (clickable) e.currentTarget.style.opacity = '0.7';
    }}
    onMouseLeave={(e) => {
      if (clickable) e.currentTarget.style.opacity = '1';
    }}
  >
    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
    <small>{label}</small>
  </div>
);

