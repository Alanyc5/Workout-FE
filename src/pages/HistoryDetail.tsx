import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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

    return (
        <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col">
            <header className="h-14 bg-white border-b flex items-center px-4 sticky top-0 z-30 gap-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600">
                    <ArrowLeft size={20} />
                </button>
                <div>
                   <h1 className="font-bold text-lg text-gray-800">
                       {dateStr ? format(new Date(dateStr), 'MMM d, yyyy') : 'Loading...'}
                   </h1>
                   <p className="text-xs text-gray-500">
                       {dateStr ? format(new Date(dateStr), 'HH:mm') : ''}
                   </p>
                </div>
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
