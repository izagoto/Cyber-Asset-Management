import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, SlidersHorizontal } from 'lucide-react';

interface CustomSelectProps<T> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string | number }[];
  className?: string;
}

export function CustomSelect<T extends string | number>({
  value,
  onChange,
  options,
  className = ""
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-1 px-3 py-1.5 bg-white border rounded-lg text-xs font-mono font-bold text-[#18181B] shadow-xs hover:bg-[#FAFAFA] transition-all cursor-pointer focus:outline-none ${
          isOpen ? 'border-[#DC2626] text-[#DC2626] ring-1/2 ring-[#DC2626]/20' : 'border-[#E4E4E7]'
        }`}
      >
        <span>{currentOption?.label ?? value}</span>
        <ChevronDown size={14} className={`text-[#A1A1AA] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 min-w-[80px] w-full bg-[#FFFFFF] rounded-xl shadow-lg shadow-black/5 overflow-hidden z-50 border border-[#E4E4E7] animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="py-1">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-left transition-colors ${
                    isSelected
                      ? 'bg-[#FEF2F2] text-[#DC2626] font-bold'
                      : 'text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#18181B]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check size={12} className="text-[#DC2626]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface CustomMultiSelectProps {
  selectedValues: string[];
  onChange: (values: string[]) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}

export function CustomMultiSelect({
  selectedValues,
  onChange,
  options,
  placeholder = "Select Categories",
  className = ""
}: CustomMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (opt: string) => {
    if (selectedValues.includes(opt)) {
      onChange(selectedValues.filter(val => val !== opt));
    } else {
      onChange([...selectedValues, opt]);
    }
  };

  const handleCheckAll = () => {
    onChange([...options]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  // Determine button text
  let triggerText = placeholder;
  if (selectedValues.length === options.length && options.length > 0) {
    triggerText = "All Categories";
  } else if (selectedValues.length === 0) {
    triggerText = "No Category Selected";
  } else if (selectedValues.length === 1) {
    triggerText = selectedValues[0];
  } else {
    triggerText = `${selectedValues.length} Categories`;
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 bg-white border rounded-lg text-xs font-mono text-[#52525B] shadow-xs hover:bg-[#FAFAFA] transition-all cursor-pointer focus:outline-none ${
          isOpen ? 'border-[#DC2626] text-[#DC2626] ring-1/2 ring-[#DC2626]/20' : 'border-[#E4E4E7]'
        }`}
      >
        <SlidersHorizontal size={12} className={isOpen ? 'text-[#DC2626]' : 'text-[#71717A]'} />
        <span className={`font-bold transition-colors ${isOpen ? 'text-[#DC2626]' : 'text-[#18181B]'}`}>{triggerText}</span>
        <ChevronDown size={14} className={`text-[#A1A1AA] transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#DC2626]' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-56 bg-[#FFFFFF] rounded-xl shadow-lg shadow-black/5 overflow-hidden z-50 border border-[#E4E4E7] animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header Toolbar */}
          <div className="px-3 py-2 bg-[#F4F4F5]/50 border-b border-[#E4E4E7]/50 flex items-center justify-between text-[10px] font-mono">
            <span className="font-bold text-[#71717A]">FILTER</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCheckAll}
                className="text-[#DC2626] hover:underline font-bold cursor-pointer"
              >
                Check All
              </button>
              <span className="text-[#E4E4E7]">|</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[#71717A] hover:text-[#18181B] hover:underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Checklist Area */}
          <div className="py-1 max-h-48 overflow-y-auto">
            {options.map((opt) => {
              const isChecked = selectedValues.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleToggle(opt)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-mono text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors text-left"
                >
                  {/* Custom Checkbox */}
                  <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center transition-all ${
                    isChecked
                      ? 'bg-[#DC2626] border-[#DC2626] text-white shadow-xs'
                      : 'border-[#E4E4E7] bg-white'
                  }`}>
                    {isChecked && <Check size={10} strokeWidth={4} />}
                  </div>
                  <span className="truncate">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
