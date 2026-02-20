import { api } from './api';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export const authApi = {
  forgotPassword: async (email: string): Promise<string> => {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.message || 'Un code de vérification a été envoyé à votre email.';
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<string> => {
    const response = await api.post('/api/auth/reset-password', data);
    return response.message || 'Votre mot de passe a été réinitialisé avec succès.';
  },
};
