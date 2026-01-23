import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useWorkoutStore } from '../lib/store';

interface SetEditorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeight?: number;
  initialReps?: number;
  initialUnit?: 'kg' | 'lb';
  initialDuration?: number | null;
  exerciseType?: 'strength' | 'cardio';
  onSave: (data: { weight: number; reps: number; unit: 'kg' | 'lb'; duration: number | null }) => void;
  onDelete?: () => void;
  mode: 'create' | 'edit';
}

export const SetEditorSheet: React.FC<SetEditorSheetProps> = ({
  isOpen,
  onClose,
  initialWeight = 0,
  initialReps = 0,
  initialUnit,
  initialDuration = 0,
  exerciseType = 'strength',
  onSave,
  onDelete,
  mode
}) => {
  const globalUnit = useWorkoutStore(state => state.unit);
  const setGlobalUnit = useWorkoutStore(state => state.setUnit);

  const [weight, setWeight] = useState(initialWeight);
  const [reps, setReps] = useState(initialReps);
  const [unit, setUnit] = useState<'kg' | 'lb'>(initialUnit || globalUnit);
  const [duration, setDuration] = useState(initialDuration || 0);

  useEffect(() => {
    if (isOpen) {
      setWeight(initialWeight);
      setReps(initialReps);
      setUnit(initialUnit || globalUnit);
      setDuration(initialDuration || 0);
    }
  }, [isOpen, initialWeight, initialReps, initialUnit, initialDuration, globalUnit]);

  if (!isOpen) return null;

  const isCardio = exerciseType === 'cardio';

  const adjustWeight = (delta: number) => {
    setWeight(prev => Math.max(0, prev + delta));
  };

  const adjustReps = (delta: number) => {
    setReps(prev => Math.max(0, prev + delta));
  };

  const adjustDuration = (delta: number) => {
    setDuration(prev => Math.max(0, prev + delta));
  };

  const handleUnitToggle = (newUnit: 'kg' | 'lb') => {
    setUnit(newUnit);
    setGlobalUnit(newUnit);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-xl sm:rounded-xl p-6 shadow-xl animate-in slide-in-from-bottom-10 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{mode === 'create' ? 'Add Set' : 'Edit Set'}</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {isCardio ? (
            /* Duration Control for Cardio */
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Duration (min)</label>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => adjustDuration(-10)} 
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 text-gray-600"
                >
                  <Minus size={24} />
                </button>
                <div className="flex-1 text-center">
                  <input 
                    type="number" 
                    value={duration} 
                    onChange={(e) => setDuration(parseInt(e.target.value) || 0)} 
                    className="w-full text-center text-4xl font-bold text-gray-800 bg-transparent focus:outline-none"
                  />
                </div>
                <button 
                  onClick={() => adjustDuration(10)} 
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 text-gray-600"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Unit Toggle */}
              <div className="flex justify-center mb-4">
                <div className="bg-gray-100 p-1 rounded-lg flex">
                  <button 
                    onClick={() => handleUnitToggle('kg')}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-sm font-bold transition-all",
                      unit === 'kg' ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"
                    )}
                  >
                    KG
                  </button>
                  <button 
                    onClick={() => handleUnitToggle('lb')}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-sm font-bold transition-all",
                      unit === 'lb' ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"
                    )}
                  >
                    LB
                  </button>
                </div>
              </div>

              {/* Weight Control */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Weight ({unit})</label>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => adjustWeight(unit === 'kg' ? -2.5 : -5)} 
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 text-gray-600"
                  >
                    <Minus size={24} />
                  </button>
                  <div className="flex-1 text-center">
                    <input 
                      type="number" 
                      value={weight} 
                      onChange={(e) => setWeight(parseFloat(e.target.value) || 0)} 
                      className="w-full text-center text-4xl font-bold text-gray-800 bg-transparent focus:outline-none"
                      step="0.5"
                    />
                  </div>
                  <button 
                    onClick={() => adjustWeight(unit === 'kg' ? 2.5 : 5)} 
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 text-gray-600"
                  >
                    <Plus size={24} />
                  </button>
                </div>
              </div>

              {/* Reps Control */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Reps</label>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => adjustReps(-1)} 
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 text-gray-600"
                  >
                    <Minus size={24} />
                  </button>
                  <div className="flex-1 text-center">
                    <input 
                      type="number" 
                      value={reps} 
                      onChange={(e) => setReps(parseInt(e.target.value) || 0)} 
                      className="w-full text-center text-4xl font-bold text-gray-800 bg-transparent focus:outline-none"
                    />
                  </div>
                  <button 
                    onClick={() => adjustReps(1)} 
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 text-gray-600"
                  >
                    <Plus size={24} />
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            {mode === 'edit' && onDelete && (
              <button 
                onClick={onDelete}
                className="flex-none px-4 py-3 bg-red-50 text-red-600 rounded-lg font-bold flex items-center justify-center active:bg-red-100"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button 
              onClick={() => onSave({ weight, reps, unit, duration: isCardio ? duration : null })}
              className={cn(
                "flex-1 py-3 bg-primary text-white rounded-lg font-bold text-lg shadow-md active:opacity-90",
                mode === 'edit' ? "ml-0" : ""
              )}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
