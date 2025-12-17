import { apiClient } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  email: string;
  role: string;
  organization: string;
  glnNumber?: string;
  message: string;
}

export interface ValidateResponse {
  userId: string;
  email: string;
  role: string;
  organization: string;
  glnNumber?: string;
  valid: boolean;
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', data),
  
  validate: (userId: string) =>
    apiClient.post<ValidateResponse>('/auth/validate', { userId }),
};

// Helper functions for managing auth state in localStorage
export const authStorage = {
  setUser: (user: LoginResponse) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  getUser: (): LoginResponse | null => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }
    }
    return null;
  },

  removeUser: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  },

  isAuthenticated: (): boolean => {
    return authStorage.getUser() !== null;
  },
};
