import { useState, useEffect } from 'react';

type User = {
  id: number;
  name: string;
  avatar_url: string | null;
};

type Props = {
  userId: number;
  type: 'followers' | 'following';
  onClose: () => void;
};

export const FollowersModal = ({ userId, type, onClose }: Props) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/users/${userId}/${type}`);
        if (!response.ok) throw new Error('Fehler beim Laden');
        const data = await response.json();
        setUsers(data.users || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [userId, type]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--card-bg)',
          borderRadius: 16,
          padding: '1.5rem',
          maxWidth: 500,
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px var(--card-shadow)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>{type === 'followers' ? 'Follower' : 'Folgt'}</h2>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            style={{ background: 'var(--border)', border: 'none' }}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {isLoading && <p style={{ color: 'var(--muted)' }}>Wird geladen...</p>}
        {error && <p style={{ color: '#d63031' }}>{error}</p>}

        {!isLoading && !error && users.length === 0 && (
          <p style={{ color: 'var(--muted)' }}>
            {type === 'followers' ? 'Noch keine Follower' : 'Folgt noch niemandem'}
          </p>
        )}

        {!isLoading && !error && users.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {users.map((user) => (
              <a
                key={user.id}
                href={`/users/${user.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'var(--text)',
                  background: 'transparent',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(108, 92, 231, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'var(--avatar-bg)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600
                  }}
                >
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar_url.startsWith('http') ? user.avatar_url : `/api/media?path=${encodeURIComponent(user.avatar_url)}`}
                      alt={user.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    user.name?.[0]?.toUpperCase() ?? '?'
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{user.name}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

