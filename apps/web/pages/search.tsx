import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Layout } from '../components/Layout';
import { requirePageAuth } from '../lib/auth/pageAuth';
import { fetcher } from '../lib/fetcher';

type SearchUser = {
  id: number;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  is_private?: boolean;
  stats: {
    followerCount: number;
  };
};

type SearchTag = {
  tag: string;
  postCount: number;
};

type UserSearchResponse = {
  results: SearchUser[];
};

type TagSearchResponse = {
  results: SearchTag[];
};

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'users' | 'tags'>('users');
  const trimmed = query.trim();
  const shouldFetch = trimmed.length >= 2;
  
  const { data: userData, isLoading: isLoadingUsers } = useSWR<UserSearchResponse>(
    shouldFetch && searchType === 'users' ? `/api/users/search?q=${encodeURIComponent(trimmed)}` : null,
    fetcher,
    {
      revalidateOnFocus: false
    }
  );

  const { data: tagData, isLoading: isLoadingTags } = useSWR<TagSearchResponse>(
    shouldFetch && searchType === 'tags' ? `/api/tags/search?q=${encodeURIComponent(trimmed)}` : null,
    fetcher,
    {
      revalidateOnFocus: false
    }
  );

  const userResults = useMemo(() => userData?.results ?? [], [userData]);
  const tagResults = useMemo(() => tagData?.results ?? [], [tagData]);
  const isLoading = searchType === 'users' ? isLoadingUsers : isLoadingTags;

  return (
    <Layout>
      <section style={{ marginBottom: '2rem' }}>
        <h1>Suche</h1>
        <p style={{ color: 'var(--muted)' }}>Suche nach Nutzern oder Tags.</p>
        
        <div style={{ marginTop: '1rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setSearchType('users')}
            className="pill-button"
            style={{
              background: searchType === 'users' ? 'var(--accent)' : 'var(--card-bg)',
              color: searchType === 'users' ? 'var(--accent-contrast)' : 'var(--text)',
              border: searchType === 'users' ? 'none' : '1px solid var(--border)'
            }}
          >
            <i className="bi bi-person" />
            Nutzer
          </button>
          <button
            type="button"
            onClick={() => setSearchType('tags')}
            className="pill-button"
            style={{
              background: searchType === 'tags' ? 'var(--accent)' : 'var(--card-bg)',
              color: searchType === 'tags' ? 'var(--accent-contrast)' : 'var(--text)',
              border: searchType === 'tags' ? 'none' : '1px solid var(--border)'
            }}
          >
            <i className="bi bi-hash" />
            Tags
          </button>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <div className="input-with-icon">
            <i className="bi bi-search" />
            <input
              type="search"
              placeholder={searchType === 'users' ? 'Nutzer suchen...' : 'Tags suchen...'}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
      </section>

      <section>
        <h2>Ergebnisse</h2>
        {!trimmed && <p style={{ color: 'var(--muted)' }}>Starte eine Suche, um Ergebnisse zu sehen.</p>}
        {trimmed && isLoading && <p style={{ color: 'var(--muted)' }}>Suche läuft...</p>}
        
        {searchType === 'users' && (
          <>
            {trimmed && !isLoading && !userResults.length && <p style={{ color: 'var(--muted)' }}>Keine Nutzer gefunden.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {userResults.map((user) => (
            <article
              key={user.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
                borderRadius: 16,
                border: '1px solid var(--border)',
                background: 'var(--card-bg)',
                boxShadow: '0 5px 16px var(--card-shadow)',
                gap: '1rem',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'var(--avatar-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 600,
                    color: 'var(--text)'
                  }}
                >
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar_url.startsWith('http') ? user.avatar_url : `/api/media?path=${encodeURIComponent(user.avatar_url)}`} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                  ) : (
                    (user.name?.[0] ?? '?')
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>{user.name}</p>
                    {user.is_private && (
                      <span 
                        style={{ 
                          padding: '0.15rem 0.5rem', 
                          background: 'var(--muted)', 
                          color: 'var(--bg)', 
                          borderRadius: 8, 
                          fontSize: '0.7rem',
                          fontWeight: 600
                        }}
                      >
                        <i className="bi bi-lock-fill" /> Privat
                      </span>
                    )}
                  </div>
                  <small style={{ color: 'var(--muted)' }}>{user.stats.followerCount} Follower</small>
                  {user.bio && <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)' }}>{user.bio}</p>}
                </div>
              </div>
              <Link href={`/users/${user.id}`} className="pill-button">
                <i className="bi bi-person" />
                Profil ansehen
              </Link>
            </article>
          ))}
            </div>
          </>
        )}
        
        {searchType === 'tags' && (
          <>
            {trimmed && !isLoading && !tagResults.length && <p style={{ color: 'var(--muted)' }}>Keine Tags gefunden.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {tagResults.map((tag) => (
                <article
                  key={tag.tag}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.25rem',
                    borderRadius: 16,
                    border: '1px solid var(--border)',
                    background: 'var(--card-bg)',
                    boxShadow: '0 5px 16px var(--card-shadow)',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        fontWeight: 600,
                        color: 'var(--accent-contrast)'
                      }}
                    >
                      #
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600 }}>{tag.tag}</p>
                      <small style={{ color: 'var(--muted)' }}>
                        {tag.postCount} {tag.postCount === 1 ? 'Beitrag' : 'Beiträge'}
                      </small>
                    </div>
                  </div>
                  <Link href={`/tags/${encodeURIComponent(tag.tag)}`} className="pill-button">
                    <i className="bi bi-arrow-right" />
                    Anzeigen
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </Layout>
  );
};

export default SearchPage;

export const getServerSideProps = (ctx: any) => requirePageAuth(ctx);

