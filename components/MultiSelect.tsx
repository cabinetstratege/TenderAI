
import React, { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

interface MultiSelectProps {
  label: string;
  placeholder: string;
  value: string; // Comma separated string "A, B, C"
  onChange: (newValue: string) => void;
  suggestions?: string[]; // Optional predefined list
  allowCustom?: boolean; // If true, user can type anything. If false, must pick from suggestions.
}

const MultiSelect: React.FC<MultiSelectProps> = ({ 
    label, 
    placeholder, 
    value, 
    onChange, 
    suggestions = [], 
    allowCustom = true 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedItems = value ? value.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];

  const handleAddItem = (item: string) => {
    if (!item) return;
    const newItem = item.trim();
    if (selectedItems.includes(newItem)) {
        setInputValue('');
        return;
    }
    
    const newItems = [...selectedItems, newItem];
    onChange(newItems.join(', '));
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleRemoveItem = (itemToRemove: string) => {
    const newItems = selectedItems.filter(item => item !== itemToRemove);
    onChange(newItems.join(', '));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (allowCustom && inputValue.trim()) {
            handleAddItem(inputValue);
        }
    }
    if (e.key === 'Backspace' && !inputValue && selectedItems.length > 0) {
        handleRemoveItem(selectedItems[selectedItems.length - 1]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSuggestions = suggestions.filter(s => 
      s.toLowerCase().includes(inputValue.toLowerCase()) && !selectedItems.includes(s)
  );

  return (
    <div className="space-y-2" ref={containerRef}>
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <div className="min-h-[46px] p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent flex flex-wrap gap-2 bg-slate-50 dark:bg-slate-900/30">
        
        {selectedItems.map((item, idx) => (
            <span key={idx} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-100 text-sm px-3 py-1 rounded-full flex items-center gap-1 border border-slate-200 dark:border-slate-700 dark:shadow-none shadow-sm">
                {item}
                <button 
                    onClick={() => handleRemoveItem(item)}
                    className="text-slate-400 hover:text-red-500 rounded-full p-0.5 transition-colors"
                >
                    <X size={14} />
                </button>
            </span>
        ))}

        <div className="relative flex-1 min-w-[120px]">
            <input
                type="text"
                className="w-full h-full p-1 outline-none text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                placeholder={selectedItems.length === 0 ? placeholder : ""}
                value={inputValue}
                onChange={(e) => {
                    setInputValue(e.target.value);
                    setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
            />
            
            {showSuggestions && (inputValue || suggestions.length > 0) && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl dark:shadow-none z-20 max-h-48 overflow-y-auto">
                    {filteredSuggestions.map(suggestion => (
                        <div 
                            key={suggestion}
                            onClick={() => handleAddItem(suggestion)}
                            className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-surfaceHighlight cursor-pointer text-sm text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-border last:border-0"
                        >
                            {suggestion}
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default MultiSelect;
