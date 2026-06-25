import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, SlidersHorizontal, Search } from 'lucide-react';

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
    <div className={`relative inline-block text-left ${className} ${isOpen ? 'z-9999' : ''}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-1 px-3 py-1.5 bg-white border rounded-lg text-sm text-[#18181B] shadow-xs hover:bg-[#FAFAFA] transition-all cursor-pointer focus:outline-none ${
          isOpen ? 'border-[#DC2626] text-[#DC2626] ring-1/2 ring-[#DC2626]/20' : 'border-[#E4E4E7]'
        }`}
      >
        <span>{currentOption?.label ?? value}</span>
        <ChevronDown size={14} className={`text-[#A1A1AA] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 min-w-[80px] w-full bg-[#FFFFFF] rounded-xl shadow-lg shadow-black/5 overflow-hidden z-50 border border-[#E4E4E7] animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="py-1 max-h-48 overflow-y-auto">
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
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
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
  className?: string;
  label?: string;
  allLabel?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

export function CustomMultiSelect({
  selectedValues,
  onChange,
  options,
  className = "",
  label = "Filter",
  allLabel = "All Categories",
  icon: Icon = SlidersHorizontal,
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

  const triggerText = selectedValues.length > 0 ? `${label} (${selectedValues.length})` : label;

  return (
    <div className={`relative inline-block text-left ${className} ${isOpen ? 'z-9999' : ''}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 bg-white border rounded-lg text-sm text-[#52525B] shadow-xs hover:bg-[#FAFAFA] transition-all cursor-pointer focus:outline-none ${
          isOpen ? 'border-[#DC2626] text-[#DC2626] ring-1/2 ring-[#DC2626]/20' : 'border-[#E4E4E7]'
        }`}
      >
        <Icon size={12} className={isOpen ? 'text-[#DC2626]' : 'text-[#71717A]'} />
        <span className={`font-bold transition-colors ${isOpen ? 'text-[#DC2626]' : 'text-[#18181B]'}`}>{triggerText}</span>
        <ChevronDown size={14} className={`text-[#A1A1AA] transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#DC2626]' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-56 bg-[#FFFFFF] rounded-xl shadow-lg shadow-black/5 overflow-hidden z-50 border border-[#E4E4E7] animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="py-1 max-h-48 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                if (selectedValues.length === options.length) {
                  handleClearAll();
                } else {
                  handleCheckAll();
                }
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors text-left border-b border-[#E4E4E7]/50 mb-1"
            >
              <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center transition-all ${
                selectedValues.length === options.length && options.length > 0
                  ? 'bg-[#DC2626] border-[#DC2626] text-white shadow-xs'
                  : 'border-[#E4E4E7] bg-white'
              }`}>
                {selectedValues.length === options.length && options.length > 0 && <Check size={10} strokeWidth={4} />}
              </div>
              <span className="truncate font-bold">{allLabel}</span>
            </button>

            {options.map((opt) => {
              const isChecked = selectedValues.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleToggle(opt)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors text-left"
                >
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

interface SearchableSelectProps<T> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; badgeText?: string; badgeColor?: string }[];
  className?: string;
  placeholder?: string;
  searchPlaceholder?: string;
}

export function SearchableSelect<T extends string | number>({
  value,
  onChange,
  options,
  className = "w-full",
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
}: SearchableSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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
  const filteredOptions = options.filter(opt => 
    String(opt.label).toLowerCase().includes(searchTerm.toLowerCase()) || 
    (opt.badgeText && opt.badgeText.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={`relative inline-block text-left ${className} ${isOpen ? 'z-9999' : ''}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-1 px-3 py-2.5 bg-white border rounded-lg text-xs font-mono text-[#18181B] hover:bg-[#FAFAFA] transition-all cursor-pointer focus:outline-none ${
          isOpen ? 'border-[#DC2626] ring-1/2 ring-[#DC2626]/20' : 'border-[#E4E4E7]'
        }`}
      >
        <span className={`flex items-center gap-2 ${!currentOption ? "text-[#A1A1AA]" : "truncate"}`}>
          <span className="truncate">{currentOption ? currentOption.label : placeholder}</span>
          {currentOption?.badgeText && (
            <span className={`shrink-0 ${currentOption.badgeColor || ''}`}>{currentOption.badgeText}</span>
          )}
        </span>
        <ChevronDown size={14} className={`text-[#A1A1AA] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} shrink-0`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-full bg-[#FFFFFF] rounded-xl shadow-lg shadow-black/5 overflow-hidden z-50 border border-[#E4E4E7] animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-2 border-b border-[#E4E4E7]">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
               <input
                 type="text"
                 autoFocus
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder={searchPlaceholder}
                 className="w-full pl-7 pr-3 py-1.5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg text-xs font-mono text-[#18181B] focus:outline-none focus:border-[#DC2626] transition-all"
               />
            </div>
          </div>
          <div className="py-1 max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-left transition-colors ${
                      isSelected ? 'bg-[#FEF2F2] font-bold' : 'hover:bg-[#F4F4F5]'
                    } ${isSelected ? 'text-[#DC2626]' : 'text-[#52525B] hover:text-[#18181B]'}`}
                  >
                    <span className="truncate flex items-center gap-2">
                      <span className="truncate">{opt.label}</span>
                      {opt.badgeText && (
                        <span className={`shrink-0 ${opt.badgeColor || ''}`}>{opt.badgeText}</span>
                      )}
                    </span>
                    {isSelected && <Check size={12} className="text-[#DC2626] shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center text-xs font-mono text-[#A1A1AA]">
                No results found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface CategoryDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
  placeholder?: string;
  allowCustom?: boolean;
}

export function CategoryDropdown({
  value,
  onChange,
  options,
  className = "w-full",
  placeholder = "Select category...",
  allowCustom = true
}: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showCustomOption = allowCustom && searchTerm && !options.includes(searchTerm);

  return (
    <div className={`relative inline-block text-left ${className} ${isOpen ? 'z-9999' : ''}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-1 px-3 py-2.5 bg-white border rounded-lg text-xs font-mono text-[#18181B] hover:bg-[#FAFAFA] transition-all cursor-pointer focus:outline-none ${
          isOpen ? 'border-[#DC2626] ring-1/2 ring-[#DC2626]/20' : 'border-[#E4E4E7]'
        }`}
      >
        <span className={`flex-1 text-left truncate ${!value ? "text-[#A1A1AA]" : ""}`}>
          {value || placeholder}
        </span>
        <ChevronDown size={14} className={`text-[#A1A1AA] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} shrink-0`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-full bg-[#FFFFFF] rounded-xl shadow-lg shadow-black/5 overflow-hidden z-50 border border-[#E4E4E7] animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-2 border-b border-[#E4E4E7]">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder=""
                 className="w-full pl-7 pr-3 py-1.5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg text-xs font-mono text-[#18181B] focus:outline-none focus:border-[#DC2626] transition-all"
               />
             </div>
           </div>
           <div className="py-1 max-h-48 overflow-y-auto">
             {filteredOptions.length > 0 ? (
               filteredOptions.map((opt) => {
                 const isSelected = opt === value;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-left transition-colors ${
                      isSelected ? 'bg-[#FEF2F2] font-bold text-[#DC2626]' : 'hover:bg-[#F4F4F5] text-[#52525B] hover:text-[#18181B]'
                    }`}
                  >
                    <span className="truncate">{opt}</span>
                    {isSelected && <Check size={12} className="text-[#DC2626] shrink-0" />}
                  </button>
                );
              })
            ) : showCustomOption ? (
              <button
                type="button"
                onClick={() => {
                  onChange(searchTerm);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-xs font-mono text-left text-[#10B981] hover:bg-[#F0FDF4] transition-colors"
              >
                + Add "{searchTerm}"
              </button>
            ) : (
              <div className="px-3 py-4 text-center text-xs font-mono text-[#A1A1AA]">
                No categories found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}