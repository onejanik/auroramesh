export type Comment = {
  id: number;
  postId: number;
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

