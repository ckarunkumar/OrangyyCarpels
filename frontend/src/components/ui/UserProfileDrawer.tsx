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
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-[390px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-border shrink-0">
          <div><h3 className="text-[15px] font-bold text-studio-text">User Profile</h3><p className="text-[11px] text-studio-muted mt-0.5">Manage your studio profile & security</p></div>
          <button type="button" onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center text-studio-muted hover:bg-studio-bg transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <form id="user-profile-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar Section */}
            <div className="flex flex-col items-center pb-2">
              <div className="relative group">
                <div className="w-9 h-9 rounded-full bg-studio-sidebar border border-studio-border flex items-center justify-center overflow-hidden text-[14px] font-bold text-studio-muted shadow-sm">
                  {avatar ? <img src={avatar} alt={user.fullName} className="w-full h-full object-cover" /> : <span>{user.fullName[0]}</span>}
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-orange text-white flex items-center justify-center shadow hover:scale-105 transition-transform" title="Upload Photo"><Camera className="w-2.5 h-2.5" /></button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </div>
              <div className="text-center mt-1.5">
                <p className="text-[13px] font-bold text-studio-text">{user.fullName}</p>
                <span className="inline-block mt-0.5 text-[9.5px] font-semibold px-2 py-0.2 rounded-full border bg-orange-50 text-brand-orange border-brand-orange/30">{user.designation || 'Team Member'}</span>
              </div>
            </div>

            {successMsg && <div className="p-2.5 bg-green-50 border border-green-200 text-green-700 rounded text-[11px] font-medium flex items-center gap-1.5"><Check className="w-3.5 h-3.5 shrink-0" />Profile details updated successfully.</div>}
            {errorMsg && <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded text-[11px] font-medium flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{errorMsg}</div>}

            {/* Editable Fields */}
            <section className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-studio-muted uppercase tracking-wider">Editable Details</h4>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-studio-muted uppercase tracking-wider flex items-center gap-1"><Phone className="w-3 h-3 text-studio-muted" /> Phone Number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 99999 00000" className="w-full px-3 py-1.5 border border-studio-border rounded text-[12.5px] text-studio-text bg-white focus:outline-none focus:border-brand-blue" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-studio-muted uppercase tracking-wider flex items-center gap-1"><MapPin className="w-3 h-3 text-studio-muted" /> Location / City</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Delhi, India" className="w-full px-3 py-1.5 border border-studio-border rounded text-[12.5px] text-studio-text bg-white focus:outline-none focus:border-brand-blue" />
              </div>
              <button type="submit" disabled={saving} className="w-full py-1.5 px-3 text-[11.5px] font-semibold text-white bg-brand-orange rounded hover:bg-opacity-90 transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save Profile Changes'}</button>
            </section>
          </form>

          {/* Change Password Section */}
          <section className="pt-3 border-t border-studio-border space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold text-studio-muted uppercase tracking-wider flex items-center gap-1"><KeyRound className="w-3 h-3 text-studio-muted" /> Security & Password</h4>
              <button type="button" onClick={() => setShowPassSection(!showPassSection)} className="text-[10.5px] font-semibold text-brand-orange hover:underline">{showPassSection ? 'Hide' : 'Change Password'}</button>
            </div>

            {showPassSection && (
              <form onSubmit={handlePasswordSubmit} className="p-3 bg-studio-sidebar/40 border border-studio-border rounded-md space-y-2.5">
                {passSuccess && <div className="p-2 bg-green-50 border border-green-200 text-green-700 rounded text-[10.5px] font-medium flex items-center gap-1"><Check className="w-3 h-3 shrink-0" />Password changed successfully!</div>}
                {passError && <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded text-[10.5px] font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3 shrink-0" />{passError}</div>}
                
                <div className="space-y-1">
                  <label className="text-[10.5px] font-semibold text-studio-muted">Current Password</label>
                  <div className="relative">
                    <input type={showCurrentPass ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="•••••••••" className="w-full pl-2.5 pr-8 py-1.5 border border-studio-border rounded text-[12px] bg-white focus:outline-none focus:border-brand-orange" />
                    <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-2.5 top-2 text-studio-muted hover:text-studio-text cursor-pointer" title={showCurrentPass ? 'Hide password' : 'Show password'}>
                      {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-semibold text-studio-muted">New Password</label>
                  <div className="relative">
                    <input type={showNewPass ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 9 chars, 1 uppercase, 1 special (!@#$%&_*)" className="w-full pl-2.5 pr-8 py-1.5 border border-studio-border rounded text-[12px] bg-white focus:outline-none focus:border-brand-orange" />
                    <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-2.5 top-2 text-studio-muted hover:text-studio-text cursor-pointer" title={showNewPass ? 'Hide password' : 'Show password'}>
                      {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Password Policy Checks */}
                <div className="text-[10px] space-y-1 bg-white p-2 rounded border border-studio-border/50 text-studio-muted">
                  <div className={`flex items-center gap-1.5 ${isMinLength ? 'text-green-600 font-medium' : ''}`}>{isMinLength ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <Circle className="w-3 h-3" />}<span>At least 9 characters</span></div>
                  <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-green-600 font-medium' : ''}`}>{hasUpper ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <Circle className="w-3 h-3" />}<span>At least 1 uppercase letter (A-Z)</span></div>
                  <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-green-600 font-medium' : ''}`}>{hasSpecial ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <Circle className="w-3 h-3" />}<span>At least 1 special char (! @ # $ % & _ *)</span></div>
                </div>

                <button type="submit" disabled={passSaving || !isPassValid || !currentPassword} className="w-full py-1.5 text-[11.5px] font-semibold text-white bg-studio-text rounded hover:bg-black transition-colors disabled:opacity-40">{passSaving ? 'Updating...' : 'Update Password'}</button>
              </form>
            )}
          </section>

          {/* Organization Read-Only Details */}
          <section className="space-y-2 pt-2 border-t border-studio-border">
            <div className="flex items-center justify-between"><h4 className="text-[10px] font-bold text-studio-muted uppercase tracking-wider">Organization</h4><span className="text-[10px] text-studio-muted flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> Read-only</span></div>
            <div className="grid grid-cols-1 gap-1.5 text-[11px]">
              <div className="p-2 bg-studio-sidebar border border-studio-border rounded flex items-center justify-between"><div className="flex items-center gap-2 text-studio-muted"><Mail className="w-3 h-3" /><span>Email</span></div><span className="text-studio-text font-medium truncate">{user.email}</span></div>
              <div className="p-2 bg-studio-sidebar border border-studio-border rounded flex items-center justify-between"><div className="flex items-center gap-2 text-studio-muted"><Briefcase className="w-3 h-3" /><span>Designation</span></div><span className="text-studio-text font-medium truncate">{user.designation || 'Designer'}</span></div>
              <div className="p-2 bg-studio-sidebar border border-studio-border rounded flex items-center justify-between"><div className="flex items-center gap-2 text-studio-muted"><Building className="w-3 h-3" /><span>Department</span></div><span className="text-studio-text font-medium truncate">{user.department || 'Studio'}</span></div>
            </div>
          </section>
        </div>

        <div className="shrink-0 p-4 border-t border-studio-border bg-studio-sidebar">
          <button type="button" onClick={() => { onClose(); logout(); }} className="w-full flex items-center justify-center gap-1.5 py-1.5 px-4 text-[12px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors"><LogOut className="w-3.5 h-3.5" />Sign Out</button>
        </div>
      </div>
    </>
  );
}
