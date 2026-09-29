import { useState } from 'react';
import { X, Mail, KeyRound, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface NdaSigningModalProps {
  open: boolean;
  assignmentId: string;
  ndaCode: string;
  ndaName: string;
  clientName: string;
  personalEmail: string;
  documentContent?: string;
  onClose: () => void;
  onSigned: (msg: string) => void;
}

export default function NdaSigningModal({
  open,
  assignmentId,
  ndaCode,
  ndaName,
  clientName,
  personalEmail: initialPersonalEmail,
  documentContent,
  onClose,
  onSigned,
}: NdaSigningModalProps) {
  const [personalEmail, setPersonalEmail] = useState(initialPersonalEmail || '');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  if (!open) return null;

  const handleSendOtp = async () => {
    if (!personalEmail || !personalEmail.includes('@')) {
      setError('Please enter a valid personal email address.');
      return;
    }

    setSendingOtp(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/ndas/assignments/${assignmentId}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalEmail: personalEmail.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setOtpSent(true);
      setMaskedEmail(data.maskedEmail || personalEmail);
      if (data.devOtp) setDevOtpHint(data.devOtp);
      setSuccess(data.message || 'OTP code sent to your personal email address.');
    } catch (err: any) {
      setError(err.message || 'Error sending OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length === 0) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setVerifyingOtp(true);
    setError(null);

    try {
      const res = await fetch(`/api/ndas/assignments/${assignmentId}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpCode: otpCode.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OTP verification failed');

      onSigned(`NDA "${ndaCode}" successfully signed!`);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-studio-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-studio-border flex justify-between items-center bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white/10 text-brand-orange">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-orange/20 text-brand-orange border border-brand-orange/30">
                  {ndaCode}
                </span>
                <h3 className="text-[15px] font-bold">{ndaName}</h3>
              </div>
              <p className="text-[11.5px] text-slate-300 font-medium mt-0.5">
                Client: {clientName} — Legal E-Signing Authentication
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-[12.5px]">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 font-semibold text-[12px]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center justify-between font-semibold text-[12px]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span>{success}</span>
              </div>
              {devOtpHint && (
                <span className="font-mono text-[11px] bg-green-100 text-green-900 px-2 py-0.5 rounded border border-green-300">
                  Dev OTP: <strong>{devOtpHint}</strong>
                </span>
              )}
            </div>
          )}

          {/* Document Content Review Box */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase text-slate-600">
              1. Review Agreement Terms
            </label>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11.5px] text-slate-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {documentContent || 'Terms of Confidentiality & Non-Disclosure Agreement...'}
            </div>
          </div>

          {/* Personal Email Authentication Step */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-[11px] font-bold uppercase text-slate-700">
              2. Personal Email Verification for OTP E-Signature
            </label>
            <p className="text-[11.5px] text-slate-500">
              E-signature authentication is verified via a 6-digit OTP code sent to your independent personal email address.
            </p>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  placeholder="Enter your personal email address (e.g. name@gmail.com)"
                  disabled={otpSent}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-orange bg-white text-slate-800 font-medium text-[12.5px] disabled:bg-slate-100"
                />
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[12px] font-bold hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1.5"
              >
                {sendingOtp ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending...
                  </>
                ) : otpSent ? (
                  'Resend OTP'
                ) : (
                  'Send OTP'
                )}
              </button>
            </div>
          </div>

          {/* OTP Code Entry & Sign Action */}
          {otpSent && (
            <form onSubmit={handleVerifyOtp} className="space-y-3 bg-orange-50/70 p-4 rounded-xl border border-orange-200 animate-in fade-in duration-200">
              <label className="block text-[11px] font-bold uppercase text-brand-orange">
                3. Enter 6-Digit OTP Code Sent to {maskedEmail}
              </label>

              <div className="flex gap-3 items-center">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4 text-brand-orange" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit OTP code"
                    className="w-full pl-9 pr-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:border-brand-orange bg-white font-mono font-bold tracking-widest text-[16px] text-slate-900 text-center"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifyingOtp || !otpCode.trim()}
                  className="px-6 py-2.5 bg-brand-orange text-white rounded-lg text-[12.5px] font-bold hover:bg-opacity-90 transition-colors shadow-md disabled:opacity-50 cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  {verifyingOtp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Verify OTP & Sign NDA
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 text-center">
                By clicking "Verify OTP & Sign NDA", you consent to affixing your digital signature to this Non-Disclosure Agreement.
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-[11.5px] text-slate-500">
          <span>Security Protocol: SHA-256 Hashed OTP Authentication</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
