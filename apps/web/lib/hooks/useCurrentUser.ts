import useSWR from 'swr';

type CurrentUserResponse =
  | {
      user: {
        id: number;
        email: string;
        name: string;
        avatar_url: string | null;
        bio: string | null;
        theme: 'light' | 'dark';
        favorite_tags: string[];
      };
    }
  | null;

const fetcher = async (url: string): Promise<CurrentUserResponse> => {
  const response = await fetch(url);
  if (response.status === 401) return null;
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Request failed');
  }
  return response.json();
};

export const useCurrentUser = () => {
  const { data, error, mutate, isLoading } = useSWR<CurrentUserResponse>('/api/auth/me', fetcher, {
    shouldRetryOnError: false
  });
  return {
    user: data?.user ?? null,
    isLoading,
    error,
    mutate
  };
};

