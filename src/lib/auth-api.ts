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
    const response = await api.post<{ message?: string }>('/api/auth/forgot-password', { email });
    return response.message || 'Si ce compte existe, un code de vérification a été envoyé.';
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<string> => {
    const response = await api.post<{ message?: string }>('/api/auth/reset-password', data);
    return response.message || 'Votre mot de passe a été réinitialisé avec succès.';
  },
};
