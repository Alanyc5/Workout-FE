import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { WorkoutSet, ExerciseWithSets } from '../lib/types';
import { format } from 'date-fns';
import { ExerciseCard } from '../components/ExerciseCard';

const USER_COLORS: Record<string, string> = {
  Alan: 'bg-green-100 text-green-700',
  Peiya: 'bg-yellow-100 text-yellow-700',
  Stanley: 'bg-[#5D4037]/10 text-[#5D4037]', // Coffee color
};

export const HistoryDetail: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [sets, setSets] = useState<WorkoutSet[]>([]);
    const [exercises, setExercises] = useState<Record<string, ExerciseWithSets>>({});
    const [dateStr, setDateStr] = useState('');
    const [userId, setUserId] = useState('');
    const [sessionNote, setSessionNote] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionId) return;
        api.history.detail(sessionId).then(detail => {
            setSets(detail.sets);
            const exMap: Record<string, ExerciseWithSets> = {};
            detail.exercises.forEach(ex => {
                exMap[ex.id] = ex;
            });
            setExercises(exMap);
            setUserId(detail.userId);
            setSessionNote(detail.note);
            setDateStr(detail.startAt);
        }).catch(console.error);
    }, [sessionId]);

    const displayBlocks = useMemo(() => {
        const exOrder: string[] = [];
        const setsByEx: Record<string, WorkoutSet[]> = {};
        
        sets.forEach(s => {
          if (!setsByEx[s.exerciseId]) {
            setsByEx[s.exerciseId] = [];
            exOrder.push(s.exerciseId);
          }
          setsByEx[s.exerciseId].push(s);
        });
        
        return exOrder.map(eid => ({ exerciseId: eid, sets: setsByEx[eid].sort((a,b) => a.orderInExercise - b.orderInExercise) }));
      }, [sets]);

    const handleDelete = async () => {
        if (!sessionId) return;
        
        const confirmed = confirm('確定要刪除這筆訓練記錄嗎？此動作無法復原。');
        if (!confirmed) return;

        try {
            await api.session.delete(sessionId);
            navigate('/');
        } catch (e) {
            alert('刪除失敗，請稍後再試');
        }
    };

    return (
        <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col">
            <header className="h-14 bg-white border-b flex items-center px-4 sticky top-0 z-30 gap-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                   <div className="flex items-center gap-2">
                       <h1 className="font-bold text-lg text-gray-800">
                           {dateStr ? format(new Date(dateStr), 'MMM d, yyyy') : 'Loading...'}
                       </h1>
                       {userId && (
                         <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${USER_COLORS[userId] || 'bg-gray-100 text-gray-600'}`}>
                           {userId}
                         </span>
                       )}
                   </div>
                   <p className="text-xs text-gray-500">
                       {dateStr ? format(new Date(dateStr), 'HH:mm') : ''}
                   </p>
                </div>
                <button 
                    onClick={handleDelete}
                    className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 active:bg-red-200 transition-colors"
                    aria-label="Delete workout"
                >
                    <Trash2 size={20} />
                </button>
            </header>
            
            <main className="flex-1 p-4 space-y-4">
                {sessionNote && (
                  <div className="relative mx-2 my-6 p-6 bg-[#FEF9C3] shadow-[5px_5px_10px_rgba(0,0,0,0.08)] rotate-[-1.5deg] border-b border-r border-yellow-200">
                    {/* 裝飾性膠帶效果 */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-7 bg-white/40 backdrop-blur-[1px] rotate-2 shadow-sm border border-white/30" />
                    
                    <h2 className="text-[10px] font-bold text-yellow-800/40 mb-2 uppercase tracking-[0.2em]">Workout Note</h2>
                    <p className="text-yellow-950 font-medium leading-relaxed whitespace-pre-wrap italic text-sm">
                      {sessionNote}
                    </p>
                    
                    {/* 右下角摺角陰影感 */}
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-gradient-to-tl from-black/5 to-transparent pointer-events-none" />
                  </div>
                )}
                {displayBlocks.map(block => {
                    const ex = exercises[block.exerciseId];
                    if (!ex) return null;
                    return (
                        <ExerciseCard 
                            key={block.exerciseId}
                            exercise={ex}
                            sets={block.sets}
                            onAddSet={() => {}}
                            onCopyLastSet={() => {}}
                            onEditSet={() => {}}
                            canCopy={false}
                            readOnly={true}
                        />
                    )
                })}
            </main>
        </div>
    );
};
