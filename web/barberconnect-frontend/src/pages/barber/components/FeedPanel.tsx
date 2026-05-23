import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { postService, type Post, type PostComment } from '../../../services/barberFeatureService';
import { barberService, type Barber } from '../../../services/barberService';

// ── Avatar helper ─────────────────────────────────────────────────────────────
const Avatar: React.FC<{
  src?: string | null; name: string; size?: number;
}> = ({ src, name, size = 44 }) => {
  const [broken, setBroken] = useState(false);
  const initials = name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'B';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: '#FFF7ED', border: '2px solid #FED7AA',
      overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: size * 0.35, color: '#F97316',
      boxShadow: '0 2px 8px rgba(249,115,22,0.15)',
    }}>
      {src && !broken
        ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setBroken(true)} />
        : initials}
    </div>
  );
};

// ── Create Post Modal ─────────────────────────────────────────────────────────
const CreatePostModal: React.FC<{
  user: any;
  onClose: () => void;
  onCreated: (post: Post) => void;
}> = ({ user, onClose, onCreated }) => {
  const [content, setContent]   = useState('');
  const [file, setFile]         = useState<File | null>(null);
  const [preview, setPreview]   = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const barberProfileId = user?.barberProfile?.id ?? user?.firebaseUid ?? '';
  const barberName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Barber';
  const barberImg  = user?.barberProfile?.profileImageUrl ?? user?.profileImageUrl ?? null;

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    if (!barberProfileId) { alert('Barber profile not found. Complete your profile first.'); return; }
    setCreating(true);
    try {
      const created = await postService.createPost(barberProfileId, content.trim(), file ?? undefined);
      onCreated(created);
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to create post.';
      alert(msg);
    } finally { setCreating(false); }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem', animation: 'fpFadeIn .2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, width: '100%', maxWidth: 580,
          boxShadow: '0 24px 64px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.08)',
          animation: 'fpSlideUp .25s ease', overflow: 'hidden',
        }}
      >
        {/* Modal header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#111827', letterSpacing: '-0.01em' }}>Create New Post</p>
            <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#9CA3AF' }}>Share a haircut, tip, or update with your customers</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#F3F4F6', color: '#6B7280', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#E5E7EB')}
            onMouseLeave={e => (e.currentTarget.style.background = '#F3F4F6')}>×</button>
        </div>

        {/* Barber profile row */}
        <div style={{ padding: '16px 24px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar src={barberImg} name={barberName} size={46} />
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>{barberName}</p>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#F97316', background: '#FFF7ED', padding: '2px 8px', borderRadius: 20, border: '1px solid #FED7AA' }}>Barber</span>
          </div>
        </div>

        {/* Textarea */}
        <div style={{ padding: '14px 24px 0' }}>
          <textarea
            ref={textRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
            style={{
              width: '100%', background: '#FAFAFA', border: '1.5px solid #E5E7EB',
              borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#111827',
              fontFamily: 'inherit', resize: 'none', outline: 'none',
              transition: 'border-color .15s, box-shadow .15s', lineHeight: 1.6,
            }}
            onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; e.target.style.background = '#fff'; }}
            onBlur={e  => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#FAFAFA'; }}
          />
        </div>

        {/* Image upload */}
        <div style={{ padding: '12px 24px 0' }}>
          {preview ? (
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', maxHeight: 220 }}>
              <img src={preview} alt="Preview" style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} />
              <button onClick={() => { setFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              style={{
                width: '100%', padding: '18px', border: '2px dashed #E5E7EB', borderRadius: 12,
                background: '#FAFAFA', color: '#9CA3AF', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'border-color .15s, color .15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#F97316'; (e.currentTarget as HTMLButtonElement).style.color = '#F97316'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'; }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 18, height: 18 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              Add haircut photo
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>

        {/* Action buttons */}
        <div style={{ padding: '16px 24px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose}
            style={{ height: 42, padding: '0 20px', border: '1.5px solid #E5E7EB', borderRadius: 10, background: '#fff', color: '#6B7280', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#D1D5DB'; (e.currentTarget as HTMLButtonElement).style.color = '#374151'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLButtonElement).style.color = '#6B7280'; }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={creating || !content.trim()}
            style={{
              height: 42, padding: '0 24px', border: 'none', borderRadius: 10,
              background: creating || !content.trim() ? '#FED7AA' : 'linear-gradient(135deg,#F97316,#EA580C)',
              color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: creating || !content.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', boxShadow: creating || !content.trim() ? 'none' : '0 2px 8px rgba(249,115,22,0.35)',
              display: 'flex', alignItems: 'center', gap: 7, transition: 'all .15s',
            }}>
            {creating
              ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'fpSpin .7s linear infinite' }} />Posting…</>
              : <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 14, height: 14 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                  Post
                </>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Post Card ─────────────────────────────────────────────────────────────────
const PostCard: React.FC<{
  post: Post;
  barberInfo: Barber | null;
  isOwn: boolean;
  onReact: (id: string) => void;
}> = ({ post, barberInfo, isOwn, onReact }) => {
  const [commentsOpen, setCommentsOpen]     = useState(false);
  const [comments, setComments]             = useState<PostComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError]   = useState<string | null>(null);
  const [commentInput, setCommentInput]     = useState('');
  const [addingComment, setAddingComment]   = useState(false);
  const { user } = useAuth();

  const barberName = barberInfo
    ? `${barberInfo.firstName ?? ''} ${barberInfo.lastName ?? ''}`.trim() || 'Barber'
    : 'Barber';
  const barberImg = barberInfo?.profileImageUrl ?? null;

  const dateStr = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recently';

  const toggleComments = async () => {
    const opening = !commentsOpen;
    setCommentsOpen(opening);
    if (opening && comments.length === 0 && !commentsError) {
      setCommentsLoading(true);
      setCommentsError(null);
      try {
        const data = await postService.getComments(post.post_id);
        setComments(data);
      } catch (e: any) {
        console.error('Failed to load comments:', e);
        setCommentsError('Failed to load comments.');
      } finally {
        setCommentsLoading(false);
      }
    }
  };

  const handleAddComment = async () => {
    const content = commentInput.trim();
    if (!content || !user?.firebaseUid) return;
    setAddingComment(true);
    try {
      const added = await postService.addComment(post.post_id, user.firebaseUid, content);
      setComments(prev => [...prev, added]);
      setCommentInput('');
    } catch (e: any) {
      alert(e.message || 'Failed to add comment');
    } finally { setAddingComment(false); }
  };

  return (
    <div style={{
      background: '#fff', borderRadius: 20, overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 4px 20px rgba(0,0,0,0.07)',
      border: '1px solid rgba(0,0,0,0.04)',
      transition: 'box-shadow .25s, transform .25s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.07), 0 12px 32px rgba(0,0,0,0.11)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05), 0 4px 20px rgba(0,0,0,0.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px 12px' }}>
        <Avatar src={barberImg} name={barberName} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>{barberName}</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>{dateStr}</p>
        </div>
        <button style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'none', color: '#9CA3AF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
        </button>
      </div>

      {/* Caption */}
      {post.content && (
        <div style={{ padding: '0 18px 12px' }}>
          <p style={{ margin: 0, fontSize: 14.5, color: '#374151', lineHeight: 1.6, fontWeight: 400 }}>{post.content}</p>
        </div>
      )}

      {/* Image */}
      {post.imageUrl && (
        <div style={{ width: '100%', height: 320, overflow: 'hidden', background: '#F3F4F6' }}>
          <img src={post.imageUrl} alt="Post" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .4s ease' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '12px 14px', borderTop: '1px solid #F3F4F6' }}>
        <button onClick={() => onReact(post.post_id)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', borderRadius: 10, border: 'none', background: 'none', color: '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLButtonElement).style.color = '#EF4444'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = '#6B7280'; }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 17, height: 17 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          {post.likesCount ?? 0}
        </button>

        <button onClick={toggleComments}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', borderRadius: 10, border: 'none', background: commentsOpen ? '#FFF7ED' : 'none', color: commentsOpen ? '#F97316' : '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}
          onMouseEnter={e => { if (!commentsOpen) { (e.currentTarget as HTMLButtonElement).style.background = '#FFF7ED'; (e.currentTarget as HTMLButtonElement).style.color = '#F97316'; } }}
          onMouseLeave={e => { if (!commentsOpen) { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = '#6B7280'; } }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 17, height: 17 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
          View comments ({post.commentsCount ?? 0})
        </button>
      </div>

      {/* Comments section */}
      {commentsOpen && (
        <div style={{ borderTop: '1px solid #F3F4F6', padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {commentsLoading && <p style={{ margin: 0, fontSize: 13, color: '#9CA3AF' }}>Loading comments…</p>}
          {commentsError  && <p style={{ margin: 0, fontSize: 13, color: '#EF4444' }}>{commentsError}</p>}
          {!commentsLoading && !commentsError && comments.length === 0 && (
            <p style={{ margin: 0, fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>No comments yet</p>
          )}
          {comments.map(c => (
            <div key={c.comment_id} style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#6B7280', flexShrink: 0 }}>
                {(c.user_id ?? 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '8px 12px', flex: 1, fontSize: 13.5, color: '#374151', lineHeight: 1.5 }}>
                {c.content}
              </div>
            </div>
          ))}
          {/* Add comment */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Avatar src={null} name={`${user?.firstName ?? 'U'}`} size={30} />
            <div style={{ flex: 1, display: 'flex', gap: 6 }}>
              <input value={commentInput} onChange={e => setCommentInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                placeholder="Write a comment…"
                style={{ flex: 1, background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 20, padding: '7px 14px', fontSize: 13, color: '#374151', outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s' }}
                onFocus={e => (e.target.style.borderColor = '#F97316')}
                onBlur={e  => (e.target.style.borderColor = '#E5E7EB')} />
              <button onClick={handleAddComment} disabled={!commentInput.trim() || addingComment}
                style={{ background: '#F97316', color: '#fff', border: 'none', borderRadius: 20, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: !commentInput.trim() ? 'not-allowed' : 'pointer', opacity: !commentInput.trim() ? 0.5 : 1, transition: 'opacity .15s', fontFamily: 'inherit' }}>
                {addingComment ? '…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main FeedPanel ────────────────────────────────────────────────────────────
const FeedPanel: React.FC = () => {
  const { user } = useAuth();
  const barberProfileId = user?.barberProfile?.id ?? user?.firebaseUid ?? '';

  const [posts,        setPosts]        = useState<Post[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [showModal,    setShowModal]    = useState(false);
  // Cache of barber info keyed by barber_profile_id
  const [barberCache,  setBarberCache]  = useState<Record<string, Barber>>({});

  // Fetch all posts (community feed — NOT filtered to logged-in barber)
  const fetchPosts = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await postService.getAllPosts();
      setPosts(data);
      // Resolve barber info for all unique barber_profile_ids
      const uniqueIds = [...new Set(data.map(p => p.barber_profile_id).filter(Boolean))];
      const newEntries: Record<string, Barber> = {};
      await Promise.all(uniqueIds.map(async (id) => {
        try {
          const b = await barberService.getBarberById(id);
          newEntries[id] = b;
        } catch { /* silent — fallback to initials */ }
      }));
      setBarberCache(prev => ({ ...prev, ...newEntries }));
    } catch (e: any) {
      setError(e.message || 'Failed to load posts');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleReact = async (postId: string) => {
    try {
      await postService.addReaction(postId, user?.firebaseUid ?? '', 'LIKE');
      setPosts(prev => prev.map(p => p.post_id === postId ? { ...p, likesCount: (p.likesCount ?? 0) + 1 } : p));
    } catch { /* silent */ }
  };

  const handleCreated = (post: Post) => {
    setPosts(prev => [post, ...prev]);
    // Add logged-in barber to cache if not already there
    if (barberProfileId && !barberCache[barberProfileId]) {
      barberService.getBarberById(barberProfileId).then(b => {
        setBarberCache(prev => ({ ...prev, [barberProfileId]: b }));
      }).catch(() => {});
    }
  };

  return (
    <>
      <style>{`
        @keyframes fpFadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes fpSlideUp { from { opacity:0; transform:translateY(20px) scale(.97) } to { opacity:1; transform:translateY(0) scale(1) } }
        @keyframes fpSpin    { to { transform:rotate(360deg) } }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Social Feed</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13.5, color: '#6B7280' }}>Community feed — see and share posts from all barbers</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: 'linear-gradient(135deg,#F97316,#EA580C)', color: '#fff',
              border: 'none', borderRadius: 10, padding: '10px 20px',
              fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 7,
              boxShadow: '0 2px 8px rgba(249,115,22,0.35)', transition: 'all .15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(249,115,22,0.5)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(249,115,22,0.35)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 15, height: 15 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Post
          </button>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#9CA3AF', padding: '2rem 0' }}>
            <div style={{ width: 20, height: 20, border: '2.5px solid #E5E7EB', borderTopColor: '#F97316', borderRadius: '50%', animation: 'fpSpin .7s linear infinite' }} />
            <span style={{ fontSize: 14 }}>Loading posts…</span>
          </div>
        )}
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', color: '#B91C1C', fontSize: 13.5 }}>
            {error}
          </div>
        )}

        {/* Feed */}
        {!loading && posts.length === 0 && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 2rem', gap: 12, color: '#9CA3AF', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F9FAFB', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#D1D5DB" style={{ width: 28, height: 28 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#374151' }}>No posts yet</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9CA3AF' }}>Be the first to share a haircut or update!</p>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, width: '100%' }}>
          {posts.map(post => (
            <PostCard
              key={post.post_id}
              post={post}
              barberInfo={barberCache[post.barber_profile_id] ?? null}
              isOwn={post.barber_profile_id === barberProfileId}
              onReact={handleReact}
            />
          ))}
        </div>
      </div>

      {/* Create Post Modal */}
      {showModal && (
        <CreatePostModal
          user={user}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
};

export default FeedPanel;
