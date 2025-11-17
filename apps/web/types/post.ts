export type Post = {
  id: number;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption: string;
  tags: string[];
  isPrivate?: boolean;
  createdAt: string;
  author: {
    id: number;
    name: string | null;
    avatarUrl: string | null;
  };
  stats: {
    likes: number;
    saves: number;
  };
  viewer?: {
    liked: boolean;
    saved: boolean;
    isOwner?: boolean;
  };
  commentCount?: number;
};

