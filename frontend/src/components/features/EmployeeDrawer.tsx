import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Trash2 } from 'lucide-react';

export interface Employee {
  employeeId: string; id?: string; fullName: string; dob?: string; designation: string; department: string;
  email: string; personalEmail?: string; phone: string; secondaryPhone?: string; permanentAddress?: string;
  guardianName?: string; motherName?: string; bloodGroup?: string; linkedInUrl?: string; aadhaarNumber?: string;
  panNumber?: string; joiningDate?: string; relievingDate?: string; status: 'Active' | 'Inactive';
  role: 'Super Admin' | 'Project Manager' | 'Employee'; location?: string; avatar?: string | null;
  education?: Array<{ degree: string; school: string; year: string }>;
  experience?: Array<{ company: string; role: string; period: string }>;
}

type FormState = {
  employeeId: string; fullName: string; dob: string; designation: string; department: string;
  email: string; personalEmail: string; phone: string; secondaryPhone: string;
  permanentAddress: string; guardianName: string; motherName: string; bloodGroup: string;
  linkedInUrl: string; aadhaarNumber: string; panNumber: string; joiningDate: string; relievingDate: string;
  status: 'Active' | 'Inactive'; role: 'Super Admin' | 'Project Manager' | 'Employee'; avatar: string | null;
};

const EMPTY_FORM: FormState = {
  employeeId: '', fullName: '', dob: '', designation: '', department: '', email: '', personalEmail: '',
  phone: '', secondaryPhone: '', permanentAddress: '', guardianName: '', motherName: '', bloodGroup: '',
  linkedInUrl: '', aadhaarNumber: '', panNumber: '', joiningDate: '', relievingDate: '', status: 'Active',
  role: 'Employee', avatar: null,
};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

interface EmployeeDrawerProps {
  open: boolean; mode: 'add' | 'edit'; employee: Employee | null;
  onClose: () => void; onSaved: () => void;
}

export default function EmployeeDrawer({ open, mode, employee, onClose, onSaved }: EmployeeDrawerProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setErrors({}); setServerError(null);
    if (mode === 'edit' && employee) {
      setForm({
        employeeId: employee.employeeId || '', fullName: employee.fullName, dob: employee.dob || '',
        designation: employee.designation, department: employee.department, email: employee.email,
        personalEmail: employee.personalEmail || '', phone: employee.phone, secondaryPhone: employee.secondaryPhone || '',
        permanentAddress: employee.permanentAddress || '', guardianName: employee.guardianName || '',
        motherName: employee.motherName || '', bloodGroup: employee.bloodGroup || '',
        linkedInUrl: employee.linkedInUrl || '', aadhaarNumber: employee.aadhaarNumber || '',
        panNumber: employee.panNumber || '', joiningDate: employee.joiningDate || '',
        relievingDate: employee.relievingDate || '', status: employee.status, role: employee.role,
        avatar: employee.avatar || null,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, mode, employee]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      if (key === 'relievingDate') {
        const today = new Date().toISOString().slice(0, 10);
        if (val && val <= today) next.status = 'Inactive';
      }
      return next;
    });
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setServerError('Image size must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, avatar: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.employeeId.trim()) errs.employeeId = 'Emp ID is required';
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.dob.trim()) errs.dob = 'Date of birth is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Valid email is required';
    if (!form.phone.trim()) errs.phone = 'Mobile number is required';
    setErrors(errs); return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true); setServerError(null);
    try {
      const url = mode === 'edit' ? `/api/employees/${employee!.employeeId}` : '/api/employees';
      const body = JSON.stringify({ ...form, employeeId: form.employeeId.trim().toUpperCase(), panNumber: form.panNumber.trim().toUpperCase() });
      const res = await fetch(url, { method: mode === 'edit' ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save employee profile.');
      onSaved(); onClose();
    } catch (err: any) { setServerError(err.message); } finally { setSaving(false); }
  };

  const inputCls = (hasErr?: boolean) => `w-full px-3 py-1.5 border rounded text-[12px] text-studio-text bg-white focus:outline-none ${hasErr ? 'border-red-400 focus:border-red-500' : 'border-studio-border hover:border-studio-muted/50 focus:border-brand-orange'}`;
  const labelCls = "block text-[11px] font-medium text-studio-muted mb-1";

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-40 bg-black/15 backdrop-blur-[1px] transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-4xl bg-white shadow-xl flex flex-col transition-transform duration-250 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-7 py-3.5 border-b border-studio-border shrink-0">
          <div>
            <h3 className="text-[16px] font-semibold text-studio-text">{mode === 'edit' ? 'Edit Team Member' : 'New Team Member'}</h3>
            <p className="text-[11px] text-studio-muted mt-0.5">{mode === 'edit' ? `Editing: ${employee?.fullName}` : 'Fill in profile details, joining & relive dates'}</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-studio-muted hover:bg-studio-sidebar transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <form id="employee-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-7 py-5 space-y-5">
          {serverError && <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded text-[11px] font-medium">{serverError}</div>}

          {/* Profile Photo Uploader */}
          <div className="flex items-center gap-3 pb-3 border-b border-studio-border/60">
            <div className="relative group">
              <div className="w-8 h-8 rounded-full bg-studio-sidebar border border-studio-border flex items-center justify-center overflow-hidden text-[12px] font-bold text-studio-muted shadow-sm">
                {form.avatar ? <img src={form.avatar} alt="Profile" className="w-full h-full object-cover" /> : <span>{form.fullName ? form.fullName[0] : 'EMP'}</span>}
              </div>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-orange text-white flex items-center justify-center shadow hover:scale-105 transition-transform" title="Upload Photo"><Camera className="w-2.5 h-2.5" /></button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-studio-text">Profile Photo</p>
              <div className="flex items-center gap-2 mt-0.5">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[11px] text-brand-orange font-medium hover:underline">Upload photo</button>
                {form.avatar && (<>
                  <span className="text-studio-muted text-[10px]">•</span>
                  <button type="button" onClick={() => setForm((p) => ({ ...p, avatar: null }))} className="text-[11px] text-red-500 font-medium hover:underline flex items-center gap-0.5"><Trash2 className="w-2.5 h-2.5" /> Remove</button>
                </>)}
              </div>
            </div>
          </div>

          {/* 1. Profile */}
          <div className="space-y-2.5">
            <h4 className="text-[12px] font-bold text-studio-text pb-1 border-b border-studio-border/70">Profile</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
              <div><label className="block text-[11px] font-bold text-brand-orange mb-1">Emp ID *</label><input type="text" placeholder="AODE0001" value={form.employeeId} onChange={set('employeeId')} className={`${inputCls(!!errors.employeeId)} font-mono uppercase`} /></div>
              <div><label className={labelCls}>Full Name *</label><input type="text" placeholder="e.g. Maya Lin" value={form.fullName} onChange={set('fullName')} className={inputCls(!!errors.fullName)} /></div>
              <div><label className={labelCls}>Date of Birth *</label><input type="date" value={form.dob} onChange={set('dob')} className={inputCls(!!errors.dob)} /></div>
              <div><label className={labelCls}>Office Email *</label><input type="email" placeholder="name@orangy.studio" value={form.email} onChange={set('email')} className={inputCls(!!errors.email)} /></div>
              <div><label className={labelCls}>Mobile Number *</label><input type="tel" placeholder="+91 99999 00000" value={form.phone} onChange={set('phone')} className={inputCls(!!errors.phone)} /></div>
              <div><label className={labelCls}>LinkedIn Link</label><input type="url" placeholder="https://linkedin.com/in/username" value={form.linkedInUrl} onChange={set('linkedInUrl')} className={inputCls()} /></div>
              <div><label className={labelCls}>Department</label><input type="text" placeholder="Brand & Identity" value={form.department} onChange={set('department')} className={inputCls()} /></div>
              <div><label className={labelCls}>Designation</label><input type="text" placeholder="Lead Designer" value={form.designation} onChange={set('designation')} className={inputCls()} /></div>
            </div>
          </div>

          {/* 2. Personal */}
          <div className="space-y-2.5">
            <h4 className="text-[12px] font-bold text-studio-text pb-1 border-b border-studio-border/70">Personal</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
              <div><label className={labelCls}>Father's / Guardian Name</label><input type="text" placeholder="Guardian Full Name" value={form.guardianName} onChange={set('guardianName')} className={inputCls()} /></div>
              <div><label className={labelCls}>Mother's Name</label><input type="text" placeholder="Mother Full Name" value={form.motherName} onChange={set('motherName')} className={inputCls()} /></div>
              <div><label className={labelCls}>Personal Email</label><input type="email" placeholder="personal@gmail.com" value={form.personalEmail} onChange={set('personalEmail')} className={inputCls()} /></div>
              <div><label className={labelCls}>Second Phone</label><input type="tel" placeholder="+91 88888 00000" value={form.secondaryPhone} onChange={set('secondaryPhone')} className={inputCls()} /></div>
              <div><label className={labelCls}>Permanent Address</label><input type="text" placeholder="House no, Street, City, PIN" value={form.permanentAddress} onChange={set('permanentAddress')} className={inputCls()} /></div>
              <div><label className={labelCls}>Blood Group</label><select value={form.bloodGroup} onChange={set('bloodGroup')} className={inputCls()}><option value="">Select Blood Group</option>{BLOOD_GROUPS.map((bg) => (<option key={bg} value={bg}>{bg}</option>))}</select></div>
              <div><label className={labelCls}>AADHAAR Number</label><input type="text" placeholder="12-digit Aadhaar" maxLength={16} value={form.aadhaarNumber} onChange={set('aadhaarNumber')} className={`${inputCls()} font-mono`} /></div>
              <div><label className={labelCls}>PAN Number</label><input type="text" placeholder="ABCDE1234F" maxLength={10} value={form.panNumber} onChange={set('panNumber')} className={`${inputCls()} font-mono uppercase`} /></div>
            </div>
          </div>

          {/* 3. Status */}
          <div className="space-y-2.5">
            <h4 className="text-[12px] font-bold text-studio-text pb-1 border-b border-studio-border/70">Status & Role</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
              <div><label className={labelCls}>Date of Joining</label><input type="date" value={form.joiningDate} onChange={set('joiningDate')} className={inputCls()} /></div>
              <div><label className={labelCls}>Date of Relieving</label><input type="date" value={form.relievingDate} onChange={set('relievingDate')} className={inputCls()} /></div>
              <div className="hidden md:block" />
              <div><label className={labelCls}>Role</label><select value={form.role} onChange={set('role')} className={inputCls()}><option value="Employee">Employee</option><option value="Project Manager">Project Manager</option><option value="Super Admin">Super Admin</option></select></div>
              <div><label className={labelCls}>Status</label><select value={form.status} onChange={set('status')} className={inputCls()}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
            </div>
          </div>
        </form>

        <div className="shrink-0 px-7 py-3 border-t border-studio-border flex items-center justify-end gap-3 bg-white">
          <button type="button" onClick={onClose} className="px-4 py-1.5 text-[12px] font-medium text-studio-muted hover:text-studio-text transition-colors">Cancel</button>
          <button type="submit" form="employee-form" disabled={saving} className="px-4 py-1.5 text-[12px] font-semibold text-white bg-brand-orange rounded hover:bg-opacity-95 transition-colors disabled:opacity-50">{saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Team Member'}</button>
        </div>
      </div>
    </>
  );
}
