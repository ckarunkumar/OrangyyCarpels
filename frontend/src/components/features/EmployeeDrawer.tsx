import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Trash2, Eye, EyeOff } from 'lucide-react';

export interface Employee {
  employeeId: string; id?: string; fullName: string; dob?: string; designation: string; department: string;
  email: string; personalEmail?: string; phone: string; secondaryPhone?: string; permanentAddress?: string;
  gender?: string; guardianName?: string; motherName?: string; bloodGroup?: string; linkedInUrl?: string;
  aadhaarNumber?: string; panNumber?: string; joiningDate?: string; relievingDate?: string; status: 'Active' | 'Inactive';
  role: 'Super Admin' | 'Project Manager' | 'Employee'; location?: string; avatar?: string | null;
  education?: Array<{ degree: string; school: string; year: string }>; experience?: Array<{ company: string; role: string; period: string }>;
  assignedProjectsCount?: number; assignedProjects?: Array<{ id: string; name: string; status: string }>;
}

type FormState = {
  employeeId: string; fullName: string; dob: string; designation: string; department: string;
  email: string; password?: string; personalEmail: string; phone: string; secondaryPhone: string;
  permanentAddress: string; gender: string; guardianName: string; motherName: string; bloodGroup: string;
  linkedInUrl: string; aadhaarNumber: string; panNumber: string; joiningDate: string; relievingDate: string;
  status: 'Active' | 'Inactive'; role: 'Super Admin' | 'Project Manager' | 'Employee'; avatar: string | null;
};

const EMPTY_FORM: FormState = {
  employeeId: '', fullName: '', dob: '', designation: '', department: '', email: '', password: '', personalEmail: '',
  phone: '', secondaryPhone: '', permanentAddress: '', gender: 'Not Specified', guardianName: '', motherName: '', bloodGroup: '',
  linkedInUrl: '', aadhaarNumber: '', panNumber: '', joiningDate: '', relievingDate: '', status: 'Active', role: 'Employee', avatar: null,
};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const GENDERS = ['Male', 'Female', 'Not Specified'];
interface EmployeeDrawerProps { open: boolean; mode: 'add' | 'edit'; employee: Employee | null; onClose: () => void; onSaved: () => void; }

export default function EmployeeDrawer({ open, mode, employee, onClose, onSaved }: EmployeeDrawerProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setErrors({}); setServerError(null); setShowPassword(false);
    if (mode === 'edit' && employee) {
      setForm({
        employeeId: employee.employeeId || '', fullName: employee.fullName, dob: employee.dob || '',
        designation: employee.designation, department: employee.department, email: employee.email, password: '',
        personalEmail: employee.personalEmail || '', phone: employee.phone, secondaryPhone: employee.secondaryPhone || '',
        permanentAddress: employee.permanentAddress || '', gender: employee.gender || 'Not Specified',
        guardianName: employee.guardianName || '', motherName: employee.motherName || '', bloodGroup: employee.bloodGroup || '',
        linkedInUrl: employee.linkedInUrl || '', aadhaarNumber: employee.aadhaarNumber || '',
        panNumber: employee.panNumber || '', joiningDate: employee.joiningDate || '',
        relievingDate: employee.relievingDate || '', status: employee.status, role: employee.role,
        avatar: employee.avatar || null,
      });
    } else {
      setForm(EMPTY_FORM);
      fetch('/api/employees/next-id').then((r) => r.json()).then((d) => { if (d.nextId) setForm((p) => ({ ...p, employeeId: d.nextId })); }).catch(() => setForm((p) => ({ ...p, employeeId: 'ODE0001' })));
    }
  }, [open, mode, employee]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.value;
    setForm((p) => {
      const next = { ...p, [key]: val };
      if (key === 'relievingDate' && val && val <= new Date().toISOString().slice(0, 10)) next.status = 'Inactive';
      return next;
    });
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setServerError('Image size must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setForm((p) => ({ ...p, avatar: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.employeeId.trim()) errs.employeeId = 'Emp ID is required';
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.dob.trim()) errs.dob = 'Date of birth is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Valid email is required';
    if (!form.phone.trim()) errs.phone = 'Mobile number is required';
    if (mode === 'add' && (!form.password || !form.password.trim())) {
      errs.password = 'Member login password is required';
    } else if (form.password && form.password.trim() && (form.password.length < 9 || !/[A-Z]/.test(form.password) || !/[!@#$%&_*]/.test(form.password))) {
      errs.password = 'Min 9 chars, 1 uppercase, 1 special (!@#$%&_*)';
    }
    setErrors(errs); return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true); setServerError(null);
    try {
      const url = mode === 'edit' ? `/api/employees/${employee!.employeeId}` : '/api/employees';
      const payload: any = { ...form, employeeId: form.employeeId.trim().toUpperCase(), panNumber: form.panNumber.trim().toUpperCase() };
      if (!payload.password) delete payload.password;
      const res = await fetch(url, { method: mode === 'edit' ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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
          <div><h3 className="text-[16px] font-semibold text-studio-text">{mode === 'edit' ? 'Edit Team Member' : 'New Team Member'}</h3><p className="text-[11px] text-studio-muted mt-0.5">{mode === 'edit' ? `Editing: ${employee?.fullName}` : 'Fill in profile details & credentials'}</p></div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-studio-muted hover:bg-studio-sidebar transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <form id="employee-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-7 py-5 space-y-4">
          {serverError && <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded text-[11px] font-medium">{serverError}</div>}

          <div className="flex items-center gap-3 pb-3 border-b border-studio-border/60">
            <div className="relative group">
              <div className="w-8 h-8 rounded-full bg-studio-sidebar border border-studio-border flex items-center justify-center overflow-hidden text-[12px] font-bold text-studio-muted shadow-sm">{form.avatar ? <img src={form.avatar} alt="Profile" className="w-full h-full object-cover" /> : <span>{form.fullName ? form.fullName[0] : 'EMP'}</span>}</div>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-orange text-white flex items-center justify-center shadow hover:scale-105" title="Upload Photo"><Camera className="w-2.5 h-2.5" /></button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-studio-text">Profile Photo</p>
              <div className="flex items-center gap-2 mt-0.5">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[11px] text-brand-orange font-medium hover:underline">Upload photo</button>
                {form.avatar && (<><span className="text-studio-muted text-[10px]">•</span><button type="button" onClick={() => setForm((p) => ({ ...p, avatar: null }))} className="text-[11px] text-red-500 font-medium hover:underline flex items-center gap-0.5"><Trash2 className="w-2.5 h-2.5" /> Remove</button></>)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[12px] font-bold text-studio-text pb-1 border-b border-studio-border/70">1. Profile & Gender</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2.5">
              <div><label className="block text-[11px] font-bold text-brand-orange mb-1">Emp ID *</label><input type="text" placeholder="ODE0001" value={form.employeeId} onChange={set('employeeId')} className={`${inputCls(!!errors.employeeId)} font-mono uppercase`} /></div>
              <div><label className={labelCls}>Full Name *</label><input type="text" placeholder="e.g. Maya Lin" value={form.fullName} onChange={set('fullName')} className={inputCls(!!errors.fullName)} /></div>
              <div><label className={labelCls}>Gender *</label><select value={form.gender} onChange={set('gender')} className={inputCls()}>{GENDERS.map((g) => (<option key={g} value={g}>{g}</option>))}</select></div>
              <div><label className={labelCls}>Date of Birth *</label><input type="date" value={form.dob} onChange={set('dob')} className={inputCls(!!errors.dob)} /></div>
              <div><label className={labelCls}>Office Email *</label><input type="email" placeholder="name@orangy.studio" value={form.email} onChange={set('email')} className={inputCls(!!errors.email)} /></div>
              <div><label className={labelCls}>Mobile Number *</label><input type="tel" placeholder="+91 99999 00000" value={form.phone} onChange={set('phone')} className={inputCls(!!errors.phone)} /></div>
              <div><label className={labelCls}>Department</label><input type="text" placeholder="Brand & Identity" value={form.department} onChange={set('department')} className={inputCls()} /></div>
              <div><label className={labelCls}>Designation</label><input type="text" placeholder="Lead Designer" value={form.designation} onChange={set('designation')} className={inputCls()} /></div>
              <div><label className={labelCls}>LinkedIn Link</label><input type="url" placeholder="https://linkedin.com/in/username" value={form.linkedInUrl} onChange={set('linkedInUrl')} className={inputCls()} /></div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[12px] font-bold text-studio-text pb-1 border-b border-studio-border/70">2. Personal</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2.5">
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

          <div className="space-y-2">
            <h4 className="text-[12px] font-bold text-studio-text pb-1 border-b border-studio-border/70">3. Access, Role & Password</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2.5">
              <div><label className={labelCls}>Date of Joining</label><input type="date" value={form.joiningDate} onChange={set('joiningDate')} className={inputCls()} /></div>
              <div><label className={labelCls}>Date of Relieving</label><input type="date" value={form.relievingDate} onChange={set('relievingDate')} className={inputCls()} /></div>
              <div><label className={labelCls}>Role</label><select value={form.role} onChange={set('role')} className={inputCls()}><option value="Employee">Employee</option><option value="Project Manager">Project Manager</option><option value="Super Admin">Super Admin</option></select></div>
              <div><label className={labelCls}>Status</label><select value={form.status} onChange={set('status')} className={inputCls()}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-studio-text mb-1">{mode === 'edit' ? 'Reset Password' : <>Member Login Password <span className="text-red-500">*</span></>}</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} placeholder={mode === 'edit' ? 'Leave blank to keep unchanged' : 'Min 9 chars, 1 uppercase, 1 special (!@#$%&_*)'} value={form.password || ''} onChange={set('password')} className={`${inputCls(!!errors.password)} pr-8`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-2 text-studio-muted hover:text-studio-text cursor-pointer" title={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {errors.password && <p className="text-[10px] text-red-500 mt-0.5">{errors.password}</p>}
              </div>
            </div>
          </div>
        </form>

        <div className="shrink-0 px-7 py-3 border-t border-studio-border flex items-center justify-end gap-3 bg-white">
          <button type="button" onClick={onClose} className="px-4 py-1.5 text-[12px] font-medium text-studio-muted hover:text-studio-text">Cancel</button>
          <button type="submit" form="employee-form" disabled={saving} className="px-4 py-1.5 text-[12px] font-semibold text-white bg-brand-orange rounded hover:bg-opacity-95 disabled:opacity-50">{saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Team Member'}</button>
        </div>
      </div>
    </>
  );
}
