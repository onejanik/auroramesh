import { Layout } from '../../components/Layout';
import { ProfileContent } from '../../components/ProfileContent';
import { requirePageAuth } from '../../lib/auth/pageAuth';
import { getUserById, getUserStats, getFollowStatus, canViewPrivateAccount, getUserByName, type UserRecord, type UserStats } from '../../lib/models/users';
import { listPosts } from '../../lib/models/posts';
import { listPolls } from '../../lib/models/polls';
import { listEvents } from '../../lib/models/events';
import { listSlideshows } from '../../lib/models/slideshows';
import { listAudioNotes } from '../../lib/models/audios';
import type { Post } from '../../types/post';
import type { Poll } from '../../types/poll';
import type { Event } from '../../types/event';
import type { Slideshow } from '../../types/slideshow';
import type { AudioNote } from '../../types/audio';

type Props = {
  user: Pick<UserRecord, 'id' | 'name' | 'bio' | 'avatar_url' | 'is_private'>;
  posts: Post[];
  polls: Poll[];
  events: Event[];
  slideshows: Slideshow[];
  audios: AudioNote[];
  isOwner: boolean;
  stats: UserStats;
  initialFollowing: boolean;
  initialPending: boolean;
  canViewContent: boolean;
};

const UserProfilePage = ({ user, posts, polls, events, slideshows, audios, isOwner, stats, initialFollowing, initialPending, canViewContent }: Props) => {
  if (!user) {
    return (
      <Layout>
        <p>Benutzer wurde nicht gefunden.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <ProfileContent 
        user={user} 
        posts={posts}
        polls={polls}
        events={events}
        slideshows={slideshows}
        audios={audios}
        stats={stats} 
        isOwner={isOwner} 
        initialFollowing={initialFollowing}
        initialPending={initialPending}
        canViewContent={canViewContent}
      />
    </Layout>
  );
};

export default UserProfilePage;

export const getServerSideProps = (ctx: any) =>
  requirePageAuth(ctx, async ({ userId }) => {
    const profileIdOrName = ctx.params?.id;
    let profileId: number;
    
    // Check if it's a number (ID) or string (name)
    if (Number.isFinite(Number(profileIdOrName))) {
      profileId = Number(profileIdOrName);
    } else {
      // Try to find user by name
      const userByName = getUserByName(profileIdOrName);
      if (!userByName) {
        return { notFound: true };
      }
      profileId = userByName.id;
    }
    
    if (!Number.isFinite(profileId)) {
      return { notFound: true };
    }

    const user = getUserById(profileId);
    if (!user) {
      return { notFound: true };
    }

    const isOwner = profileId === userId;
    const canView = canViewPrivateAccount(userId, profileId);
    const followStatus = isOwner ? 'none' : getFollowStatus(userId, profileId);
    
    // Only fetch content if user can view the content
    const { posts } = canView 
      ? listPosts(50, undefined, { userId: profileId, viewerId: userId })
      : { posts: [] };
    const polls = canView ? listPolls(userId, undefined, profileId) : [];
    const events = canView ? listEvents(userId, undefined, profileId) : [];
    const slideshows = canView ? listSlideshows(userId, undefined, profileId) : [];
    const audios = canView ? listAudioNotes(userId, undefined, profileId) : [];
    
    const stats = getUserStats(profileId);

    return {
      props: {
        user: {
          id: user.id,
          name: user.name,
          bio: user.bio,
          avatar_url: user.avatar_url,
          is_private: user.is_private
        },
        posts,
        polls,
        events,
        slideshows,
        audios,
        isOwner,
        stats: canView ? stats : { 
          ...stats, 
          postCount: 0, // Hide post count for private accounts
          totalLikes: 0 // Hide like count for private accounts
        },
        initialFollowing: followStatus === 'approved',
        initialPending: followStatus === 'pending',
        canViewContent: canView
      }
    };
  });

