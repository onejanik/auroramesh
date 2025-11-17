export type Slideshow = {
  id: number;
  caption?: string;
  mediaUrls: string[];
  createdAt: string;
  author: {
    id: number;
    name: string | null;
    avatarUrl: string | null;
  };
};

