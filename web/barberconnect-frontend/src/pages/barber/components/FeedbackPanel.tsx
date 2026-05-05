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
    <div className="flex flex-col gap-6 animate-fade-in pb-10">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Ratings & Feedback</h2>
        <p className="text-sm text-slate-500 mt-1">See what your customers are saying</p>
      </div>

      {loading && <p className="text-slate-400 text-sm">Loading...</p>}
      {error   && <p className="text-red-500 text-sm">{error}</p>}

      {/* Overview Row */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Average Rating */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center">
            <h3 className="text-sm font-semibold text-slate-600 mb-4">Average Rating</h3>
            <h2 className="text-5xl font-black text-slate-900 mb-2">{avgRating}</h2>
            <div className="flex text-[#D2691E] text-lg mb-2">★★★★★</div>
            <p className="text-xs text-slate-500">
              {totalReviews} review{totalReviews !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Distribution */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-5">Rating Distribution</h3>
            <div className="flex flex-col gap-3">
              {dist.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600 w-6">
                    {star}★
                  </span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#D2691E] rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 w-16 text-right">
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-slate-800">All reviews</h3>
            <button className="text-sm text-slate-600 hover:text-slate-800 font-semibold">
              Filter
            </button>
          </div>

          {feedback.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-6">No reviews yet</p>
          )}

          <div className="flex flex-col gap-5">
            {feedback.map(fb => (
              <div key={fb.feedbackId} className="flex gap-4 pb-5 border-b border-slate-100 last:border-0 last:pb-0">

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-slate-200 flex flex-shrink-0 items-center justify-center text-slate-600 font-bold text-sm">
                  {(fb.customerId ?? '?').charAt(0).toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{fb.customerId}</h4>
                      <p className="text-xs text-slate-400">
                        {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-[#D2691E] text-sm mb-2">
                    {stars(fb.rating ?? 0)}
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed">
                    {fb.comment}
                  </p>

                  {/* Existing reply */}
                  {fb.replyContent && (
                    <div className="mt-3 ml-4 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
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
                        placeholder="Write a reply..."
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D2691E] focus:ring-1 focus:ring-[#D2691E]"
                      />
                      <button
                        onClick={() => handleReply(fb.feedbackId)}
                        disabled={replying[fb.feedbackId]}
                        className="bg-[#D2691E] hover:bg-[#8B4513] text-white px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50 transition-all"
                      >
                        {replying[fb.feedbackId] ? '...' : 'Reply'}
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
