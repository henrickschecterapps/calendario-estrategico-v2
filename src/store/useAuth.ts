import { create } from 'zustand';
import { User, onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  initAuth: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  loading: true,
  initAuth: () => {
    // Timeout de segurança para destravar a tela
    const fallbackTimer = setTimeout(() => {
      set((state) => state.loading ? { loading: false } : state);
    }, 2500);

    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        clearTimeout(fallbackTimer);
        set({ loading: false });
        return;
      }

      const unsubscribe = onAuthStateChanged(auth, 
        (user) => {
          clearTimeout(fallbackTimer);
          const adminUsers = [
            'admin@tripla.com.br',
            'henri@tripla.com.br'
          ];
          const isAdmin = user ? adminUsers.includes(user.email || "") : false;

          set({ user, isAdmin, loading: false });
        }, 
        (error) => {
          console.error("Erro no Auth listener:", error);
          clearTimeout(fallbackTimer);
          set({ loading: false });
        }
      );
    } catch (error) {
      console.error("Falha ao inicializar Firebase Auth:", error);
      clearTimeout(fallbackTimer);
      set({ loading: false });
    }
  },
}));
