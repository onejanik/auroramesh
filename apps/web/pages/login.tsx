import { FormEvent, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Layout } from '../components/Layout';
import { useCurrentUser } from '../lib/hooks/useCurrentUser';

const LoginPage = () => {
  const router = useRouter();
  const next = typeof router.query.next === 'string' ? router.query.next : '/feed';
  const { mutate } = useCurrentUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      setError('Login fehlgeschlagen. Bitte prüfe deine Angaben.');
      setSubmitting(false);
      return;
    }
    await mutate();
    router.push(next);
  };

  return (
    <>
      <Head>
        <title>Login – AuroraMesh</title>
      </Head>
      <Layout>
        <section style={{ maxWidth: 420, margin: '0 auto' }}>
          <h1>Login</h1>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label>
              E-Mail
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: 8 }} />
            </label>
            <label>
              Passwort
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: 8 }} />
            </label>
            {error && <p style={{ color: '#d63031' }}>{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ padding: '0.8rem', background: '#6c5ce7', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600 }}
            >
              {isSubmitting ? 'Wird angemeldet...' : 'Einloggen'}
            </button>
          </form>
          <p style={{ marginTop: '1rem' }}>
            Noch kein Konto? <Link href="/register">Jetzt registrieren</Link>
          </p>
        </section>
      </Layout>
    </>
  );
};

export default LoginPage;

