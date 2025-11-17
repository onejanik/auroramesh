import { Post } from '../types/post';
import { PostCard } from './PostCard';

type Props = {
  posts: Post[];
  isLoading: boolean;
};

export const PostList = ({ posts, isLoading }: Props) => {
  if (isLoading) {
    return <p>Feed wird geladen...</p>;
  }

  if (!posts.length) {
    return <p>Noch keine Posts – teile als erstes dein Bild oder Video!</p>;
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard post={post} key={post.id} />
      ))}
    </div>
  );
};

