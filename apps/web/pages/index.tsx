import Head from 'next/head';
import Link from 'next/link';
import { Layout } from '../components/Layout';
import { useCurrentUser } from '../lib/hooks/useCurrentUser';

export default function Home() {
  const { user } = useCurrentUser();

  const features = [
    {
      icon: 'bi-shield-check',
      title: 'Privacy First',
      description: 'Volle Kontrolle über deine Privatsphäre. Stelle Posts und Account auf privat und entscheide selbst, wer deine Inhalte sieht.'
    },
    {
      icon: 'bi-palette',
      title: 'Vielfältige Formate',
      description: 'Posts, Stories, Umfragen, Events, Slideshows und Audio-Notizen. Alles in einer App.'
    },
    {
      icon: 'bi-lightning-charge',
      title: 'Echtzeit-Aktivitäten',
      description: 'Benachrichtigungen über Likes, Kommentare und neue Follower in Echtzeit. Verpasse keine Interaktion.'
    },
    {
      icon: 'bi-funnel',
      title: 'Smarter Feed-Filter',
      description: 'Zeige nur, was dich interessiert. Blende Umfragen, Events oder andere Inhaltstypen nach Bedarf aus.'
    },
    {
      icon: 'bi-stars',
      title: 'Open Source',
      description: 'Transparent, community-driven und ohne versteckte Algorithmen. Deine Daten gehören dir.'
    },
    {
      icon: 'bi-globe',
      title: 'Keine Werbung',
      description: 'Keine Ads, keine Tracking-Pixel, keine Datenverkäufe. Einfach ein sauberes Social-Media-Erlebnis.'
    }
  ];

  return (
    <>
      <Head>
        <title>AuroraMesh – Social Media mit Privacy First</title>
        <meta name="description" content="Die moderne Social-Media-Plattform mit vollständiger Privatsphäre-Kontrolle, vielfältigen Formaten und ohne Werbung." />
      </Head>
      <Layout>
        {/* Hero Section */}
        <section style={{ textAlign: 'center', maxWidth: 800, margin: '3rem auto 5rem' }}>
          <p style={{ 
            letterSpacing: 3, 
            textTransform: 'uppercase', 
            color: 'var(--accent)', 
            fontWeight: 600,
            marginBottom: '1rem'
          }}>
            Connect • Create • Control
          </p>
          <h1 style={{ 
            fontSize: 'clamp(2rem, 5vw, 3.5rem)', 
            marginBottom: '1.5rem',
            lineHeight: 1.2,
            background: 'linear-gradient(135deg, var(--accent) 0%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Social Media, wie es sein sollte
          </h1>
          <p style={{ 
            fontSize: '1.2rem', 
            color: 'var(--muted)', 
            marginBottom: '2.5rem',
            lineHeight: 1.6
          }}>
            Keine Algorithmen, die dich manipulieren. Keine Werbung, die dich verfolgt. 
            Nur echte Verbindungen mit voller Kontrolle über deine Privatsphäre.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href={user ? '/feed' : '/register'}
              className="pill-button"
              style={{
                padding: '1rem 2.5rem',
                fontSize: '1.1rem',
                background: 'var(--accent)',
                color: 'var(--accent-contrast)',
                boxShadow: '0 8px 24px rgba(108, 92, 231, 0.3)',
                textDecoration: 'none'
              }}
            >
              <i className="bi bi-rocket-takeoff" />
              {user ? 'Zum Feed' : 'Jetzt starten'}
            </Link>
            {!user && (
              <Link
                href="/login"
                className="pill-button nav-button"
                style={{
                  padding: '1rem 2.5rem',
                  fontSize: '1.1rem',
                  textDecoration: 'none'
                }}
              >
                Anmelden
              </Link>
            )}
          </div>
        </section>

        {/* Features Grid */}
        <section style={{ maxWidth: 1000, margin: '0 auto 5rem' }}>
          <h2 style={{ 
            textAlign: 'center', 
            fontSize: '2rem', 
            marginBottom: '3rem'
          }}>
            Was macht uns besser?
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem'
          }}>
            {features.map((feature, index) => (
              <div
                key={index}
                style={{
                  padding: '2rem',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                  boxShadow: '0 5px 20px var(--card-shadow)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px var(--card-shadow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 5px 20px var(--card-shadow)';
                }}
              >
                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'rgba(108, 92, 231, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <i className={`bi ${feature.icon}`} style={{ fontSize: '1.8rem', color: 'var(--accent)' }} />
                </div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>{feature.title}</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison Section */}
        <section style={{ 
          maxWidth: 700, 
          margin: '0 auto 5rem',
          padding: '3rem 2rem',
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: 24,
          boxShadow: '0 8px 32px var(--card-shadow)'
        }}>
          <h2 style={{ 
            textAlign: 'center', 
            fontSize: '2rem', 
            marginBottom: '2rem'
          }}>
            AuroraMesh vs. andere Plattformen
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <ComparisonRow 
              feature="Deine Daten gehören dir"
              aurora={true}
              others={false}
            />
            <ComparisonRow 
              feature="Keine Werbung"
              aurora={true}
              others={false}
            />
            <ComparisonRow 
              feature="Chronologischer Feed"
              aurora={true}
              others={false}
            />
            <ComparisonRow 
              feature="Privacy-Controls"
              aurora={true}
              others="Teilweise"
            />
            <ComparisonRow 
              feature="Open Source"
              aurora={true}
              others={false}
            />
            <ComparisonRow 
              feature="Content-Filter"
              aurora={true}
              others={false}
            />
          </div>
        </section>

        {/* CTA Section */}
        {!user && (
          <section style={{ 
            textAlign: 'center', 
            maxWidth: 600, 
            margin: '0 auto 5rem',
            padding: '3rem 2rem',
            background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
            borderRadius: 24,
            border: '1px solid var(--border)'
          }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
              Bereit für echtes Social Media?
            </h2>
            <p style={{ color: 'var(--muted)', marginBottom: '2rem', fontSize: '1.1rem' }}>
              Werde Teil einer Community, die Privatsphäre und Authentizität schätzt.
            </p>
            <Link
              href="/register"
              className="pill-button"
              style={{
                padding: '1rem 2.5rem',
                fontSize: '1.1rem',
                background: 'var(--accent)',
                color: 'var(--accent-contrast)',
                boxShadow: '0 8px 24px rgba(108, 92, 231, 0.3)',
                textDecoration: 'none'
              }}
            >
              Kostenfrei registrieren
            </Link>
          </section>
        )}
      </Layout>
    </>
  );
}

const ComparisonRow = ({ feature, aurora, others }: { feature: string; aurora: boolean | string; others: boolean | string }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr',
    gap: '1rem',
    alignItems: 'center',
    padding: '1rem',
    borderBottom: '1px solid var(--border)'
  }}>
    <div style={{ fontWeight: 500 }}>{feature}</div>
    <div style={{ textAlign: 'center' }}>
      {typeof aurora === 'boolean' ? (
        aurora ? (
          <i className="bi bi-check-circle-fill" style={{ color: '#10b981', fontSize: '1.5rem' }} />
        ) : (
          <i className="bi bi-x-circle-fill" style={{ color: '#ef4444', fontSize: '1.5rem' }} />
        )
      ) : (
        <span style={{ color: 'var(--muted)' }}>{aurora}</span>
      )}
    </div>
    <div style={{ textAlign: 'center' }}>
      {typeof others === 'boolean' ? (
        others ? (
          <i className="bi bi-check-circle-fill" style={{ color: '#10b981', fontSize: '1.5rem' }} />
        ) : (
          <i className="bi bi-x-circle-fill" style={{ color: '#ef4444', fontSize: '1.5rem' }} />
        )
      ) : (
        <span style={{ color: 'var(--muted)' }}>{others}</span>
      )}
    </div>
  </div>
);

