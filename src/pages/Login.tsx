import React, { useState } from 'react';
import { useWorkoutStore } from '../lib/store';

export const Login: React.FC = () => {
  const { login } = useWorkoutStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
        setError('請輸入帳號密碼');
        return;
    }
    
    // Simple frontend validation for specific users if desired, 
    // but actual validation happens on API call.
    // We save credentials; if next API call fails (401), we'll be kicked back out (via logic in api.ts + store)
    // But since `login` just sets state, `App.tsx` will switch view immediately.
    // Ideally we might want to "test" credentials, but for now this is MVP.
    login(username, password);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Workout Login</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              placeholder="Enter username"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              placeholder="Enter password"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button 
            type="submit"
            className="w-full py-3 bg-primary text-white font-bold rounded-lg shadow-md active:opacity-90 mt-4"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};
