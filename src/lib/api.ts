import { Session, Exercise, WorkoutSet, SessionDetail } from './types';
import { useWorkoutStore } from './store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- Helper Functions ---

interface ApiResponse<T> {
  ok: boolean;
  data: T;
  error?: {
    code?: string;
    message: string;
  };
}

async function request<T>(
  endpoint: string, 
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    params?: Record<string, string>;
  } = {}
): Promise<T> {
  // Check Config
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not defined in .env');
  }

  const { method = 'GET', body, params } = options;
  const authHeader = useWorkoutStore.getState().authCredentials;

  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };

  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  // Handle Query Strings
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  // Debug Log
  console.log(`[API] ${method} ${url}`, body);

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    useWorkoutStore.getState().logout();
    throw new Error('Unauthorized');
  }

  // Handle Non-200 HTTP Errors
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP Error ${response.status}: ${errorText}`);
  }

  const json: ApiResponse<T> = await response.json();
  
  // Handle Application Level Errors (ok: false)
  if (!json.ok) {
    throw new Error(json.error?.message || 'Unknown API Error');
  }

  return json.data;
}

// --- API Methods ---

export const api = {
  session: {
    start: () => request<Session>('/api/sessions', { method: 'POST' }),
    end: (id: string) => request<Session>(`/api/sessions/${id}/end`, { method: 'PUT' }),
    delete: (id: string) => request<{ deleted: boolean }>(`/api/sessions/${id}`, { method: 'DELETE' }),
  },
  exercise: {
    list: (query?: string) => request<Exercise[]>('/api/exercises', { 
        method: 'GET',
        params: query ? { query } : undefined
    }),
    create: (name: string) => request<Exercise>('/api/exercises', { 
        method: 'POST', 
        body: { name } 
    }),
    lastTime: (exerciseId: string, currentSessionId: string) => 
      request<WorkoutSet | null>(`/api/exercises/${exerciseId}/last-set`, { 
        method: 'GET',
        params: { currentSessionId }
      }),
  },
  set: {
    create: (data: Omit<WorkoutSet, 'id' | 'orderInExercise'>) => 
      request<WorkoutSet>('/api/sets', { 
        method: 'POST',
        body: data
      }),
    update: (id: string, data: Partial<WorkoutSet>) => 
      request<WorkoutSet>(`/api/sets/${id}`, { 
        method: 'PUT',
        body: data
      }),
    delete: (id: string) => 
      request<{ deleted: boolean }>(`/api/sets/${id}`, { 
        method: 'DELETE'
      }),
  },
  history: {
    list: () => request<Session[]>('/api/history', { method: 'GET' }),
    detail: (id: string) => request<SessionDetail>(`/api/sessions/${id}`, { method: 'GET' }),
  }
};


