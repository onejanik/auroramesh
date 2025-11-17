import { Layout } from '../../components/Layout';
import { ProfileContent } from '../../components/ProfileContent';
import { requirePageAuth } from '../../lib/auth/pageAuth';
import { getUserById, getUserStats, getFollowStatus, canViewPrivateAccount, type UserRecord, type UserStats } from '../../lib/models/users';
import { listPosts } from '../../lib/models/posts';
import type { Post } from '../../types/post';

type Props = {
  user: Pick<UserRecord, 'id' | 'name' | 'bio' | 'avatar_url' | 'is_private'>;
  posts: Post[];
  isOwner: boolean;
  stats: UserStats;
  initialFollowing: boolean;
  initialPending: boolean;
  canViewContent: boolean;
};

const UserProfilePage = ({ user, posts, isOwner, stats, initialFollowing, initialPending, canViewContent }: Props) => {
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
    const profileId = Number(ctx.params?.id);
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
    
    // Only fetch posts if user can view the content
    const { posts } = canView 
      ? listPosts(50, undefined, { userId: profileId, viewerId: userId })
      : { posts: [] };
    
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

