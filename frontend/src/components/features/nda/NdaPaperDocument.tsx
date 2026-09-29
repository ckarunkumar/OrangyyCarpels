import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface NdaPaperDocumentProps {
  documentContent?: string | null;
  recipientName?: string;
  signedDate?: string | null;
  isSigned?: boolean;
}

export default function NdaPaperDocument({
  documentContent,
  recipientName,
  signedDate,
  isSigned = false,
}: NdaPaperDocumentProps) {
  if (!documentContent) {
    return (
      <div className="py-12 text-center text-slate-400 italic text-[12px]">
        No agreement text content available.
      </div>
    );
  }

  // Format date display
  const dateStr = signedDate
    ? new Date(signedDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');

  const replacePlaceholders = (text: string) => {
    // 1. Split text by placeholders to render bold dynamic tags
    let result: (string | React.ReactNode)[] = [text];

    // Replace _____________________ with recipient name
    if (recipientName) {
      const newResult: (string | React.ReactNode)[] = [];
      result.forEach((chunk) => {
        if (typeof chunk === 'string') {
          const parts = chunk.split('_____________________');
          parts.forEach((p, idx) => {
            newResult.push(p);
            if (idx < parts.length - 1) {
              newResult.push(
                <span
                  key={`recip-${idx}`}
                  className="font-bold underline text-slate-900 bg-orange-50 px-1 py-0.5 rounded border border-orange-200"
                >
                  {recipientName}
                </span>
              );
            }
          });
        } else {
          newResult.push(chunk);
        }
      });
      result = newResult;
    }

    // Replace ____________ with date
    const finalResult: (string | React.ReactNode)[] = [];
    result.forEach((chunk) => {
      if (typeof chunk === 'string') {
        const parts = chunk.split('____________');
        parts.forEach((p, idx) => {
          finalResult.push(p);
          if (idx < parts.length - 1) {
            finalResult.push(
              <span
                key={`date-${idx}`}
                className="font-bold underline text-slate-900 bg-slate-100 px-1 py-0.5 rounded border border-slate-200"
              >
                {dateStr}
              </span>
            );
          }
        });
      } else {
        finalResult.push(chunk);
      }
    });

    return finalResult;
  };

  const lines = documentContent.split('\n');

  return (
    <div className="bg-slate-300/40 p-4 sm:p-8 rounded-xl border border-slate-300 flex justify-center overflow-x-auto">
      <div className="w-full max-w-[800px] bg-white shadow-xl border border-slate-200/90 rounded-sm p-8 sm:p-14 text-slate-900 font-serif leading-relaxed text-[13.5px] relative">
        {/* Top Legal Document Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 mb-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-orange" />
            <span className="font-sans font-bold text-[13px] text-slate-900 tracking-tight">
              ORANGYY DESIGN LLP
            </span>
          </div>
          <div className="text-right">
            <span className="font-sans font-bold text-[10px] uppercase tracking-widest text-slate-500 block">
              OFFICIAL NDA DOCUMENT
            </span>
            {isSigned && (
              <span className="inline-block mt-0.5 px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded font-sans text-[10px] font-bold">
                ✓ OTP E-SIGNED
              </span>
            )}
          </div>
        </div>

        {/* Content Paragraphs */}
        <div className="space-y-4 text-justify">
          {lines.map((line, idx) => {
            const trimmed = line.trim();

            if (!trimmed) {
              return <div key={idx} className="h-2" />;
            }

            // Main Title
            if (trimmed === 'NON DISCLOSURE AGREEMENT' || trimmed === 'MUTUAL NON-DISCLOSURE AGREEMENT') {
              return (
                <h1 key={idx} className="text-center font-bold text-[17px] tracking-wide text-slate-900 my-6">
                  {trimmed}
                </h1>
              );
            }

            // Section titles (1. Confidential Information..., 2. Restrictions..., etc.)
            if (/^\d+\.\s+/.test(trimmed)) {
              return (
                <h3 key={idx} className="font-bold text-[14px] text-slate-900 mt-6 mb-2 underline">
                  {replacePlaceholders(trimmed)}
                </h3>
              );
            }

            // Subsections (a), (b), etc.
            if (/^\([a-z]\)\s+/.test(trimmed)) {
              return (
                <p key={idx} className="pl-4 text-slate-800 leading-relaxed">
                  {replacePlaceholders(trimmed)}
                </p>
              );
            }

            // Bold labels like "Project Reference:"
            if (trimmed.startsWith('Project Reference:')) {
              return (
                <p key={idx} className="text-slate-900 leading-relaxed font-normal">
                  <strong className="font-bold text-slate-900">Project Reference:</strong>{' '}
                  {replacePlaceholders(trimmed.replace('Project Reference:', ''))}
                </p>
              );
            }

            // Closing signatory line
            if (trimmed.startsWith('IN WITNESS WHEREOF') || trimmed === 'Orangyy Design LLP') {
              return (
                <div key={idx} className="pt-4 font-bold text-slate-900">
                  {replacePlaceholders(trimmed)}
                </div>
              );
            }

            return (
              <p key={idx} className="text-slate-800 leading-relaxed">
                {replacePlaceholders(trimmed)}
              </p>
            );
          })}
        </div>

        {/* Bottom Document Footer */}
        <div className="pt-10 border-t border-slate-200 mt-10 flex justify-between items-center text-[10.5px] font-sans text-slate-500 font-medium">
          <span>Orangyy Design LLP — Legal Confidentiality Record</span>
          <span>Security Authentication: OTP E-Sign Verified</span>
        </div>
      </div>
    </div>
  );
}
