export type AudioNote = {
  id: number;
  audioUrl: string;
  caption?: string;
  createdAt: string;
  author: {
    id: number;
    name: string | null;
    avatarUrl: string | null;
  };
};

