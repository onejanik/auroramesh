import { Layout } from '../components/Layout';
import { ProfileContent } from '../components/ProfileContent';
import { requirePageAuth } from '../lib/auth/pageAuth';
import { getUserById, getUserStats, type UserRecord, type UserStats } from '../lib/models/users';
import { listPosts } from '../lib/models/posts';
import { listPolls } from '../lib/models/polls';
import { listEvents } from '../lib/models/events';
import { listSlideshows } from '../lib/models/slideshows';
import { listAudioNotes } from '../lib/models/audios';
import type { Post } from '../types/post';
import type { Poll } from '../types/poll';
import type { Event } from '../types/event';
import type { Slideshow } from '../types/slideshow';
import type { AudioNote } from '../types/audio';

type Props = {
  user: Pick<UserRecord, 'id' | 'name' | 'bio' | 'avatar_url'>;
  posts: Post[];
  polls: Poll[];
  events: Event[];
  slideshows: Slideshow[];
  audios: AudioNote[];
  stats: UserStats;
};

const MePage = ({ user, posts, polls, events, slideshows, audios, stats }: Props) => (
  <Layout>
    <ProfileContent user={user} posts={posts} polls={polls} events={events} slideshows={slideshows} audios={audios} stats={stats} isOwner />
  </Layout>
);

export default MePage;

export const getServerSideProps = (ctx: any) =>
  requirePageAuth(ctx, async ({ userId }) => {
    const user = getUserById(userId);
    if (!user) {
      return { notFound: true };
    }

    const { posts } = listPosts(50, undefined, { userId, viewerId: userId });
    const polls = listPolls(userId, undefined, userId);
    const events = listEvents(userId, undefined, userId);
    const slideshows = listSlideshows(userId, undefined, userId);
    const audios = listAudioNotes(userId, undefined, userId);
    const stats = getUserStats(userId);

    return {
      props: {
        user,
        posts,
        polls,
        events,
        slideshows,
        audios,
        stats
      }
    };
  });

