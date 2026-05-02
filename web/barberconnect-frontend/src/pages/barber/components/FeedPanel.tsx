import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { postService, type Post, type PostComment } from '../../../services/barberFeatureService';

const FeedPanel: React.FC = () => {
  const { user } = useAuth();
  const barberProfileId = user?.barberProfile?.id?.toString() ?? '';

  // ─── State ──────────────────────────────────────────────────────────────────
  const [posts, setPosts]           = useState<Post[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newFile, setNewFile]       = useState<File | null>(null);
  const [creating, setCreating]     = useState(false);

  // Per-post comment states
  const [openComments, setOpenComments]     = useState<Record<string, boolean>>({});
  const [comments, setComments]             = useState<Record<string, PostComment[]>>({});
  const [commentInput, setCommentInput]     = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});

  const fileRef = useRef<HTMLInputElement>(null);

  // ─── Fetch posts on mount ────────────────────────────────────────────────────
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await postService.getAllPosts();
      setPosts(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  // ─── Create post ─────────────────────────────────────────────────────────────
  const handleCreatePost = async () => {
    if (!newContent.trim()) return;
    setCreating(true);
    try {
      const created = await postService.createPost(barberProfileId, newContent.trim(), newFile ?? undefined);
      setPosts(prev => [created, ...prev]);
      setNewContent('');
      setNewFile(null);
      setShowCreate(false);
    } catch (e: any) {
      alert(e.message || 'Failed to create post');
    } finally {
      setCreating(false);
    }
  };

  // ─── React ────────────────────────────────────────────────────────────────────
  const handleReact = async (postId: string) => {
    try {
      await postService.addReaction(postId, user?.firebaseUid ?? '', 'LIKE');
      // Optimistic update
      setPosts(prev => prev.map(p =>
        p.post_id === postId ? { ...p, likesCount: p.likesCount + 1 } : p
      ));
    } catch { /* silent */ }
  };

  // ─── Comments ─────────────────────────────────────────────────────────────────
  const toggleComments = async (postId: string) => {
    const isOpen = !!openComments[postId];
    setOpenComments(prev => ({ ...prev, [postId]: !isOpen }));
    if (!isOpen && !comments[postId]) {
      setLoadingComments(prev => ({ ...prev, [postId]: true }));
      try {
        const data = await postService.getComments(postId);
        setComments(prev => ({ ...prev, [postId]: data }));
      } catch { /* silent */ } finally {
        setLoadingComments(prev => ({ ...prev, [postId]: false }));
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    const content = (commentInput[postId] ?? '').trim();
    if (!content) return;
    try {
      const added = await postService.addComment(postId, user?.firebaseUid ?? '', content);
      setComments(prev => ({ ...prev, [postId]: [...(prev[postId] ?? []), added] }));
      setCommentInput(prev => ({ ...prev, [postId]: '' }));
      setPosts(prev => prev.map(p =>
        p.post_id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
      ));
    } catch (e: any) {
      alert(e.message || 'Failed to add comment');
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-10">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Social Feed</h2>
          <p className="text-slate-500 font-medium mt-1">Share your work and engage with customers</p>
        </div>
        <button
          onClick={() => setShowCreate(v => !v)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition flex items-center gap-2"
        >
          <span>➕</span> Create Post
        </button>
      </div>

      {/* Create Post Form */}
      {showCreate && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4 max-w-2xl">
          <h3 className="font-bold text-slate-800">New Post</h3>
          <textarea
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder="What's on your mind? Share a haircut, tip, or update…"
            className="border border-slate-200 rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:border-slate-400"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              📷 {newFile ? newFile.name : 'Add Photo'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => setNewFile(e.target.files?.[0] ?? null)} />
            <button
              onClick={handleCreatePost}
              disabled={creating || !newContent.trim()}
              className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold disabled:opacity-50 transition ml-auto"
            >
              {creating ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {/* Loading / Error */}
      {loading && <p className="text-slate-400 text-sm">Loading posts…</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Feed */}
      <div className="flex flex-col items-center gap-6">
        {!loading && posts.length === 0 && (
          <p className="text-slate-400 text-sm mt-6">No posts yet. Create your first one!</p>
        )}

        {posts.map(post => (
          <div key={post.post_id} className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

            {/* Post Header */}
            <div className="flex items-center gap-4 p-5">
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex flex-shrink-0 items-center justify-center text-slate-600 font-bold text-sm">
                {user?.firstName?.charAt(0) ?? 'B'}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">{user?.firstName} {user?.lastName}</h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  {post.createdAt ? new Date(post.createdAt).toLocaleString() : ''}
                </p>
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
                onClick={() => handleReact(post.post_id)}
                className="flex items-center gap-2 text-slate-500 hover:text-[#D2691E] transition"
              >
                <span className="text-xl">❤️</span>
                <span className="text-sm font-bold">{post.likesCount}</span>
              </button>
              <button
                onClick={() => toggleComments(post.post_id)}
                className="flex items-center gap-2 text-slate-500 hover:text-[#8B4513] transition"
              >
                <span className="text-xl">💬</span>
                <span className="text-sm font-bold">{post.commentsCount}</span>
              </button>
            </div>

            {/* Comments section */}
            {openComments[post.post_id] && (
              <div className="px-5 pb-5 flex flex-col gap-3 border-t border-slate-50 pt-4">
                {loadingComments[post.post_id] && <p className="text-xs text-slate-400">Loading comments…</p>}
                {(comments[post.post_id] ?? []).map(c => (
                  <div key={c.comment_id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">
                      {c.user_id.charAt(0).toUpperCase()}
                    </div>
                    <div className="bg-slate-50 rounded-xl px-3 py-2 text-sm text-slate-700 flex-1">
                      {c.content}
                    </div>
                  </div>
                ))}
                {/* Add comment */}
                <div className="flex gap-2 mt-1">
                  <input
                    value={commentInput[post.post_id] ?? ''}
                    onChange={e => setCommentInput(prev => ({ ...prev, [post.post_id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleAddComment(post.post_id)}
                    placeholder="Add a comment…"
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                  />
                  <button
                    onClick={() => handleAddComment(post.post_id)}
                    className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeedPanel;
