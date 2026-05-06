import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { barberService } from '../../services/barberService';
import type { Barber } from '../../services/barberService';
import { appointmentService } from '../../services/appointmentService';
import { feedbackService } from '../../services/barberFeatureService';
import { postService } from '../../services/barberFeatureService';
import type { Post } from '../../services/barberFeatureService';
import api from '../../services/api';
import CalendarWidget from '../../components/CalendarWidget/CalendarWidget';
import './CustomerDashboard.css';

const CustomerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [calendarAppointments, setCalendarAppointments] = useState<any[]>([]);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Map of add-on id → name for display in calendar popup
  const [addOnMap, setAddOnMap] = useState<Record<string, string>>({});

  // Posts State
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // Feedback State
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackAppointmentId, setFeedbackAppointmentId] = useState('');
  const [feedbackBarberId, setFeedbackBarberId] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    fetchBarbers();
    fetchPosts();
    fetchAddOnMap();
  }, []);

  const fetchPosts = async () => {
    setPostsLoading(true);
    try {
      const data = await postService.getAllPosts();
      setPosts(data);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setPostsLoading(false);
    }
  };

  // Build a flat id→name map from the global add-ons endpoint
  const fetchAddOnMap = async () => {
    try {
      const res = await api.get('/addons');
      const cats: any[] = res.data?.data ?? [];
      const map: Record<string, string> = {};
      cats.forEach((cat: any) => {
        (cat.items ?? []).forEach((item: any) => {
          map[item.id] = item.name;
        });
      });
      setAddOnMap(map);
    } catch (e) {
      console.error('Failed to fetch add-on map:', e);
    }
  };

  // Re-fetch appointments on mount AND whenever navigating back from booking
  useEffect(() => {
    if (user?.firebaseUid) {
      fetchAppointments();
    }
  // location.state changes when navigating back from BookingPage with refreshCalendar:true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, location.state]);

  const fetchAppointments = async () => {
    try {
      setCalendarError(null);
      const data = await appointmentService.getCustomerAppointments(user!.firebaseUid);
      const safeData = Array.isArray(data) ? data : [];

      // Fetch barber names for each unique barber_profile_id
      const uniqueBarberIds = [...new Set(safeData.map(a => a.barber_profile_id).filter(Boolean))];
      const barberNameMap: Record<string, string> = {};
      await Promise.all(
        uniqueBarberIds.map(async (bid) => {
          try {
            const b = await barberService.getBarberById(bid);
            barberNameMap[bid] = `${b.firstName ?? ''} ${b.lastName ?? ''}`.trim() || 'Barber';
          } catch {
            barberNameMap[bid] = 'Barber';
          }
        })
      );

      const formatted = safeData.map(app => {
        const d = new Date(app.appointmentDateTime);
        return {
          id: app.appointment_id,
          date: d.getDate(),
          fullDateText: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          barberId: app.barber_profile_id,
          barberName: barberNameMap[app.barber_profile_id] || 'Barber',
          haircutId: app.haircut_style_id,
          haircutName: 'Haircut',
          addOnNames: (app.selectedOptionIds ?? []).map((id: string) => addOnMap[id] || id).filter(Boolean),
          totalPrice: app.totalPrice,
          paymentMethod: app.paymentMethod,
          status: app.status,
        };
      });
      setCalendarAppointments(formatted);
    } catch (err: any) {
      console.error('Failed to fetch appointments:', err);
      setCalendarError('Failed to load your appointments. Please refresh.');
    }
  };

  const fetchBarbers = async () => {
    try {
      const barbersData = await barberService.getAvailableBarbers();
      setBarbers(barbersData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const isProfileIncomplete = () => {
    return !user?.phoneNumber || user.phoneNumber.trim() === '';
  };

  const handleLeaveFeedback = (appointmentId: string, barberId: string) => {
    setFeedbackAppointmentId(appointmentId);
    setFeedbackBarberId(barberId);
    setFeedbackRating(5);
    setFeedbackComment('');
    setFeedbackModalOpen(true);
  };

  const submitFeedback = async () => {
    if (!user?.firebaseUid) return;
    setSubmittingFeedback(true);
    try {
      await feedbackService.submitFeedback({
        appointmentId: feedbackAppointmentId,
        customerId: user.firebaseUid,
        barberProfileId: feedbackBarberId,
        rating: feedbackRating,
        comment: feedbackComment
      });
      alert('Thank you! Your feedback has been submitted successfully.');
      setFeedbackModalOpen(false);
    } catch (err: any) {
      alert('Failed to submit feedback: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="customer-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">✂</span>
            <span className="logo-text">BarberConnect</span>
          </div>
          <nav className="header-nav">
            <Link to="/dashboard" className="nav-btn active">🏠 Dashboard</Link>
            <Link to="/booking" className="nav-btn">📅 My Bookings</Link>
            <Link to="/profile" className="nav-btn">👤 Profile</Link>
            <button className="nav-btn logout-btn" onClick={handleLogout}>
              🚪 Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          {isProfileIncomplete() && (
            <div className="profile-warning">
              <div className="warning-content">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                  <h4>Complete Your Profile</h4>
                  <p>Add your phone number to book appointments and receive updates.</p>
                </div>
                <Link to="/profile" className="complete-profile-btn">
                  Complete Profile
                </Link>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="search-section">
            <div className="search-container">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search barbers or styles..." 
                className="search-input"
              />
              <button className="filter-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
                Filter
              </button>
            </div>
          </div>

          <div className="dashboard-grid">
                        <section className="barber-feed">
              <h2>Barber Feed</h2>
              <div className="feed-posts">
                {postsLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                    Loading posts...
                  </div>
                ) : posts.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                    No posts yet. Check back soon!
                  </div>
                ) : (
                  posts.map((post) => (
                    <div key={post.post_id} className="post-card">
                      <div className="post-header">
                        <div className="post-avatar">
                          <img src="/api/placeholder/40/40" alt="Barber" />
                        </div>
                        <div className="post-info">
                          <h4>Barber Post</h4>
                          <span>
                            {post.createdAt
                              ? new Date(post.createdAt).toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric', year: 'numeric'
                                })
                              : 'Recently'}
                          </span>
                        </div>
                      </div>
                      <div className="post-content">
                        <p>{post.content}</p>
                        {post.imageUrl && (
                          <div className="post-image">
                            <img
                              src={post.imageUrl}
                              alt="Post"
                              style={{ width: '100%', borderRadius: '8px', marginTop: '10px' }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="post-actions">
                        <button className="action-btn">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          {post.likesCount ?? 0}
                        </button>
                        <button className="action-btn">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          {post.commentsCount ?? 0}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <aside className="available-barbers">
              <h2>Available Barbers</h2>
              {error && <div className="error-message">{error}</div>}
              <div className="barbers-list">
                {barbers.length > 0 ? (
                  barbers.map((barber) => (
                    <div key={barber.id} className="barber-card">
                      <div className="barber-avatar">
                        <img 
                          src={barber.profileImageUrl || '/api/placeholder/60/60'} 
                          alt={`${barber.firstName ?? ''} ${barber.lastName ?? ''}`.trim() || 'Barber'}
                          onError={(e) => { (e.target as HTMLImageElement).src = '/api/placeholder/60/60'; }}
                        />
                      </div>
                      <div className="barber-info">
                        <h4>
                          {`${barber.firstName ?? ''} ${barber.lastName ?? ''}`.trim() || 'Barber'}
                        </h4>
                        <div className="barber-rating">
                          ⭐ {parseFloat(barber.rating).toFixed(1)} ({barber.totalReviews})
                        </div>
                        <div className="barber-experience">
                          {barber.yearsExperience} years exp.
                        </div>
                        <div className="barber-specialties">
                          {barber.bio || 'Professional Barber'}
                        </div>
                      </div>
                      <Link 
                        to="/booking" 
                        state={{ 
                          selectedBarber: {
                            id: barber.id,
                            name: `${barber.firstName ?? ''} ${barber.lastName ?? ''}`.trim() || 'Barber',
                            specialties: barber.bio || 'General Haircuts',
                            experience: `${barber.yearsExperience} years exp.`,
                            profileImageUrl: barber.profileImageUrl || null,
                          }
                        }}
                        className="book-btn"
                      >
                        Book Now
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="no-barbers">
                    <p>No barbers available at the moment</p>
                  </div>
                )}
              </div>
              
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                {/* FIX: Show inline calendar error */}
                {calendarError && (
                  <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#fef2f2', borderRadius: '0.375rem' }}>
                    {calendarError}
                  </div>
                )}
                <CalendarWidget 
                  isBarberView={false} 
                  appointments={calendarAppointments}
                  onLeaveFeedback={handleLeaveFeedback}
                />
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Feedback Modal Overlay */}
      {feedbackModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, color: '#1e293b', fontSize: '1.25rem', fontWeight: 700 }}>Rate Your Experience</h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>How was your recent haircut? Your feedback helps us improve.</p>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Rating</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star} 
                    onClick={() => setFeedbackRating(star)}
                    style={{ 
                      background: 'none', border: 'none', cursor: 'pointer', 
                      fontSize: '2rem', color: star <= feedbackRating ? '#f59e0b' : '#e2e8f0',
                      transition: 'color 0.2s ease'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Comment (Optional)</label>
              <textarea 
                value={feedbackComment}
                onChange={e => setFeedbackComment(e.target.value)}
                placeholder="Tell us what you liked or what could be better..."
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setFeedbackModalOpen(false)}
                style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={submitFeedback}
                disabled={submittingFeedback}
                style={{ padding: '0.5rem 1.25rem', border: 'none', borderRadius: '6px', background: '#f59e0b', color: '#fff', fontWeight: 600, cursor: submittingFeedback ? 'not-allowed' : 'pointer', opacity: submittingFeedback ? 0.7 : 1 }}
              >
                {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;