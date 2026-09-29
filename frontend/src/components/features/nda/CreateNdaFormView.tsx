import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  FileText,
  AlertCircle,
  UserCheck,
  Calendar,
  RotateCcw,
  CheckCircle2,
  Users,
  Search,
} from 'lucide-react';
import { Employee, Client } from '../../../types/registry';

export const DEFAULT_OFFICIAL_NDA_TEXT = `NON DISCLOSURE AGREEMENT

This AGREEMENT is made by and between Orangyy Design LLP (the "Company") and _____________________ (the "Recipient") effective as of ____________.

Project Reference: Information related, but not limited to, development projects and assignments to be performed by the Recipient for the Company.

The Company possesses competitively valuable Confidential Information (as hereinafter defined) regarding its current products, future products, research and development, and general business operations.  Recipient may enter or has entered into a business relationship with the Company and in connection therewith may need to review or use the Company's Confidential Information and Materials or to create new Confidential Information and Materials for the Company.  In consideration of the promises and covenants contained in this Agreement and the disclosure of Confidential Information and Materials from the Company to the Recipient, the parties hereto agree as follows:

1. Confidential Information and Materials

(a)  "Confidential Information" shall mean any nonpublic information that the Company specifically marks and designates, either orally or in writing, as confidential or which, under the circumstances surrounding the disclosure, ought to be treated as confidential or which the Recipient creates or produces in the course of performing services for the Company.  "Confidential Information" includes, but is not limited to, product schematics or drawings, descriptive material, specifications, software (source code or object code), sales and customer information, the Company's business policies or practices, information received from others that the Company is obligated to treat as confidential, and other materials and information of a confidential nature.

(b)  "Confidential Information" shall not include any materials or information which the Recipient shows: (i) is at the time of disclosure generally known by or available to the public or became so known or available thereafter through no fault of the Recipient; or (ii) is legally known to the Recipient at the time of disclosure by the Company; or (iii) is furnished by the Company to third parties without restriction; or (iv) is furnished to the Recipient by a third party who legally obtained said information and the right to disclose it; or (v) is developed independently by the Recipient either before or after the term of the Recipient’s engagement as a consultant or independent contractor to the Company where the Recipient can document such independent development.

(c) "Confidential Materials" shall mean all tangible materials containing Confidential Information, including without limitation drawings, schematics, written or printed documents, computer disks, tapes, and compact disks (CD), whether machine or user readable.

2. Restrictions

(a)  Recipient shall not disclose any Confidential Information to third parties without the prior written authorization of the Company.  Notwithstanding the foregoing, Recipient shall not at any time disclose to any third party any Confidential Information comprising a trade secret of the Company or any Confidential Information of any other party to whom the Company owes an obligation.  However, Recipient may disclose Confidential Information in accordance with judicial or other governmental orders, provided Recipient shall give the Company reasonable notice prior to such disclosure and shall comply with any applicable protective order or equivalent.

(b)Recipient shall not use any Confidential Information or Confidential Materials of the Company for any purposes except those expressly contemplated hereby or as authorized by the Company.

(c)  Recipient shall take reasonable security precautions, which shall in any event be as great as the precautions it takes to protect its own confidential information, to keep confidential the Confidential Information.  Recipient may disclose Confidential Information or Confidential Materials only to Recipient's employees or consultants on a need-to-know basis.  Recipient shall instruct all employees given access to the information to maintain confidentiality and to refrain from making unauthorized copies.  Recipient shall maintain appropriate written agreements with its employees, consultants, parent, subsidiaries, affiliates or related parties, who receive, or have access to, Confidential Information sufficient to enable it to comply with the terms of this Agreement.

(d)  Confidential Information and Confidential Materials may be disclosed, reproduced, summarized or distributed only in pursuance of Recipient's business relationship with the Company, and only as otherwise provided hereunder.  Recipient agrees to segregate all such Confidential Materials from the confidential materials of others to prevent commingling.

3.  Rights and Remedies

(a) Recipient shall notify the Company immediately upon discovery of any unauthorized use or disclosure of Confidential Information or Confidential Materials, or any other breach of this Agreement by Recipient, and will cooperate with the Company in every reasonable way to help the Company regain possession of the Confidential Information and/or Confidential Materials and prevent further unauthorized use or disclosure.

(b) Recipient shall return all originals, copies, reproductions and summaries of Confidential Information and/or Confidential Materials then in Recipient's possession or control at the Company's request or, at the Company's option, certify destruction of the same.

(c) Recipient acknowledges that monetary damages may not be a sufficient remedy for damages resulting from the unauthorized disclosure of Confidential Information and that the Company shall be entitled, without waiving any other rights or remedies, to seek such injunctive or equitable relief as may be deemed proper by a court of competent jurisdiction.

(d) The Company may visit Recipient's premises, with reasonable prior notice and during normal business hours, to review Recipient's compliance with the terms of this Agreement.


4. Miscellaneous

(a) All Confidential Information and Confidential Materials are and shall remain the sole and exclusive property of the Company.  By disclosing information to Recipient, the Company does not grant any express or implied right to Recipient to or under the Company patents, copyrights, trademarks, or trade secret information.

(b) All Confidential Information and Materials are provided "AS IS" and the Company makes no warranty regarding the accuracy or reliability of such information or materials.  The Company does not warrant that it will release any product concerning which information has been disclosed as a part of the Confidential Information or Confidential Materials.  The Company will not be liable for any expenses or losses incurred or any action undertaken by the Recipient as a result of the receipt of Confidential Information or Confidential Materials.  The entire risk arising out of the use of the Confidential Information and Confidential Materials remains with the Recipient.

(c) Recipient agrees that it shall adhere to all Indian Export Administration laws and regulations and shall not export or re-export any technical data or products received from the Company or the direct product of such technical data to any proscribed country listed in the Indian Export Administration Regulations unless properly authorized by  both the Company and the Indian Government.

(d)  This Agreement constitutes the entire Agreement between the parties with respect to the subject matter hereof.  It shall not be modified except by a written agreement dated subsequent to the date of this Agreement and signed by both parties. 

(e)  None of the provisions of this Agreement shall be deemed to have been waived by any act or acquiescence on the part of the Company, its agents, or employees but only by an instrument in writing signed by an authorized officer of the Company.  No waiver of any provision of this Agreement shall constitute a waiver of any other provision(s) or of the same provision on another occasion.  Failure of either party to enforce any provision of this Agreement shall not constitute waiver of such provision or any other provisions of this Agreement.

(f)  If any action at law or in equity is necessary to enforce or interpret the rights arising out of or relating to this Agreement, the prevailing party shall be entitled to recover reasonable attorney's fees, costs and necessary disbursements in addition to any other relief to which it may be entitled.

(g)  This Agreement shall be construed and governed by the laws of the State of Tamilnadu, and both parties further consent to jurisdiction by the state and federal courts sitting in Coimbatore, Tamilnadu.

(h)  If any provision of this Agreement shall be held by a court of competent jurisdiction to be illegal, invalid or unenforceable, the remaining provisions shall remain in full force and effect.  Should any of the obligations of this Agreement be found illegal or unenforceable as being too broad with respect to the duration, scope or subject matter thereof, such obligations shall be deemed and construed to be reduced to the maximum duration, scope or subject matter allowable by law.

(i)  All obligations created by this Agreement shall survive change or termination of the parties' business relationship.

IN WITNESS WHEREOF, the parties hereto have executed this Agreement by their duly authorized representatives as of the date first set forth above.



Orangyy Design LLP`;

export interface EditingNDAData {
  id: string;
  ndaCode: string;
  ndaName: string;
  documentContent?: string;
  employeeIds?: string[];
}

interface CreateNdaFormViewProps {
  clientId?: string;
  clients: Client[];
  employees: Employee[];
  editingNda?: EditingNDAData | null;
  onCancel: () => void;
  onCreated: (msg: string) => void;
}

export default function CreateNdaFormView({
  clientId,
  clients,
  employees,
  editingNda,
  onCancel,
  onCreated,
}: CreateNdaFormViewProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [ndaName, setNdaName] = useState('');
  const [documentContent, setDocumentContent] = useState(DEFAULT_OFFICIAL_NDA_TEXT);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [empSearch, setEmpSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingNda) {
      setNdaName(editingNda.ndaName);
      if (editingNda.documentContent) {
        setDocumentContent(editingNda.documentContent);
      }
      if (editingNda.employeeIds) {
        setSelectedEmployees(editingNda.employeeIds);
      }
    } else {
      if (clientId) {
        setSelectedClientId(clientId);
      } else if (clients.length > 0) {
        setSelectedClientId(clients[0].id);
      }
    }
  }, [editingNda, clientId, clients]);

  useEffect(() => {
    if (!editingNda && selectedClientId) {
      const selectedClientObj = clients.find((c) => c.id === selectedClientId);
      const clientName = selectedClientObj?.name || 'Client';
      setNdaName(`Mutual Non-Disclosure Agreement - ${clientName}`);
    }
  }, [selectedClientId, clients, editingNda]);

  const toggleEmployee = (empId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleSelectAllEmployees = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map((e) => e.employeeId));
    }
  };

  // Insert helper tags into textarea
  const insertTag = (tag: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const current = documentContent;
    const updated = current.substring(0, start) + tag + current.substring(end);
    setDocumentContent(updated);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + tag.length, start + tag.length);
      }
    }, 50);
  };

  const resetToDefaultTemplate = () => {
    if (window.confirm('Reset document text to default official legal template?')) {
      setDocumentContent(DEFAULT_OFFICIAL_NDA_TEXT);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId && !editingNda) {
      setError('Please select a client.');
      return;
    }
    if (!ndaName.trim()) {
      setError('NDA Document Title is required.');
      return;
    }
    if (selectedEmployees.length === 0) {
      setError('Please assign at least one employee.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const url = editingNda ? `/api/ndas/${editingNda.id}` : '/api/ndas';
      const method = editingNda ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          ndaName: ndaName.trim(),
          documentContent: documentContent.trim(),
          employeeIds: selectedEmployees,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${editingNda ? 'update' : 'create'} NDA`);

      onCreated(
        editingNda
          ? `NDA "${editingNda.ndaCode}" updated successfully.`
          : `New NDA "${data.ndaCode}" created successfully and assigned to ${selectedEmployees.length} employee(s).`
      );
      onCancel();
    } catch (err: any) {
      setError(err.message || 'Error saving NDA');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(
    (e) =>
      !empSearch ||
      e.fullName.toLowerCase().includes(empSearch.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(empSearch.toLowerCase()) ||
      (e.personalEmail && e.personalEmail.toLowerCase().includes(empSearch.toLowerCase()))
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200 pb-16">
      {/* Top Header Card */}
      <div className="bg-white border border-studio-border rounded-xl p-5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
              title="Back to NDA List"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-50 text-brand-orange border border-orange-100 shadow-2xs">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">
                  {editingNda ? `Edit NDA: ${editingNda.ndaCode}` : 'Create New NDA'}
                </h2>
                <p className="text-[12px] text-slate-500 font-medium">
                  {editingNda
                    ? 'Update agreement terms and employee assignments'
                    : 'Assign NDA document to employees for OTP e-signing in formal paper document format'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-[12.5px] font-bold text-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-brand-orange text-white rounded-lg text-[12.5px] font-bold hover:bg-opacity-90 transition-colors shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {submitting ? (
                'Saving...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Save & Assign NDA
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 font-semibold text-[12.5px]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Settings & Paper Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Settings & Employee Selection (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Client & Title Form */}
          <div className="bg-white border border-studio-border rounded-xl p-5 shadow-2xs space-y-4">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-orange" /> Basic Agreement Details
            </h3>

            {/* Select Client */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Select Client <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                disabled={Boolean(editingNda)}
                className="w-full px-3.5 py-2.5 border border-studio-border rounded-lg focus:outline-none focus:border-brand-orange bg-white text-slate-900 font-semibold text-[13px] shadow-2xs disabled:bg-slate-100"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id})
                  </option>
                ))}
              </select>
            </div>

            {/* NDA Title */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                NDA Document Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ndaName}
                onChange={(e) => setNdaName(e.target.value)}
                placeholder="e.g. Mutual Non-Disclosure Agreement - Client"
                className="w-full px-3.5 py-2.5 border border-studio-border rounded-lg focus:outline-none focus:border-brand-orange font-medium text-slate-900 text-[13px] shadow-2xs"
              />
            </div>
          </div>

          {/* Assign Employees */}
          <div className="bg-white border border-studio-border rounded-xl p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-orange" /> Assign Employees ({selectedEmployees.length}) <span className="text-red-500">*</span>
              </h3>
              <button
                type="button"
                onClick={handleSelectAllEmployees}
                className="text-[11.5px] font-bold text-brand-orange hover:underline cursor-pointer"
              >
                {selectedEmployees.length === employees.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Search Employee input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                placeholder="Search employee by name or ID..."
                className="w-full pl-8 pr-3 py-1.5 text-[12px] border border-studio-border rounded-lg focus:outline-none focus:border-brand-orange bg-slate-50/50"
              />
            </div>

            {/* Employee List */}
            <div className="border border-studio-border rounded-lg divide-y divide-studio-border/50 max-h-[380px] overflow-y-auto bg-slate-50/30">
              {filteredEmployees.length === 0 ? (
                <p className="text-[12px] text-slate-500 italic p-4 text-center">No matching employees found.</p>
              ) : (
                filteredEmployees.map((emp) => {
                  const isChecked = selectedEmployees.includes(emp.employeeId);
                  return (
                    <label
                      key={emp.employeeId}
                      className={`flex items-center justify-between py-2.5 px-3 cursor-pointer transition-colors ${
                        isChecked ? 'bg-orange-50/60 font-semibold' : 'hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEmployee(emp.employeeId)}
                          className="rounded text-brand-orange focus:ring-brand-orange cursor-pointer w-4 h-4 shrink-0"
                        />
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="text-[12.5px] text-slate-900 font-semibold truncate">{emp.fullName}</span>
                            <span className="text-[10px] font-mono font-bold text-slate-600 px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 shrink-0">
                              {emp.employeeId}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono truncate">
                            {emp.personalEmail || emp.email || 'No email registered'}
                          </p>
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Authentic Word / Paper Document Format Editor (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-100 border border-slate-300/80 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-brand-orange" /> Agreement Terms & Text Content (Document Format View)
                </h3>
                <p className="text-[11.5px] text-slate-500 mt-0.5">
                  Super Admin Word Document Editor — Styled in official paper layout
                </p>
              </div>

              <button
                type="button"
                onClick={resetToDefaultTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-[11.5px] font-semibold transition-colors shadow-2xs shrink-0 cursor-pointer"
                title="Reset to default legal text"
              >
                <RotateCcw className="w-3.5 h-3.5 text-brand-orange" /> Reset Legal Template
              </button>
            </div>

            {/* Word Toolbar */}
            <div className="bg-white border border-slate-300 rounded-lg p-2 flex items-center gap-1 flex-wrap shadow-2xs text-slate-700">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 px-2 border-r border-slate-200">
                Word Editor Toolbar
              </span>

              {/* Formatting helper buttons */}
              <button
                type="button"
                onClick={() => insertTag('_____________________')}
                className="flex items-center gap-1 px-2.5 py-1 text-[11.5px] font-bold bg-orange-50 text-brand-orange border border-orange-200 hover:bg-orange-100 rounded transition-colors cursor-pointer"
                title="Insert Recipient Name Placeholder"
              >
                <UserCheck className="w-3.5 h-3.5" /> + Recipient Name
              </button>

              <button
                type="button"
                onClick={() => insertTag('____________')}
                className="flex items-center gap-1 px-2.5 py-1 text-[11.5px] font-bold bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                title="Insert Effective Date Placeholder"
              >
                <Calendar className="w-3.5 h-3.5" /> + Date Placeholder
              </button>

              <div className="h-4 w-px bg-slate-200 mx-1" />

              <span className="text-[11px] text-slate-500 font-medium px-1">
                Placeholders: <code className="bg-amber-50 text-amber-900 border border-amber-200 px-1 py-0.5 rounded text-[10.5px] font-mono">_____________________</code> (Recipient Name) & <code className="bg-amber-50 text-amber-900 border border-amber-200 px-1 py-0.5 rounded text-[10.5px] font-mono">____________</code> (Signing Date)
              </span>
            </div>

            {/* Paper Document Container Sheet (Simulating Image 2 Layout) */}
            <div className="bg-slate-300/40 p-4 sm:p-8 rounded-xl border border-slate-300 flex justify-center overflow-x-auto">
              <div className="w-full max-w-[800px] bg-white shadow-xl border border-slate-200/90 rounded-sm p-8 sm:p-14 min-h-[900px] flex flex-col justify-between text-slate-900 font-serif leading-relaxed text-[13.5px] relative">
                {/* Paper Top Decorative Header */}
                <div className="text-center pb-6 border-b border-slate-200 mb-6">
                  <div className="text-[10px] font-mono font-bold tracking-[0.25em] text-slate-400 uppercase">
                    OFFICIAL LEGAL DOCUMENT SHEET
                  </div>
                </div>

                {/* Textarea disguised as exact Paper Document Text */}
                <textarea
                  ref={textareaRef}
                  rows={28}
                  value={documentContent}
                  onChange={(e) => setDocumentContent(e.target.value)}
                  className="w-full h-full min-h-[750px] bg-transparent resize-y focus:outline-none font-serif text-[13.5px] text-slate-900 leading-relaxed tracking-normal p-0 border-none select-text"
                  placeholder="Enter Agreement Terms & Content here..."
                  style={{ tabSize: 4 }}
                />

                {/* Paper Bottom Footer */}
                <div className="pt-8 border-t border-slate-200 mt-8 flex justify-between items-center text-[10.5px] font-sans text-slate-400 font-medium">
                  <span>ORANGYY DESIGN LLP — CONFIDENTIAL</span>
                  <span>PAGE 1 OF 1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
