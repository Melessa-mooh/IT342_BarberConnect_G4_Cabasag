import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { barberService } from '../../../services/barberService';
import api from '../../../services/api';

const ProfilePanel = () => {
  const { user, refreshUser } = useAuth();
  const [isSaving,       setIsSaving]       = useState(false);
  const [saveSuccess,    setSaveSuccess]    = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewUrl,     setPreviewUrl]     = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({ phone: '', bio: '', experience: '', gcash: '', email: '' });

  useEffect(() => {
    if (user) {
      setFormData({
        phone:      user.phoneNumber || '',
        bio:        user.barberProfile?.bio || '',
        experience: user.barberProfile?.yearsExperience?.toString() || '',
        gcash:      user.barberProfile?.gcashNumber || '',
        email:      user.email || '',
      });
      setPreviewUrl(user.barberProfile?.profileImageUrl || null);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setPreviewUrl(URL.createObjectURL(file));
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post(`/barbers/${user.firebaseUid}/profile-picture`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreviewUrl(res.data?.data);
      await refreshUser();
    } catch (err: any) {
      alert('Failed to upload photo: ' + (err?.response?.data?.error || err?.message));
      setPreviewUrl(user.barberProfile?.profileImageUrl || null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true); setSaveSuccess(false);
    try {
      await barberService.updateProfile(user.firebaseUid, {
        phone: formData.phone, bio: formData.bio,
        experience: parseInt(formData.experience) || 0, gcash: formData.gcash,
      });
      await refreshUser();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      alert(`Failed to save profile: ${error?.response?.data?.error || error?.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Barber';
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      <div className="barber-page-header">
        <h1>My Profile</h1>
        <p>Manage your professional information and photo.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* Left: Avatar card */}
        <div className="barber-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', textAlign: 'center' }}>
          {/* Avatar */}
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '96px', height: '96px', borderRadius: '50%',
              background: '#FFF7ED', border: '3px solid #FED7AA',
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {previewUrl ? (
                <img src={previewUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={() => setPreviewUrl(null)} />
              ) : (
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F97316' }}>{initials}</span>
              )}
            </div>
            {uploadingPhoto && (
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="barber-spinner" style={{ width: '24px', height: '24px', borderWidth: '3px', margin: 0 }} />
              </div>
            )}
          </div>

          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#111827' }}>{fullName}</p>
            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#6B7280' }}>Professional Barber</p>
            <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#9CA3AF' }}>{formData.email}</p>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center', paddingTop: '1rem', borderTop: '1px solid #F3F4F6' }}>
            {[
              { label: 'Rating',   value: user?.barberProfile?.rating ? parseFloat(user.barberProfile.rating).toFixed(1) : '—', color: '#F59E0B' },
              { label: 'Reviews',  value: user?.barberProfile?.totalReviews ?? '—',                                              color: '#3B82F6' },
              { label: 'Yrs Exp',  value: formData.experience || '—',                                                            color: '#22C55E' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: s.color }}>{s.value}</p>
                <p style={{ margin: 0, fontSize: '0.65rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
              </div>
            ))}
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="barber-btn-primary"
            style={{ width: '100%' }}
          >
            {uploadingPhoto ? 'Uploading…' : 'Change Photo'}
          </button>
        </div>

        {/* Right: Edit form */}
        <div className="barber-card">
          <div className="barber-card-header">
            <span className="barber-card-title">Edit Profile</span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="barber-label">Phone Number</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange}
                  placeholder="+63 912 345 6789" className="barber-input" />
              </div>
              <div>
                <label className="barber-label">Email (Read-only)</label>
                <input type="email" value={formData.email} disabled className="barber-input" />
              </div>
            </div>

            <div>
              <label className="barber-label">Short Bio</label>
              <textarea name="bio" value={formData.bio} onChange={handleChange}
                placeholder="Tell customers about your barbering style and specialties…"
                rows={4}
                className="barber-input"
                style={{ resize: 'none' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="barber-label">Years of Experience</label>
                <input type="number" name="experience" value={formData.experience} onChange={handleChange}
                  placeholder="e.g. 5" className="barber-input" />
              </div>
              <div>
                <label className="barber-label">GCash Number</label>
                <input type="text" name="gcash" value={formData.gcash} onChange={handleChange}
                  placeholder="09XXXXXXXXX" className="barber-input" />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.875rem', paddingTop: '0.75rem', borderTop: '1px solid #F3F4F6' }}>
              {saveSuccess && (
                <span style={{ fontSize: '0.875rem', color: '#22C55E', fontWeight: 600 }}>
                  ✓ Profile saved!
                </span>
              )}
              <button
                type="button"
                className="barber-btn-secondary"
                onClick={() => {
                  if (user) setFormData({
                    phone: user.phoneNumber || '', bio: user.barberProfile?.bio || '',
                    experience: user.barberProfile?.yearsExperience?.toString() || '',
                    gcash: user.barberProfile?.gcashNumber || '', email: user.email || '',
                  });
                }}
              >
                Reset
              </button>
              <button type="submit" disabled={isSaving} className="barber-btn-primary">
                {isSaving ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ProfilePanel;
