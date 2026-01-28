import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { api } from '../lib/api';
import { useWorkoutStore } from '../lib/store';
import { Motivation } from '../lib/types';
import { formatDistanceToNow } from 'date-fns';

const EMOJIS = ['😍', '🥵', '💪', '❤️‍🔥', '💯'];
const USER_COLORS: Record<string, string> = {
  Alan: 'bg-green-100 text-green-700',
  Peiya: 'bg-yellow-100 text-yellow-700',
  Stanley: 'bg-[#5D4037]/10 text-[#5D4037]',
};

export const MotivationBoard: React.FC = () => {
  const { currentUser } = useWorkoutStore();
  const [motivations, setMotivations] = useState<Motivation[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadMotivations();
    // Optional: Poll every minute to keep it fresh? Not required by prompt but good UX.
    // For now, simple load.
  }, []);

  const loadMotivations = () => {
    api.motivation.list().then(setMotivations).catch(console.error);
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const created = await api.motivation.create(newMessage);
      setMotivations(prev => [created, ...prev]);
      setNewMessage('');
    } catch (e) {
      alert('Failed to post message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReact = async (id: string, emoji: string) => {
    if (!currentUser) return;
    
    // Optimistic update
    setMotivations(prev => prev.map(m => {
        if (m.id !== id) return m;
        const currentUsers = m.reactions[emoji] || [];
        const hasReacted = currentUsers.includes(currentUser);
        
        let newUsers;
        if (hasReacted) {
            newUsers = currentUsers.filter(u => u !== currentUser);
        } else {
            newUsers = [...currentUsers, currentUser];
        }

        return {
            ...m,
            reactions: { ...m.reactions, [emoji]: newUsers }
        };
    }));

    try {
        await api.motivation.react(id, emoji);
    } catch (e) {
        console.error(e);
        loadMotivations(); // Revert on error
    }
  };

  if (!currentUser) return null;

  return (
    <div className="">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-700">Team Shoutouts (36h)</h2>
      </div>

      {/* Input */}
      <form onSubmit={handlePost} className="relative mb-6">
        <input
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Say something to motivate the team..."
          className="w-full pl-4 pr-12 py-3.5 rounded-2xl border-none shadow-sm ring-1 ring-gray-100 focus:ring-2 focus:ring-primary/20 bg-white text-base"
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim() || isSubmitting}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-xl disabled:opacity-50 active:scale-95 transition-all shadow-sm hover:bg-primary/90"
        >
          <Send size={16} />
        </button>
      </form>

      {/* Lists */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
        {motivations.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-4">No active messages. Be the first!</div>
        )}
        {motivations.map(msg => (
          <div key={msg.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${USER_COLORS[msg.userId] || 'bg-gray-100 text-gray-600'}`}>
                  {msg.userId}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(msg.createdAt))} ago
                </span>
              </div>
            </div>
            <p className="text-gray-800 font-medium mb-4 whitespace-pre-wrap text-[15px] leading-relaxed">
              {msg.message}
            </p>
            
            {/* Reactions */}
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(emoji => {
                const users = msg.reactions[emoji] || [];
                const count = users.length;
                const hasReacted = currentUser && users.includes(currentUser);
                
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReact(msg.id, emoji)}
                    className={`
                      flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs transition-all border
                      ${hasReacted 
                        ? 'bg-primary/10 border-primary/20 text-primary font-semibold' 
                        : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'}
                    `}
                  >
                    <span className="text-sm">{emoji}</span>
                    {count > 0 && <span>{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
