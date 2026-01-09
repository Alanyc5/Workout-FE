import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CheckCircle2 } from 'lucide-react';
import { useWorkoutStore } from '../lib/store';
import { api } from '../lib/api';
import { WorkoutSet, Exercise } from '../lib/types';
import { ExerciseCard } from '../components/ExerciseCard';
import { ExercisePicker } from '../components/ExercisePicker';
import { SetEditorSheet } from '../components/SetEditorSheet';

export const SessionPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeSessionId, setActiveSessionId } = useWorkoutStore();
  
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [exercises, setExercises] = useState<Record<string, Exercise>>({});
  const [lastTimes, setLastTimes] = useState<Record<string, string>>({}); // exerciseId -> "40 kg x 10"
  
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<{ set: WorkoutSet | null, mode: 'create' | 'edit', defaults?: {weight: number, reps: number, exerciseId: string} }>({ set: null, mode: 'create' });
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    if (!activeSessionId) {
      navigate('/');
      return;
    }

    const loadSession = async () => {
      try {
        const detail = await api.history.detail(activeSessionId);
        setSets(detail.sets);
        
        const exMap: Record<string, Exercise> = {};
        detail.exercises.forEach(ex => {
          exMap[ex.id] = { id: ex.id, name: ex.name, lastUsedAt: ex.lastUsedAt };
          fetchLastTime(ex.id);
        });
        setExercises(exMap);
      } catch (e) {
        console.error(e);
      }
    };
    loadSession();
  }, [activeSessionId, navigate]);

  const fetchLastTime = async (exerciseId: string) => {
    if (!activeSessionId) return;
    try {
      const lastSet = await api.exercise.lastTime(exerciseId, activeSessionId);
      if (lastSet) {
        setLastTimes(prev => ({ ...prev, [exerciseId]: `${lastSet.weight}kg × ${lastSet.reps}` }));
      }
    } catch { /* ignore */ }
  };

  const groupedSets = useMemo(() => {
    // const groups: { exerciseId: string; sets: WorkoutSet[] }[] = [];
    
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
  
  const [manualExercises, setManualExercises] = useState<string[]>([]);
  
  const displayBlocks = useMemo(() => {
    const existing = new Set(groupedSets.map(g => g.exerciseId));
    const manuals = manualExercises.filter(id => !existing.has(id)).map(id => ({ exerciseId: id, sets: [] }));
    return [...groupedSets, ...manuals];
  }, [groupedSets, manualExercises]);


  const handleAddExercise = (ex: Exercise) => {
    setExercises(prev => ({ ...prev, [ex.id]: ex }));
    setManualExercises(prev => [...prev, ex.id]);
    setIsPickerOpen(false);
    fetchLastTime(ex.id);
  };

  const openAddSet = (exerciseId: string) => {
    // Determine default weight/reps from last set of this exercise
    const exSets = sets.filter(s => s.exerciseId === exerciseId);
    const lastSet = exSets[exSets.length - 1];
    
    setEditingSet({
      mode: 'create',
      set: null,
      defaults: {
        exerciseId,
        weight: lastSet ? lastSet.weight : 0, // Could default to 0 or last time
        reps: lastSet ? lastSet.reps : 0
      }
    });
    setIsEditorOpen(true);
  };

  const openEditSet = (set: WorkoutSet) => {
    setEditingSet({
      mode: 'edit',
      set: set
    });
    setIsEditorOpen(true);
  };

  const handleSaveSet = async (weight: number, reps: number) => {
    if (!activeSessionId) return;

    // Close immediately for better UX (Optimistic UI)
    setIsEditorOpen(false);

    try {
      if (editingSet.mode === 'create' && editingSet.defaults) {
        const { exerciseId } = editingSet.defaults;
        // Optimistic
        const tempId = 'temp_' + Date.now();
        const newSet: WorkoutSet = {
          id: tempId,
          sessionId: activeSessionId,
          exerciseId,
          orderInExercise: (sets.filter(s => s.exerciseId === exerciseId).length) + 1,
          weight,
          reps
        };
        setSets(prev => [...prev, newSet]); // optimistic
        
        const created = await api.set.create({ sessionId: activeSessionId, exerciseId, weight, reps });
        setSets(prev => prev.map(s => s.id === tempId ? created : s));

      } else if (editingSet.mode === 'edit' && editingSet.set) {
        const { id } = editingSet.set;
        setSets(prev => prev.map(s => s.id === id ? { ...s, weight, reps } : s));
        await api.set.update(id, { weight, reps });
      }
    } catch (e) {
      alert('Save failed');
      // Revert optimistic if needed (skipped for MVP/simplicity)
    }
  };

  const handleDeleteSet = async () => {
    if (editingSet.mode === 'edit' && editingSet.set) {
        const { id } = editingSet.set;
        // Close immediately
        setIsEditorOpen(false);
        
        await handleQuickDeleteSet(id);
    }
  }

  const handleQuickDeleteSet = async (setId: string) => {
    // Optimistic delete
    const previousSets = sets;
    setSets(prev => prev.filter(s => s.id !== setId)); 
    
    try {
        await api.set.delete(setId);
    } catch {
        alert('Delete failed');
        setSets(previousSets); // Revert on failure
    }
  }

  const handleRemoveExercise = (exerciseId: string) => {
    setManualExercises(prev => prev.filter(id => id !== exerciseId));
  }

  const handleCopyLast = async (exerciseId: string) => {
    if (!activeSessionId) return;
    const exSets = sets.filter(s => s.exerciseId === exerciseId);
    const last = exSets[exSets.length - 1];
    if (!last) return;

    // Create logic
    const weight = last.weight;
    const reps = last.reps;
    const tempId = 'temp_copy_' + Date.now();
    const newSet: WorkoutSet = {
      id: tempId,
      sessionId: activeSessionId,
      exerciseId,
      orderInExercise: exSets.length + 1,
      weight,
      reps
    };
    setSets(prev => [...prev, newSet]);
    
    try {
        const created = await api.set.create({ sessionId: activeSessionId, exerciseId, weight, reps });
        setSets(prev => prev.map(s => s.id === tempId ? created : s));
    } catch (e) {
        // revert
    }
  };

  const finishSession = async () => {
    if (!activeSessionId) return;
    
    // 檢查是否有任何運動
    if (sets.length === 0) {
      const confirmed = confirm('This workout has no exercises. It will not be saved to history. Continue?');
      if (!confirmed) return;
    } else {
      if (!confirm('Finish workout?')) return;
    }
    
    try {
        await api.session.end(activeSessionId);
    } catch (e) {
        console.error("無法更新後端 Session (可能已被刪除)，將強制結束本地 session", e);
    } finally {
        // 無論 API 成功或失敗，都清除本地狀態並回到首頁
        setActiveSessionId(null);
        navigate('/');
    }
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <header className="h-14 bg-white border-b flex items-center justify-between px-4 sticky top-0 z-30">
        <h1 className="font-bold text-lg text-primary">Training</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-primary text-xs font-medium px-2 py-1 bg-primary/10 rounded-full">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Active
          </div>
          <button 
            onClick={finishSession} 
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-sm active:opacity-90 flex items-center gap-2"
          >
            Finish
            <CheckCircle2 size={18} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 pb-24 space-y-4">
        {sets.length === 0 && displayBlocks.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              ⚠️ This workout will not be saved to history unless you add at least one exercise.
            </p>
          </div>
        )}
        
        {displayBlocks.length === 0 ? (
           <div className="h-64 flex flex-col items-center justify-center text-gray-400">
             <p>No exercises yet</p>
             <button onClick={() => setIsPickerOpen(true)} className="mt-4 text-primary font-bold">Add One</button>
           </div>
        ) : (
            displayBlocks.map(block => {
                const ex = exercises[block.exerciseId];
                if (!ex) return null;
                return (
                    <ExerciseCard 
                        key={block.exerciseId}
                        exercise={ex}
                        sets={block.sets}
                        lastTimeSet={lastTimes[ex.id]}
                        onAddSet={() => openAddSet(ex.id)}
                        onCopyLastSet={() => handleCopyLast(ex.id)}
                        onEditSet={openEditSet}
                        onDeleteSet={handleQuickDeleteSet}
                        onRemoveExercise={() => handleRemoveExercise(ex.id)}
                        canCopy={block.sets.length > 0}
                    />
                )
            })
        )}
        
        <button 
           onClick={() => setIsPickerOpen(true)}
           className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
            <Plus size={20} />
            Add Exercise
        </button>
      </main>

      {/* Overlays */}
      {isPickerOpen && (
        <ExercisePicker 
            onSelect={handleAddExercise} 
            onClose={() => setIsPickerOpen(false)} 
        />
      )}
      
      <SetEditorSheet 
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        mode={editingSet.mode}
        initialWeight={editingSet.mode === 'create' ? editingSet.defaults?.weight : editingSet.set?.weight}
        initialReps={editingSet.mode === 'create' ? editingSet.defaults?.reps : editingSet.set?.reps}
        onSave={handleSaveSet}
        onDelete={handleDeleteSet}
      />
    </div>
  );
};
