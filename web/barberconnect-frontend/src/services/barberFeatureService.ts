import api from './api';
import axios from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Post {
  post_id: string;
  barber_profile_id: string;
  content: string;
  imageUrl: string | null;
  likesCount: number;
  commentsCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface PostComment {
  comment_id: string;
  post_id: string;
  user_id: string;
  content: string;
  isActive: boolean;
  createdAt: string;
}

export interface Reaction {
  reaction_id: string;
  post_id: string;
  user_id: string;
  type: 'LIKE' | 'LOVE' | 'FIRE' | 'CLAP';
  createdAt: string;
}

export interface LeaveRequest {
  leaveRequestId: string;
  barberProfileId: string;
  requestedDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
  createdAt: string;
  resolvedAt: string | null;
}

export interface FeedbackWithReply {
  feedbackId: string;
  appointmentId: string;
  customerId: string;
  barberProfileId: string;
  rating: number;
  comment: string;
  isActive: boolean;
  createdAt: string;
  replyCommentId: string | null;
  replyContent: string | null;
}

export interface AttendanceRecord {
  userId: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  attendanceStatus: 'WORKING' | 'ON_LEAVE' | 'ABSENT';
}

export interface IncomeRecord {
  incomeRecordId: string;
  appointmentId: string;
  barberProfileId: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  recordedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const unwrap = <T>(res: { data: { success: boolean; data: T; error: string | null } }): T => {
  if (!res.data.success) throw new Error(res.data.error || 'API error');
  return res.data.data;
};

// ─── Posts ────────────────────────────────────────────────────────────────────

export const postService = {
  /** Fetch all active posts (newest first) */
  getAllPosts: async (): Promise<Post[]> => {
    const res = await api.get('/posts');
    return unwrap(res);
  },

  /** Fetch posts by barber */
  getPostsByBarber: async (barberProfileId: string): Promise<Post[]> => {
    const res = await api.get(`/posts/barber/${barberProfileId}`);
    return unwrap(res);
  },

  /** Create a new post (with optional image) */
  createPost: async (barberProfileId: string, content: string, file?: File): Promise<Post> => {
    const form = new FormData();
    form.append('barberProfileId', barberProfileId);
    form.append('content', content);
    if (file) form.append('file', file);
    const token = localStorage.getItem('jwt_token');
    const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/posts`, form, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return unwrap(res);
  },

  /** React to a post */
  addReaction: async (postId: string, userId: string, type: Reaction['type']): Promise<Reaction> => {
    const res = await api.post(`/posts/${postId}/reactions`, { userId, type });
    return unwrap(res);
  },

  /** Get comments for a post */
  getComments: async (postId: string): Promise<PostComment[]> => {
    const res = await api.get(`/posts/${postId}/comments`);
    return unwrap(res);
  },

  /** Add a comment to a post */
  addComment: async (postId: string, userId: string, content: string): Promise<PostComment> => {
    const res = await api.post(`/posts/${postId}/comments`, { userId, content });
    return unwrap(res);
  },
};

// ─── Leave Requests (Barber) ──────────────────────────────────────────────────

export const leaveService = {
  /** Submit a leave request */
  createLeaveRequest: async (barberProfileId: string, requestedDate: string, reason: string): Promise<LeaveRequest> => {
    const res = await api.post(`/barbers/${barberProfileId}/leave-request`, { requestedDate, reason });
    return unwrap(res);
  },

  /** Get all leave requests for a barber */
  getLeaveRequests: async (barberProfileId: string): Promise<LeaveRequest[]> => {
    const res = await api.get(`/barbers/${barberProfileId}/leave-requests`);
    return unwrap(res);
  },
};

// ─── Feedback ─────────────────────────────────────────────────────────────────

export const feedbackService = {
  /** Get all feedback for a barber (includes reply content) */
  getFeedbackForBarber: async (barberProfileId: string): Promise<FeedbackWithReply[]> => {
    const res = await api.get(`/feedback/barber/${barberProfileId}`);
    return unwrap(res);
  },

  /** Barber replies to a specific feedback */
  replyToFeedback: async (feedbackId: string, barberProfileId: string, replyContent: string): Promise<PostComment> => {
    const res = await api.post(`/feedback/${feedbackId}/reply`, { barberProfileId, replyContent });
    return unwrap(res);
  },

  /** Customer submits feedback for a completed appointment */
  submitFeedback: async (payload: {
    appointmentId: string;
    customerId: string;
    barberProfileId: string;
    rating: number;
    comment: string;
  }) => {
    const res = await api.post('/feedback', payload);
    return unwrap(res);
  },
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminBarberService = {
  /** Admin: get all PENDING leave requests */
  getPendingLeaveRequests: async (): Promise<LeaveRequest[]> => {
    const res = await api.get('/admin/leave-requests');
    return unwrap(res);
  },

  /** Admin: approve a leave request */
  approveLeaveRequest: async (leaveRequestId: string): Promise<LeaveRequest> => {
    const res = await api.put(`/admin/leave-requests/${leaveRequestId}/approve`);
    return unwrap(res);
  },

  /** Admin: decline a leave request */
  declineLeaveRequest: async (leaveRequestId: string): Promise<LeaveRequest> => {
    const res = await api.put(`/admin/leave-requests/${leaveRequestId}/decline`);
    return unwrap(res);
  },

  /** Admin: get today's attendance */
  getTodayAttendance: async (): Promise<AttendanceRecord[]> => {
    const res = await api.get('/admin/attendance/today');
    return unwrap(res);
  },

  /** Admin: create a barber account */
  createBarber: async (payload: {
    firstName: string; lastName: string;
    email: string; password: string; phoneNumber: string;
  }) => {
    const res = await api.post('/admin/barbers/create', payload);
    return unwrap(res);
  },

  /** Admin: deactivate a barber */
  deleteBarber: async (userId: string) => {
    const res = await api.delete(`/admin/barbers/${userId}`);
    return unwrap(res);
  },
};

// ─── Income ───────────────────────────────────────────────────────────────────

export const incomeService = {
  /** Get all income records for a barber */
  getIncomeForBarber: async (barberProfileId: string): Promise<IncomeRecord[]> => {
    const res = await api.get(`/barbers/${barberProfileId}/income`);
    return unwrap(res);
  },
};
