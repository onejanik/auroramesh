import { Layout } from '../../components/Layout';
import { PostCard } from '../../components/PostCard';
import { requirePageAuth } from '../../lib/auth/pageAuth';
import { getPostById } from '../../lib/models/posts';
import type { Post } from '../../types/post';

type Props = {
  post: Post | null;
};

const PostDetailPage = ({ post }: Props) => {
  if (!post) {
    return (
      <Layout>
        <p>Beitrag wurde nicht gefunden.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <PostCard post={post} />
    </Layout>
  );
};

export default PostDetailPage;

export const getServerSideProps = (ctx: any) =>
  requirePageAuth(ctx, async ({ userId }) => {
    const postId = Number(ctx.params?.id);
    if (!Number.isFinite(postId)) {
      return { notFound: true };
    }

    const post = getPostById(postId, userId);
    if (!post) {
      return { notFound: true };
    }

    return {
      props: {
        post
      }
    };
  });

