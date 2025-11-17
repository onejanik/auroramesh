import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Layout } from '../components/Layout';
import { requirePageAuth } from '../lib/auth/pageAuth';
import { fetcher } from '../lib/fetcher';

type FollowRequest = {
  id: number;
  name: string;
  avatar_url: string | null;
  created_at: string;
};

type FollowRequestsResponse = {
  requests: FollowRequest[];
};

const FollowRequestsPage = () => {
  const { data, isLoading, mutate } = useSWR<FollowRequestsResponse>('/api/follow-requests', fetcher);
  const [processing, setProcessing] = useState<number | null>(null);

  const handleApprove = async (requesterId: number) => {
    setProcessing(requesterId);
    try {
      const response = await fetch(`/api/follow-requests/${requesterId}/approve`, { method: 'POST' });
      if (!response.ok) throw new Error('Fehler beim Genehmigen');
      await mutate();
    } catch (error) {
      console.error(error);
      alert('Fehler beim Genehmigen der Anfrage');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requesterId: number) => {
    setProcessing(requesterId);
    try {
      const response = await fetch(`/api/follow-requests/${requesterId}/reject`, { method: 'POST' });
      if (!response.ok) throw new Error('Fehler beim Ablehnen');
      await mutate();
    } catch (error) {
      console.error(error);
      alert('Fehler beim Ablehnen der Anfrage');
    } finally {
      setProcessing(null);
    }
  };

  const requests = data?.requests ?? [];

  return (
    <Layout>
      <section style={{ marginBottom: '2rem' }}>
        <h1>Follower-Anfragen</h1>
        <p style={{ color: 'var(--muted)' }}>
          {requests.length === 0
            ? 'Du hast keine offenen Follower-Anfragen.'
            : `Du hast ${requests.length} ${requests.length === 1 ? 'offene Anfrage' : 'offene Anfragen'}.`}
        </p>
      </section>

      <section>
        {isLoading && <p style={{ color: 'var(--muted)' }}>Lädt...</p>}
        {!isLoading && requests.length === 0 && (
          <div
            style={{
              padding: '3rem 1rem',
              textAlign: 'center',
              background: 'var(--card-bg)',
              borderRadius: 16,
              border: '1px solid var(--border)'
            }}
          >
            <i className="bi bi-person-check" style={{ fontSize: '3rem', color: 'var(--muted)', display: 'block', marginBottom: '1rem' }} />
            <p style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>Keine Anfragen vorhanden</p>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {requests.map((request) => (
            <article
              key={request.id}
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
                <Link href={`/users/${request.id}`}>
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
                      color: 'var(--text)',
                      cursor: 'pointer',
                      overflow: 'hidden'
                    }}
                  >
                    {request.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={request.avatar_url} alt={request.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (request.name?.[0] ?? '?')
                    )}
                  </div>
                </Link>
                <div>
                  <Link href={`/users/${request.id}`} style={{ textDecoration: 'none' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>{request.name}</p>
                  </Link>
                  <small style={{ color: 'var(--muted)' }}>
                    Angefragt am {new Date(request.created_at).toLocaleDateString()}
                  </small>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="pill-button"
                  onClick={() => handleApprove(request.id)}
                  disabled={processing === request.id}
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--accent-contrast)'
                  }}
                >
                  <i className="bi bi-check-lg" />
                  Genehmigen
                </button>
                <button
                  type="button"
                  className="pill-button"
                  onClick={() => handleReject(request.id)}
                  disabled={processing === request.id}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text)'
                  }}
                >
                  <i className="bi bi-x-lg" />
                  Ablehnen
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default FollowRequestsPage;

export const getServerSideProps = (ctx: any) => requirePageAuth(ctx);

