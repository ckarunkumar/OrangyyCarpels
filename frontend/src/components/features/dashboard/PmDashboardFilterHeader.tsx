import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar, X } from 'lucide-react';

interface PmDashboardFilterHeaderProps {
  title: string;
  isDrilldown?: boolean;
  onBackToStudio?: () => void;
  selectedFY: string;
  onChangeFY: (fy: string) => void;
  fromDate: string;
  toDate: string;
  onApplyDateRange: (from: string, to: string) => void;
  onClearDateRange: () => void;
  availableFYs: string[];
}

export default function PmDashboardFilterHeader({
  title,
  selectedFY,
  onChangeFY,
  fromDate,
  toDate,
  onApplyDateRange,
  onClearDateRange,
  availableFYs,
}: PmDashboardFilterHeaderProps) {
  const [isOpenDatePopup, setIsOpenDatePopup] = useState(false);
  const [tempFrom, setTempFrom] = useState(fromDate);
  const [tempTo, setTempTo] = useState(toDate);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempFrom(fromDate);
    setTempTo(toDate);
  }, [fromDate, toDate]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setIsOpenDatePopup(false);
      }
    }
    if (isOpenDatePopup) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpenDatePopup]);

  const formatDateDisplay = (isoStr?: string) => {
    if (!isoStr) return '';
    const [y, m, d] = isoStr.split('-');
    return `${d}-${m}-${y}`;
  };

  const hasRange = Boolean(fromDate && toDate);
  const dateRangeLabel = hasRange
    ? `${formatDateDisplay(fromDate)} - ${formatDateDisplay(toDate)}`
    : 'From Date - To Date';

  return (
    <div className="space-y-3">
      {/* Main Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900">{title}</h1>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <div className="relative">
            <select
              value={selectedFY}
              onChange={(e) => onChangeFY(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-lg px-3.5 py-1.5 pr-8 text-[12.5px] text-slate-700 font-normal shadow-xs hover:border-slate-300 focus:outline-none cursor-pointer"
            >
              {availableFYs.map((fy) => (<option key={fy} value={fy}>{fy}</option>))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative" ref={popupRef}>
            <button
              type="button"
              onClick={() => setIsOpenDatePopup(!isOpenDatePopup)}
              className={`flex items-center gap-2 bg-white border rounded-lg px-3.5 py-1.5 text-[12.5px] shadow-xs transition-colors cursor-pointer ${
                hasRange ? 'border-orange-500 text-orange-600 font-medium' : 'border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-orange-500" />
              <span>{dateRangeLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isOpenDatePopup && (
              <div className="absolute right-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-4 z-50 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-[12px] font-semibold text-slate-800">Select Date Range</span>
                  {hasRange && (
                    <button
                      type="button"
                      onClick={() => { onClearDateRange(); setIsOpenDatePopup(false); }}
                      className="text-[11px] text-slate-400 hover:text-red-500 flex items-center gap-0.5"
                    >
                      <X className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                <div className="space-y-2 text-[12px]">
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-0.5">From Date</label>
                    <input type="date" value={tempFrom} onChange={(e) => setTempFrom(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-0.5">To Date</label>
                    <input type="date" value={tempTo} onChange={(e) => setTempTo(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-orange-500" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setIsOpenDatePopup(false)} className="px-3 py-1 text-[11.5px] text-slate-600 hover:text-slate-800">Cancel</button>
                  <button
                    type="button"
                    onClick={() => { if (tempFrom && tempTo) { onApplyDateRange(tempFrom, tempTo); setIsOpenDatePopup(false); } }}
                    disabled={!tempFrom || !tempTo}
                    className="px-3 py-1 bg-orange-500 text-white rounded-lg text-[11.5px] font-medium hover:bg-orange-600 disabled:opacity-40"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
