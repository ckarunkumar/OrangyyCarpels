import { Smartphone, Tablet, Monitor, User, Clock, Globe, MapPin } from 'lucide-react';

export interface LoginLogItem {
  id: number;
  employeeId?: string;
  fullName: string;
  email: string;
  role: string;
  ipAddress: string;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  os: string;
  browser: string;
  deviceType?: string;
  networkInfo?: string | null;
  userAgent?: string;
  loginAt: string;
}

interface RowProps {
  log: LoginLogItem;
  onOpenMap: (log: LoginLogItem) => void;
}

export default function SystemLogsRow({ log, onOpenMap }: RowProps) {
  const d = new Date(log.loginAt);
  const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const isSA = log.role === 'Super Admin';
  const loc = [log.city, log.country].filter(Boolean).join(', ') || 'Local / LAN';

  const getDeviceIcon = (type?: string) => {
    if (type === 'Mobile') return <Smartphone className="w-3.5 h-3.5 text-blue-500" />;
    if (type === 'Tablet') return <Tablet className="w-3.5 h-3.5 text-purple-500" />;
    return <Monitor className="w-3.5 h-3.5 text-slate-500" />;
  };

  return (
    <tr className="hover:bg-studio-hover/40 transition-colors">
      <td className="py-2.5 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isSA ? 'bg-orange-100 text-brand-orange' : 'bg-slate-100 text-slate-700'}`}>
            {log.fullName ? log.fullName[0].toUpperCase() : <User className="w-3 h-3" />}
          </div>
          <div>
            <div className="font-semibold text-studio-text leading-tight">{log.fullName || 'User'}</div>
            <span className={`inline-block text-[9px] px-1 py-0.2 rounded font-medium ${isSA ? 'bg-orange-50 text-brand-orange border border-orange-200' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
              {log.role || 'Employee'}
            </span>
          </div>
        </div>
      </td>
      <td className="py-2.5 px-4 font-mono text-[11px] text-studio-muted whitespace-nowrap">{log.email}</td>
      <td className="py-2.5 px-4 whitespace-nowrap">
        <div className="text-studio-text font-medium leading-tight">{dateStr}</div>
        <div className="text-studio-muted text-[10.5px] font-mono flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{timeStr}</div>
      </td>
      <td className="py-2.5 px-4 whitespace-nowrap">
        <span className="font-mono text-[10.5px] px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-700">{log.ipAddress}</span>
        {log.networkInfo && <div className="text-[10px] text-studio-muted truncate max-w-36">{log.networkInfo}</div>}
      </td>
      <td className="py-2.5 px-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <span className="text-[11.5px] text-studio-text">{loc}</span>
          <button type="button" onClick={() => onOpenMap(log)} className="p-1 rounded hover:bg-orange-50 text-brand-orange transition-colors" title="View map">
            <MapPin className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
      <td className="py-2.5 px-4 whitespace-nowrap">
        <div className="text-[11.5px] text-studio-text font-medium">{log.os || 'Unknown OS'}</div>
        <div className="text-[10.5px] text-studio-muted flex items-center gap-1"><Globe className="w-2.5 h-2.5" />{log.browser || 'Browser'}</div>
      </td>
      <td className="py-2.5 px-4 whitespace-nowrap">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-studio-text px-2 py-0.5 bg-studio-bg rounded-md border border-studio-border">
          {getDeviceIcon(log.deviceType)}
          {log.deviceType || 'Desktop / Web'}
        </span>
      </td>
    </tr>
  );
}
