import useSWR from 'swr';
import { Layout } from '../../components/Layout';
import { requirePageAuth } from '../../lib/auth/pageAuth';
import { getUserById } from '../../lib/models/users';
import { isAdminUser } from '../../lib/auth/isAdmin';
import { fetcher } from '../../lib/fetcher';
import type { Report } from '../../types/report';

type Props = {
  isAdmin: boolean;
};

const AdminPage = ({ isAdmin }: Props) => {
  const { data, mutate, isLoading } = useSWR<{ reports: Report[] }>(isAdmin ? '/api/admin/reports' : null, fetcher, {
    refreshInterval: 30_000
  });

  if (!isAdmin) {
    return (
      <Layout>
        <p>Kein Zugriff.</p>
      </Layout>
    );
  }

  const resolve = async (id: number) => {
    await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    mutate();
  };

  return (
    <Layout>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1>Moderation</h1>
        <p style={{ color: 'var(--muted)' }}>Verwalte Meldungen und halte AuroraMesh sicher.</p>
      </div>
      {isLoading && <p>Berichte werden geladen...</p>}
      {data?.reports?.length ? (
        <div className="report-list">
          {data.reports.map((report) => (
            <article key={report.id} className="card">
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>
                    {report.targetType} #{report.targetId}
                  </strong>
                  <p style={{ margin: 0, color: 'var(--muted)' }}>gemeldet von {report.reporter.email}</p>
                </div>
                <span className={`status-pill status-pill--${report.status}`}>{report.status}</span>
              </header>
              <p style={{ whiteSpace: 'pre-wrap' }}>{report.reason}</p>
              <small style={{ color: 'var(--muted)' }}>{new Date(report.createdAt).toLocaleString()}</small>
              {report.status === 'open' && (
                <button type="button" className="pill-button" style={{ marginTop: '0.75rem' }} onClick={() => resolve(report.id)}>
                  Erledigt
                </button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p>Keine Meldungen vorhanden.</p>
      )}
    </Layout>
  );
};

export default AdminPage;

export const getServerSideProps = (ctx: any) =>
  requirePageAuth(ctx, async ({ userId }) => {
    const user = getUserById(userId) ?? null;
    const admin = isAdminUser(user);
    if (!admin) {
      return {
        redirect: {
          destination: '/feed',
          permanent: false
        }
      };
    }
    return { props: { isAdmin: true } };
  });

