import { create } from 'zustand';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  userRole: string | null;
  loading: boolean;
  initAuth: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  userRole: null,
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

      // Auth listener runs for the lifetime of the app — no cleanup needed
      const _unsubscribe = onAuthStateChanged(auth, 
        async (user) => {
          clearTimeout(fallbackTimer);
          
          if (!user) {
            set({ user: null, isAdmin: false, userRole: null, loading: false });
            return;
          }

          try {
            const db = getFirebaseDb();
            const userDoc = await getDoc(doc(db, "users", user.uid));
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const role = userData.role || 'pending';
              
              if (role === 'pending') {
                // User not yet approved — sign out
                await signOut(auth);
                set({ user: null, isAdmin: false, userRole: null, loading: false });
                return;
              }
              
              const isAdmin = role === 'admin';
              set({ user, isAdmin, userRole: role, loading: false });
            } else {
              // Legacy user without Firestore doc — check hardcoded admin list for backward compat
              const legacyAdmins = [
                'admin@tripla.com.br',
                'henri@tripla.com.br'
              ];
              const isAdmin = legacyAdmins.includes(user.email || "");
              set({ user, isAdmin, userRole: isAdmin ? 'admin' : 'approved', loading: false });
            }
          } catch (err) {
            console.error("Erro ao verificar role do usuário:", err);
            // Fallback: allow login but not admin
            set({ user, isAdmin: false, userRole: 'approved', loading: false });
          }
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
