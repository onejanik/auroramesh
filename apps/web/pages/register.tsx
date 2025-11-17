import { FormEvent, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Layout } from '../components/Layout';
import { useCurrentUser } from '../lib/hooks/useCurrentUser';

const RegisterPage = () => {
  const router = useRouter();
  const next = typeof router.query.next === 'string' ? router.query.next : '/feed';
  const { mutate } = useCurrentUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuggestions([]);
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.message ?? 'Registrierung fehlgeschlagen');
      if (body.suggestions && Array.isArray(body.suggestions)) {
        setSuggestions(body.suggestions);
      }
      setSubmitting(false);
      return;
    }

    await mutate();
    router.push(next);
  };

  return (
    <>
      <Head>
        <title>Registrieren – AuroraMesh</title>
      </Head>
      <Layout>
        <section style={{ maxWidth: 420, margin: '0 auto' }}>
          <h1>Registrieren</h1>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label>
              Nutzername
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: 8 }} />
            </label>
            <label>
              E-Mail
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: 8 }} />
            </label>
            <label>
              Passwort
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: 8 }} />
            </label>
            {error && <p style={{ color: '#d63031' }}>{error}</p>}
            {suggestions.length > 0 && (
              <div style={{ padding: '1rem', background: 'var(--card-bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Vorschläge für verfügbare Nutzernamen:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setName(suggestion);
                        setSuggestions([]);
                        setError(null);
                      }}
                      style={{
                        padding: '0.5rem 0.8rem',
                        background: 'var(--accent)',
                        color: 'var(--accent-contrast)',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ padding: '0.8rem', background: '#6c5ce7', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600 }}
            >
              {isSubmitting ? 'Wird erstellt...' : 'Konto erstellen'}
            </button>
          </form>
          <p style={{ marginTop: '1rem' }}>
            Bereits registriert? <Link href="/login">Zum Login</Link>
          </p>
        </section>
      </Layout>
    </>
  );
};

export default RegisterPage;

