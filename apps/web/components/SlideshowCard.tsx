import Link from 'next/link';
import { useState } from 'react';
import type { Slideshow } from '../types/slideshow';
import { ReportButton } from './ReportButton';
import { CommentThreadGeneric } from './CommentThreadGeneric';
import { useCurrentUser } from '../lib/hooks/useCurrentUser';
import { isAdminUser } from '../lib/auth/isAdmin';

type Props = {
  slideshow: Slideshow;
  viewerId?: number;
  isOwner?: boolean;
};

const getMediaSrc = (path: string) => (path.startsWith('http') ? path : `/api/media?path=${encodeURIComponent(path)}`);

export const SlideshowCard = ({ slideshow, viewerId, isOwner: propIsOwner }: Props) => {
  const { user } = useCurrentUser();
  const [index, setIndex] = useState(0);
  const [isDeleted, setIsDeleted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
  const isOwner = propIsOwner ?? (user && slideshow.author.id === user.id);
  const isAdmin = user ? isAdminUser({ id: user.id, email: user.email } as any) : false;

  const prev = () => setIndex((value) => (value === 0 ? slideshow.mediaUrls.length - 1 : value - 1));
  const next = () => setIndex((value) => (value === slideshow.mediaUrls.length - 1 ? 0 : value + 1));

  const handleDelete = async () => {
    if (!confirm('Möchtest du diese Slideshow wirklich löschen?')) return;
    try {
      const response = await fetch(`/api/slideshows/${slideshow.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Löschen fehlgeschlagen');
      setIsDeleted(true);
    } catch (error) {
      console.error(error);
      alert('Fehler beim Löschen');
    }
  };

  if (isDeleted) {
    return null;
  }

  return (
    <article className="card">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div>
          <Link href={`/users/${slideshow.author.id}`} style={{ textDecoration: 'none', color: 'var(--text)' }}>
            <strong>{slideshow.author.name ?? 'Unbekannt'}</strong>
          </Link>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{new Date(slideshow.createdAt).toLocaleString()}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {!isOwner && <ReportButton targetType="slideshow" targetId={slideshow.id} authorId={slideshow.author.id} />}
          {(isOwner || isAdmin) && (
            <button
              type="button"
              className="icon-button"
              onClick={handleDelete}
              style={{ color: '#e74c3c', borderColor: '#e74c3c' }}
              title="Slideshow löschen"
            >
              <i className="bi bi-trash-fill" />
            </button>
          )}
        </div>
      </header>
      {slideshow.caption && <p style={{ marginBottom: '0.5rem' }}>{slideshow.caption}</p>}
      <div className="slideshow-frame">
        <button type="button" className="slideshow-nav" onClick={prev}>
          <i className="bi bi-chevron-left" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={getMediaSrc(slideshow.mediaUrls[index])} alt={slideshow.caption ?? 'Slideshow'} />
        <button type="button" className="slideshow-nav" onClick={next}>
          <i className="bi bi-chevron-right" />
        </button>
      </div>
      <div className="slideshow-dots">
        {slideshow.mediaUrls.map((_, dotIdx) => (
          <span key={dotIdx} className={`slideshow-dot ${dotIdx === index ? 'is-active' : ''}`} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
        <button 
          type="button" 
          className="icon-button" 
          onClick={() => setShowComments((value) => !value)}
          style={{ fontSize: '0.9rem' }}
        >
          <i className="bi bi-chat-dots" />
          Kommentare
        </button>
      </div>
      {showComments && (
        <CommentThreadGeneric targetType="slideshow" targetId={slideshow.id} authorId={slideshow.author.id} />
      )}
    </article>
  );
};

