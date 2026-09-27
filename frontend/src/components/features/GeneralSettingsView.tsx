import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck, Plus } from 'lucide-react';
import Breadcrumbs from '../ui/Breadcrumbs';
import StudioIdentityForm from './StudioIdentityForm';
import ConfigurationsView from './ConfigurationsView';
import BusinessLineManager from './BusinessLineManager';
import LeaveSettingsView from './LeaveSettingsView';
import SystemLogsView from './SystemLogsView';

export default function GeneralSettingsView() {
  const location = useLocation();
  const isConfigurations = location.pathname === '/settings/configurations' || location.pathname === '/settings/config';
  const isServices = location.pathname === '/settings/services' || location.pathname === '/settings/bl-sl';
  const isLeaves = location.pathname === '/settings/leaves';
  const isLogs = location.pathname === '/settings/logs';
  const [triggerAddBL, setTriggerAddBL] = useState(false);

  const getTitle = () => {
    if (isLogs) return 'System Logs';
    if (isLeaves) return 'Leave & Holiday Settings';
    if (isServices) return 'Services';
    if (isConfigurations) return 'Configurations';
    return 'Studio Settings';
  };

  const getBreadcrumbLabel = () => {
    if (isLogs) return 'Logs';
    if (isLeaves) return 'Leaves';
    if (isServices) return 'Services';
    if (isConfigurations) return 'Configurations';
    return 'Studio';
  };

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-200">
      <Breadcrumbs
        items={[
          { label: 'General Settings' },
          { label: getBreadcrumbLabel() },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-studio-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] font-bold tracking-tight text-studio-text">{getTitle()}</h2>
            <span className="px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-brand-orange text-[10px] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Super Admin
            </span>
          </div>
        </div>

        {isServices && (
          <button
            type="button"
            onClick={() => setTriggerAddBL(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-orange text-white rounded-lg text-[12.5px] font-semibold hover:bg-opacity-90 transition-colors shadow-sm cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Business Line
          </button>
        )}
      </div>

      {/* Page Content */}
      <div className="pt-1 w-full">
        {isLogs ? (
          <SystemLogsView />
        ) : isLeaves ? (
          <LeaveSettingsView />
        ) : isServices ? (
          <BusinessLineManager addingBL={triggerAddBL} onAddingBLChange={setTriggerAddBL} />
        ) : isConfigurations ? (
          <ConfigurationsView />
        ) : (
          <StudioIdentityForm />
        )}
      </div>
    </div>
  );
}
