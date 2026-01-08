import React, { useState, useEffect } from 'react';
import { Search, Plus, Clock, ChevronRight, ArrowLeft, Languages } from 'lucide-react';
import { api } from '../lib/api';
import { Exercise } from '../lib/types';

// --- Data Definitions ---

type Lang = 'tw' | 'en';

interface PresetItem {
  en: string;
  tw: string;
}

const PRESET_CATEGORIES: Record<string, PresetItem> = {
  Chest: { en: 'Chest', tw: '胸部' },
  Back: { en: 'Back', tw: '背部' },
  Legs: { en: 'Legs', tw: '腿部' },
  Shoulders: { en: 'Shoulders', tw: '肩部' },
  Arms: { en: 'Arms', tw: '手臂' },
};

const PRESETS: Record<string, PresetItem[]> = {
  Chest: [
    { en: 'Barbell Bench Press', tw: '槓鈴臥推' },
    { en: 'Incline Dumbbell Press', tw: '上斜啞鈴臥推' },
    { en: 'Machine Fly', tw: '器械夾胸' },
    { en: 'Push-ups', tw: '伏地挺身' },
  ],
  Back: [
    { en: 'Deadlift', tw: '硬舉' },
    { en: 'Pull-ups', tw: '引體向上' },
    { en: 'Lat Pulldown', tw: '滑輪下拉' },
    { en: 'Seated Row', tw: '坐姿划船' },
    { en: 'Dumbbell Row', tw: '啞鈴划船' },
  ],
  Legs: [
    { en: 'Barbell Squat', tw: '槓鈴深蹲' },
    { en: 'Leg Press', tw: '腿推機' },
    { en: 'Leg Extension', tw: '腿屈伸' },
    { en: 'Bulgarian Split Squat', tw: '保加利亞單腿蹲' },
  ],
  Shoulders: [
    { en: 'Overhead Press', tw: '站姿肩推' },
    { en: 'Dumbbell Shoulder Press', tw: '啞鈴肩推' },
    { en: 'Lateral Raise', tw: '側平舉' },
  ],
  Arms: [
    { en: 'Bicep Curl', tw: '二頭彎舉' },
    { en: 'Tricep Pushdown', tw: '三頭下壓' },
  ]
};

// --- Component ---

interface ExercisePickerProps {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export const ExercisePicker: React.FC<ExercisePickerProps> = ({ onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [dbExercises, setDbExercises] = useState<Exercise[]>([]); // Existing DB exercises
  const [recentExercises, setRecentExercises] = useState<Exercise[]>([]);
  
  // UI State
  const [lang, setLang] = useState<Lang>('tw'); // Default to Chinese first
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    // Load all exercises to check duplicates and show recent
    api.exercise.list().then(data => {
      setDbExercises(data);
      // Backend usually sorts by lastUsedAt, take top 5
      setRecentExercises(data.filter(e => e.lastUsedAt).slice(0, 5));
    });
  }, []);

  // Helper to standardise naming for DB (Always TW (EN))
  // This ensures we don't have duplicates like "A (B)" and "B (A)"
  const getCanonicalName = (item: PresetItem) => {
    return `${item.tw} (${item.en})`;
  };

  // Helper to format name based on lang preference for DISPLAY only
  const formatDisplayName = (item: PresetItem) => {
    return lang === 'tw' 
      ? `${item.tw} (${item.en})` 
      : `${item.en} (${item.tw})`;
  };

  // Logic to handle picking a preset
  const handleSelectPreset = async (item: PresetItem) => {
    const dbName = getCanonicalName(item); // Always search/create using the standard name
    
    // 1. Check if the canonical name exists in DB
    const existing = dbExercises.find(e => e.name === dbName);
    
    if (existing) {
      onSelect(existing);
      return;
    }

    // 2. Extra safety: Check if the "flipped" name exists (legacy data support)
    // In case older data has "Barbell Press (槓鈴臥推)"
    const legacyName = `${item.en} (${item.tw})`;
    const existingLegacy = dbExercises.find(e => e.name === legacyName);
    if (existingLegacy) {
         onSelect(existingLegacy);
         return;
    }
    
    // 3. Create new using the CANONICAL name
    try {
      const newEx = await api.exercise.create(dbName);
      onSelect(newEx);
    } catch (e) {
      alert('Failed to create exercise');
    }
  };

  const handleCreateCustom = async () => {
    if (!query) return;
    try {
      const newEx = await api.exercise.create(query);
      onSelect(newEx);
    } catch (e) {
      alert('Failed to create exercise');
    }
  };

  const toggleLang = () => {
    setLang(prev => prev === 'tw' ? 'en' : 'tw');
  };

  // -- Render Views --

  const renderHeader = () => (
    <div className="p-4 border-b space-y-3">
      <div className="flex justify-between items-center">
         {selectedCategory ? (
            <button onClick={() => setSelectedCategory(null)} className="flex items-center text-primary font-bold gap-1 text-sm">
                <ArrowLeft size={16} />
                Categories
            </button>
         ) : (
             <h2 className="font-bold text-gray-700">Select Exercise</h2>
         )}
         
         <div className="flex items-center gap-3">
            <button onClick={toggleLang} className="p-2 bg-gray-100 rounded-full text-gray-600 active:bg-gray-200">
                <Languages size={18} />
            </button>
            <button onClick={onClose} className="text-gray-500 font-medium text-sm">Cancel</button>
         </div>
      </div>

      <div className="bg-gray-100 rounded-lg flex items-center px-3 py-2">
        <Search size={18} className="text-gray-400" />
        <input
          autoFocus={!selectedCategory}
          className="flex-1 bg-transparent border-none focus:outline-none ml-2 text-gray-800 placeholder:text-gray-400"
          placeholder="Search..."
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            // If user types, we effectively exit category mode visually to show results
            if (e.target.value) setSelectedCategory(null);
          }}
        />
      </div>
    </div>
  );

  const renderSearchResults = () => {
    // Local filtering of DB exercises
    const filteredDb = dbExercises.filter(e => e.name.toLowerCase().includes(query.toLowerCase()));
    
    return (
      <div className="space-y-1">
        {filteredDb.map(ex => (
          <button
            key={ex.id}
            onClick={() => onSelect(ex)}
            className="w-full text-left py-3 px-2 rounded-lg hover:bg-gray-50 border-b border-gray-50 last:border-0"
          >
            <span className="text-gray-800">{ex.name}</span>
          </button>
        ))}

        {!filteredDb.find(e => e.name.toLowerCase() === query.toLowerCase()) && (
            <button
            onClick={handleCreateCustom}
            className="w-full text-left py-3 px-2 rounded-lg bg-primary/5 text-primary flex items-center gap-2 mt-2"
            >
            <Plus size={18} />
            <span className="font-medium">Create "{query}"</span>
            </button>
        )}
      </div>
    );
  };

  const renderCategoryList = () => {
    return (
        <div className="space-y-1">
            {recentExercises.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recent</h3>
                    {recentExercises.map(ex => (
                        <button
                        key={ex.id}
                        onClick={() => onSelect(ex)}
                        className="w-full text-left py-3 px-2 rounded-lg hover:bg-gray-50 flex items-center justify-between group"
                        >
                        <span className="font-medium text-gray-800">{ex.name}</span>
                        <Clock size={14} className="text-gray-300" />
                        </button>
                    ))}
                </div>
            )}

            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Categories</h3>
            {Object.keys(PRESET_CATEGORIES).map(key => {
                const label = lang === 'tw' ? PRESET_CATEGORIES[key].tw : PRESET_CATEGORIES[key].en;
                const subLabel = lang === 'tw' ? PRESET_CATEGORIES[key].en : PRESET_CATEGORIES[key].tw;
                
                return (
                    <button
                        key={key}
                        onClick={() => setSelectedCategory(key)}
                        className="w-full py-4 px-2 flex items-center justify-between border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100"
                    >
                        <div className="flex flex-col items-start">
                            <span className="font-bold text-gray-800 text-lg">{label}</span>
                            <span className="text-xs text-gray-400">{subLabel}</span>
                        </div>
                        <ChevronRight className="text-gray-300" />
                    </button>
                )
            })}
        </div>
    )
  };

  const renderCategoryItems = (categoryKey: string) => {
      const items = PRESETS[categoryKey] || [];
      const catLabel = lang === 'tw' ? PRESET_CATEGORIES[categoryKey].tw : PRESET_CATEGORIES[categoryKey].en;

      return (
          <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 px-2">{catLabel} Exercises</h3>
              <div className="space-y-1">
                  {items.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectPreset(item)}
                        className="w-full text-left py-3 px-3 rounded-xl bg-white border border-gray-100 shadow-sm mb-2 hover:border-primary/50 active:bg-gray-50 transition-colors"
                      >
                          <span className="font-medium text-gray-800 text-base">{formatDisplayName(item)}</span>
                      </button>
                  ))}
              </div>
          </div>
      )
  }

  return (
    <div className="fixed inset-0 z-40 bg-white flex flex-col animate-in slide-in-from-bottom-5 duration-200">
      {renderHeader()}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
        {query ? renderSearchResults() : (
            selectedCategory ? renderCategoryItems(selectedCategory) : renderCategoryList()
        )}
      </div>
    </div>
  );
};
