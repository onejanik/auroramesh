import { useState } from 'react';
import useSWR from 'swr';
import { Layout } from '../components/Layout';
import { PostList } from '../components/PostList';
import { StoryRail } from '../components/StoryRail';
import { PollCard } from '../components/PollCard';
import { EventCard } from '../components/EventCard';
import { SlideshowCard } from '../components/SlideshowCard';
import { AudioCard } from '../components/AudioCard';
import { fetcher } from '../lib/fetcher';
import { requirePageAuth } from '../lib/auth/pageAuth';
import { useCurrentUser } from '../lib/hooks/useCurrentUser';
import type { Post } from '../types/post';
import type { Story } from '../types/story';
import type { Poll } from '../types/poll';
import type { Event } from '../types/event';
import type { Slideshow } from '../types/slideshow';
import type { AudioNote } from '../types/audio';

type FeedResponse = {
  posts: Post[];
  nextCursor: string | null;
};

type StoriesResponse = {
  stories: Story[];
};

type PollsResponse = {
  polls: Poll[];
};

type EventsResponse = {
  events: Event[];
};

type SlideshowsResponse = {
  slideshows: Slideshow[];
};

type AudiosResponse = {
  audios: AudioNote[];
};

const FeedPage = () => {
  const { user } = useCurrentUser();
  const shouldFetch = typeof user?.id === 'number';
  
  // Feed-Filter State
  const [showPolls, setShowPolls] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [showSlideshows, setShowSlideshows] = useState(true);
  const [showAudios, setShowAudios] = useState(true);
  const [showPosts, setShowPosts] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  
  const { data, isLoading, error } = useSWR<FeedResponse>(
    shouldFetch ? `/api/posts?limit=20&excludeUserId=${user!.id}` : null,
    fetcher
  );
  const { data: storiesData } = useSWR<StoriesResponse>(shouldFetch ? '/api/stories' : null, fetcher, {
    refreshInterval: 60_000
  });
  const { data: pollsData } = useSWR<PollsResponse>(shouldFetch ? `/api/polls?excludeUserId=${user!.id}` : null, fetcher, { refreshInterval: 60_000 });
  const { data: eventsData } = useSWR<EventsResponse>(shouldFetch ? `/api/events?excludeUserId=${user!.id}` : null, fetcher, { refreshInterval: 60_000 });
  const { data: slideshowsData } = useSWR<SlideshowsResponse>(shouldFetch ? `/api/slideshows?excludeUserId=${user!.id}` : null, fetcher);
  const { data: audiosData } = useSWR<AudiosResponse>(shouldFetch ? `/api/audios?excludeUserId=${user!.id}` : null, fetcher);
  const isFeedLoading = !shouldFetch || isLoading;

  return (
    <Layout>
      <StoryRail stories={storiesData?.stories ?? []} currentUser={user} />
      
      {showPolls && pollsData?.polls?.length ? (
        <div className="stack">
          {pollsData.polls.map((poll) => (
            <PollCard key={poll.id} poll={poll} />
          ))}
        </div>
      ) : null}
      
      {showEvents && eventsData?.events?.length ? (
        <div className="stack">
          {eventsData.events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : null}
      
      {showSlideshows && slideshowsData?.slideshows?.length ? (
        <div className="stack">
          {slideshowsData.slideshows.map((slideshow) => (
            <SlideshowCard key={slideshow.id} slideshow={slideshow} />
          ))}
        </div>
      ) : null}
      
      {showAudios && audiosData?.audios?.length ? (
        <div className="stack">
          {audiosData.audios.map((note) => (
            <AudioCard key={note.id} note={note} />
          ))}
        </div>
      ) : null}
      
      {error ? <p style={{ color: '#d63031' }}>Feed konnte nicht geladen werden.</p> : null}
      {showPosts && <PostList posts={data?.posts ?? []} isLoading={isFeedLoading} />}
      
      {/* Filter Button (fixed at bottom) */}
      <div style={{ 
        position: 'fixed', 
        bottom: '2rem', 
        right: '2rem', 
        zIndex: 40 
      }}>
        {filterOpen && (
          <div style={{ 
            marginBottom: '1rem', 
            padding: '1rem', 
            background: 'var(--card-bg)', 
            borderRadius: 16, 
            border: '1px solid var(--border)',
            boxShadow: '0 15px 40px var(--card-shadow)',
            minWidth: 250
          }}>
            <h4 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '0.95rem' }}>Feed-Filter</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={showPosts} onChange={(e) => setShowPosts(e.target.checked)} />
                <span>Posts</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={showPolls} onChange={(e) => setShowPolls(e.target.checked)} />
                <span>Umfragen</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={showEvents} onChange={(e) => setShowEvents(e.target.checked)} />
                <span>Events</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={showSlideshows} onChange={(e) => setShowSlideshows(e.target.checked)} />
                <span>Slideshows</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={showAudios} onChange={(e) => setShowAudios(e.target.checked)} />
                <span>Audio-Notizen</span>
              </label>
            </div>
          </div>
        )}
        <button
          type="button"
          className="pill-button"
          style={{ 
            background: 'var(--accent)', 
            color: 'var(--accent-contrast)',
            boxShadow: '0 8px 24px rgba(108, 92, 231, 0.3)',
            fontSize: '1.1rem',
            padding: '0.75rem 1.25rem'
          }}
          onClick={() => setFilterOpen(!filterOpen)}
        >
          <i className={`bi ${filterOpen ? 'bi-x-lg' : 'bi-funnel-fill'}`} />
          Filter
        </button>
      </div>
    </Layout>
  );
};

export default FeedPage;

export const getServerSideProps = (ctx: any) => requirePageAuth(ctx);

