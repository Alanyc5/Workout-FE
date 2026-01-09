import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WorkoutSet } from './types';

interface WorkoutStore {
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;

  // Auth state
  authCredentials: string | null;
  currentUser: string | null;
  login: (user: string, pass: string) => void;
  logout: () => void;
  
  // Cache or temporary state for current session
  sessionSets: WorkoutSet[];
  setSessionSets: (sets: WorkoutSet[]) => void;
  addSet: (set: WorkoutSet) => void;
  updateSet: (id: string, diff: Partial<WorkoutSet>) => void;
  removeSet: (id: string) => void;
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set) => ({
      activeSessionId: null,
      setActiveSessionId: (id) => set({ activeSessionId: id }),

      authCredentials: null,
      currentUser: null,
      login: (user, pass) => {
        const token = btoa(`${user}:${pass}`);
        set({ authCredentials: `Basic ${token}`, currentUser: user });
      },
      logout: () => set({ authCredentials: null, currentUser: null }),
      
      sessionSets: [],
      setSessionSets: (sets) => set({ sessionSets: sets }),
      addSet: (newSet) => set((state) => ({ sessionSets: [...state.sessionSets, newSet] })),
      updateSet: (id, diff) => set((state) => ({
        sessionSets: state.sessionSets.map((s) => (s.id === id ? { ...s, ...diff } : s))
      })),
      removeSet: (id) => set((state) => ({
        sessionSets: state.sessionSets.filter((s) => s.id !== id)
      })),
    }),
    {
      name: 'workout-storage',
      partialize: (state) => ({ 
        activeSessionId: state.activeSessionId,
        authCredentials: state.authCredentials,
        currentUser: state.currentUser
      }), 
    }
  )
);
