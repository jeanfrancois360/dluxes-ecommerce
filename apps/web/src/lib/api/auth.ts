import { api } from './client';
import type { LoginCredentials, RegisterData, AuthResponse, ProfileUpdateData } from './types';

export const authAPI = {
  login: (credentials: LoginCredentials) =>
    api.post<AuthResponse>('/auth/login', credentials),

  register: (data: RegisterData) =>
    api.post<AuthResponse>('/auth/register', data),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  },

  getProfile: () =>
    api.get('/auth/me'),

  updateProfile: (data: ProfileUpdateData) =>
    api.patch('/users/me', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data),

  verifyEmail: (token: string) =>
    api.post('/auth/verify-email', { token }),

  resendVerification: (email: string) =>
    api.post('/auth/resend-verification', { email }),
};

// Export individual functions for convenience
export const login = (credentials: LoginCredentials) => authAPI.login(credentials);
export const register = (data: RegisterData) => authAPI.register(data);
export const logout = () => authAPI.logout();
export const getCurrentUser = () => authAPI.getProfile();
export const updateProfile = (data: ProfileUpdateData) => authAPI.updateProfile(data);
export const changePassword = (currentPassword: string, newPassword: string, confirmPassword: string) =>
  authAPI.changePassword({ currentPassword, newPassword });
export const requestPasswordReset = (data: { email: string }) => authAPI.forgotPassword(data.email);
export const confirmPasswordReset = (data: { token: string; password: string; confirmPassword: string }) =>
  authAPI.resetPassword({ token: data.token, password: data.password });
export const verifyEmail = (token: string) => authAPI.verifyEmail(token);
export const resendEmailVerification = () => api.post('/auth/resend-verification');
export const refreshToken = () => api.post('/auth/refresh');

// Magic link functions
export const requestMagicLink = (data: { email: string }) => api.post('/auth/magic-link', data);
export const verifyMagicLink = (token: string) => api.post(`/auth/magic-link/verify/${token}`);

// 2FA functions
export const setupTwoFactor = () => api.post('/auth/2fa/setup');
export const enableTwoFactor = (data: { code: string }) => api.post('/auth/2fa/enable', data);
export const disableTwoFactor = (data: { code: string }) => api.post('/auth/2fa/disable', data);
export const verifyTwoFactor = (code: string, loginToken: string) =>
  api.post('/auth/2fa/verify', { code, loginToken });
export const regenerateBackupCodes = () => api.post('/auth/2fa/regenerate-backup-codes');

// Profile management
export const uploadAvatar = (file: File, onProgress?: (progress: number) => void) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return api.post('/auth/avatar', formData);
};
export const deleteAvatar = () => api.delete('/auth/avatar');
export const deleteAccount = (password: string) => api.post('/auth/delete-account', { password });

// Session management
export const getSessions = () => api.get('/auth/sessions');
export const revokeSession = (sessionId: string) => api.delete(`/auth/sessions/${sessionId}`);
export const revokeAllSessions = () => api.delete('/auth/sessions');
