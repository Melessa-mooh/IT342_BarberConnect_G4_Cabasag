import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { feedbackService, type FeedbackWithReply } from '../../../services/barberFeatureService';

const FeedbackPanel: React.FC = () => {
  const { user } = useAuth();
  const barberProfileId = user?.barberProfile?.id?.toString() ?? '';

  const [feedback, setFeedback]   = useState<FeedbackWithReply[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState<Record<string, string>>({});
  const [replying, setReplying]   = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!barberProfileId) return;
    fetchFeedback();
  }, [barberProfileId]);

  const fetchFeedback = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await feedbackService.getFeedbackForBarber(barberProfileId);
      setFeedback(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (feedbackId: string) => {
    const content = (replyInput[feedbackId] ?? '').trim();
    if (!content) return;
    setReplying(prev => ({ ...prev, [feedbackId]: true }));
    try {
      await feedbackService.replyToFeedback(feedbackId, barberProfileId, content);
      // Optimistic update
      setFeedback(prev => prev.map(fb =>
        fb.feedbackId === feedbackId ? { ...fb, replyContent: content, replyCommentId: 'done' } : fb
      ));
      setReplyInput(prev => ({ ...prev, [feedbackId]: '' }));
    } catch (e: any) {
      alert(e.message || 'Failed to send reply');
    } finally {
      setReplying(prev => ({ ...prev, [feedbackId]: false }));
    }
  };

  // ── Computed stats ─────────────────────────────────────────────────────────
  const totalReviews = feedback.length;
  const avgRating = totalReviews > 0
    ? (feedback.reduce((s, f) => s + (f.rating ?? 0), 0) / totalReviews).toFixed(1)
    : '0.0';

  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: feedback.filter(f => f.rating === star).length,
    pct: totalReviews > 0
      ? Math.round((feedback.filter(f => f.rating === star).length / totalReviews) * 100)
      : 0,
  }));

  const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-10">

      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Ratings &amp; Feedback</h2>
        <p className="text-slate-500 font-medium mt-1">See what your customers are saying</p>
      </div>

      {loading && <p className="text-slate-400 text-sm">Loading feedback…</p>}
      {error   && <p className="text-red-500 text-sm">{error}</p>}

      {/* Overview Row */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Average Rating */}
          <div className="md:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col justify-center hover:shadow-md transition-shadow">
            <h3 className="text-sm font-bold text-slate-800 mb-6 border-b border-slate-50 pb-2">Average Rating</h3>
            <div className="flex flex-col items-center">
              <h2 className="text-6xl font-black text-slate-900 tracking-tighter mb-2">{avgRating}</h2>
              <div className="flex text-amber-400 text-xl tracking-widest drop-shadow-sm mb-2">★★★★★</div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
                Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Distribution */}
          <div className="md:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col hover:shadow-md transition-shadow">
            <h3 className="text-sm font-bold text-slate-800 mb-6 border-b border-slate-50 pb-2">Rating Distribution</h3>
            <div className="flex flex-col gap-3">
              {dist.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-600 w-8 flex justify-between">
                    {star} <span className="text-amber-400">★</span>
                  </span>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                    <div className="h-full bg-slate-900 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 w-20 text-right">
                    {count} ({pct}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Review List */}
      {!loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h3 className="text-sm font-bold text-slate-800 mb-8 border-b border-slate-50 pb-2">Customer Reviews</h3>

          {feedback.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-6">No reviews yet. Keep up the great work!</p>
          )}

          <div className="flex flex-col gap-8">
            {feedback.map(fb => (
              <div key={fb.feedbackId} className="flex gap-5 border-b border-slate-50 pb-8 last:border-0 last:pb-0">

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex flex-shrink-0 items-center justify-center text-slate-600 font-bold text-sm">
                  {(fb.customerId ?? '?').charAt(0).toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{fb.customerId}</h4>
                      <p className="text-xs font-semibold text-slate-400">
                        {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-amber-400 text-sm tracking-widest mt-2 mb-3">
                    {stars(fb.rating ?? 0)}
                  </div>

                  <p className="text-sm font-medium text-slate-700 leading-relaxed italic border-l-2 border-slate-200 pl-3">
                    "{fb.comment}"
                  </p>

                  {/* Existing reply */}
                  {fb.replyContent && (
                    <div className="mt-3 ml-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                      <p className="text-xs font-bold text-slate-500 mb-1">Your reply:</p>
                      <p className="text-sm text-slate-700">{fb.replyContent}</p>
                    </div>
                  )}

                  {/* Reply form (only if no reply yet) */}
                  {!fb.replyCommentId && (
                    <div className="mt-3 flex gap-2">
                      <input
                        value={replyInput[fb.feedbackId] ?? ''}
                        onChange={e => setReplyInput(prev => ({ ...prev, [fb.feedbackId]: e.target.value }))}
                        placeholder="Write a reply…"
                        className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                      />
                      <button
                        onClick={() => handleReply(fb.feedbackId)}
                        disabled={replying[fb.feedbackId]}
                        className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50 transition"
                      >
                        {replying[fb.feedbackId] ? '…' : 'Reply'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackPanel;
