import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode, useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { AuthButton } from './AuthButton';
import { useCurrentUser } from '../lib/hooks/useCurrentUser';
import { fetcher } from '../lib/fetcher';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type Props = {
  children: ReactNode;
};

export const Layout = ({ children }: Props) => {
  const router = useRouter();
  const { user, mutate } = useCurrentUser();
  const { data: notificationsData } = useSWR<{ notifications: any[]; unreadCount: number }>(
    user ? '/api/notifications' : null,
    fetcher,
    { refreshInterval: 30000 }
  );
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') return stored;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });
  const [isMenuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [showIosInstall, setShowIosInstall] = useState(false);

  useEffect(() => {
    if (user?.theme && user.theme !== theme) {
      setTheme(user.theme);
      return;
    }
    if (!user && typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('theme');
      if ((stored === 'dark' || stored === 'light') && stored !== theme) {
        setTheme(stored);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.theme]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.theme = theme;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isMenuOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handler = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = window.navigator.userAgent || '';
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isStandalone = (window.navigator as any).standalone;
    if (isIos && !isStandalone) {
      setShowIosInstall(true);
    }
  }, []);

  const adminEmails =
    (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
  const isAdmin = user ? (adminEmails.length ? adminEmails.includes(user.email.toLowerCase()) : user.id === 1) : false;

  const unreadCount = notificationsData?.unreadCount ?? 0;
  const { data: followRequestsData } = useSWR<{ requests: any[] }>(user ? '/api/follow-requests' : null, fetcher, {
    refreshInterval: 30000
  });
  const requestCount = followRequestsData?.requests?.length ?? 0;

  const navItems =
    user?.id != null
      ? [
          { href: '/upload', label: 'Erstellen', icon: 'bi-plus-circle' },
          { href: '/follow-requests', label: 'Anfragen', icon: 'bi-person-plus', badge: requestCount },
          { href: '/activity', label: 'Aktivität', icon: 'bi-bell', badge: unreadCount },
          { href: '/search', label: 'Suche', icon: 'bi-search' },
          ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: 'bi-shield-lock' }] : [])
        ]
      : [];

  const toggleTheme = async () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (user) {
      try {
        await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: nextTheme })
        });
        mutate();
      } catch (error) {
        console.error('Theme update failed', error);
      }
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setMenuOpen(false);
    await mutate();
    router.push('/');
  };

  const avatarContent = user?.avatar_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={user.avatar_url.startsWith('http') ? user.avatar_url : `/api/media?path=${encodeURIComponent(user.avatar_url)}`} alt={user.name ?? 'Avatar'} />
  ) : (
    <span>{user?.name?.[0] ?? '?'}</span>
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href={user ? '/feed' : '/'} style={{ fontWeight: 700, fontSize: 20, color: 'var(--text)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            AuroraMesh
            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: 'var(--accent)', color: 'var(--accent-contrast)', borderRadius: 8, fontWeight: 600 }}>
              BETA
            </span>
          </Link>
          {user && (
            <nav style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="pill-button nav-button" style={{ position: 'relative' }}>
                  <i className={`bi ${item.icon}`} />
                  {item.label}
                  {item.badge && item.badge > 0 ? (
                    <span
                      style={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        background: '#e74c3c',
                        color: '#fff',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  ) : null}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <div className="header-actions">
          <button type="button" className="icon-button" onClick={toggleTheme} aria-label="Theme wechseln">
            <i className={`bi ${theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-stars'}`} />
          </button>
          {deferredPrompt && (
            <button
              type="button"
              className="icon-button"
              onClick={async () => {
                if (deferredPrompt && typeof (deferredPrompt as any).prompt === 'function') {
                  (deferredPrompt as any).prompt();
                  await (deferredPrompt as any).userChoice;
                  setDeferredPrompt(null);
                }
              }}
            >
              <i className="bi bi-download" />
              Installieren
            </button>
          )}
          {user ? (
            <div className="user-menu" ref={menuRef}>
              <button type="button" className="user-avatar" onClick={() => setMenuOpen((open) => !open)}>
                {avatarContent}
                <i className={`bi ${isMenuOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
              </button>
              {isMenuOpen && (
                <div className="user-dropdown">
                  <Link href="/me">
                    <i className="bi bi-person-circle" />
                    Mein Profil
                  </Link>
                  <Link href="/profile">
                    <i className="bi bi-pencil-square" />
                    Profil bearbeiten
                  </Link>
                  <Link href="/upload">
                    <i className="bi bi-cloud-upload" />
                    Upload
                  </Link>
                  <button type="button" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <AuthButton />
          )}
        </div>
      </header>
      {showIosInstall && (
        <div className="install-hint">
          <div>
            <strong>Auf den Home-Screen legen</strong>
            <p>Im Safari-Teilen-Menü „Zum Home-Bildschirm“ wählen, um AuroraMesh wie eine App zu nutzen.</p>
          </div>
          <button type="button" className="icon-button" onClick={() => setShowIosInstall(false)}>
            <i className="bi bi-check-lg" />
            Verstanden
          </button>
        </div>
      )}
      <main className="app-main">{children}</main>
    </div>
  );
};

