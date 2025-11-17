export type Comment = {
  id: number;
  postId?: number | null; // Legacy field
  targetType?: 'post' | 'poll' | 'event' | 'slideshow' | 'audio';
  targetId?: number;
  parentCommentId?: number | null;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name: string | null;
    avatarUrl: string | null;
  };
  repliesCount: number;
};

