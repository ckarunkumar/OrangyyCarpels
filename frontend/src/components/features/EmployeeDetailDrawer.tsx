import { useState } from 'react';
import { X, Mail, Phone, MapPin, Pencil, Calendar, Heart, Shield, Users, Globe, Building, Briefcase, Hash, ZoomIn } from 'lucide-react';
import { Employee } from './EmployeeDrawer';

interface EmployeeDetailDrawerProps {
  open: boolean;
  employee: Employee | null;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: (emp: Employee) => void;
}

export default function EmployeeDetailDrawer({ open, employee, isAdmin, onClose, onEdit }: EmployeeDetailDrawerProps) {
  const [zoomOpen, setZoomOpen] = useState(false);

  if (!employee) return null;

  return (
    <>
      {/* Zoomed Profile Photo Modal */}
      {zoomOpen && (
        <div
          onClick={() => setZoomOpen(false)}
          className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-2xl p-3 shadow-2xl max-w-sm w-full flex flex-col items-center"
          >
            <button
              onClick={() => setZoomOpen(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-studio-text shadow-lg border border-studio-border flex items-center justify-center hover:bg-studio-sidebar transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-64 h-64 rounded-xl overflow-hidden bg-studio-sidebar border border-studio-border flex items-center justify-center">
              {employee.avatar ? (
                <img src={employee.avatar} alt={employee.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-brand-orange/10 text-brand-orange">
                  <span className="text-[64px] font-bold">{employee.fullName[0]}</span>
                </div>
              )}
            </div>
            <div className="text-center mt-3 pb-1">
              <h4 className="text-[15px] font-bold text-studio-text">{employee.fullName}</h4>
              <p className="text-[11px] text-studio-muted mt-0.5">{employee.designation} • {employee.department}</p>
              <p className="text-[10px] font-mono text-studio-muted/80 mt-1">{employee.employeeId}</p>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      <div onClick={onClose} className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      
      {/* Drawer */}
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-[460px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-border shrink-0">
          <div>
            <h3 className="text-[15px] font-bold text-studio-text">Employee Profile</h3>
            <p className="text-[11px] text-studio-muted font-mono">{employee.employeeId}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <button type="button" onClick={() => { onClose(); onEdit(employee); }} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-brand-orange bg-orange-50 border border-brand-orange/30 rounded hover:bg-orange-100 transition-colors">
                <Pencil className="w-3 h-3" /> Edit Profile
              </button>
            )}
            <button type="button" onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center text-studio-muted hover:bg-studio-bg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Header Overview with Click-to-Zoom Avatar */}
          <div className="flex items-center gap-3.5 pb-3.5 border-b border-studio-border">
            <div
              onClick={() => setZoomOpen(true)}
              title="Click to zoom profile picture"
              className="relative group w-12 h-12 rounded-full bg-studio-sidebar flex items-center justify-center text-[16px] font-bold text-studio-muted border border-studio-border shrink-0 shadow-sm overflow-hidden cursor-pointer hover:border-brand-orange transition-all"
            >
              {employee.avatar ? (
                <img src={employee.avatar} alt={employee.fullName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              ) : (
                <span>{employee.fullName[0]}</span>
              )}
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                <ZoomIn className="w-4 h-4" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-bold text-studio-text truncate">{employee.fullName}</h3>
              <p className="text-[11px] text-studio-muted truncate">{employee.designation} • {employee.department}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-studio-sidebar border border-studio-border text-studio-text">{employee.employeeId || `AODE${String(employee.id).padStart(4, '0')}`}</span>
                <span className="text-[9px] font-semibold px-2 py-0.2 rounded-full border bg-orange-50 text-brand-orange border-brand-orange/30">{employee.designation || 'Team Member'}</span>
                <span className={`text-[9px] font-semibold px-2 py-0.2 rounded-full border ${employee.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>{employee.status}</span>
              </div>
            </div>
          </div>

          {/* 1. Profile Details */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold text-studio-text uppercase tracking-wider pb-1 border-b border-studio-border/70">1. Profile Information</h4>
            <div className="grid grid-cols-2 gap-2.5 bg-studio-sidebar/50 border border-studio-border rounded-lg p-3 text-[12px]">
              <div><span className="text-studio-muted text-[10px] uppercase font-bold block">Full Name</span><span className="text-studio-text font-semibold">{employee.fullName}</span></div>
              <div><span className="text-studio-muted text-[10px] uppercase font-bold block">Date of Birth</span><span className="text-studio-text flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3 text-studio-muted" />{employee.dob || '—'}</span></div>
              <div><span className="text-studio-muted text-[10px] uppercase font-bold block">Date of Joining</span><span className="text-studio-text flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3 text-green-600" />{employee.joiningDate || '—'}</span></div>
              <div><span className="text-studio-muted text-[10px] uppercase font-bold block">Date of Relieving</span><span className="text-studio-text flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3 text-red-500" />{employee.relievingDate || '—'}</span></div>
              <div><span className="text-studio-muted text-[10px] uppercase font-bold block">Office Email</span><span className="text-studio-text font-medium truncate flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3 text-brand-blue" />{employee.email}</span></div>
              <div><span className="text-studio-muted text-[10px] uppercase font-bold block">Mobile Number</span><span className="text-studio-text flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3 text-green-600" />{employee.phone}</span></div>
              <div><span className="text-studio-muted text-[10px] uppercase font-bold block">Department</span><span className="text-studio-text flex items-center gap-1 mt-0.5"><Building className="w-3 h-3 text-studio-muted" />{employee.department || '—'}</span></div>
              <div><span className="text-studio-muted text-[10px] uppercase font-bold block">Designation</span><span className="text-studio-text flex items-center gap-1 mt-0.5"><Briefcase className="w-3 h-3 text-studio-muted" />{employee.designation || '—'}</span></div>
              <div className="col-span-2"><span className="text-studio-muted text-[10px] uppercase font-bold block">Location</span><span className="text-studio-text flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3 text-red-500" />{employee.location || '—'}</span></div>
              {employee.linkedInUrl && (
                <div className="col-span-2 pt-1 border-t border-studio-border/60">
                  <span className="text-studio-muted text-[10px] uppercase font-bold block">LinkedIn Profile</span>
                  <a href={employee.linkedInUrl} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline font-medium text-[11px] flex items-center gap-1 mt-0.5 truncate"><Globe className="w-3 h-3 shrink-0" />{employee.linkedInUrl}</a>
                </div>
              )}
            </div>
          </div>

          {/* 2. Personal & Family Details */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold text-studio-text uppercase tracking-wider pb-1 border-b border-studio-border/70">2. Personal & Family</h4>
            <div className="grid grid-cols-2 gap-2.5 bg-studio-sidebar/50 border border-studio-border rounded-lg p-3 text-[12px]">
              <div><span className="text-studio-muted text-[10px] uppercase font-bold block">Father / Guardian</span><span className="text-studio-text font-medium flex items-center gap-1 mt-0.5"><Users className="w-3 h-3 text-studio-muted" />{employee.guardianName || '—'}</span></div>
              <div><span className="text-studio-muted text-[10px] uppercase font-bold block">Mother's Name</span><span className="text-studio-text font-medium flex items-center gap-1 mt-0.5"><Users className="w-3 h-3 text-studio-muted" />{employee.motherName || '—'}</span></div>
              <div><span className="text-studio-muted text-[10px] uppercase font-bold block">Personal Email</span><span className="text-studio-text truncate block mt-0.5">{employee.personalEmail || '—'}</span></div>
              <div><span className="text-studio-muted text-[10px] uppercase font-bold block">Second Phone</span><span className="text-studio-text block mt-0.5">{employee.secondaryPhone || '—'}</span></div>
              <div><span className="text-studio-muted text-[10px] uppercase font-bold block">Blood Group</span><span className="text-brand-orange font-bold flex items-center gap-1 mt-0.5"><Heart className="w-3 h-3 text-brand-orange" />{employee.bloodGroup || '—'}</span></div>
              <div><span className="text-studio-muted text-[10px] uppercase font-bold block">AADHAAR Number</span><span className="text-studio-text font-mono font-medium flex items-center gap-1 mt-0.5"><Shield className="w-3 h-3 text-blue-600" />{employee.aadhaarNumber || '—'}</span></div>
              <div className="col-span-2"><span className="text-studio-muted text-[10px] uppercase font-bold block">PAN Number</span><span className="text-studio-text font-mono font-bold flex items-center gap-1 mt-0.5"><Shield className="w-3 h-3 text-green-600" />{employee.panNumber || '—'}</span></div>
              {employee.permanentAddress && (
                <div className="col-span-2 pt-1 border-t border-studio-border/60">
                  <span className="text-studio-muted text-[10px] uppercase font-bold block">Permanent Address</span>
                  <span className="text-studio-text leading-relaxed whitespace-pre-wrap block mt-0.5">{employee.permanentAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Status & System Details */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold text-studio-text uppercase tracking-wider pb-1 border-b border-studio-border/70">3. Status & Access</h4>
            <div className="grid grid-cols-3 gap-2 bg-studio-sidebar/50 border border-studio-border rounded-lg p-3 text-[12px]">
              <div><span className="text-studio-muted text-[10px] uppercase font-bold block">System Role</span><span className="text-studio-text font-semibold">{employee.role}</span></div>
              <div><span className="text-studio-muted text-[10px] uppercase font-bold block">Active Status</span><span className="text-studio-text font-semibold">{employee.status}</span></div>
              <div><span className="text-studio-muted text-[10px] uppercase font-bold block">Emp ID</span><span className="text-studio-text font-mono flex items-center gap-0.5"><Hash className="w-3 h-3 text-studio-muted" />{employee.employeeId}</span></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
