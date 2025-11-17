export type Story = {
  id: number;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  createdAt: string;
  expiresAt: string;
  durationSeconds?: number | null;
  author: {
    id: number;
    name: string | null;
    avatarUrl: string | null;
  };
};

