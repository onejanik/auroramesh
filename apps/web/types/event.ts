export type Event = {
  id: number;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  createdAt: string;
  author: {
    id: number;
    name: string | null;
    avatarUrl: string | null;
  };
  stats: {
    rsvps: number;
  };
  viewerRsvp?: boolean;
};

