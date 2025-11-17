import { FormEvent, useState } from 'react';
import { Layout } from '../components/Layout';
import { requirePageAuth } from '../lib/auth/pageAuth';
import { getUserById } from '../lib/models/users';

type Props = {
  initialName: string | null;
  initialBio: string | null;
  initialTags: string[];
  initialAvatar: string | null;
  initialTheme: 'light' | 'dark';
  initialIsPrivate: boolean;
};

const ProfilePage = ({ initialName, initialBio, initialTags, initialAvatar, initialTheme, initialIsPrivate }: Props) => {
  const [name, setName] = useState(initialName ?? '');
  const [bio, setBio] = useState(initialBio ?? '');
  const [favoriteTags, setFavoriteTags] = useState(initialTags.join(', '));
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatar);
  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme);
  const [isPrivate, setIsPrivate] = useState(initialIsPrivate);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('saving');
    const tags = favoriteTags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, bio, favoriteTags: tags, avatarUrl, theme, isPrivate })
    });
    setStatus(response.ok ? 'saved' : 'error');
  };

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) {
        throw new Error('Upload fehlgeschlagen');
      }
      const { storagePath, mediaType } = await uploadRes.json();
      if (mediaType !== 'image') {
        throw new Error('Nur Bilder erlaubt');
      }
      setAvatarUrl(storagePath);
    } catch (error) {
      console.error(error);
      setStatus('error');
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <Layout>
      <h1>Profil</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label>
          Profilbild
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#f1f1f1'
              }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl.startsWith('http') ? avatarUrl : `/api/media?path=${avatarUrl}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ display: 'block', textAlign: 'center', lineHeight: '72px', color: '#999' }}>?</span>
              )}
            </div>
            <input type="file" accept="image/*" onChange={(e) => handleAvatarUpload(e.target.files?.[0] ?? null)} disabled={avatarUploading} />
          </div>
        </label>
        <label>
          Anzeigename
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </label>
        <label>
          Bio
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} style={{ width: '100%', minHeight: 120, padding: 8 }} />
        </label>
        <label>
          Lieblings-Tags (Kommagetrennt)
          <input type="text" value={favoriteTags} onChange={(e) => setFavoriteTags(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </label>
        <label>
          Theme
          <select value={theme} onChange={(e) => setTheme(e.target.value as 'light' | 'dark')} style={{ width: '100%', padding: 8 }}>
            <option value="light">Hell</option>
            <option value="dark">Dunkel</option>
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
          <span>Privater Account (Beiträge nur für genehmigte Follower sichtbar)</span>
        </label>
        <button
          type="submit"
          style={{ width: 200, padding: '0.7rem 1rem', background: '#6c5ce7', border: 'none', borderRadius: 8, color: '#fff' }}
          disabled={status === 'saving'}
        >
          {status === 'saving' ? 'Speichert...' : 'Änderungen speichern'}
        </button>
        {status === 'saved' && <p style={{ color: '#2d3436' }}>Gespeichert!</p>}
        {status === 'error' && <p style={{ color: '#d63031' }}>Fehler beim Speichern</p>}
      </form>
    </Layout>
  );
};

export default ProfilePage;

export const getServerSideProps = (ctx: any) =>
  requirePageAuth(ctx, async ({ userId }) => {
    const user = getUserById(userId);
    return {
      props: {
        initialName: user?.name ?? '',
        initialBio: user?.bio ?? '',
        initialTags: user?.favorite_tags ?? [],
        initialAvatar: user?.avatar_url ?? null,
        initialTheme: user?.theme ?? 'light',
        initialIsPrivate: user?.is_private ?? false
      }
    };
  });

