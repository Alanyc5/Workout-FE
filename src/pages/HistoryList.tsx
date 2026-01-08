import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { api } from '../lib/api';
import { Session } from '../lib/types';
import { format } from 'date-fns';

export const HistoryList: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    api.history.list().then(setSessions).catch(console.error);
  }, []);

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
              onClick={() => navigate(`/history/${session.id}`)}
              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm active:bg-gray-50 cursor-pointer flex justify-between items-center"
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
            </div>
        ))}
      </main>
    </div>
  );
};
