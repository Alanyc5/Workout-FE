import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { Session } from '../lib/types';
import { format } from 'date-fns';

export const HistoryList: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    api.history.list().then(setSessions).catch(console.error);
  }, []);

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    
    const confirmed = confirm('確定要刪除這筆訓練記錄嗎？');
    if (!confirmed) return;

    setDeletingId(sessionId);
    try {
      await api.session.delete(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (error) {
      alert('刪除失敗，請稍後再試');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col">
      <header className="h-14 bg-white border-b flex items-center px-4 sticky top-0 z-30 gap-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg text-gray-800">History</h1>
      </header>
      
      <main className="flex-1 p-4 space-y-3">
        {sessions.map(session => (
            <div 
              key={session.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div
                onClick={() => navigate(`/history/${session.id}`)}
                className="p-4 active:bg-gray-50 cursor-pointer flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">
                      {format(new Date(session.startAt), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(session.startAt), 'HH:mm')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(e, session.id)}
                  disabled={deletingId === session.id}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                  aria-label="Delete workout"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
        ))}
      </main>
    </div>
  );
};
