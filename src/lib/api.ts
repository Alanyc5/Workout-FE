import { Session, Exercise, WorkoutSet, SessionDetail, ExerciseWithSets } from './types';
import { useWorkoutStore } from './store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const USE_MOCK = !API_BASE_URL; // Default to mock if no URL

// --- Mock Data & Helpers ---
const MOCK_DELAY = 300;
const STORAGE_KEY = 'workout_mvp_data';

interface DbSchema {
  sessions: Session[];
  exercises: Exercise[];
  sets: WorkoutSet[];
}

const getDb = (): DbSchema => {
  const s = localStorage.getItem(STORAGE_KEY);
  if (s) return JSON.parse(s);
  return { sessions: [], exercises: [], sets: [] };
};

const saveDb = (db: DbSchema) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

const mockRequest = async <T>(action: string, data: any): Promise<T> => {
  await new Promise(r => setTimeout(r, MOCK_DELAY));
  const db = getDb();
  
  switch (action) {
    case 'session.start': {
      const newSession: Session = {
        id: 'sess_' + Date.now(),
        startAt: new Date().toISOString(),
        endAt: null,
        note: null
      };
      db.sessions.unshift(newSession); // Newest first
      saveDb(db);
      return newSession as T;
    }
    case 'session.end': {
      const s = db.sessions.find(x => x.id === data.id);
      if (s) {
        s.endAt = new Date().toISOString();
        saveDb(db);
      }
      return s as T;
    }
    case 'exercise.list': {
      let exs = db.exercises;
      if (data.query) {
        exs = exs.filter(e => e.name.toLowerCase().includes(data.query.toLowerCase()));
      }
      // sort by lastUsedAt desc
      exs.sort((a,b) => (b.lastUsedAt || '').localeCompare(a.lastUsedAt || ''));
      return exs as T;
    }
    case 'exercise.create': {
      const newEx: Exercise = {
        id: 'ex_' + Date.now(),
        name: data.name,
        lastUsedAt: new Date().toISOString()
      };
      db.exercises.push(newEx);
      saveDb(db);
      return newEx as T;
    }
    case 'set.create': {
      const newSet: WorkoutSet = {
        id: 'set_' + Date.now(),
        sessionId: data.sessionId,
        exerciseId: data.exerciseId,
        orderInExercise: 0, 
        weight: data.weight,
        reps: data.reps
      };
      // fix order
      const existing = db.sets.filter(s => s.sessionId === data.sessionId && s.exerciseId === data.exerciseId);
      newSet.orderInExercise = existing.length + 1;
      
      db.sets.push(newSet);
      
      // Update exercise lastUsed
      const ex = db.exercises.find(e => e.id === data.exerciseId);
      if (ex) {
        ex.lastUsedAt = new Date().toISOString();
      }
      saveDb(db);
      return newSet as T;
    }
    case 'set.update': {
      const idx = db.sets.findIndex(s => s.id === data.id);
      if (idx !== -1) {
        db.sets[idx] = { ...db.sets[idx], ...data };
        saveDb(db);
        return db.sets[idx] as T;
      }
      throw new Error('Set not found');
    }
    case 'set.delete': {
        const idx = db.sets.findIndex(s => s.id === data.id);
        if (idx !== -1) {
          db.sets.splice(idx, 1);
          saveDb(db);
        }
        return { deleted: true } as T;
    }
    case 'history.list': {
      return db.sessions.filter(s => s.endAt) as T; 
    }
    case 'history.detail': {
      const session = db.sessions.find(s => s.id === data.id);
      if (!session) throw new Error('Session not found');
      
      const sets = db.sets.filter(s => s.sessionId === data.id);
      // Use built-in Set to uniquify
      const exIds = Array.from(new Set(sets.map(s => s.exerciseId)));
      const exercises: ExerciseWithSets[] = exIds.map(eid => {
          const ex = db.exercises.find(e => e.id === eid)!;
          return { ...ex, sets: [] }; 
      });
      
      const detail: SessionDetail = {
          ...session,
          sets,
          exercises
      };
      return detail as T;
    }
    case 'exercise.lastTime': {
        const candidates = db.sets.filter(s => s.exerciseId === data.exerciseId && s.sessionId !== data.currentSessionId);
        if (candidates.length === 0) return null as T;
        return candidates[candidates.length - 1] as T;
    }
    default:
      throw new Error('Unknown action: ' + action);
  }
};

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

async function request<T>(action: string, data: any = {}): Promise<T> {
  if (USE_MOCK) {
    console.log(`[MockAPI] ${action}`, data);
    return mockRequest<T>(action, data);
  }

  // Get credentials from store (outside hook)
  const authHeader = useWorkoutStore.getState().authCredentials;

  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };

  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ action, data }),
  });

  const json: ApiResponse<T> = await response.json();
  if (!json.ok) {
    // If 401, logout
    if (response.status === 401) {
        useWorkoutStore.getState().logout();
    }
    throw new Error(json.error?.message || 'API Error');
  }
  return json.data as T;
}

export const api = {
  session: {
    start: () => request<Session>('session.start'),
    end: (id: string) => request<Session>('session.end', { id }),
  },
  exercise: {
    list: (query?: string) => request<Exercise[]>('exercise.list', { query }),
    create: (name: string) => request<Exercise>('exercise.create', { name }),
    lastTime: (exerciseId: string, currentSessionId: string) => 
      request<WorkoutSet | null>('exercise.lastTime', { exerciseId, currentSessionId }),
  },
  set: {
    create: (data: Omit<WorkoutSet, 'id' | 'orderInExercise'>) => request<WorkoutSet>('set.create', data),
    update: (id: string, data: Partial<WorkoutSet>) => request<WorkoutSet>('set.update', { id, ...data }),
    delete: (id: string) => request<{ deleted: boolean }>('set.delete', { id }),
  },
  history: {
    list: () => request<Session[]>('history.list'),
    detail: (id: string) => request<SessionDetail>('history.detail', { id }),
  }
};
