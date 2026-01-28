import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CheckCircle2 } from 'lucide-react';
import { useWorkoutStore } from '../lib/store';
import { api } from '../lib/api';
import { WorkoutSet, Exercise, ExerciseWithSets } from '../lib/types';
import { ExerciseCard } from '../components/ExerciseCard';
import { ExercisePicker } from '../components/ExercisePicker';
import { SetEditorSheet } from '../components/SetEditorSheet';

export const SessionPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeSessionId, setActiveSessionId } = useWorkoutStore();
  
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [exercises, setExercises] = useState<Record<string, ExerciseWithSets>>({});
  const [lastTimes, setLastTimes] = useState<Record<string, { weight: number; reps: number; unit: string; duration: number | null }>>({}); // exerciseId -> data
  
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<{ 
    set: WorkoutSet | null, 
    mode: 'create' | 'edit', 
    defaults?: { weight: number, reps: number, unit: 'kg' | 'lb', duration: number | null, exerciseId: string } 
  }>({ set: null, mode: 'create' });
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
        
        const exMap: Record<string, ExerciseWithSets> = {};
        detail.exercises.forEach(ex => {
          exMap[ex.id] = ex;
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
        setLastTimes(prev => ({ 
          ...prev, 
          [exerciseId]: { 
            weight: lastSet.weight, 
            reps: lastSet.reps, 
            unit: lastSet.unit,
            duration: lastSet.duration
          } 
        }));
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
  const [sessionNote, setSessionNote] = useState('');
  
  const displayBlocks = useMemo(() => {
    const existing = new Set(groupedSets.map(g => g.exerciseId));
    const manuals = manualExercises.filter(id => !existing.has(id)).map(id => ({ exerciseId: id, sets: [] }));
    return [...groupedSets, ...manuals];
  }, [groupedSets, manualExercises]);


  const handleAddExercise = (ex: Exercise) => {
    const exWithSets: ExerciseWithSets = { ...ex, sets: [], note: null };
    setExercises(prev => ({ ...prev, [ex.id]: exWithSets }));
    setManualExercises(prev => [...prev, ex.id]);
    setIsPickerOpen(false);
    fetchLastTime(ex.id);
  };

  const openAddSet = (exerciseId: string) => {
    // Determine default weight/reps from last set of this exercise
    const exSets = sets.filter(s => s.exerciseId === exerciseId);
    const lastSetInSession = exSets[exSets.length - 1];
    const historicalLastTime = lastTimes[exerciseId];
    
    setEditingSet({
      mode: 'create',
      set: null,
      defaults: {
        exerciseId,
        weight: lastSetInSession ? lastSetInSession.weight : (historicalLastTime?.weight || 0),
        reps: lastSetInSession ? lastSetInSession.reps : (historicalLastTime?.reps || 0),
        unit: lastSetInSession ? lastSetInSession.unit : (historicalLastTime?.unit as any || 'kg'),
        duration: lastSetInSession ? lastSetInSession.duration : (historicalLastTime?.duration || 0)
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

  const handleSaveSet = async (data: { weight: number; reps: number; unit: 'kg' | 'lb'; duration: number | null }) => {
    if (!activeSessionId) return;
    const { weight, reps, unit, duration } = data;

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
          reps,
          unit,
          duration
        };
        setSets(prev => [...prev, newSet]); // optimistic
        
        const created = await api.set.create({ sessionId: activeSessionId, exerciseId, weight, reps, unit, duration });
        setSets(prev => prev.map(s => s.id === tempId ? created : s));

      } else if (editingSet.mode === 'edit' && editingSet.set) {
        const { id } = editingSet.set;
        setSets(prev => prev.map(s => s.id === id ? { ...s, weight, reps, unit, duration } : s));
        await api.set.update(id, { weight, reps, unit, duration });
      }
    } catch (e) {
      alert('Save failed');
      // Revert optimistic if needed (skipped for MVP/simplicity)
    }
  };

  const handleUpdateNote = async (exerciseId: string, note: string) => {
    if (!activeSessionId) return;
    setExercises(prev => ({
      ...prev,
      [exerciseId]: { ...prev[exerciseId], note }
    }));
    try {
      await api.exercise.updateNote(activeSessionId, exerciseId, note);
    } catch (e) {
      alert('Failed to save note');
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
    const { weight, reps, unit, duration } = last;
    const tempId = 'temp_copy_' + Date.now();
    const newSet: WorkoutSet = {
      id: tempId,
      sessionId: activeSessionId,
      exerciseId,
      orderInExercise: exSets.length + 1,
      weight,
      reps,
      unit,
      duration
    };
    setSets(prev => [...prev, newSet]);
    
    try {
        const created = await api.set.create({ sessionId: activeSessionId, exerciseId, weight, reps, unit, duration });
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
        await api.session.end(activeSessionId, sessionNote);
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
                        lastTimeSet={lastTimes[ex.id] ? (ex.type === 'cardio' ? `${lastTimes[ex.id].duration} min` : `${lastTimes[ex.id].weight}${lastTimes[ex.id].unit} × ${lastTimes[ex.id].reps}`) : null}
                        onAddSet={() => openAddSet(ex.id)}
                        onCopyLastSet={() => handleCopyLast(ex.id)}
                        onEditSet={openEditSet}
                        onDeleteSet={handleQuickDeleteSet}
                        onRemoveExercise={() => handleRemoveExercise(ex.id)}
                        onUpdateNote={(note) => handleUpdateNote(ex.id, note)}
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

        <div className="mt-8">
            <label className="block text-sm font-bold text-gray-700 mb-2">Workout Note</label>
            <textarea
              value={sessionNote}
              onChange={(e) => setSessionNote(e.target.value)}
              placeholder="How was your workout today?"
              className="w-full h-32 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-base"
            />
        </div>
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
        initialUnit={editingSet.mode === 'create' ? editingSet.defaults?.unit : editingSet.set?.unit}
        initialDuration={editingSet.mode === 'create' ? editingSet.defaults?.duration : editingSet.set?.duration}
        exerciseType={editingSet.mode === 'create' ? (exercises[editingSet.defaults?.exerciseId || '']?.type) : (exercises[editingSet.set?.exerciseId || '']?.type)}
        onSave={handleSaveSet}
        onDelete={handleDeleteSet}
      />
    </div>
  );
};
