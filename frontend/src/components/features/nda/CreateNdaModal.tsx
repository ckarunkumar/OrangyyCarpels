import React, { useState, useEffect } from 'react';
import { X, FileText, AlertCircle } from 'lucide-react';
import { Employee, Client } from '../../../types/registry';

interface CreateNdaModalProps {
  open: boolean;
  clientId?: string;
  clients: Client[];
  employees: Employee[];
  onClose: () => void;
  onCreated: (msg: string) => void;
}

export default function CreateNdaModal({
  open,
  clientId,
  clients,
  employees,
  onClose,
  onCreated,
}: CreateNdaModalProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [ndaName, setNdaName] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clientId) {
      setSelectedClientId(clientId);
    } else if (clients.length > 0) {
      setSelectedClientId(clients[0].id);
    }
  }, [clientId, clients]);

  useEffect(() => {
    const selectedClientObj = clients.find((c) => c.id === selectedClientId);
    const clientName = selectedClientObj?.name || 'Client';
    setNdaName(`Mutual Non-Disclosure Agreement - ${clientName}`);
    setDocumentContent(
      `MUTUAL NON-DISCLOSURE AGREEMENT (NDA)\n\n` +
      `This Non-Disclosure Agreement ("Agreement") is made effective as of the date of e-signature, by and between Orangyy Design Private Limited ("Company") and ${clientName} ("Client").\n\n` +
      `1. CONFIDENTIAL INFORMATION\n` +
      `The recipient agrees to hold and maintain in strict confidence all proprietary technical, financial, and business information disclosed in connection with project deliverables.\n\n` +
      `2. OBLIGATIONS OF EMPLOYEES\n` +
      `Assigned team members shall not duplicate, transmit, or disclose any confidential information to unauthorized third parties without prior written consent.\n\n` +
      `3. E-SIGNATURE AUTHENTICATION\n` +
      `Signature verification is executed via 6-digit OTP delivered to the employee's verified personal email address on record. OTP verification constitutes a binding electronic signature.`
    );
  }, [selectedClientId, clients]);

  if (!open) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      setError('Please select a client.');
      return;
    }
    if (!ndaName.trim()) {
      setError('NDA Name is required.');
      return;
    }
    if (selectedEmployees.length === 0) {
      setError('Please assign at least one employee.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/ndas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          ndaName: ndaName.trim(),
          documentContent: documentContent.trim(),
          employeeIds: selectedEmployees,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create NDA');

      onCreated(`New NDA "${data.ndaCode}" created successfully and assigned to ${selectedEmployees.length} employee(s).`);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error creating NDA');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Slide-over Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300"
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed top-0 right-0 z-50 h-full w-full max-w-[560px] bg-white shadow-2xl flex flex-col transition-transform duration-300 animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-border bg-studio-sidebar shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-50 text-brand-orange border border-orange-100">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-studio-text">Create New NDA</h3>
              <p className="text-[11.5px] text-studio-muted font-medium">Assign NDA document to employees for OTP e-signing</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-studio-muted hover:text-studio-text hover:bg-studio-bg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-[12.5px]">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 font-semibold text-[12px]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Select Client */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-studio-muted mb-1">
              Select Client <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3 py-2 border border-studio-border rounded-lg focus:outline-none focus:border-brand-orange bg-white text-studio-text font-medium text-[12.5px]"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id})
                </option>
              ))}
            </select>
          </div>

          {/* NDA Name */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-studio-muted mb-1">
              NDA Document Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={ndaName}
              onChange={(e) => setNdaName(e.target.value)}
              placeholder="e.g. Mutual Non-Disclosure Agreement - Client"
              className="w-full px-3 py-2 border border-studio-border rounded-lg focus:outline-none focus:border-brand-orange font-medium text-studio-text text-[12.5px]"
            />
          </div>

          {/* Document Content */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-studio-muted mb-1">
              Agreement Terms & Text Content <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={6}
              value={documentContent}
              onChange={(e) => setDocumentContent(e.target.value)}
              className="w-full px-3 py-2 border border-studio-border rounded-lg focus:outline-none focus:border-brand-orange font-mono text-[11.5px] text-slate-700 bg-studio-sidebar/30 leading-relaxed"
            />
          </div>

          {/* Assign Employees */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-studio-muted">
                Assign Employees ({selectedEmployees.length}) <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleSelectAllEmployees}
                className="text-[11px] font-semibold text-brand-orange hover:underline cursor-pointer"
              >
                {selectedEmployees.length === employees.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="border border-studio-border rounded-lg p-2 max-h-48 overflow-y-auto divide-y divide-studio-border/50 bg-studio-sidebar/20 space-y-1">
              {employees.length === 0 ? (
                <p className="text-[11.5px] text-studio-muted italic p-2 text-center">No active employees found.</p>
              ) : (
                employees.map((emp) => {
                  const isChecked = selectedEmployees.includes(emp.employeeId);
                  return (
                    <label
                      key={emp.employeeId}
                      className="flex items-center justify-between py-1.5 px-2.5 hover:bg-white rounded cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEmployee(emp.employeeId)}
                          className="rounded text-brand-orange focus:ring-brand-orange cursor-pointer"
                        />
                        <span className="font-semibold text-studio-text">{emp.fullName}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-500 px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200">
                          {emp.employeeId}
                        </span>
                      </div>
                      <span className="text-[11px] text-studio-muted font-mono truncate max-w-[180px]">
                        {emp.personalEmail || emp.email || 'No email'}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-studio-border bg-studio-sidebar flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-studio-muted hover:text-studio-text hover:bg-studio-bg rounded-lg text-[12px] font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 bg-brand-orange text-white rounded-lg text-[12px] font-bold hover:bg-opacity-90 transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            {submitting ? 'Creating NDA...' : 'Save & Assign NDA'}
          </button>
        </div>
      </div>
    </>
  );
}
