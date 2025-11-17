import { Layout } from '../../components/Layout';
import { PostList } from '../../components/PostList';
import { requirePageAuth } from '../../lib/auth/pageAuth';
import { listPosts } from '../../lib/models/posts';
import type { Post } from '../../types/post';

type Props = {
  tag: string;
  posts: Post[];
};

const TagPage = ({ tag, posts }: Props) => {
  return (
    <Layout>
      <section style={{ marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="bi bi-hash" />
          {tag}
        </h1>
        <p style={{ color: 'var(--muted)' }}>
          {posts.length} {posts.length === 1 ? 'Beitrag' : 'Beiträge'} mit diesem Tag
        </p>
      </section>

      <section>
        {posts.length > 0 ? (
          <PostList posts={posts} isLoading={false} />
        ) : (
          <div
            style={{
              padding: '3rem 1rem',
              textAlign: 'center',
              background: 'var(--card-bg)',
              borderRadius: 16,
              border: '1px solid var(--border)'
            }}
          >
            <i className="bi bi-search" style={{ fontSize: '3rem', color: 'var(--muted)', display: 'block', marginBottom: '1rem' }} />
            <p style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>
              Keine Beiträge mit diesem Tag gefunden.
            </p>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default TagPage;

export const getServerSideProps = (ctx: any) =>
  requirePageAuth(ctx, async ({ userId }) => {
    const tag = ctx.params?.tag as string;
    
    if (!tag) {
      return { notFound: true };
    }

    // Get all posts and filter by tag
    const { posts: allPosts } = listPosts(1000, undefined, { viewerId: userId });
    const posts = allPosts.filter((post) => 
      post.tags?.some((t) => t.toLowerCase() === decodeURIComponent(tag).toLowerCase())
    );

    return {
      props: {
        tag: decodeURIComponent(tag),
        posts
      }
    };
  });

