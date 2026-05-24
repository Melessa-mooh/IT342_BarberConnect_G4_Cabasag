import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { barberService } from '../../services/barberService';
import type { Barber } from '../../services/barberService';
import { appointmentService } from '../../services/appointmentService';
import { feedbackService, postService } from '../../services/barberFeatureService';
import type { Post } from '../../services/barberFeatureService';
import api from '../../services/api';
import CalendarWidget from '../../components/CalendarWidget/CalendarWidget';
import CustomerNavbar from '../../components/CustomerNavbar';
import './CustomerDashboard.css';

// ── Post icon helpers (feed only) ────────────────────────────────────────────
const IconHeart = ({ filled }: { filled?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);
const IconComment = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
  </svg>
);
const IconDots = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────
const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [barbers,              setBarbers]              = useState<Barber[]>([]);
  const [calendarAppointments, setCalendarAppointments] = useState<any[]>([]);
  const [calendarError,        setCalendarError]        = useState<string | null>(null);
  const [loading,              setLoading]              = useState(true);
  const [addOnMap,             setAddOnMap]             = useState<Record<string, string>>({});
  const [searchQuery,          setSearchQuery]          = useState('');

  const [posts,        setPosts]        = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [likedPosts,   setLikedPosts]   = useState<Set<string>>(new Set());
  // Per-post comment state
  const [openComments,    setOpenComments]    = useState<Record<string, boolean>>({});
  const [postComments,    setPostComments]    = useState<Record<string, any[]>>({});
  const [commentInput,    setCommentInput]    = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [commenterNames,  setCommenterNames]  = useState<Record<string, string>>({});

  const [feedbackOpen,   setFeedbackOpen]   = useState(false);
  const [fbApptId,       setFbApptId]       = useState('');
  const [fbBarberId,     setFbBarberId]     = useState('');
  const [fbRating,       setFbRating]       = useState(5);
  const [fbComment,      setFbComment]      = useState('');
  const [fbSubmitting,   setFbSubmitting]   = useState(false);

  // ── Data fetching ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchBarbers();
    fetchPosts();
    fetchAddOnMap();
  }, []);

  useEffect(() => {
    if (user?.firebaseUid) fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, location.state]);

  const fetchPosts = async () => {
    setPostsLoading(true);
    try { setPosts(await postService.getAllPosts()); }
    catch (err) { console.error(err); }
    finally { setPostsLoading(false); }
  };

  const fetchAddOnMap = async () => {
    try {
      const res = await api.get('/addons');
      const cats: any[] = res.data?.data ?? [];
      const map: Record<string, string> = {};
      cats.forEach((cat: any) => (cat.items ?? []).forEach((item: any) => { map[item.id] = item.name; }));
      setAddOnMap(map);
    } catch { /* silent */ }
  };

  const fetchAppointments = async () => {
    try {
      setCalendarError(null);
      const data = await appointmentService.getCustomerAppointments(user!.firebaseUid);
      const safe = Array.isArray(data) ? data : [];
      const uniqueIds = [...new Set(safe.map(a => a.barber_profile_id).filter(Boolean))];
      const nameMap: Record<string, string> = {};
      await Promise.all(uniqueIds.map(async bid => {
        try { const b = await barberService.getBarberById(bid); nameMap[bid] = `${b.firstName ?? ''} ${b.lastName ?? ''}`.trim() || 'Barber'; }
        catch { nameMap[bid] = 'Barber'; }
      }));
      setCalendarAppointments(safe.map(app => {
        const d = new Date(app.appointmentDateTime);
        return {
          id: app.appointment_id,
          date: d.getDate(),
          fullDateText: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          barberId: app.barber_profile_id,
          barberName: nameMap[app.barber_profile_id] || 'Barber',
          haircutName: 'Haircut',
          addOnNames: (app.selectedOptionIds ?? []).map((id: string) => addOnMap[id] || id).filter(Boolean),
          totalPrice: app.totalPrice,
          paymentMethod: app.paymentMethod,
          status: app.status,
        };
      }));
    } catch (err: any) {
      setCalendarError('Failed to load appointments. Please refresh.');
    }
  };

  const fetchBarbers = async () => {
    try { setBarbers(await barberService.getAvailableBarbers()); }
    catch { /* silent */ }
    finally { setLoading(false); }
  };

  const toggleLike = async (postId: string) => {
    if (!user?.firebaseUid) return;
    // Optimistic update
    setLikedPosts(prev => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
    setPosts(prev => prev.map(p =>
      p.post_id === postId
        ? { ...p, likesCount: likedPosts.has(postId) ? (p.likesCount ?? 1) - 1 : (p.likesCount ?? 0) + 1 }
        : p
    ));
    try {
      await postService.addReaction(postId, user.firebaseUid, 'LIKE');
    } catch { /* silent — optimistic already applied */ }
  };

  const toggleComments = async (postId: string) => {
    const isOpen = !!openComments[postId];
    setOpenComments(prev => ({ ...prev, [postId]: !isOpen }));
    if (!isOpen && !postComments[postId]) {
      setLoadingComments(prev => ({ ...prev, [postId]: true }));
      try {
        const data = await postService.getComments(postId);
        setPostComments(prev => ({ ...prev, [postId]: data }));
        // Resolve commenter names
        const backendNames = (data as any[]).reduce<Record<string, string>>((acc, c) => {
          if (c.user_id && c.commenterName) acc[c.user_id] = c.commenterName;
          return acc;
        }, {});
        if (Object.keys(backendNames).length > 0) {
          setCommenterNames(prev => ({ ...prev, ...backendNames }));
        }
        const unknownIds = [...new Set((data as any[]).map((c: any) => c.user_id).filter((id: string) => id && !commenterNames[id] && !backendNames[id]))];
        if (unknownIds.length > 0) {
          const resolved: Record<string, string> = {};
          await Promise.all(unknownIds.map(async (uid: string) => {
            try {
              const res = await api.get(`/auth/user/${uid}`);
              const u = res.data?.data ?? res.data;
              resolved[uid] = `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim() || 'User';
            } catch { resolved[uid] = 'User'; }
          }));
          setCommenterNames(prev => ({ ...prev, ...resolved }));
        }
      } catch { /* silent */ }
      finally { setLoadingComments(prev => ({ ...prev, [postId]: false })); }
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user?.firebaseUid) return;
    const content = (commentInput[postId] ?? '').trim();
    if (!content) return;
    try {
      const added = await postService.addComment(postId, user.firebaseUid, content);
      setPostComments(prev => ({ ...prev, [postId]: [...(prev[postId] ?? []), added] }));
      setCommentInput(prev => ({ ...prev, [postId]: '' }));
      setPosts(prev => prev.map(p =>
        p.post_id === postId ? { ...p, commentsCount: (p.commentsCount ?? 0) + 1 } : p
      ));
    } catch (err: any) {
      alert('Failed to add comment: ' + (err.message || 'Unknown error'));
    }
  };

  const openFeedback = (apptId: string, barberId: string) => {
    setFbApptId(apptId); setFbBarberId(barberId);
    setFbRating(5); setFbComment(''); setFeedbackOpen(true);
  };

  const submitFeedback = async () => {
    if (!user?.firebaseUid) return;
    setFbSubmitting(true);
    try {
      await feedbackService.submitFeedback({ appointmentId: fbApptId, customerId: user.firebaseUid, barberProfileId: fbBarberId, rating: fbRating, comment: fbComment });
      alert('Thank you! Your feedback has been submitted.');
      setFeedbackOpen(false);
    } catch (err: any) {
      alert('Failed to submit feedback: ' + (err.message || 'Unknown error'));
    } finally { setFbSubmitting(false); }
  };

  const isIncomplete = !user?.phoneNumber || user.phoneNumber.trim() === '';

  // Filter barbers by search query (name or bio)
  const filteredBarbers = searchQuery.trim()
    ? barbers.filter(b => {
        const name = `${b.firstName ?? ''} ${b.lastName ?? ''}`.toLowerCase();
        const bio  = (b.bio ?? '').toLowerCase();
        const q    = searchQuery.toLowerCase();
        return name.includes(q) || bio.includes(q);
      })
    : barbers;

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="cd-loading">
      <div className="cd-spinner" />
      <p>Loading dashboard…</p>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="cd-root">

      {/* ── Shared Navbar ──────────────────────────────────────────────── */}
      <CustomerNavbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Profile incomplete banner */}
      {isIncomplete && (
        <div className="cd-banner">
          <p><strong>Complete your profile</strong> — Add your phone number to book appointments and receive updates.</p>
          <Link to="/profile" className="cd-banner-btn">Complete Profile</Link>
        </div>
      )}

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="cd-body">

        {/* ── Feed column ──────────────────────────────────────────────── */}
        <div className="cd-feed-col">
          <div className="cd-feed-header">
            <h2>Barber Feed</h2>
            <span className="cd-feed-count">{posts.length} posts</span>
          </div>

          <div className="cd-feed-scroll">
            {postsLoading ? (
              <div className="cd-feed-empty">
                <div className="cd-spinner" />
                <p>Loading posts…</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="cd-feed-empty">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#D1D5DB" style={{ width: 48, height: 48 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <p>No posts yet. Check back soon!</p>
              </div>
            ) : (
              posts.map(post => {
                const liked = likedPosts.has(post.post_id);
                const dateStr = post.createdAt
                  ? new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Recently';

                // Look up barber info from the already-loaded barbers list
                const postBarber = barbers.find(b => b.id === post.barber_profile_id);
                const barberName = post.barberFullName || (postBarber
                  ? `${postBarber.firstName ?? ''} ${postBarber.lastName ?? ''}`.trim() || 'Barber'
                  : 'Barber');
                const barberInitials = barberName
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map(n => n.charAt(0).toUpperCase())
                  .join('') || (postBarber
                  ? [postBarber.firstName, postBarber.lastName]
                      .filter(Boolean)
                      .map(n => n!.charAt(0).toUpperCase())
                      .join('') || 'B'
                  : 'B');
                const barberImg = post.barberProfileImageUrl || postBarber?.profileImageUrl || null;

                return (
                  <div key={post.post_id} className="cd-post">
                    {/* Header */}
                    <div className="cd-post-header">
                      <div className="cd-post-avatar">
                        {barberImg ? (
                          <img
                            src={barberImg}
                            alt={barberName}
                            onError={e => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = 'none';
                              const parent = img.parentElement;
                              if (parent && !parent.querySelector('.cd-avatar-initials')) {
                                const span = document.createElement('span');
                                span.className = 'cd-avatar-initials';
                                span.textContent = barberInitials;
                                parent.appendChild(span);
                              }
                            }}
                          />
                        ) : (
                          <span className="cd-avatar-initials">{barberInitials}</span>
                        )}
                      </div>
                      <div className="cd-post-meta">
                        <p className="cd-post-name">{barberName}</p>
                        <p className="cd-post-date">{dateStr}</p>
                      </div>
                      <button className="cd-post-more"><IconDots /></button>
                    </div>

                    {/* Body */}
                    <div className="cd-post-body">
                      {post.content && <p className="cd-post-text">{post.content}</p>}
                      {post.imageUrl && (
                        <div className="cd-post-img">
                          <img src={post.imageUrl} alt="Post" loading="lazy" />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="cd-post-actions">
                      <button
                        className={`cd-action-btn${liked ? ' liked' : ''}`}
                        onClick={() => toggleLike(post.post_id)}
                      >
                        <IconHeart filled={liked} />
                        {(post.likesCount ?? 0) + (liked ? 1 : 0)}
                      </button>
                      <button
                        className="cd-action-btn"
                        onClick={() => toggleComments(post.post_id)}
                      >
                        <IconComment />
                        {post.commentsCount ?? 0}
                      </button>
                    </div>

                    {/* Comments section */}
                    {openComments[post.post_id] && (
                      <div style={{ padding: '0 16px 16px', borderTop: '1px solid #F9FAFB' }}>
                        {loadingComments[post.post_id] && (
                          <p style={{ fontSize: 12.5, color: '#9CA3AF', padding: '10px 0' }}>Loading comments…</p>
                        )}
                        {/* Comment list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                          {(postComments[post.post_id] ?? []).map((c: any) => {
                            const cName = c.commenterName || commenterNames[c.user_id] || 'User';
                            const cInitial = cName.charAt(0).toUpperCase();
                            return (
                              <div key={c.comment_id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <div style={{
                                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                                  background: '#FFF7ED', border: '1.5px solid #FED7AA',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 11, fontWeight: 800, color: '#F97316',
                                }}>
                                  {cInitial}
                                </div>
                                <div style={{ flex: 1, background: '#F9FAFB', borderRadius: '0 12px 12px 12px', padding: '7px 12px', border: '1px solid #F3F4F6' }}>
                                  <p style={{ margin: '0 0 2px', fontSize: 11.5, fontWeight: 700, color: '#374151' }}>{cName}</p>
                                  <p style={{ margin: 0, fontSize: 13, color: '#4B5563', lineHeight: 1.5 }}>{c.content}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {/* Add comment input */}
                        <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                            background: '#FFF7ED', border: '1.5px solid #FED7AA',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 800, color: '#F97316',
                          }}>
                            {(user?.firstName ?? 'U').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, display: 'flex', gap: 6, background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 24, padding: '5px 5px 5px 12px', alignItems: 'center' }}>
                            <input
                              type="text"
                              value={commentInput[post.post_id] ?? ''}
                              onChange={e => setCommentInput(prev => ({ ...prev, [post.post_id]: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && handleAddComment(post.post_id)}
                              placeholder="Write a comment…"
                              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: '#374151', fontFamily: 'inherit' }}
                            />
                            <button
                              onClick={() => handleAddComment(post.post_id)}
                              disabled={!(commentInput[post.post_id] ?? '').trim()}
                              style={{
                                background: (commentInput[post.post_id] ?? '').trim() ? 'linear-gradient(135deg,#F97316,#EA580C)' : '#E5E7EB',
                                color: (commentInput[post.post_id] ?? '').trim() ? '#fff' : '#9CA3AF',
                                border: 'none', borderRadius: 20, padding: '6px 14px',
                                fontSize: 12, fontWeight: 700, cursor: (commentInput[post.post_id] ?? '').trim() ? 'pointer' : 'not-allowed',
                                transition: 'all .15s', fontFamily: 'inherit', flexShrink: 0,
                              }}
                            >
                              Post
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right column ─────────────────────────────────────────────── */}
        <div className="cd-right-col">

          {/* Available Barbers */}
          <div className="cd-section">
            <div className="cd-section-header">
              <p className="cd-section-title">Available Barbers</p>
              <span className="cd-section-sub">
                {searchQuery ? `${filteredBarbers.length} result${filteredBarbers.length !== 1 ? 's' : ''}` : `${barbers.length} online`}
              </span>
            </div>
            <div className="cd-barber-list">
              {filteredBarbers.length === 0 ? (
                <p className="cd-no-barbers">
                  {searchQuery ? `No barbers found for "${searchQuery}"` : 'No barbers available right now.'}
                </p>
              ) : (
                filteredBarbers.map(barber => {
                  const name = `${barber.firstName ?? ''} ${barber.lastName ?? ''}`.trim() || 'Barber';
                  const initials = [barber.firstName, barber.lastName]
                    .filter(Boolean)
                    .map(n => n!.charAt(0).toUpperCase())
                    .join('') || 'B';
                  return (
                    <div key={barber.id} className="cd-barber-card">
                      <div className="cd-barber-avatar">
                        {barber.profileImageUrl ? (
                          <img
                            src={barber.profileImageUrl}
                            alt={name}
                            onError={e => {
                              // Hide broken image and show initials fallback
                              const img = e.target as HTMLImageElement;
                              img.style.display = 'none';
                              const parent = img.parentElement;
                              if (parent && !parent.querySelector('.cd-avatar-initials')) {
                                const span = document.createElement('span');
                                span.className = 'cd-avatar-initials';
                                span.textContent = initials;
                                parent.appendChild(span);
                              }
                            }}
                          />
                        ) : (
                          <span className="cd-avatar-initials">{initials}</span>
                        )}
                      </div>
                      <div className="cd-barber-info">
                        <p className="cd-barber-name">{name}</p>
                        <div className="cd-barber-meta">
                          <span className="cd-barber-rating">★ {parseFloat(barber.rating).toFixed(1)}</span>
                          <span>·</span>
                          <span>{barber.yearsExperience}yr exp</span>
                        </div>
                      </div>
                      <Link
                        to="/booking"
                        state={{ selectedBarber: { id: barber.id, name, specialties: barber.bio || 'General Haircuts', experience: `${barber.yearsExperience} years exp.`, profileImageUrl: barber.profileImageUrl || null } }}
                        className="cd-book-btn"
                      >
                        Book
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Calendar */}
          <div className="cd-section">
            <div className="cd-section-header">
              <p className="cd-section-title">My Appointments</p>
              <span className="cd-section-sub">{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="cd-calendar-wrap">
              {calendarError && <div className="cd-cal-error">{calendarError}</div>}
              <CalendarWidget
                isBarberView={false}
                appointments={calendarAppointments}
                onLeaveFeedback={openFeedback}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Feedback modal ──────────────────────────────────────────────── */}
      {feedbackOpen && (
        <div className="cd-modal-overlay" onClick={() => setFeedbackOpen(false)}>
          <div className="cd-modal" onClick={e => e.stopPropagation()}>
            <h3>Rate Your Experience</h3>
            <p>How was your recent haircut? Your feedback helps us improve.</p>

            <label>Rating</label>
            <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem' }}>
              {[1,2,3,4,5].map(star => (
                <button key={star} onClick={() => setFbRating(star)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 28, color: star <= fbRating ? '#F59E0B' : '#E5E7EB', transition: 'color .15s' }}>★</button>
              ))}
            </div>

            <label>Comment (Optional)</label>
            <textarea value={fbComment} onChange={e => setFbComment(e.target.value)} placeholder="Tell us what you liked or what could be better…" />

            <div className="cd-modal-actions">
              <button className="cd-modal-cancel" onClick={() => setFeedbackOpen(false)}>Cancel</button>
              <button className="cd-modal-submit" onClick={submitFeedback} disabled={fbSubmitting}>
                {fbSubmitting ? 'Submitting…' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
