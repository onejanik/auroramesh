import Link from 'next/link';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Post } from '../types/post';
import { ReportButton } from './ReportButton';
import { CommentThread } from './CommentThread';

const getMediaSrc = (mediaUrl: string) => {
  if (!mediaUrl) return '';
  if (mediaUrl.startsWith('http')) return mediaUrl;
  return `/api/media?path=${encodeURIComponent(mediaUrl)}`;
};

type Props = {
  post: Post;
};

export const PostCard = ({ post }: Props) => {
  const [liked, setLiked] = useState(post.viewer?.liked ?? false);
  const [saved, setSaved] = useState(post.viewer?.saved ?? false);
  const [likeCount, setLikeCount] = useState(post.stats?.likes ?? 0);
  const [saveCount, setSaveCount] = useState(post.stats?.saves ?? 0);
  const [isMutating, setMutating] = useState<'like' | 'save' | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [isPrivate, setIsPrivate] = useState(post.isPrivate ?? false);
  const [isDeleted, setIsDeleted] = useState(false);
  const isOwner = post.viewer?.isOwner ?? false;

  const toggleReaction = async (kind: 'like' | 'save') => {
    const isLike = kind === 'like';
    const state = isLike ? liked : saved;
    const setState = isLike ? setLiked : setSaved;
    const setCount = isLike ? setLikeCount : setSaveCount;
    const endpoint = isLike ? 'like' : 'save';
    const nextState = !state;

    setState(nextState);
    setCount((value) => Math.max(0, value + (nextState ? 1 : -1)));
    setMutating(kind);

    try {
      const response = await fetch(`/api/posts/${post.id}/${endpoint}`, {
        method: nextState ? 'POST' : 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Aktion fehlgeschlagen');
      }
      const data = await response.json();
      if (isLike) {
        setLikeCount(data.likeCount);
        setLiked(data.liked);
      } else {
        setSaveCount(data.saveCount);
        setSaved(data.saved);
      }
    } catch (error) {
      console.error(error);
      // revert optimistic update
      setState(state);
      setCount((value) => Math.max(0, value + (state ? 1 : -1)));
    } finally {
      setMutating(null);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Möchtest du diesen Beitrag wirklich löschen?')) return;
    try {
      const response = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Löschen fehlgeschlagen');
      setIsDeleted(true);
    } catch (error) {
      console.error(error);
      alert('Fehler beim Löschen');
    }
  };

  const handleTogglePrivacy = async () => {
    const newPrivacy = !isPrivate;
    setIsPrivate(newPrivacy);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrivate: newPrivacy })
      });
      if (!response.ok) throw new Error('Update fehlgeschlagen');
      const data = await response.json();
      setIsPrivate(data.isPrivate);
    } catch (error) {
      console.error(error);
      setIsPrivate(!newPrivacy);
      alert('Fehler beim Aktualisieren');
    }
  };

  if (isDeleted) {
    return null;
  }

  return (
    <article
      style={{
        border: '1px solid var(--border)',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: '1.5rem',
        background: 'var(--card-bg)',
        boxShadow: '0 5px 20px var(--card-shadow)'
      }}
    >
      <div style={{ padding: '1rem' }}>
        <Link href={`/users/${post.author.id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--avatar-bg)',
              overflow: 'hidden'
            }}
          >
            {post.author.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.author.avatarUrl.startsWith('http') ? post.author.avatarUrl : `/api/media?path=${encodeURIComponent(post.author.avatarUrl)}`} alt={post.author.name ?? 'Avatar'} style={{ width: '100%', height: '100%' }} />
            ) : (
              <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: '40px', textAlign: 'center', display: 'block' }}>
                {post.author.name?.[0] ?? '?'}
              </span>
            )}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>{post.author.name ?? 'Unbekannt'}</p>
            <small style={{ color: 'var(--muted)' }}>{new Date(post.createdAt).toLocaleString()}</small>
          </div>
        </Link>
        {post.caption && (
          <div className="markdown-body" style={{ marginTop: '1rem' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.caption}</ReactMarkdown>
          </div>
        )}
        {post.tags?.length ? (
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {post.tags.map((tag) => (
              <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} className="tag-pill" style={{ cursor: 'pointer' }}>
                #{tag}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
      <div style={{ width: '100%', maxHeight: 500, background: '#000', display: 'flex', justifyContent: 'center' }}>
        {post.mediaType === 'video' ? (
          <video controls style={{ width: '100%', maxHeight: 500 }} src={getMediaSrc(post.mediaUrl)} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getMediaSrc(post.mediaUrl)} alt={post.caption ?? 'Post media'} style={{ width: '100%', objectFit: 'cover' }} />
        )}
      </div>
      <div className="post-footer">
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className={`icon-button ${liked ? 'is-active' : ''}`}
            onClick={() => toggleReaction('like')}
            disabled={isMutating === 'like'}
          >
            <i className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'}`} />
            <span>{likeCount}</span>
          </button>
          <button
            type="button"
            className={`icon-button ${saved ? 'is-active' : ''}`}
            onClick={() => toggleReaction('save')}
            disabled={isMutating === 'save'}
          >
            <i className={`bi ${saved ? 'bi-bookmark-fill' : 'bi-bookmark'}`} />
            <span>{saveCount}</span>
          </button>
          <button type="button" className="icon-button" onClick={() => setShowComments((value) => !value)}>
            <i className="bi bi-chat-dots" />
            <span>{post.commentCount ?? 0}</span>
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isOwner && (
            <>
              <button
                type="button"
                className="icon-button"
                onClick={handleTogglePrivacy}
                title={isPrivate ? 'Öffentlich machen' : 'Privat machen'}
              >
                <i className={`bi ${isPrivate ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`} />
                {isPrivate ? 'Privat' : 'Öffentlich'}
              </button>
              <button
                type="button"
                className="icon-button"
                onClick={handleDeletePost}
                style={{ color: '#e74c3c', borderColor: '#e74c3c' }}
                title="Beitrag löschen"
              >
                <i className="bi bi-trash-fill" />
              </button>
            </>
          )}
          {!isOwner && <ReportButton targetType="post" targetId={post.id} />}
        </div>
      </div>
      {showComments && (
        <div style={{ padding: '0 1rem 1rem' }}>
          <CommentThread postId={post.id} postAuthorId={post.author.id} />
        </div>
      )}
    </article>
  );
};

