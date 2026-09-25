import { useState } from 'react';
import { X, Bell, CheckCircle2, RotateCcw, Send, FolderKanban, Clock, Check, ArrowRight, CalendarCheck, Shield } from 'lucide-react';

export interface NotificationItem {
  id: number;
  userId?: number | string | null;
  role?: string | null;
  title: string;
  message: string;
  type: string;
  projectId?: string | null;
  isRead: boolean;
  createdAt: string | Date;
}

interface NotificationDrawerProps {
  open: boolean;
  notifications: NotificationItem[];
  onClose: () => void;
  onSelectNotification: (item: NotificationItem) => void;
  onMarkAllAsRead: () => void;
}

export default function NotificationDrawer({
  open, notifications, onClose, onSelectNotification, onMarkAllAsRead,
}: NotificationDrawerProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (!open) return null;

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'timesheet_submit': return <Send className="w-3.5 h-3.5 text-blue-600" />;
      case 'timesheet_approve': return <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />;
      case 'timesheet_reopen': return <RotateCcw className="w-3.5 h-3.5 text-amber-600" />;
      case 'project_assign': return <FolderKanban className="w-3.5 h-3.5 text-brand-orange" />;
      case 'leave_request': return <CalendarCheck className="w-3.5 h-3.5 text-blue-600" />;
      case 'leave_approve': return <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />;
      case 'leave_reject': return <X className="w-3.5 h-3.5 text-red-600" />;
      case 'leave_cancel': case 'leave_delete': return <RotateCcw className="w-3.5 h-3.5 text-amber-600" />;
      case 'login_activity': return <Shield className="w-3.5 h-3.5 text-purple-600" />;
      default: return <Clock className="w-3.5 h-3.5 text-purple-600" />;
    }
  };

  const formatTime = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recently';
    const diff = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300" />
      <div className="fixed top-0 right-0 z-50 h-full w-full max-w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-studio-border shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand-orange" />
            <h3 className="text-[14px] font-bold text-studio-text">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 bg-brand-orange text-white text-[10px] font-bold rounded-full">{unreadCount}</span>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-studio-bg text-studio-muted hover:text-studio-text transition-colors cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>

        {/* Action Controls & Tabs */}
        <div className="px-4 py-2 bg-studio-sidebar/40 border-b border-studio-border flex items-center justify-between text-[11.5px] shrink-0">
          <div className="flex items-center gap-1">
            <button onClick={() => setFilter('all')} className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${filter === 'all' ? 'bg-white shadow-2xs text-studio-text' : 'text-studio-muted hover:text-studio-text'}`}>All</button>
            <button onClick={() => setFilter('unread')} className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${filter === 'unread' ? 'bg-white shadow-2xs text-brand-orange' : 'text-studio-muted hover:text-studio-text'}`}>Unread ({unreadCount})</button>
          </div>
          {unreadCount > 0 && (
            <button onClick={onMarkAllAsRead} className="text-[11px] font-semibold text-brand-orange hover:opacity-80 flex items-center gap-1 cursor-pointer"><Check className="w-3 h-3" /> Mark all read</button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-studio-border/60">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-studio-muted text-[12px] space-y-1">
              <p className="font-semibold text-studio-text">No notifications</p>
              <p className="text-[11px]">You're all caught up!</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectNotification(item)}
                className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${item.isRead ? 'bg-white hover:bg-studio-hover/40' : 'bg-orange-50/25 hover:bg-orange-50/50'}`}
              >
                <div className="mt-0.5 p-1.5 rounded-full bg-white border border-studio-border shadow-2xs shrink-0">{getIcon(item.type)}</div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className={`text-[12px] leading-tight truncate ${item.isRead ? 'font-medium text-studio-text' : 'font-bold text-studio-text'}`}>{item.title}</h4>
                    <span className="text-[10px] text-studio-muted font-mono shrink-0">{formatTime(item.createdAt)}</span>
                  </div>
                  <p className="text-[11px] text-studio-muted leading-relaxed line-clamp-2">{item.message}</p>
                  {item.projectId && (
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-brand-orange hover:underline pt-0.5">
                      Open Timesheet <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                {!item.isRead && <span className="w-2 h-2 rounded-full bg-brand-orange shrink-0 mt-1.5" />}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
