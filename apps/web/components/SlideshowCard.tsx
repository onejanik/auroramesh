import { useState } from 'react';
import type { Slideshow } from '../types/slideshow';
import { ReportButton } from './ReportButton';

type Props = {
  slideshow: Slideshow;
};

const getMediaSrc = (path: string) => (path.startsWith('http') ? path : `/api/media?path=${encodeURIComponent(path)}`);

export const SlideshowCard = ({ slideshow }: Props) => {
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((value) => (value === 0 ? slideshow.mediaUrls.length - 1 : value - 1));
  const next = () => setIndex((value) => (value === slideshow.mediaUrls.length - 1 ? 0 : value + 1));

  return (
    <article className="card">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div>
          <strong>{slideshow.author.name ?? 'Unbekannt'}</strong>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{new Date(slideshow.createdAt).toLocaleString()}</p>
        </div>
        <ReportButton targetType="slideshow" targetId={slideshow.id} />
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
    </article>
  );
};

