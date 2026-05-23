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
}> = ({ post, barberInfo, onReact }) => {
  const [commentsOpen, setCommentsOpen]       = useState(false);
  const [comments, setComments]               = useState<PostComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError]     = useState<string | null>(null);
  const [commentInput, setCommentInput]       = useState('');
  const [addingComment, setAddingComment]     = useState(false);
  // commenter name cache: user_id → display name
  const [commenterNames, setCommenterNames]   = useState<Record<string, string>>({});
  const { user } = useAuth();

  const barberName = barberInfo
    ? `${barberInfo.firstName ?? ''} ${barberInfo.lastName ?? ''}`.trim() || 'Barber'
    : 'Barber';
  const barberImg = barberInfo?.profileImageUrl ?? null;

  const dateStr = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recently';

  // Resolve commenter names for a list of comments
  const resolveCommenterNames = async (newComments: PostComment[]) => {
    const unknownIds = [...new Set(newComments.map(c => c.user_id).filter(id => id && !commenterNames[id]))];
    if (unknownIds.length === 0) return;
    const resolved: Record<string, string> = {};
    await Promise.all(unknownIds.map(async (uid) => {
      try {
        const res = await import('../../../services/api').then(m => m.default.get(`/auth/user/${uid}`));
        const u = res.data?.data ?? res.data;
        resolved[uid] = `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim() || 'User';
      } catch {
        resolved[uid] = 'User';
      }
    }));
    setCommenterNames(prev => ({ ...prev, ...resolved }));
  };

  const toggleComments = async () => {
    const opening = !commentsOpen;
    setCommentsOpen(opening);
    if (opening && comments.length === 0 && !commentsError) {
      setCommentsLoading(true);
      setCommentsError(null);
      try {
        const data = await postService.getComments(post.post_id);
        setComments(data);
        await resolveCommenterNames(data);
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
      // Resolve name for the new commenter (current user)
      if (user.firebaseUid && !commenterNames[user.firebaseUid]) {
        const myName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'You';
        setCommenterNames(prev => ({ ...prev, [user.firebaseUid!]: myName }));
      }
    } catch (e: any) {
      alert(e.message || 'Failed to add comment');
    } finally { setAddingComment(false); }
  };

  const myName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'You';
  const myInitial = (user?.firstName ?? 'U').charAt(0).toUpperCase();

  return (
    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

      {/* Post Header — real barber avatar + full name */}
      <div className="flex items-center gap-4 p-5">
        <Avatar src={barberImg} name={barberName} size={44} />
        <div>
          <h3 className="font-bold text-slate-800 text-sm">{barberName}</h3>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">{dateStr}</p>
        </div>
      </div>

      {/* Post Image */}
      {post.imageUrl && (
        <div className="w-full aspect-[4/5] bg-slate-900 overflow-hidden relative">
          <img src={post.imageUrl} alt="Post" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Caption */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-sm text-slate-700 font-medium">{post.content}</p>
      </div>

      {/* Actions */}
      <div className="p-5 flex items-center gap-4 border-t border-slate-50">
        <button
          onClick={() => onReact(post.post_id)}
          className="flex items-center gap-2 text-slate-500 hover:text-[#D2691E] transition"
        >
          <span className="text-xl">❤️</span>
          <span className="text-sm font-bold">{post.likesCount ?? 0}</span>
        </button>
        <button
          onClick={toggleComments}
          className="flex items-center gap-2 text-slate-500 hover:text-[#8B4513] transition"
        >
          <span className="text-xl">💬</span>
          <span className="text-sm font-bold">{post.commentsCount ?? 0}</span>
        </button>
      </div>

      {/* Comments section */}
      {commentsOpen && (
        <div style={{ padding: '0 20px 18px', borderTop: '1px solid #F3F4F6' }}>
          {commentsLoading && (
            <p style={{ fontSize: 12.5, color: '#9CA3AF', padding: '10px 0' }}>Loading comments…</p>
          )}
          {commentsError && (
            <p style={{ fontSize: 12.5, color: '#EF4444', padding: '10px 0' }}>{commentsError}</p>
          )}
          {!commentsLoading && !commentsError && comments.length === 0 && (
            <p style={{ fontSize: 12.5, color: '#9CA3AF', fontStyle: 'italic', padding: '10px 0' }}>No comments yet — be the first!</p>
          )}

          {/* Comment list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            {comments.map(c => {
              const name = commenterNames[c.user_id] || 'User';
              const initial = name.charAt(0).toUpperCase();
              return (
                <div key={c.comment_id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: '#FFF7ED', border: '1.5px solid #FED7AA',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: '#F97316',
                  }}>
                    {initial}
                  </div>
                  {/* Bubble */}
                  <div style={{ flex: 1, background: '#F9FAFB', borderRadius: '0 12px 12px 12px', padding: '8px 12px', border: '1px solid #F3F4F6' }}>
                    <p style={{ margin: '0 0 3px', fontSize: 11.5, fontWeight: 700, color: '#374151' }}>{name}</p>
                    <p style={{ margin: 0, fontSize: 13, color: '#4B5563', lineHeight: 1.5 }}>{c.content}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add comment */}
          <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'center' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: '#FFF7ED', border: '1.5px solid #FED7AA',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: '#F97316',
            }}>
              {myInitial}
            </div>
            <div style={{ flex: 1, display: 'flex', gap: 8, background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 24, padding: '6px 6px 6px 14px', alignItems: 'center' }}>
              <input
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                placeholder={`Comment as ${myName}…`}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: '#374151', fontFamily: 'inherit' }}
              />
              <button
                onClick={handleAddComment}
                disabled={!commentInput.trim() || addingComment}
                style={{
                  background: commentInput.trim() ? 'linear-gradient(135deg,#F97316,#EA580C)' : '#E5E7EB',
                  color: commentInput.trim() ? '#fff' : '#9CA3AF',
                  border: 'none', borderRadius: 20, padding: '6px 14px',
                  fontSize: 12, fontWeight: 700, cursor: commentInput.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all .15s', fontFamily: 'inherit', flexShrink: 0,
                }}
              >
                {addingComment ? '…' : 'Send'}
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40, alignItems: 'center' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, maxWidth: 640, width: '100%' }}>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, width: '100%', margin: '0 auto' }}>
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
