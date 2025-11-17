import { Layout } from '../components/Layout';
import { ProfileContent } from '../components/ProfileContent';
import { requirePageAuth } from '../lib/auth/pageAuth';
import { getUserById, getUserStats, type UserRecord, type UserStats } from '../lib/models/users';
import { listPosts } from '../lib/models/posts';
import type { Post } from '../types/post';

type Props = {
  user: Pick<UserRecord, 'id' | 'name' | 'bio' | 'avatar_url'>;
  posts: Post[];
  stats: UserStats;
};

const MePage = ({ user, posts, stats }: Props) => (
  <Layout>
    <ProfileContent user={user} posts={posts} stats={stats} isOwner />
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
    const stats = getUserStats(userId);

    return {
      props: {
        user,
        posts,
        stats
      }
    };
  });

