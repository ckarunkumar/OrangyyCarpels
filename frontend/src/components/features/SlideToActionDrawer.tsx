import { useState, useRef, useEffect } from 'react';
import { X, ChevronRight, CheckCircle2, Lock, RotateCcw } from 'lucide-react';
import { ProjectTimesheetItem } from './TimesheetsView';

export type TimesheetActionType = 'Submit' | 'Approve' | 'Lock' | 'ReOpen';

interface SlideToActionDrawerProps {
  open: boolean;
  actionType: TimesheetActionType;
  project: ProjectTimesheetItem;
  month: string;
  totalHours: number;
  billableHours: number;
  isPM?: boolean;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function SlideToActionDrawer({
  open, actionType, project, month, totalHours, billableHours, isPM, submitting, onClose, onConfirm,
}: SlideToActionDrawerProps) {
  const [sliderPos, setSliderPos] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const maxDrag = useRef(0);

  useEffect(() => {
    if (open) {
      setSliderPos(0);
      setIsDragging(false);
      setIsCompleted(false);
    }
  }, [open]);

  const handleStart = () => {
    if (submitting || isCompleted) return;
    if (trackRef.current) maxDrag.current = trackRef.current.clientWidth - 42;
    setIsDragging(true);
  };

  const triggerConfirm = () => {
    if (submitting || isCompleted) return;
    setIsDragging(false);
    setIsCompleted(true);
    if (trackRef.current) {
      maxDrag.current = trackRef.current.clientWidth - 42;
      setSliderPos(maxDrag.current);
    }
    onConfirm();
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !trackRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const rect = trackRef.current.getBoundingClientRect();
      let pos = clientX - rect.left - 18;
      if (pos < 0) pos = 0;
      if (pos > maxDrag.current) pos = maxDrag.current;
      setSliderPos(pos);

      if (maxDrag.current > 0 && pos >= maxDrag.current * 0.70) {
        triggerConfirm();
      }
    };

    const handleEnd = () => {
      if (!isDragging) return;
      setIsDragging(false);
      if (!isCompleted) setSliderPos(0);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, isCompleted, onConfirm]);

  if (!open) return null;

  const dragPercent = maxDrag.current > 0 ? Math.min(100, Math.round((sliderPos / maxDrag.current) * 100)) : 0;

  const config = {
    Submit: {
      title: 'Submit Timesheet',
      notice: 'Submitting will lock this sheet for review by your Project Manager.',
      noticeIcon: Lock,
      noticeBg: 'bg-amber-50 border-amber-200 text-amber-900',
      sliderText: 'Slide to Submit',
      btnColor: 'bg-brand-orange',
      dragGlow: 'bg-brand-orange/15',
    },
    Approve: {
      title: isPM ? 'Approve & Send to Super Admin' : 'Approve Timesheet',
      notice: isPM ? 'Approving will advance this timesheet to Super Admin for final review & locking.' : 'Advance timesheet for billing & payroll processing.',
      noticeIcon: CheckCircle2,
      noticeBg: 'bg-purple-50 border-purple-200 text-purple-900',
      sliderText: 'Slide to Approve',
      btnColor: 'bg-purple-600',
      dragGlow: 'bg-purple-600/15',
    },
    Lock: {
      title: 'Final Review & Lock',
      notice: 'Locking will finalize all hours. Only Super Admin can unlock or make further edits.',
      noticeIcon: Lock,
      noticeBg: 'bg-green-50 border-green-200 text-green-900',
      sliderText: 'Slide to Lock',
      btnColor: 'bg-green-600',
      dragGlow: 'bg-green-600/15',
    },
    ReOpen: {
      title: 'ReOpen Timesheet',
      notice: 'ReOpening will reset this timesheet back to Draft, returning it for rework.',
      noticeIcon: RotateCcw,
      noticeBg: 'bg-amber-50 border-amber-200 text-amber-900',
      sliderText: 'Slide to ReOpen',
      btnColor: 'bg-amber-600',
      dragGlow: 'bg-amber-600/15',
    },
  }[actionType];

  const NoticeIcon = config.noticeIcon;

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-[340px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-studio-border shrink-0">
          <div>
            <h3 className="text-[14px] font-bold text-studio-text">{config.title}</h3>
            <p className="text-[11px] text-studio-muted mt-0.5 truncate">{project.projectName} • {month}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-studio-bg text-studio-muted hover:text-studio-text transition-colors cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3 text-[12px]">
          <div className={`p-2.5 border rounded text-[11px] flex items-start gap-1.5 leading-snug ${config.noticeBg}`}>
            <NoticeIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{config.notice}</span>
          </div>

          <div className="border border-studio-border rounded-lg p-3 bg-studio-sidebar/20 space-y-2">
            <div className="text-[10px] font-bold text-studio-muted uppercase tracking-wider">Summary</div>
            <div className="flex justify-between py-0.5 border-b border-studio-border/40 text-[11.5px]">
              <span className="text-studio-muted">Client:</span>
              <span className="font-semibold text-studio-text truncate max-w-[170px]">{project.client}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-studio-border/40 text-[11.5px]">
              <span className="text-studio-muted">Billable Time:</span>
              <span className="font-mono font-bold text-blue-600">{billableHours} hrs</span>
            </div>
            <div className="flex justify-between py-0.5 text-[12px]">
              <span className="font-semibold text-studio-text">Total Hours:</span>
              <span className="font-mono font-bold text-brand-orange text-[14px]">{totalHours} hrs</span>
            </div>
          </div>
        </div>

        <div className="shrink-0 px-4 py-3.5 border-t border-studio-border bg-studio-sidebar/30 space-y-2.5">
          <div ref={trackRef} onClick={triggerConfirm} className="relative h-11 bg-white rounded-full p-0.5 flex items-center select-none overflow-hidden border border-studio-border shadow-2xs cursor-pointer">
            <div className={`absolute left-0 top-0 bottom-0 rounded-full transition-all ${config.dragGlow}`} style={{ width: `${Math.max(sliderPos + 38, 38)}px` }} />
            <span className="w-full text-center text-[11px] font-bold tracking-wide text-studio-text select-none pointer-events-none" style={{ opacity: Math.max(0.1, 1 - dragPercent / 75) }}>
              {submitting ? 'Processing...' : isCompleted ? 'Confirmed' : config.sliderText}
            </span>
            <div
              onMouseDown={handleStart} onTouchStart={handleStart}
              style={{ transform: `translateX(${sliderPos}px)` }}
              className={`absolute left-1 top-1 bottom-1 w-9 h-9 ${config.btnColor} text-white rounded-full flex items-center justify-center shadow-xs cursor-grab active:cursor-grabbing transition-transform duration-75 ease-out ${isDragging ? 'scale-105 shadow-md' : ''}`}
            >
              {submitting || isCompleted ? <CheckCircle2 className="w-4 h-4 animate-pulse" /> : <ChevronRight className="w-4 h-4 stroke-[2.5]" />}
            </div>
          </div>
          <div className="flex justify-center">
            <button type="button" onClick={onClose} disabled={submitting} className="text-[11px] font-semibold text-studio-muted hover:text-studio-text transition-colors py-0.5 px-3 cursor-pointer">Cancel</button>
          </div>
        </div>
      </div>
    </>
  );
}
