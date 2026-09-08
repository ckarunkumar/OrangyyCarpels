import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, Trash2 } from 'lucide-react';
import { Employee } from './EmployeeDrawer';
import Breadcrumbs from '../ui/Breadcrumbs';

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

interface EmployeeFormViewProps {
  mode: 'add' | 'edit';
  employee: Employee | null;
  onBack: () => void;
  onSaved: (msg?: string) => void;
}

export default function EmployeeFormView({ mode, employee, onBack, onSaved }: EmployeeFormViewProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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
  }, [mode, employee]);

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
      onSaved(mode === 'edit' ? `Team member ${form.fullName} updated successfully.` : `Team member ${form.fullName} created successfully.`);
    } catch (err: any) { setServerError(err.message); } finally { setSaving(false); }
  };

  const inputCls = (hasErr?: boolean) => `w-full px-3 py-2 border rounded-md text-[12.5px] text-studio-text bg-white focus:outline-none transition-colors ${hasErr ? 'border-red-400 focus:border-red-500 bg-red-50/20' : 'border-studio-border hover:border-studio-muted/60 focus:border-brand-orange'}`;
  const labelCls = "block text-[11px] font-medium text-studio-muted mb-1";

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      <Breadcrumbs items={[{ label: 'Team', onClick: onBack }, { label: mode === 'edit' ? `Edit Member (${employee?.fullName || ''})` : 'New Member' }]} />
      <div className="flex items-center justify-between border-b border-studio-border pb-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="p-1.5 rounded-lg border border-studio-border bg-white hover:bg-studio-sidebar text-studio-text transition-colors cursor-pointer" title="Back to Team Registry"><ArrowLeft className="w-4 h-4" /></button>
          <div>
            <h2 className="text-[20px] font-bold tracking-tight text-studio-text">{mode === 'edit' ? `Edit Team Member (${employee?.fullName})` : 'New Team Member'}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button type="button" onClick={onBack} className="px-4 py-2 border border-studio-border rounded-md text-[12px] font-semibold text-studio-text hover:bg-studio-sidebar transition-colors cursor-pointer">Cancel</button>
          <button type="submit" form="employee-full-form" disabled={saving} className="px-5 py-2 bg-brand-orange text-white rounded-md text-[12px] font-semibold hover:bg-opacity-95 shadow-sm transition-all disabled:opacity-50 cursor-pointer">{saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Team Member'}</button>
        </div>
      </div>

      {serverError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[12px] font-medium">{serverError}</div>}

      <form id="employee-full-form" onSubmit={handleSubmit} className="bg-white border border-studio-border rounded-lg shadow-sm p-6 space-y-7">
        {/* Profile Photo Uploader */}
        <div className="flex items-center gap-4 pb-5 border-b border-studio-border/70">
          <div className="relative group">
            <div className="w-16 h-16 rounded-full bg-studio-sidebar border-2 border-studio-border flex items-center justify-center overflow-hidden text-[16px] font-bold text-studio-muted shadow-2xs">
              {form.avatar ? <img src={form.avatar} alt="Profile" className="w-full h-full object-cover" /> : <span>{form.fullName ? form.fullName[0] : 'EMP'}</span>}
            </div>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-brand-orange text-white flex items-center justify-center shadow hover:scale-105 transition-transform cursor-pointer" title="Upload Photo"><Camera className="w-3 h-3" /></button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-studio-text">Team Member Profile Photo</p>
            <p className="text-[11px] text-studio-muted">Upload a clear square headshot (PNG, JPG up to 2MB)</p>
            <div className="flex items-center gap-3 mt-1.5">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[11.5px] text-brand-orange font-semibold hover:underline cursor-pointer">Upload Photo</button>
              {form.avatar && (<><span className="text-studio-muted text-[10px]">•</span><button type="button" onClick={() => setForm((p) => ({ ...p, avatar: null }))} className="text-[11.5px] text-red-500 font-semibold hover:underline flex items-center gap-1 cursor-pointer"><Trash2 className="w-3 h-3" /> Remove</button></>)}
            </div>
          </div>
        </div>

        {/* 1. Profile Information */}
        <div className="space-y-3">
          <div className="border-b border-studio-border/70 pb-1.5"><h3 className="text-[13px] font-bold text-studio-text uppercase tracking-wider">1. Profile Details</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div><label className="block text-[11px] font-bold text-brand-orange mb-1">Emp ID *</label><input type="text" placeholder="AODE0001" value={form.employeeId} onChange={set('employeeId')} className={`${inputCls(!!errors.employeeId)} font-mono uppercase font-semibold`} /></div>
            <div><label className={labelCls}>Full Name *</label><input type="text" placeholder="e.g. Maya Lin" value={form.fullName} onChange={set('fullName')} className={inputCls(!!errors.fullName)} /></div>
            <div><label className={labelCls}>Date of Birth *</label><input type="date" value={form.dob} onChange={set('dob')} className={inputCls(!!errors.dob)} /></div>
            <div><label className={labelCls}>Office Email *</label><input type="email" placeholder="name@orangy.studio" value={form.email} onChange={set('email')} className={inputCls(!!errors.email)} /></div>
            <div><label className={labelCls}>Mobile Number *</label><input type="tel" placeholder="+91 99999 00000" value={form.phone} onChange={set('phone')} className={inputCls(!!errors.phone)} /></div>
            <div><label className={labelCls}>LinkedIn Link</label><input type="url" placeholder="https://linkedin.com/in/username" value={form.linkedInUrl} onChange={set('linkedInUrl')} className={inputCls()} /></div>
            <div><label className={labelCls}>Department</label><input type="text" placeholder="Brand & Identity" value={form.department} onChange={set('department')} className={inputCls()} /></div>
            <div><label className={labelCls}>Designation</label><input type="text" placeholder="Lead Designer" value={form.designation} onChange={set('designation')} className={inputCls()} /></div>
          </div>
        </div>

        {/* 2. Personal Information */}
        <div className="space-y-3">
          <div className="border-b border-studio-border/70 pb-1.5"><h3 className="text-[13px] font-bold text-studio-text uppercase tracking-wider">2. Personal Information</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
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

        {/* 3. Status & Role */}
        <div className="space-y-3">
          <div className="border-b border-studio-border/70 pb-1.5"><h3 className="text-[13px] font-bold text-studio-text uppercase tracking-wider">3. Access Role & Status</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div><label className={labelCls}>Date of Joining</label><input type="date" value={form.joiningDate} onChange={set('joiningDate')} className={inputCls()} /></div>
            <div><label className={labelCls}>Date of Relieving</label><input type="date" value={form.relievingDate} onChange={set('relievingDate')} className={inputCls()} /></div>
            <div className="hidden md:block" />
            <div><label className={labelCls}>System Role</label><select value={form.role} onChange={set('role')} className={inputCls()}><option value="Employee">Employee</option><option value="Project Manager">Project Manager</option><option value="Super Admin">Super Admin</option></select></div>
            <div><label className={labelCls}>Status</label><select value={form.status} onChange={set('status')} className={inputCls()}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
          </div>
        </div>
      </form>
    </div>
  );
}
