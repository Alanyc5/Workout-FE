import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface SetEditorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeight?: number;
  initialReps?: number;
  onSave: (weight: number, reps: number) => void;
  onDelete?: () => void;
  mode: 'create' | 'edit';
}

export const SetEditorSheet: React.FC<SetEditorSheetProps> = ({
  isOpen,
  onClose,
  initialWeight = 0,
  initialReps = 0,
  onSave,
  onDelete,
  mode
}) => {
  const [weight, setWeight] = useState(initialWeight);
  const [reps, setReps] = useState(initialReps);

  useEffect(() => {
    if (isOpen) {
      setWeight(initialWeight);
      setReps(initialReps);
    }
  }, [isOpen, initialWeight, initialReps]);

  if (!isOpen) return null;

  const adjustWeight = (delta: number) => {
    setWeight(prev => Math.max(0, prev + delta));
  };

  const adjustReps = (delta: number) => {
    setReps(prev => Math.max(0, prev + delta));
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
          {/* Weight Control */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Weight (kg)</label>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => adjustWeight(-2.5)} 
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
                onClick={() => adjustWeight(2.5)} 
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
              onClick={() => onSave(weight, reps)}
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
