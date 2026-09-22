import React from 'react';
import { Landmark } from 'lucide-react';

interface EmployeeFormBankSectionProps {
  form: {
    bankName?: string;
    branchName?: string;
    ifscCode?: string;
    accountNumber?: string;
    accountHolderName?: string;
    accountType?: string;
    upiId?: string;
  };
  set: (key: any) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  inputCls: (hasErr?: boolean) => string;
  labelCls: string;
}

export default function EmployeeFormBankSection({ form, set, inputCls, labelCls }: EmployeeFormBankSectionProps) {
  return (
    <div className="space-y-3">
      <div className="border-b border-studio-border/70 pb-1.5 flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-studio-text uppercase tracking-wider flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5 text-brand-orange" />
          4. Bank & Payout Details
        </h3>
        <span className="text-[11px] text-studio-muted">Official company salary & reimbursement account</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3.5">
        <div>
          <label className={labelCls}>Bank Name</label>
          <input
            type="text"
            placeholder="e.g. HDFC Bank / ICICI Bank"
            value={form.bankName || ''}
            onChange={set('bankName')}
            className={inputCls()}
          />
        </div>

        <div>
          <label className={labelCls}>Branch Name</label>
          <input
            type="text"
            placeholder="e.g. Connaught Place, New Delhi"
            value={form.branchName || ''}
            onChange={set('branchName')}
            className={inputCls()}
          />
        </div>

        <div>
          <label className={labelCls}>IFSC Code</label>
          <input
            type="text"
            placeholder="HDFC0001234"
            maxLength={11}
            value={form.ifscCode || ''}
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase();
              set('ifscCode')(e);
            }}
            className={`${inputCls()} font-mono uppercase`}
          />
        </div>

        <div>
          <label className={labelCls}>Account Number</label>
          <input
            type="text"
            placeholder="e.g. 50100234567890"
            value={form.accountNumber || ''}
            onChange={set('accountNumber')}
            className={`${inputCls()} font-mono`}
          />
        </div>

        <div>
          <label className={labelCls}>Account Holder Name</label>
          <input
            type="text"
            placeholder="Name as per Bank Record"
            value={form.accountHolderName || ''}
            onChange={set('accountHolderName')}
            className={inputCls()}
          />
        </div>

        <div>
          <label className={labelCls}>Account Type</label>
          <select
            value={form.accountType || 'Savings'}
            onChange={set('accountType')}
            className={inputCls()}
          >
            <option value="Savings">Savings Account</option>
            <option value="Current">Current Account</option>
            <option value="Salary">Salary Account</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <label className={labelCls}>UPI ID / VPA (Optional)</label>
          <input
            type="text"
            placeholder="username@okhdfcbank / mobile@upi"
            value={form.upiId || ''}
            onChange={set('upiId')}
            className={`${inputCls()} font-mono`}
          />
        </div>
      </div>
    </div>
  );
}
