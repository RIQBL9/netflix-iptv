import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loginXtream } from '../api/xtreamApi';

interface UserInfo {
  username: string;
  password: string;
  status: string;
  exp_date: string;
  max_connections: number;
  message: string;
  auth: number;
  server_info?: {
    url: string;
    port: string;
    https_port: string;
    server_protocol: string;
  };
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  serverUrl: string;
  error: string | null;
  isLoading: boolean;
  login: (serverUrl: string, username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      serverUrl: '',
      error: null,
      isLoading: false,

      login: async (serverUrl, username, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await loginXtream(serverUrl, username, password);
          
          if (response && response.user_info && response.user_info.auth === 1) {
            set({
              isAuthenticated: true,
              user: response.user_info,
              serverUrl,
              error: null,
              isLoading: false,
            });
            return true;
          } else {
            const errorMsg = response?.user_info?.message || 'Authentication failed';
            set({
              isAuthenticated: false,
              user: null,
              error: errorMsg,
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          set({
            isAuthenticated: false,
            user: null,
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
          return false;
        }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          serverUrl: '',
          error: null,
        });
      },

      checkAuth: async () => {
        const { user, serverUrl } = get();
        
        if (!user || !serverUrl) {
          set({ isAuthenticated: false });
          return false;
        }
        
        // Optionally verify the token is still valid by making a request to the server
        try {
          const response = await loginXtream(
            serverUrl,
            user.username,
            user.password
          );
          
          if (response && response.user_info && response.user_info.auth === 1) {
            set({
              isAuthenticated: true,
              user: response.user_info,
            });
            return true;
          } else {
            set({
              isAuthenticated: false,
              user: null,
            });
            return false;
          }
        } catch (error) {
          set({
            isAuthenticated: false,
            user: null,
          });
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        serverUrl: state.serverUrl,
      }),
    }
  )
);