import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { WorkoutSet, Exercise } from '../lib/types';
import { format } from 'date-fns';
import { ExerciseCard } from '../components/ExerciseCard';

export const HistoryDetail: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [sets, setSets] = useState<WorkoutSet[]>([]);
    const [exercises, setExercises] = useState<Record<string, Exercise>>({});
    const [dateStr, setDateStr] = useState('');

    useEffect(() => {
        if (!sessionId) return;
        api.history.detail(sessionId).then(detail => {
            setSets(detail.sets);
            const exMap: Record<string, Exercise> = {};
            detail.exercises.forEach(ex => {
                exMap[ex.id] = { id: ex.id, name: ex.name, lastUsedAt: ex.lastUsedAt };
            });
            setExercises(exMap);
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
                   <h1 className="font-bold text-lg text-gray-800">
                       {dateStr ? format(new Date(dateStr), 'MMM d, yyyy') : 'Loading...'}
                   </h1>
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
