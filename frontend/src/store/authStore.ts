import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'SPV' | 'Staff' | string;
  unit_id: number | null;
  status?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: Cookies.get('token') || null,
      isAuthenticated: !!Cookies.get('token'),
      setAuth: (user, token) => {
        Cookies.set('token', token, { expires: 1 }); // 1 day
        set({ user, token, isAuthenticated: true });
      },
      setUser: (user) => {
        set({ user });
      },
      logout: () => {
        Cookies.remove('token');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'ghtm_auth_user',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);
