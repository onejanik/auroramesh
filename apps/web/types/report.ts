export type Report = {
  id: number;
  reporter: {
    id: number;
    name: string | null;
    email: string;
  };
  targetType: 'post' | 'poll' | 'event' | 'slideshow' | 'audio' | 'story';
  targetId: number;
  reason: string;
  status: 'open' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
};

