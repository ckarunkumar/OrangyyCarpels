import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { getCurrentMonthIso } from '../../utils/dateUtils';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

interface MonthYearPickerProps {
  value: string; // 'YYYY-MM' e.g. '2026-09'
  onChange: (value: string) => void;
  className?: string;
  minMonth?: string; // e.g. '2026-04'
  maxMonth?: string; // e.g. '2026-10'
}

export default function MonthYearPicker({ value, onChange, className = '', minMonth, maxMonth }: MonthYearPickerProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Parse YYYY-MM
  const fallback = getCurrentMonthIso();
  const parts = (value || fallback).split('-');
  const selectedYear = parseInt(parts[0], 10) || new Date().getFullYear();
  const selectedMonth = parseInt(parts[1], 10) || (new Date().getMonth() + 1);

  const [viewYear, setViewYear] = useState(selectedYear);

  useEffect(() => {
    const p = (value || '').split('-');
    const y = parseInt(p[0], 10);
    if (y) setViewYear(y);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Calculate prev/next month strings
  let prevM = selectedMonth - 1;
  let prevY = selectedYear;
  if (prevM < 1) { prevM = 12; prevY -= 1; }
  const prevIso = `${prevY}-${String(prevM).padStart(2, '0')}`;
  const isPrevDisabled = !!(minMonth && prevIso < minMonth);

  let nextM = selectedMonth + 1;
  let nextY = selectedYear;
  if (nextM > 12) { nextM = 1; nextY += 1; }
  const nextIso = `${nextY}-${String(nextM).padStart(2, '0')}`;
  const isNextDisabled = !!(maxMonth && nextIso > maxMonth);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPrevDisabled) return;
    onChange(prevIso);
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isNextDisabled) return;
    onChange(nextIso);
  };

  const handleSelectMonth = (monthIndex: number) => {
    const m = monthIndex + 1;
    const iso = `${viewYear}-${String(m).padStart(2, '0')}`;
    if (minMonth && iso < minMonth) return;
    if (maxMonth && iso > maxMonth) return;
    onChange(iso);
    setOpen(false);
  };

  const currentNowIso = getCurrentMonthIso();
  const isCurrentMonthDisabled = (minMonth && currentNowIso < minMonth) || (maxMonth && currentNowIso > maxMonth);

  const handleJumpToCurrent = () => {
    if (isCurrentMonthDisabled) return;
    const now = new Date();
    onChange(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    setViewYear(now.getFullYear());
    setOpen(false);
  };

  const minYear = minMonth ? parseInt(minMonth.split('-')[0], 10) : undefined;
  const maxYear = maxMonth ? parseInt(maxMonth.split('-')[0], 10) : undefined;
  const isPrevYearDisabled = minYear !== undefined && viewYear <= minYear;
  const isNextYearDisabled = maxYear !== undefined && viewYear >= maxYear;

  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();

  return (
    <div ref={popoverRef} className={`relative inline-block ${className}`}>
      {/* Control Pill */}
      <div className="flex items-center bg-white border border-studio-border hover:border-brand-orange/50 rounded-lg shadow-2xs transition-all overflow-hidden">
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={isPrevDisabled}
          title="Previous Month"
          className={`px-2 py-1.5 border-r border-studio-border/60 transition-colors ${
            isPrevDisabled
              ? 'opacity-30 cursor-not-allowed text-studio-muted bg-gray-50'
              : 'hover:bg-studio-sidebar text-studio-muted hover:text-studio-text cursor-pointer'
          }`}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-studio-text hover:bg-studio-sidebar/50 transition-colors cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5 text-brand-orange shrink-0" />
          <span>{MONTH_NAMES[selectedMonth - 1] || 'Select'} {selectedYear}</span>
          <ChevronDown className={`w-3 h-3 text-studio-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>

        <button
          type="button"
          onClick={handleNextMonth}
          disabled={isNextDisabled}
          title="Next Month"
          className={`px-2 py-1.5 border-l border-studio-border/60 transition-colors ${
            isNextDisabled
              ? 'opacity-30 cursor-not-allowed text-studio-muted bg-gray-50'
              : 'hover:bg-studio-sidebar text-studio-muted hover:text-studio-text cursor-pointer'
          }`}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Modern Popover */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-64 bg-white border border-studio-border rounded-xl shadow-xl p-3 animate-in fade-in slide-in-from-top-1">
          {/* Year Navigation */}
          <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-studio-border">
            <button
              type="button"
              disabled={isPrevYearDisabled}
              onClick={() => setViewYear((y) => y - 1)}
              className={`p-1 rounded-md transition-colors ${
                isPrevYearDisabled ? 'opacity-30 cursor-not-allowed text-studio-muted' : 'hover:bg-studio-sidebar text-studio-muted hover:text-studio-text cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-[13px] text-studio-text tracking-wide">{viewYear}</span>
            <button
              type="button"
              disabled={isNextYearDisabled}
              onClick={() => setViewYear((y) => y + 1)}
              className={`p-1 rounded-md transition-colors ${
                isNextYearDisabled ? 'opacity-30 cursor-not-allowed text-studio-muted' : 'hover:bg-studio-sidebar text-studio-muted hover:text-studio-text cursor-pointer'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 12 Months Grid */}
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {MONTH_NAMES.map((name, idx) => {
              const iso = `${viewYear}-${String(idx + 1).padStart(2, '0')}`;
              const isDisabled = (minMonth && iso < minMonth) || (maxMonth && iso > maxMonth);
              const isSelected = selectedYear === viewYear && selectedMonth === (idx + 1);
              const isCurrent = currentYear === viewYear && currentMonthIdx === idx;
              return (
                <button
                  key={name}
                  type="button"
                  disabled={!!isDisabled}
                  onClick={() => handleSelectMonth(idx)}
                  className={`py-1.5 text-[11.5px] font-semibold rounded-md transition-all relative ${
                    isDisabled
                      ? 'opacity-30 cursor-not-allowed text-studio-muted bg-gray-50'
                      : isSelected
                      ? 'bg-brand-orange text-white shadow-xs cursor-pointer'
                      : isCurrent
                      ? 'bg-orange-50 text-brand-orange border border-brand-orange/30 hover:bg-brand-orange hover:text-white cursor-pointer'
                      : 'text-studio-text hover:bg-studio-sidebar hover:text-brand-orange cursor-pointer'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>

          {/* Quick Actions Footer */}
          <div className="pt-2 border-t border-studio-border flex items-center justify-between text-[11px]">
            <button
              type="button"
              disabled={!!isCurrentMonthDisabled}
              onClick={handleJumpToCurrent}
              className={`font-semibold text-brand-orange ${
                isCurrentMonthDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:underline cursor-pointer'
              }`}
            >
              Current Month
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-studio-muted hover:text-studio-text font-medium cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
