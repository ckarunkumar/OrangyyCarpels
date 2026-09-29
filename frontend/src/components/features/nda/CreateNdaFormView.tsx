import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Search,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Strikethrough,
  Baseline,
  Image as ImageIcon,
  Link as LinkIcon,
  Code,
  List,
  ListOrdered,
  Quote,
  AlertCircle,
} from 'lucide-react';
import { Employee, Client } from '../../../types/registry';

export const DEFAULT_OFFICIAL_NDA_HTML = `<p style="text-align: center; font-weight: bold; font-size: 15px; margin-bottom: 20px;">NON DISCLOSURE AGREEMENT</p>

<p>This AGREEMENT is made by and between <strong>Orangyy Design LLP</strong> (the "Company") and _____________________ (the "Recipient") effective as of ____________.</p>

<p style="margin-top: 16px;"><strong>Project Reference:</strong> Information related, but not limited to, development projects and assignments to be performed by the Recipient for the Company.</p>

<p style="margin-top: 16px;">The Company possesses competitively valuable Confidential Information (as hereinafter defined) regarding its current products, future products, research and development, and general business operations. Recipient may enter or has entered into a business relationship with the Company and in connection therewith may need to review or use the Company's Confidential Information and Materials or to create new Confidential Information and Materials for the Company. In consideration of the promises and covenants contained in this Agreement and the disclosure of Confidential Information and Materials from the Company to the Recipient, the parties hereto agree as follows:</p>

<p style="margin-top: 20px;"><strong>1. <u>Confidential Information and Materials</u></strong></p>

<p style="margin-top: 12px;"><strong>(a)</strong> "Confidential Information" shall mean any nonpublic information that the Company specifically marks and designates, either orally or in writing, as confidential or which, under the circumstances surrounding the disclosure, ought to be treated as confidential or which the Recipient creates or produces in the course of performing services for the Company. "Confidential Information" includes, but is not limited to, product schematics or drawings, descriptive material, specifications, software (source code or object code), sales and customer information, the Company's business policies or practices, information received from others that the Company is obligated to treat as confidential, and other materials and information of a confidential nature.</p>

<p style="margin-top: 12px;"><strong>(b)</strong> "Confidential Information" shall not include any materials or information which the Recipient shows: (i) is at the time of disclosure generally known by or available to the public or became so known or available thereafter through no fault of the Recipient; or (ii) is legally known to the Recipient at the time of disclosure by the Company; or (iii) is furnished by the Company to third parties without restriction; or (iv) is furnished to the Recipient by a third party who legally obtained said information and the right to disclose it; or (v) is developed independently by the Recipient either before or after the term of the Recipient’s engagement as a consultant or independent contractor to the Company where the Recipient can document such independent development.</p>

<p style="margin-top: 12px;"><strong>(c)</strong> "Confidential Materials" shall mean all tangible materials containing Confidential Information, including without limitation drawings, schematics, written or printed documents, computer disks, tapes, and compact disks (CD), whether machine or user readable.</p>

<p style="margin-top: 20px;"><strong>2. <u>Restrictions</u></strong></p>

<p style="margin-top: 12px;"><strong>(a)</strong> Recipient shall not disclose any Confidential Information to third parties without the prior written authorization of the Company. Notwithstanding the foregoing, Recipient shall not at any time disclose to any third party any Confidential Information comprising a trade secret of the Company or any Confidential Information of any other party to whom the Company owes an obligation. However, Recipient may disclose Confidential Information in accordance with judicial or other governmental orders, provided Recipient shall give the Company reasonable notice prior to such disclosure and shall comply with any applicable protective order or equivalent.</p>

<p style="margin-top: 12px;"><strong>(b)</strong> Recipient shall not use any Confidential Information or Confidential Materials of the Company for any purposes except those expressly contemplated hereby or as authorized by the Company.</p>

<p style="margin-top: 12px;"><strong>(c)</strong> Recipient shall take reasonable security precautions, which shall in any event be as great as the precautions it takes to protect its own confidential information, to keep confidential the Confidential Information. Recipient may disclose Confidential Information or Confidential Materials only to Recipient's employees or consultants on a need-to-know basis. Recipient shall instruct all employees given access to the information to maintain confidentiality and to refrain from making unauthorized copies. Recipient shall maintain appropriate written agreements with its employees, consultants, parent, subsidiaries, affiliates or related parties, who receive, or have access to, Confidential Information sufficient to enable it to comply with the terms of this Agreement.</p>

<p style="margin-top: 12px;"><strong>(d)</strong> Confidential Information and Confidential Materials may be disclosed, reproduced, summarized or distributed only in pursuance of Recipient's business relationship with the Company, and only as otherwise provided hereunder. Recipient agrees to segregate all such Confidential Materials from the confidential materials of others to prevent commingling.</p>

<p style="margin-top: 20px;"><strong>3. <u>Rights and Remedies</u></strong></p>

<p style="margin-top: 12px;"><strong>(a)</strong> Recipient shall notify the Company immediately upon discovery of any unauthorized use or disclosure of Confidential Information or Confidential Materials, or any other breach of this Agreement by Recipient, and will cooperate with the Company in every reasonable way to help the Company regain possession of the Confidential Information and/or Confidential Materials and prevent further unauthorized use or disclosure.</p>

<p style="margin-top: 12px;"><strong>(b)</strong> Recipient shall return all originals, copies, reproductions and summaries of Confidential Information and/or Confidential Materials then in Recipient's possession or control at the Company's request or, at the Company's option, certify destruction of the same.</p>

<p style="margin-top: 12px;"><strong>(c)</strong> Recipient acknowledges that monetary damages may not be a sufficient remedy for damages resulting from the unauthorized disclosure of Confidential Information and that the Company shall be entitled, without waiving any other rights or remedies, to seek such injunctive or equitable relief as may be deemed proper by a court of competent jurisdiction.</p>

<p style="margin-top: 12px;"><strong>(d)</strong> The Company may visit Recipient's premises, with reasonable prior notice and during normal business hours, to review Recipient's compliance with the terms of this Agreement.</p>

<p style="margin-top: 20px;"><strong>4. <u>Miscellaneous</u></strong></p>

<p style="margin-top: 12px;"><strong>(a)</strong> All Confidential Information and Confidential Materials are and shall remain the sole and exclusive property of the Company. By disclosing information to Recipient, the Company does not grant any express or implied right to Recipient to or under the Company patents, copyrights, trademarks, or trade secret information.</p>

<p style="margin-top: 12px;"><strong>(b)</strong> All Confidential Information and Materials are provided "AS IS" and the Company makes no warranty regarding the accuracy or reliability of such information or materials. The Company does not warrant that it will release any product concerning which information has been disclosed as a part of the Confidential Information or Confidential Materials. The Company will not be liable for any expenses or losses incurred or any action undertaken by the Recipient as a result of the receipt of Confidential Information or Confidential Materials. The entire risk arising out of the use of the Confidential Information and Confidential Materials remains with the Recipient.</p>

<p style="margin-top: 12px;"><strong>(c)</strong> Recipient agrees that it shall adhere to all Indian Export Administration laws and regulations and shall not export or re-export any technical data or products received from the Company or the direct product of such technical data to any proscribed country listed in the Indian Export Administration Regulations unless properly authorized by both the Company and the Indian Government.</p>

<p style="margin-top: 12px;"><strong>(d)</strong> This Agreement constitutes the entire Agreement between the parties with respect to the subject matter hereof. It shall not be modified except by a written agreement dated subsequent to the date of this Agreement and signed by both parties.</p>

<p style="margin-top: 12px;"><strong>(e)</strong> None of the provisions of this Agreement shall be deemed to have been waived by any act or acquiescence on the part of the Company, its agents, or employees but only by an instrument in writing signed by an authorized officer of the Company. No waiver of any provision of this Agreement shall constitute a waiver of any other provision(s) or of the same provision on another occasion. Failure of either party to enforce any provision of this Agreement shall not constitute waiver of such provision or any other provisions of this Agreement.</p>

<p style="margin-top: 12px;"><strong>(f)</strong> If any action at law or in equity is necessary to enforce or interpret the rights arising out of or relating to this Agreement, the prevailing party shall be entitled to recover reasonable attorney's fees, costs and necessary disbursements in addition to any other relief to which it may be entitled.</p>

<p style="margin-top: 12px;"><strong>(g)</strong> This Agreement shall be construed and governed by the laws of the State of Tamilnadu, and both parties further consent to jurisdiction by the state and federal courts sitting in Coimbatore, Tamilnadu.</p>

<p style="margin-top: 12px;"><strong>(h)</strong> If any provision of this Agreement shall be held by a court of competent jurisdiction to be illegal, invalid or unenforceable, the remaining provisions shall remain in full force and effect. Should any of the obligations of this Agreement be found illegal or unenforceable as being too broad with respect to the duration, scope or subject matter thereof, such obligations shall be deemed and construed to be reduced to the maximum duration, scope or subject matter allowable by law.</p>

<p style="margin-top: 12px;"><strong>(i)</strong> All obligations created by this Agreement shall survive change or termination of the parties' business relationship.</p>

<p style="margin-top: 24px;"><strong>IN WITNESS WHEREOF</strong>, the parties hereto have executed this Agreement by their duly authorized representatives as of the date first set forth above.</p>

<p style="margin-top: 24px;"><strong>Orangyy Design LLP</strong></p>`;

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
  const [documentContent, setDocumentContent] = useState(DEFAULT_OFFICIAL_NDA_HTML);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [empSearch, setEmpSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== documentContent) {
      editorRef.current.innerHTML = documentContent;
    }
  }, [documentContent]);

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

  // Rich Text Editor Command Execution
  const execCmd = (command: string, value: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setDocumentContent(editorRef.current.innerHTML);
    }
  };

  const resetToDefaultTemplate = () => {
    if (window.confirm('Reset document text to default official legal template?')) {
      setDocumentContent(DEFAULT_OFFICIAL_NDA_HTML);
      if (editorRef.current) {
        editorRef.current.innerHTML = DEFAULT_OFFICIAL_NDA_HTML;
      }
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

    const finalContent = editorRef.current ? editorRef.current.innerHTML : documentContent;

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
          documentContent: finalContent.trim(),
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
    <div className="w-full space-y-5 animate-in fade-in duration-200 pb-16">
      {/* 1. Standard Application Page Header (Matching Image 1 Header Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-studio-border pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg border border-studio-border bg-white hover:bg-studio-sidebar text-studio-text transition-colors cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-[20px] font-bold tracking-tight text-studio-text">
            {editingNda ? `Edit NDA (${editingNda.ndaCode})` : 'Create New NDA'}
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-studio-border bg-white hover:bg-studio-sidebar text-studio-text rounded-lg text-[12px] font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 bg-brand-orange text-white rounded-lg text-[12px] font-bold hover:bg-opacity-90 transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-2"
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
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 font-semibold text-[12px]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Form Settings (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Basic Details Card */}
          <div className="bg-white border border-studio-border rounded-xl p-5 shadow-2xs space-y-4">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-studio-text border-b border-studio-border pb-2">
              BASIC AGREEMENT DETAILS
            </h3>

            {/* Select Client */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-studio-muted mb-1">
                SELECT CLIENT <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                disabled={Boolean(editingNda)}
                className="w-full px-3 py-2 border border-studio-border rounded-lg focus:outline-none focus:border-brand-orange bg-white text-studio-text font-medium text-[12.5px] disabled:bg-slate-100"
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
              <label className="block text-[11px] font-bold uppercase tracking-wider text-studio-muted mb-1">
                NDA DOCUMENT TITLE <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ndaName}
                onChange={(e) => setNdaName(e.target.value)}
                placeholder="e.g. Mutual Non-Disclosure Agreement - Client"
                className="w-full px-3 py-2 border border-studio-border rounded-lg focus:outline-none focus:border-brand-orange font-medium text-studio-text text-[12.5px]"
              />
            </div>
          </div>

          {/* Assign Employees Card */}
          <div className="bg-white border border-studio-border rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-studio-border pb-2">
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-studio-text">
                ASSIGN EMPLOYEES ({selectedEmployees.length}) <span className="text-red-500">*</span>
              </h3>
              <button
                type="button"
                onClick={handleSelectAllEmployees}
                className="text-[11.5px] font-bold text-brand-orange hover:underline cursor-pointer"
              >
                {selectedEmployees.length === employees.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-studio-muted absolute left-3 top-2.5" />
              <input
                type="text"
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                placeholder="Search employee by name or ID..."
                className="w-full pl-8 pr-3 py-1.5 text-[12px] border border-studio-border rounded-lg focus:outline-none focus:border-brand-orange bg-studio-sidebar/40"
              />
            </div>

            {/* Employee Checkbox List */}
            <div className="border border-studio-border rounded-lg divide-y divide-studio-border/50 max-h-[380px] overflow-y-auto bg-studio-sidebar/20">
              {filteredEmployees.length === 0 ? (
                <p className="text-[12px] text-studio-muted italic p-4 text-center">No matching employees found.</p>
              ) : (
                filteredEmployees.map((emp) => {
                  const isChecked = selectedEmployees.includes(emp.employeeId);
                  return (
                    <label
                      key={emp.employeeId}
                      className={`flex items-center justify-between py-2 px-3 cursor-pointer transition-colors ${
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
                            <span className="text-[12.5px] text-studio-text font-semibold truncate">{emp.fullName}</span>
                            <span className="text-[10px] font-mono font-bold text-slate-600 px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 shrink-0">
                              {emp.employeeId}
                            </span>
                          </div>
                          <p className="text-[11px] text-studio-muted font-mono truncate">
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

        {/* Right Word Document Editor Section (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-100 border border-studio-border rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-studio-border pb-2.5">
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-studio-text">
                Agreement Terms & Text Content
              </h3>

              <button
                type="button"
                onClick={resetToDefaultTemplate}
                className="flex items-center gap-1.5 px-3 py-1 bg-white border border-studio-border hover:bg-slate-50 text-studio-text rounded-lg text-[11.5px] font-semibold transition-colors shadow-2xs shrink-0 cursor-pointer"
                title="Reset to default legal text"
              >
                <RotateCcw className="w-3.5 h-3.5 text-brand-orange" /> Reset Legal Template
              </button>
            </div>

            {/* Functional Rich Text Editor Toolbar */}
            <div className="bg-white border border-studio-border rounded-lg px-3 py-2 flex items-center gap-2 flex-wrap shadow-2xs text-slate-600">
              <button
                type="button"
                onClick={() => execCmd('undo')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                title="Undo"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => execCmd('redo')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                title="Redo"
              >
                <Redo2 className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-slate-200" />

              <button
                type="button"
                onClick={() => execCmd('bold')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 cursor-pointer transition-colors font-bold"
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => execCmd('italic')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => execCmd('underline')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                title="Underline"
              >
                <Underline className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-slate-200" />

              <button
                type="button"
                onClick={() => execCmd('justifyLeft')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                title="Align Left"
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => execCmd('justifyCenter')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                title="Align Center"
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => execCmd('justifyRight')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                title="Align Right"
              >
                <AlignRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => execCmd('justifyFull')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                title="Justify"
              >
                <AlignJustify className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => execCmd('strikeThrough')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                title="Strikethrough"
              >
                <Strikethrough className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => execCmd('foreColor', '#ea580c')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                title="Text Color"
              >
                <Baseline className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-slate-200" />

              <button
                type="button"
                onClick={() => {
                  const url = prompt('Enter image URL:');
                  if (url) execCmd('insertImage', url);
                }}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                title="Insert Image"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = prompt('Enter link URL:');
                  if (url) execCmd('createLink', url);
                }}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                title="Insert Link"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => execCmd('formatBlock', 'pre')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                title="Code"
              >
                <Code className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-slate-200" />

              <button
                type="button"
                onClick={() => execCmd('insertUnorderedList')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                title="Bullet List"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => execCmd('insertOrderedList')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                title="Numbered List"
              >
                <ListOrdered className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => execCmd('formatBlock', 'blockquote')}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                title="Quote"
              >
                <Quote className="w-4 h-4" />
              </button>
            </div>

            {/* Document Container Sheet with Fixed Height and Scrollbar */}
            <div className="bg-[#f1f5f9] p-6 sm:p-10 rounded-xl border border-studio-border flex justify-center h-[650px] overflow-y-auto">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => {
                  if (editorRef.current) {
                    setDocumentContent(editorRef.current.innerHTML);
                  }
                }}
                className="w-full max-w-[800px] bg-white shadow-md border border-slate-200/90 rounded-sm p-10 sm:p-16 min-h-[1056px] text-slate-900 font-sans leading-[1.7] text-[13.5px] focus:outline-none whitespace-normal select-text my-2 shrink-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
