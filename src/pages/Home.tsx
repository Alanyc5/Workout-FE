import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Calendar, History, Loader2, LogOut } from 'lucide-react';
import { api } from '../lib/api';
import { useWorkoutStore } from '../lib/store';
import { Session } from '../lib/types';
import { format } from 'date-fns';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { activeSessionId, setActiveSessionId, logout, currentUser } = useWorkoutStore();
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    // Determine if we should redirect to session if active
    // But maybe user wants to see home first.
    // For MVP, if active, showing "Resume" is better.
    
    // Fetch history (show more for team activity)
    api.history.list()
      .then(sessions => setRecentSessions(sessions.slice(0, 6)))
      .catch(console.error);
  }, []);

  const handleStartSession = async () => {
    if (activeSessionId) {
      navigate('/session');
      return;
    }
    
    setIsStarting(true);
    try {
      const session = await api.session.start();
      setActiveSessionId(session.id);
      navigate('/session');
    } catch (e) {
      alert('Failed to start session');
      setIsStarting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col p-6">
      <header className="mb-8 mt-4 pb-5 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold pb-4 text-gray-900">SAP Workout Tracker</h1>
          {currentUser && (
            <p className="text-m text-gray-500 mt-1">Hello, <span className="font-semibold text-primary">{currentUser}</span></p>
          )}
        </div>
        <button 
          onClick={() => { if (confirm('Are you sure you want to logout?')) logout(); }}
          className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 active:bg-gray-300 transition-colors"
          aria-label="Logout"
        >
          <LogOut size={20} />
        </button>
      </header>


      <main className="flex-1 flex flex-col gap-8">
        <section>
          <button
            onClick={handleStartSession}
            disabled={isStarting}
            className="w-full bg-primary text-white text-xl font-bold py-6 rounded-2xl shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-transform disabled:opacity-70 disabled:cursor-wait"
          >
            {isStarting ? <Loader2 className="animate-spin" /> : <Play fill="currentColor" />}
            {activeSessionId ? 'Resume Workout' : (isStarting ? 'Starting...' : 'Start Workout')}
          </button>
        </section>

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-700">Team Activity</h2>
            <button 
              onClick={() => navigate('/history')}
              className="text-primary text-sm font-semibold flex items-center gap-1"
            >
              See all
              <History size={14} />
            </button>
          </div>

          {recentSessions.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
              No team activity yet!
            </div>
          ) : (
            <div className="space-y-3">
              {recentSessions.map(session => (
                <div 
                  key={session.id}
                  onClick={() => navigate(`/history/${session.id}`)}
                  className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm active:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        session.userId === currentUser 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {session.userId || 'Unknown'}
                      </span>
                      {session.userId === currentUser && (
                        <span className="text-xs text-gray-400">(You)</span>
                      )}
                    </div>
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-800">
                      {format(new Date(session.startAt), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(session.startAt), 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
