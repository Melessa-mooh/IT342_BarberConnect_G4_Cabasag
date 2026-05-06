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

  const toggleLike = (postId: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
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
                const initial = (post.barber_profile_id ?? 'B').charAt(0).toUpperCase();

                return (
                  <div key={post.post_id} className="cd-post">
                    {/* Header */}
                    <div className="cd-post-header">
                      <div className="cd-post-avatar">{initial}</div>
                      <div className="cd-post-meta">
                        <p className="cd-post-name">Barber Post</p>
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
                      <button className="cd-action-btn">
                        <IconComment />
                        {post.commentsCount ?? 0}
                      </button>
                    </div>
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
                  const initial = name.charAt(0).toUpperCase();
                  return (
                    <div key={barber.id} className="cd-barber-card">
                      <div className="cd-barber-avatar">
                        {barber.profileImageUrl ? (
                          <img src={barber.profileImageUrl} alt={name}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : initial}
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
