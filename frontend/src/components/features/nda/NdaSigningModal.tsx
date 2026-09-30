import React, { useState, useRef } from 'react';
import { ArrowLeft, Mail, KeyRound, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { DEFAULT_OFFICIAL_NDA_HTML } from './CreateNdaFormView';

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

function personalizeDocumentHtml(rawHtml: string, recipientName: string, signedDateStr?: string): string {
  let personalized = rawHtml || '';

  const firstPlaceholderRegex = /(and\s*(?:<[^>]+>)*\s*)(_{2,}|-{2,}|—+|–+|<u[^>]*>[\s\S]*?<\/u>)/i;
  if (firstPlaceholderRegex.test(personalized)) {
    personalized = personalized.replace(firstPlaceholderRegex, `$1<strong style="color: #0F172A;">${recipientName}</strong>`);
  } else {
    personalized = personalized.replace(/(_{3,}|-{3,}|—+|–+)/i, `<strong style="color: #0F172A;">${recipientName}</strong>`);
  }

  const secondPlaceholderRegex = /(effective\s+as\s+of\s*(?:<[^>]+>)*\s*)(_{2,}|-{2,}|—+|–+|<u[^>]*>[\s\S]*?<\/u>)/i;
  if (secondPlaceholderRegex.test(personalized)) {
    personalized = personalized.replace(secondPlaceholderRegex, `$1<strong style="color: #0F172A;">${signedDateStr || '___________'}</strong>`);
  } else {
    personalized = personalized.replace(/(_{3,}|-{3,}|—+|–+)/i, `<strong style="color: #0F172A;">${signedDateStr || '___________'}</strong>`);
  }

  return personalized;
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
  const otpFormRef = useRef<HTMLFormElement>(null);

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
      setSuccess(data.message || `OTP code sent to ${personalEmail}.`);

      setTimeout(() => {
        if (otpFormRef.current) {
          otpFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
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

      window.dispatchEvent(new CustomEvent('notifications-updated'));

      onSigned(`NDA "${ndaCode}" successfully signed!`);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const recipientName = personalEmail ? personalEmail.split('@')[0] : 'Recipient';
  const personalizedContent = personalizeDocumentHtml(documentContent || DEFAULT_OFFICIAL_NDA_HTML, recipientName);

  const getHeaderTitle = () => {
    if (!clientName) return ndaName;
    const baseTitle = ndaName.replace(new RegExp(`\\s*-\\s*${clientName}`, 'i'), '').trim();
    if (baseTitle.toLowerCase().startsWith(clientName.toLowerCase())) {
      return baseTitle;
    }
    return `${clientName} - ${baseTitle}`;
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* 1. Page Header matching NDA Detail View layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-studio-border pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-studio-border bg-white hover:bg-studio-sidebar text-studio-text transition-colors cursor-pointer"
            title="Back to NDA List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-[20px] font-bold tracking-tight text-studio-text">
              {getHeaderTitle()}
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-orange-200 bg-orange-50 text-brand-orange shrink-0">
              {ndaCode}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-[11px] font-semibold px-3 py-1 rounded-full border inline-block max-w-full truncate bg-amber-50 text-amber-800 border-amber-300">
            Pending Signature
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-studio-border bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* 2. Main Single Card Container matching NDA Detail View */}
      <div className="bg-white border border-studio-border rounded-xl p-5 shadow-2xs space-y-6 relative">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 font-semibold text-[12px]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Sticky OTP Notification Banner */}
        {success && (
          <div className="sticky top-2 z-30 p-3.5 bg-green-50/95 backdrop-blur-md border border-green-300 text-green-900 rounded-xl space-y-1.5 animate-in fade-in shadow-md">
            <div className="flex items-center justify-between font-semibold text-[12px]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span>{success}</span>
              </div>
            </div>
            {devOtpHint && (
              <div className="mt-1 pt-2 border-t border-green-200 flex items-center justify-between text-[11.5px]">
                <span className="text-green-800 font-bold">OTP Code:</span>
                <span className="font-mono font-bold text-[15px] bg-white text-green-900 px-3 py-1 rounded border border-green-300 shadow-sm tracking-widest">
                  {devOtpHint}
                </span>
              </div>
            )}
          </div>
        )}

        {/* OFFICIAL AGREEMENT DOCUMENT FORMAT Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-studio-border pb-2.5">
            <h4 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">
              NON-DISCLOSURE AGREEMENT TERMS
            </h4>
            <span className="text-[12px] font-mono text-slate-600 font-medium">
              {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>

          {/* Read-Only Document Container */}
          <div
            className="w-full bg-white border border-studio-border rounded-lg p-7 sm:p-10 text-slate-900 font-sans leading-[1.7] text-[13px] focus:outline-none overflow-y-auto max-h-[460px] min-h-[460px] select-text shadow-2xs"
            dangerouslySetInnerHTML={{ __html: personalizedContent }}
          />
        </div>

        {/* E-SIGNATURE EXECUTION & OTP VERIFICATION Section */}
        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-center border-b border-studio-border pb-2.5">
            <h4 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">
              E-SIGNATURE EXECUTION & OTP VERIFICATION
            </h4>
          </div>

          {/* Step 2: Personal Email Verification */}
          <div className="space-y-2 bg-studio-sidebar/30 p-5 rounded-xl border border-studio-border">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-studio-text">
              Personal Email Verification for OTP E-Signature
            </label>
            <p className="text-[11.5px] text-studio-muted">
              E-signature authentication is verified via a 6-digit OTP code sent to your independent personal email address.
            </p>

            <div className="flex gap-2.5 pt-1">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-studio-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  placeholder="Enter personal email (e.g. name@gmail.com)"
                  disabled={otpSent}
                  className="w-full pl-9 pr-3 py-2 border border-studio-border rounded-lg focus:outline-none focus:border-brand-orange bg-white text-studio-text font-medium text-[12.5px] disabled:bg-slate-100"
                />
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className="px-5 py-2 bg-brand-orange text-white rounded-lg text-[12px] font-bold hover:bg-opacity-90 transition-colors shadow-2xs cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1.5"
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

          {/* Step 3: OTP Code Entry & Sign Action */}
          {otpSent && (
            <form ref={otpFormRef} onSubmit={handleVerifyOtp} className="space-y-3 bg-orange-50/70 p-5 rounded-xl border border-orange-200 animate-in fade-in duration-200">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-orange">
                Enter 6-Digit OTP Code Sent to {maskedEmail || personalEmail}
              </label>

              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative w-full sm:flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-orange">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full pl-9 pr-3 py-2.5 border border-orange-300 rounded-lg focus:outline-none focus:border-brand-orange bg-white font-mono font-bold tracking-widest text-[16px] text-slate-900 text-center shadow-2xs"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifyingOtp || !otpCode.trim()}
                  className="w-full sm:w-auto px-6 py-2.5 bg-brand-orange text-white rounded-lg text-[12.5px] font-bold hover:bg-opacity-90 transition-colors shadow-md disabled:opacity-50 cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
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

              <p className="text-[11px] text-slate-500 text-center pt-1">
                By clicking "Verify OTP & Sign NDA", you consent to affixing your digital signature to this Non-Disclosure Agreement.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
