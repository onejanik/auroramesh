export type PollOption = {
  id: string;
  label: string;
  votes: number;
};

export type Poll = {
  id: number;
  question: string;
  options: PollOption[];
  createdAt: string;
  author: {
    id: number;
    name: string | null;
    avatarUrl: string | null;
  };
  viewerSelection?: string | null;
};

