import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { barberService } from '../../../services/barberService';
import api from '../../../services/api';

const ProfilePanel = () => {
  const { user, refreshUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    phone: '',
    bio: '',
    experience: '',
    gcash: '',
    email: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        phone: user.phoneNumber || '',
        bio: user.barberProfile?.bio || '',
        experience: user.barberProfile?.yearsExperience?.toString() || '',
        gcash: user.barberProfile?.gcashNumber || '',
        email: user.email || ''
      });
      setPreviewUrl(user.barberProfile?.profileImageUrl || null);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/barbers/${user.firebaseUid}/profile-picture`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl: string = res.data?.data;
      setPreviewUrl(uploadedUrl);
      await refreshUser();
    } catch (err: any) {
      console.error('Photo upload failed:', err);
      alert('Failed to upload photo: ' + (err?.response?.data?.error || err?.message || 'Unknown error'));
      setPreviewUrl(user.barberProfile?.profileImageUrl || null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await barberService.updateProfile(user.firebaseUid, {
        phone: formData.phone,
        bio: formData.bio,
        experience: parseInt(formData.experience) || 0,
        gcash: formData.gcash
      });
      await refreshUser();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error('Failed to save profile', error);
      const message = error?.response?.data?.error || error?.message || 'Unknown error';
      alert(`Failed to save profile: ${message}. Please check your connection and try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Barber Profile</h2>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        {/* Profile Photo Upload */}
        <div className="flex items-center gap-6 mb-8 border-b border-gray-100 pb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={() => setPreviewUrl(null)}
                />
              ) : (
                <span className="text-4xl text-gray-400">👤</span>
              )}
            </div>
            {uploadingPhoto && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Profile Photo</h3>
            <p className="text-sm text-gray-500 mb-3">This photo will be shown to customers when they book</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="bg-[#D2691E] hover:bg-[#8B4513] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
            </button>
          </div>
        </div>

        {/* Profile Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <input 
                type="text" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+63 912 345 6789"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#D2691E]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Google Email (Read-only)</label>
              <input 
                type="email" 
                value={formData.email}
                disabled
                className="w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-lg p-3 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Short Bio</label>
            <textarea 
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell customers about your barbering style..."
              className="w-full border border-gray-300 rounded-lg p-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-[#D2691E]"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Years of Experience</label>
              <input 
                type="number" 
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                placeholder="Years..."
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#D2691E]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">GCash Number</label>
              <input 
                type="text" 
                name="gcash"
                value={formData.gcash}
                onChange={handleChange}
                placeholder="09..."
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#D2691E]"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-6">
            {saveSuccess && (
              <span className="text-green-600 font-bold bg-green-50 px-4 py-2 rounded-lg animate-pulse">
                ✓ Profile Saved!
              </span>
            )}
            <div className="flex gap-4">
              <button type="button" className="px-6 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition">
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSaving}
                className={`px-8 py-2 text-white font-bold rounded-lg shadow-sm transition ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#8B4513] to-[#D2691E] hover:from-[#A0522D] hover:to-[#CD853F]'}`}
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePanel;
