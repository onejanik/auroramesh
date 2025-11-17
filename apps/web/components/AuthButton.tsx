import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCurrentUser } from '../lib/hooks/useCurrentUser';

export const AuthButton = () => {
  const router = useRouter();
  const { user, isLoading, mutate } = useCurrentUser();

  if (isLoading) {
    return <span style={{ fontSize: 14, color: '#666' }}>Laden...</span>;
  }

  if (!user) {
    return (
      <Link href={`/login?next=${encodeURIComponent(router.asPath)}`} style={{ fontWeight: 600, color: '#6c5ce7' }}>
        Login
      </Link>
    );
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await mutate();
    router.push('/');
  };

  return (
    <button
      onClick={handleLogout}
      style={{ fontWeight: 600, color: '#e17055', background: 'transparent', border: 'none', cursor: 'pointer' }}
    >
      Logout
    </button>
  );
};

