import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { formatPhoneNumber, validatePhilippinePhoneNumber, normalizePhoneNumber } from '../utils/phoneUtils';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phoneNumber: user?.phoneNumber || '',
    bio: user?.barberProfile?.bio || '',
    yearsExperience: user?.barberProfile?.yearsExperience || 0,
    isAvailable: user?.barberProfile?.isAvailable ?? true
  });

  const handleLogout = async () => {
    try {
      logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'phoneNumber') {
      const formatted = formatPhoneNumber(value);
      console.log('Phone number formatting:', { original: value, formatted });
      setFormData(prev => ({
        ...prev,
        [name]: formatted
      }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'yearsExperience' ? parseInt(value) || 0 : value
      }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setImageUploading(true);
    setError('');
    setSuccess('');

    try {
      await authService.uploadProfileImage(file);
      await refreshUser();
      setSuccess('Profile picture updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to upload profile picture');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return;
    }

    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return;
    }

    if (formData.phoneNumber && !validatePhilippinePhoneNumber(formData.phoneNumber)) {
      setError('Please enter a valid Philippine phone number');
      return;
    }

    setLoading(true);

    try {
      const updateData: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim()
      };

      if (formData.phoneNumber) {
        const normalized = normalizePhoneNumber(formData.phoneNumber);
        console.log('Phone number normalization:', { 
          original: formData.phoneNumber, 
          normalized 
        });
        updateData.phoneNumber = normalized;
      }

      // Add barber-specific fields if user is a barber
      if (user?.role === 'BARBER') {
        updateData.bio = formData.bio;
        updateData.yearsExperience = formData.yearsExperience;
        updateData.isAvailable = formData.isAvailable;
      }

      // Call the profile update API
      console.log('Sending profile update request:', updateData);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify(updateData)
      });

      console.log('Profile update response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Profile update error:', errorData);
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const result = await response.json();
      console.log('Profile update result:', result);
      setSuccess('Profile updated successfully!');
      
      // Refresh user context to get updated data
      await refreshUser();
      
      // Update the form data with the response to reflect any server-side changes
      if (result.data) {
        setFormData(prev => ({
          ...prev,
          firstName: result.data.firstName || prev.firstName,
          lastName: result.data.lastName || prev.lastName,
          phoneNumber: result.data.phoneNumber || prev.phoneNumber,
          bio: result.data.barberProfile?.bio || prev.bio,
          yearsExperience: result.data.barberProfile?.yearsExperience || prev.yearsExperience,
          isAvailable: result.data.barberProfile?.isAvailable ?? prev.isAvailable
        }));
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div className="profile-page">
      {/* Navigation Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">✂</span>
            <span className="logo-text">BarberConnect</span>
          </div>
          <nav className="header-nav">
            <Link to="/dashboard" className="nav-btn">🏠 Dashboard</Link>
            {user?.role === 'CUSTOMER' && (
              <Link to="/booking" className="nav-btn">📅 My Bookings</Link>
            )}
            {user?.role === 'BARBER' && (
              <>
                <button className="nav-btn">📅 Appointments</button>
                <button className="nav-btn">💰 Income</button>
              </>
            )}
            <Link to="/profile" className="nav-btn active">👤 Profile</Link>
            <button className="nav-btn logout-btn" onClick={handleLogout}>
              🚪 Logout
            </button>
          </nav>
        </div>
      </header>

      <div className="profile-container">
        <div className="profile-header">
          <h1>My Profile</h1>
          <p>Update your personal information</p>
        </div>
        
        <div className="profile-avatar-section">
          <div className="avatar-wrapper" onClick={() => fileInputRef.current?.click()}>
            {imageUploading ? (
              <div className="avatar-loading">
                <div className="spinner"></div>
              </div>
            ) : (
              <>
                <img 
                  src={user?.profileImageUrl || user?.barberProfile?.profileImageUrl || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=1f2937&color=c79864`} 
                  alt="Profile" 
                  className="profile-avatar-large" 
                />
                <div className="avatar-overlay">
                  <span>📷 Change</span>
                </div>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              hidden 
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          {error && (
            <div className="error-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              </svg>
              {success}
            </div>
          )}

          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={user.email}
                  disabled
                  className="disabled-input"
                />
                <small className="input-hint">Email cannot be changed</small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+63 9XX XXX XXXX"
                />
                <small className="input-hint">
                  Format: +63 9XX XXX XXXX or 09XX XXX XXXX
                </small>
              </div>
            </div>
          </div>

          {user.role === 'BARBER' && (
            <div className="form-section">
              <h3>Barber Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="yearsExperience">Years of Experience</label>
                  <input
                    type="number"
                    id="yearsExperience"
                    name="yearsExperience"
                    value={formData.yearsExperience}
                    onChange={handleInputChange}
                    min="0"
                    max="50"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell customers about your experience and specialties..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isAvailable"
                      checked={formData.isAvailable}
                      onChange={handleInputChange}
                    />
                    <span className="checkmark"></span>
                    Available for appointments
                  </label>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Updating...
              </>
            ) : (
              <>
                Update Profile
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;