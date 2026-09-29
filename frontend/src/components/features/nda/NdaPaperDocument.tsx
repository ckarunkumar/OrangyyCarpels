import React from 'react';

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
    let result: (string | React.ReactNode)[] = [text];

    // Replace Orangyy Design LLP with bold
    const boldResult: (string | React.ReactNode)[] = [];
    result.forEach((chunk) => {
      if (typeof chunk === 'string') {
        const parts = chunk.split('Orangyy Design LLP');
        parts.forEach((p, idx) => {
          boldResult.push(p);
          if (idx < parts.length - 1) {
            boldResult.push(
              <strong key={`company-${idx}`} className="font-bold text-slate-900">
                Orangyy Design LLP
              </strong>
            );
          }
        });
      } else {
        boldResult.push(chunk);
      }
    });
    result = boldResult;

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

  // If documentContent is HTML markup
  if (documentContent.includes('<p>') || documentContent.includes('<div>') || documentContent.includes('<strong>')) {
    return (
      <div className="bg-[#f1f5f9] p-6 sm:p-10 rounded-xl border border-slate-200 flex justify-center max-h-[650px] overflow-y-auto">
        <div className="w-full max-w-[800px] bg-white shadow-md border border-slate-200/90 rounded-sm p-10 sm:p-16 text-slate-900 font-sans leading-[1.7] text-[13.5px]">
          <div
            className="space-y-4"
            dangerouslySetInnerHTML={{ __html: documentContent }}
          />
        </div>
      </div>
    );
  }

  const lines = documentContent.split('\n');

  return (
    <div className="bg-[#f1f5f9] p-6 sm:p-10 rounded-xl border border-slate-200 flex justify-center max-h-[650px] overflow-y-auto">
      <div className="w-full max-w-[800px] bg-white shadow-md border border-slate-200/90 rounded-sm p-10 sm:p-16 text-slate-900 font-sans leading-[1.7] text-[13.5px] relative">
        {/* Content Paragraphs matching Image 1 layout */}
        <div className="space-y-3.5 text-left">
          {lines.map((line, idx) => {
            const trimmed = line.trim();

            if (!trimmed) {
              return <div key={idx} className="h-1.5" />;
            }

            // Main Title
            if (trimmed === 'NON DISCLOSURE AGREEMENT' || trimmed === 'MUTUAL NON-DISCLOSURE AGREEMENT') {
              return (
                <h1 key={idx} className="text-center font-bold text-[15px] tracking-wide text-slate-900 mb-6">
                  {trimmed}
                </h1>
              );
            }

            // Section titles (1. Confidential Information..., 2. Restrictions..., etc.)
            if (/^\d+\.\s+/.test(trimmed)) {
              return (
                <h3 key={idx} className="font-bold text-[13.5px] text-slate-900 mt-5 mb-1.5 underline">
                  {replacePlaceholders(trimmed)}
                </h3>
              );
            }

            // Subsections (a), (b), etc.
            if (/^\([a-z]\)\s+/.test(trimmed)) {
              const letter = trimmed.substring(0, 3);
              const rest = trimmed.substring(3);
              return (
                <p key={idx} className="text-slate-900 leading-relaxed">
                  <strong className="font-bold text-slate-900">{letter}</strong> {replacePlaceholders(rest)}
                </p>
              );
            }

            // Bold labels like "Project Reference:"
            if (trimmed.startsWith('Project Reference:')) {
              return (
                <p key={idx} className="text-slate-900 leading-relaxed">
                  <strong className="font-bold text-slate-900">Project Reference:</strong>{' '}
                  {replacePlaceholders(trimmed.replace('Project Reference:', ''))}
                </p>
              );
            }

            // Closing signatory line
            if (trimmed.startsWith('IN WITNESS WHEREOF') || trimmed === 'Orangyy Design LLP') {
              return (
                <div key={idx} className="pt-3 font-bold text-slate-900">
                  {replacePlaceholders(trimmed)}
                </div>
              );
            }

            return (
              <p key={idx} className="text-slate-900 leading-relaxed">
                {replacePlaceholders(trimmed)}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}
