import React from 'react';
import { Plus, Copy, Trash2 } from 'lucide-react';
import { WorkoutSet, Exercise } from '../lib/types';
import { cn } from '../lib/utils'; // I need to create utils for clsx/tailwind-merge

interface ExerciseCardProps {
  exercise: Exercise;
  sets: WorkoutSet[];
  lastTimeSet?: string | null; // e.g. "40kg x 10"
  onAddSet: () => void;
  onCopyLastSet?: () => void;
  onEditSet: (set: WorkoutSet) => void;
  onDeleteSet?: (setId: string) => void;
  onRemoveExercise?: () => void;
  canCopy: boolean;
  readOnly?: boolean;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  sets,
  lastTimeSet,
  onAddSet,
  onCopyLastSet,
  onEditSet,
  onDeleteSet,
  onRemoveExercise,
  canCopy,
  readOnly
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-800">{exercise.name}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {lastTimeSet ? `Last: ${lastTimeSet}` : 'No record'}
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {sets.map((set) => (
          <div 
            key={set.id}
            onClick={() => !readOnly && onEditSet(set)}
            className={cn(
              "flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg group", 
              !readOnly && "active:bg-gray-100 cursor-pointer"
            )}
          >
            <span className="text-gray-400 font-mono text-sm w-8">#{set.orderInExercise}</span>
            <div className="flex-1 flex justify-center gap-1 font-semibold text-gray-800">
              <span>{set.weight}</span>
              <span className="text-gray-400 text-xs self-center">kg</span>
              <span className="text-gray-400 mx-1">×</span>
              <span>{set.reps}</span>
            </div>
            {!readOnly && onDeleteSet && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSet(set.id);
                }}
                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                aria-label="Delete set"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      {!readOnly && (
      <div className="flex gap-2">
        <button 
          onClick={onAddSet}
          className="flex-1 bg-gray-800 text-white py-2 rounded-lg flex items-center justify-center gap-1 text-sm font-medium active:bg-gray-700"
        >
          <Plus size={16} />
          Add Set
        </button>
        <button 
          onClick={onCopyLastSet}
          disabled={!canCopy}
          className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg flex items-center justify-center gap-1 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed active:bg-gray-200"
        >
          <Copy size={16} />
          Copy Last
        </button>
        {sets.length === 0 && onRemoveExercise && (
           <button 
             onClick={onRemoveExercise}
             className="w-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center active:bg-red-100 border border-red-100"
             aria-label="Remove exercise"
           >
             <Trash2 size={18} />
           </button>
        )}
      </div>
      )}
    </div>
  );
};
