import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { barberService } from '../services/barberService';
import { formatPhoneNumber, validatePhilippinePhoneNumber, normalizePhoneNumber } from '../utils/phoneUtils';
import CustomerNavbar from '../components/CustomerNavbar';
import './ProfilePage.css';

// ── Toast component ───────────────────────────────────────────────────────────
const Toast = ({ message, type, onDone }: { message: string; type: 'success' | 'error'; onDone: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={`pp-toast ${type}`}>
      {type === 'success' ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 16, height: 16, color: '#22C55E', flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 16, height: 16, flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      )}
      {message}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading,        setLoading]        = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [toast,          setToast]          = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    firstName:      user?.firstName || '',
    lastName:       user?.lastName  || '',
    phoneNumber:    user?.phoneNumber || '',
    bio:            user?.barberProfile?.bio || '',
    yearsExperience:user?.barberProfile?.yearsExperience || 0,
    isAvailable:    user?.barberProfile?.isAvailable ?? true,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Sync form when user context loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName:       user.firstName || '',
        lastName:        user.lastName  || '',
        phoneNumber:     user.phoneNumber || '',
        bio:             user.barberProfile?.bio || '',
        yearsExperience: user.barberProfile?.yearsExperience || 0,
        isAvailable:     user.barberProfile?.isAvailable ?? true,
      });
    }
  }, [user]);

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name === 'phoneNumber') {
      setFormData(prev => ({ ...prev, phoneNumber: formatPhoneNumber(value) }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: name === 'yearsExperience' ? parseInt(value) || 0 : value }));
    }
    // Clear field error on change
    if (fieldErrors[name]) setFieldErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast('File size must be less than 10MB', 'error'); return; }
    setImageUploading(true);
    try {
      await authService.uploadProfileImage(file);
      await refreshUser();
      showToast('Profile photo updated!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload photo', 'error');
    } finally {
      setImageUploading(false);
    }
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim())  errors.lastName  = 'Last name is required';
    if (formData.phoneNumber && !validatePhilippinePhoneNumber(formData.phoneNumber)) {
      errors.phoneNumber = 'Enter a valid Philippine number (+63 9XX XXX XXXX)';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      // Step 1: always update basic user fields via /auth/profile
      const basicPayload: any = {
        firstName: formData.firstName.trim(),
        lastName:  formData.lastName.trim(),
      };
      if (formData.phoneNumber) {
        basicPayload.phoneNumber = normalizePhoneNumber(formData.phoneNumber);
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
        },
        body: JSON.stringify(basicPayload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update profile');
      }

      // Step 2: for BARBERs, also save barber-specific fields to barber_profiles
      if (user?.role === 'BARBER') {
        await barberService.updateProfile(user.firebaseUid, {
          phone:      normalizePhoneNumber(formData.phoneNumber) || '',
          bio:        formData.bio,
          experience: formData.yearsExperience,
          gcash:      user.barberProfile?.gcashNumber || '',
          isAvailable: formData.isAvailable,
        });
      }

      await refreshUser();
      showToast('Profile updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="pp-loading">
        <div className="pp-loading-spinner" />
        <p style={{ color: '#9CA3AF', fontSize: 14 }}>Loading profile…</p>
      </div>
    );
  }

  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'User';
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const avatarSrc = user.profileImageUrl || user.barberProfile?.profileImageUrl || null;
  const roleLabel = user.role === 'BARBER' ? 'Professional Barber' : user.role === 'ADMIN' ? 'Administrator' : 'Customer';

  return (
    <div className="pp-root">
      {/* ── Shared navbar ─────────────────────────────────────────────── */}
      <CustomerNavbar showSearch={false} />

      {/* ── Hero header ───────────────────────────────────────────────── */}
      <div className="pp-hero">
        <div className="pp-avatar-wrap">
          <div className="pp-avatar-ring" onClick={() => fileInputRef.current?.click()}>
            {avatarSrc ? (
              <img src={avatarSrc} alt={fullName} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <span className="pp-avatar-initials">{initials}</span>
            )}
            <div className="pp-avatar-overlay">
              <span>📷<br />Change</span>
            </div>
            {imageUploading && (
              <div className="pp-avatar-uploading">
                <div className="pp-spinner" style={{ borderColor: 'rgba(249,115,22,0.3)', borderTopColor: '#F97316' }} />
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
        </div>
      </div>

      {/* ── Identity ──────────────────────────────────────────────────── */}
      <div className="pp-identity">
        <h1 className="pp-name">{fullName}</h1>
        <p className="pp-role">{roleLabel} · {user.email}</p>
        <div className="pp-actions">
          <button className="pp-btn-primary" onClick={() => document.getElementById('pp-form')?.scrollIntoView({ behavior: 'smooth' })}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 14, height: 14 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
            </svg>
            Edit Profile
          </button>
          <button className="pp-btn-ghost">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 14, height: 14 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
        </div>
      </div>

      {/* ── Form ──────────────────────────────────────────────────────── */}
      <div className="pp-content">
        <form id="pp-form" onSubmit={handleSubmit}>

          {/* Basic Information */}
          <div className="pp-card">
            <div className="pp-card-header">
              <div className="pp-card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div>
                <p className="pp-card-title">Basic Information</p>
                <p className="pp-card-sub">Your personal details</p>
              </div>
            </div>

            <div className="pp-card-body">
              {/* Name row */}
              <div className="pp-row">
                <div className="pp-field">
                  <label className="pp-label">First Name</label>
                  <input
                    className={`pp-input${fieldErrors.firstName ? ' error' : ''}`}
                    type="text" name="firstName"
                    value={formData.firstName} onChange={handleChange}
                    placeholder="Juan"
                  />
                  {fieldErrors.firstName && <p className="pp-input-hint error-hint">{fieldErrors.firstName}</p>}
                </div>
                <div className="pp-field">
                  <label className="pp-label">Last Name</label>
                  <input
                    className={`pp-input${fieldErrors.lastName ? ' error' : ''}`}
                    type="text" name="lastName"
                    value={formData.lastName} onChange={handleChange}
                    placeholder="dela Cruz"
                  />
                  {fieldErrors.lastName && <p className="pp-input-hint error-hint">{fieldErrors.lastName}</p>}
                </div>
              </div>

              {/* Email */}
              <div className="pp-field">
                <label className="pp-label">Email Address</label>
                <div className="pp-email-row">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 15, height: 15 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <span className="pp-email-value">{user.email}</span>
                  <span className="pp-email-badge">Read-only</span>
                </div>
                <p className="pp-input-hint">Email is linked to your account and cannot be changed.</p>
              </div>

              {/* Phone */}
              <div className="pp-field">
                <label className="pp-label">Phone Number</label>
                <input
                  className={`pp-input${fieldErrors.phoneNumber ? ' error' : ''}`}
                  type="tel" name="phoneNumber"
                  value={formData.phoneNumber} onChange={handleChange}
                  placeholder="+63 9XX XXX XXXX"
                />
                {fieldErrors.phoneNumber
                  ? <p className="pp-input-hint error-hint">{fieldErrors.phoneNumber}</p>
                  : <p className="pp-input-hint">Format: +63 9XX XXX XXXX or 09XX XXX XXXX</p>
                }
              </div>
            </div>

            <div className="pp-form-actions">
              <button type="button" className="pp-cancel-btn" onClick={() => navigate('/dashboard')}>Cancel</button>
              <button type="submit" className="pp-save-btn" disabled={loading}>
                {loading ? <><div className="pp-spinner" /> Saving…</> : <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 14, height: 14 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Save Changes
                </>}
              </button>
            </div>
          </div>

          {/* Barber-specific section */}
          {user.role === 'BARBER' && (
            <div className="pp-card">
              <div className="pp-card-header">
                <div className="pp-card-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <p className="pp-card-title">Barber Information</p>
                  <p className="pp-card-sub">Your professional details visible to customers</p>
                </div>
              </div>

              <div className="pp-card-body">
                <div className="pp-field">
                  <label className="pp-label">Years of Experience</label>
                  <input
                    className="pp-input"
                    type="number" name="yearsExperience"
                    value={formData.yearsExperience} onChange={handleChange}
                    min={0} max={50} placeholder="e.g. 5"
                    style={{ maxWidth: 160 }}
                  />
                </div>

                <div className="pp-field">
                  <label className="pp-label">Bio</label>
                  <textarea
                    className="pp-input pp-textarea"
                    name="bio"
                    value={formData.bio} onChange={handleChange}
                    placeholder="Tell customers about your experience and specialties…"
                    rows={4}
                  />
                </div>

                <div className="pp-toggle-row">
                  <div>
                    <p className="pp-toggle-label">Available for Appointments</p>
                    <p className="pp-toggle-sub">Customers can book you when this is on</p>
                  </div>
                  <label className="pp-toggle">
                    <input type="checkbox" name="isAvailable" checked={formData.isAvailable} onChange={handleChange} />
                    <span className="pp-toggle-slider" />
                  </label>
                </div>
              </div>

              <div className="pp-form-actions">
                <button type="button" className="pp-cancel-btn" onClick={() => navigate('/dashboard')}>Cancel</button>
                <button type="submit" className="pp-save-btn" disabled={loading}>
                  {loading ? <><div className="pp-spinner" /> Saving…</> : <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 14, height: 14 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Save Changes
                  </>}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />
      )}
    </div>
  );
};

export default ProfilePage;
