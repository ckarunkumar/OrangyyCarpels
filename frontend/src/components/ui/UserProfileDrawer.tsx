import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, Camera, LogOut, Check, AlertCircle, MapPin, Phone, Mail, Briefcase, Building, KeyRound, CheckCircle2, Circle, Eye, EyeOff } from 'lucide-react';

interface UserProfileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function UserProfileDrawer({ open, onClose }: UserProfileDrawerProps) {
  const { user, logout, updateProfile, changePassword } = useAuth();
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Password change state
  const [showPassSection, setShowPassSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passSaving, setPassSaving] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMinLength = newPassword.length >= 9;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasSpecial = /[!@#$%&_*]/.test(newPassword);
  const isPassValid = isMinLength && hasUpper && hasSpecial;

  useEffect(() => {
    if (user && open) {
      setPhone(user.phone || ''); setLocation(user.location || 'Delhi, India');
      setAvatar(user.avatar || null); setSuccessMsg(false); setErrorMsg(null);
      setCurrentPassword(''); setNewPassword('');
      setShowCurrentPass(false); setShowNewPass(false);
      setPassSuccess(false); setPassError(null);
    }
  }, [user, open]);

  if (!user) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { setErrorMsg('Image file size must be under 2MB.'); return; }
      const reader = new FileReader();
      reader.onload = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErrorMsg(null); setSuccessMsg(false);
    const result = await updateProfile({ phone: phone.trim(), location: location.trim(), avatar });
    setSaving(false);
    if (result.success) { setSuccessMsg(true); setTimeout(() => setSuccessMsg(false), 2500); }
    else { setErrorMsg(result.error || 'Failed to update profile.'); }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) { setPassError('Enter your current password.'); return; }
    if (!isPassValid) { setPassError('New password must satisfy all policy requirements.'); return; }
    setPassSaving(true); setPassError(null); setPassSuccess(false);
    const res = await changePassword(currentPassword, newPassword);
    setPassSaving(false);
    if (res.success) {
      setPassSuccess(true); setCurrentPassword(''); setNewPassword('');
      setTimeout(() => setPassSuccess(false), 3000);
    } else { setPassError(res.error || 'Failed to change password.'); }
  };

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-[480px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-border shrink-0 bg-white">
          <div><h3 className="text-[16px] font-bold text-studio-text">User Profile</h3><p className="text-[11.5px] text-studio-muted mt-0.5">Manage your studio profile & security</p></div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-studio-muted hover:bg-studio-sidebar transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <form id="user-profile-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar Section */}
            <div className="flex flex-col items-center pb-2">
              <div className="relative group">
                <div className="w-14 h-14 rounded-full bg-slate-50 border border-studio-border flex items-center justify-center overflow-hidden text-[16px] font-bold text-studio-muted shadow-2xs">
                  {avatar ? <img src={avatar} alt={user.fullName} className="w-full h-full object-cover" /> : <span>{user.fullName[0]}</span>}
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-brand-orange text-white flex items-center justify-center shadow hover:scale-105 transition-transform cursor-pointer" title="Upload Photo"><Camera className="w-3 h-3" /></button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </div>
              <div className="text-center mt-2">
                <p className="text-[14px] font-bold text-studio-text">{user.fullName}</p>
                <span className="inline-block mt-1 text-[9.5px] font-semibold px-2.5 py-0.5 rounded-full border bg-orange-50 text-brand-orange border-brand-orange/30">{user.designation || 'Team Member'}</span>
              </div>
            </div>

            {successMsg && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-[12px] font-medium flex items-center gap-2"><Check className="w-4 h-4 shrink-0" />Profile details updated successfully.</div>}
            {errorMsg && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[12px] font-medium flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}</div>}

            {/* Editable Fields */}
            <div className="space-y-3 bg-slate-50/70 border border-studio-border rounded-xl p-4">
              <h4 className="text-[11px] font-bold text-studio-muted uppercase tracking-wider">Contact Details</h4>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-studio-muted uppercase tracking-wider flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-studio-muted" /> Phone Number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 99999 00000" className="w-full px-3 py-2 border border-studio-border rounded-lg text-[12.5px] text-studio-text bg-white focus:outline-none focus:border-brand-orange" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-studio-muted uppercase tracking-wider flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-studio-muted" /> Location / City</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Delhi, India" className="w-full px-3 py-2 border border-studio-border rounded-lg text-[12.5px] text-studio-text bg-white focus:outline-none focus:border-brand-orange" />
              </div>
              <button type="submit" disabled={saving} className="w-full py-2 px-3 text-[12px] font-semibold text-white bg-brand-orange rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs">{saving ? 'Saving...' : 'Save Profile Changes'}</button>
            </div>
          </form>

          {/* Change Password Section */}
          <div className="space-y-3 bg-slate-50/70 border border-studio-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-studio-muted uppercase tracking-wider flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5 text-studio-muted" /> Security & Password</h4>
              <button type="button" onClick={() => setShowPassSection(!showPassSection)} className="text-[11px] font-semibold text-brand-orange hover:underline cursor-pointer">{showPassSection ? 'Hide' : 'Change Password'}</button>
            </div>

            {showPassSection && (
              <form onSubmit={handlePasswordSubmit} className="space-y-3 pt-2">
                {passSuccess && <div className="p-2.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-[11px] font-medium flex items-center gap-1.5"><Check className="w-3.5 h-3.5 shrink-0" />Password changed successfully!</div>}
                {passError && <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[11px] font-medium flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{passError}</div>}
                
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-studio-muted">Current Password</label>
                  <div className="relative">
                    <input type={showCurrentPass ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="•••••••••" className="w-full pl-3 pr-9 py-1.5 border border-studio-border rounded-lg text-[12.5px] bg-white focus:outline-none focus:border-brand-orange" />
                    <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-2.5 top-2 text-studio-muted hover:text-studio-text cursor-pointer" title={showCurrentPass ? 'Hide password' : 'Show password'}>
                      {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-studio-muted">New Password</label>
                  <div className="relative">
                    <input type={showNewPass ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 9 chars, 1 uppercase, 1 special (!@#$%&_*)" className="w-full pl-3 pr-9 py-1.5 border border-studio-border rounded-lg text-[12.5px] bg-white focus:outline-none focus:border-brand-orange" />
                    <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-2.5 top-2 text-studio-muted hover:text-studio-text cursor-pointer" title={showNewPass ? 'Hide password' : 'Show password'}>
                      {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Password Policy Checks */}
                <div className="text-[10.5px] space-y-1 bg-white p-2.5 rounded-lg border border-studio-border text-studio-muted">
                  <div className={`flex items-center gap-1.5 ${isMinLength ? 'text-green-600 font-medium' : ''}`}>{isMinLength ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <Circle className="w-3.5 h-3.5" />}<span>At least 9 characters</span></div>
                  <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-green-600 font-medium' : ''}`}>{hasUpper ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <Circle className="w-3.5 h-3.5" />}<span>At least 1 uppercase letter (A-Z)</span></div>
                  <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-green-600 font-medium' : ''}`}>{hasSpecial ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <Circle className="w-3.5 h-3.5" />}<span>At least 1 special char (! @ # $ % & _ *)</span></div>
                </div>

                <button type="submit" disabled={passSaving || !isPassValid || !currentPassword} className="w-full py-2 text-[12px] font-semibold text-white bg-studio-text rounded-lg hover:bg-black transition-colors disabled:opacity-40 cursor-pointer">{passSaving ? 'Updating...' : 'Update Password'}</button>
              </form>
            )}
          </div>

          {/* Organization Read-Only Details */}
          <div className="space-y-2 bg-slate-50/70 border border-studio-border rounded-xl p-4">
            <div className="flex items-center justify-between"><h4 className="text-[11px] font-bold text-studio-muted uppercase tracking-wider">Organization</h4><span className="text-[10.5px] text-studio-muted flex items-center gap-1"><Lock className="w-3 h-3" /> Read-only</span></div>
            <div className="grid grid-cols-1 gap-2 text-[12px]">
              <div className="p-2.5 bg-white border border-studio-border rounded-lg flex items-center justify-between"><div className="flex items-center gap-2 text-studio-muted"><Mail className="w-3.5 h-3.5" /><span>Email</span></div><span className="text-studio-text font-medium truncate">{user.email}</span></div>
              <div className="p-2.5 bg-white border border-studio-border rounded-lg flex items-center justify-between"><div className="flex items-center gap-2 text-studio-muted"><Briefcase className="w-3.5 h-3.5" /><span>Designation</span></div><span className="text-studio-text font-medium truncate">{user.designation || 'Designer'}</span></div>
              <div className="p-2.5 bg-white border border-studio-border rounded-lg flex items-center justify-between"><div className="flex items-center gap-2 text-studio-muted"><Building className="w-3.5 h-3.5" /><span>Department</span></div><span className="text-studio-text font-medium truncate">{user.department || 'Studio'}</span></div>
            </div>
          </div>
        </div>

        <div className="shrink-0 p-4 border-t border-studio-border bg-white">
          <button type="button" onClick={() => { onClose(); logout(); }} className="w-full flex items-center justify-center gap-2 py-2 px-4 text-[12.5px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"><LogOut className="w-4 h-4" />Sign Out</button>
        </div>
      </div>
    </>
  );
}
