import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Theme store with persistence to localStorage.
 * Manages light/dark theme toggle matching legacy behavior.
 */
interface ThemeState {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "light",
      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        set({ theme: next });
        // Apply to DOM
        if (typeof document !== "undefined") {
          document.documentElement.dataset.theme = next;
          document.documentElement.classList.toggle("dark", next === "dark");
        }
      },
    }),
    {
      name: "tripla-theme",
      onRehydrateStorage: () => (state) => {
        // Sync DOM on rehydrate
        if (state && typeof document !== "undefined") {
          document.documentElement.dataset.theme = state.theme;
          document.documentElement.classList.toggle("dark", state.theme === "dark");
        }
      },
    }
  )
);
