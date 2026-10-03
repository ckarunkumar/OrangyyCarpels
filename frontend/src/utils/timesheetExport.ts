import { ProjectTimesheetItem } from '../components/features/TimesheetsView';

export interface ExportEntry {
  sno?: string;
  date: string;
  dayLabel: string;
  description: string;
  task?: string;
  hours: number;
  isBillable?: boolean;
  resourceName?: string;
}

const formatMonthName = (monthStr: string) => {
  const [y, m] = monthStr.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

function parseDateAndDay(dayLabel: string, dateStr: string) {
  if (dayLabel) {
    const match = dayLabel.match(/^(.*?)(?:\s*\((.*?)\))?$/);
    if (match) {
      const datePart = match[1].trim();
      const dayPart = match[2] ? match[2].trim() : '';
      if (dayPart) return { date: datePart, day: dayPart };
    }
  }
  const dObj = new Date(dateStr);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayPart = !isNaN(dObj.getTime()) ? days[dObj.getDay()] : '';
  return { date: dayLabel || dateStr, day: dayPart };
}

/**
 * Exports timesheet data to a structured CSV / Excel spreadsheet.
 */
export function exportTimesheetToExcel(
  project: ProjectTimesheetItem,
  month: string,
  entries: ExportEntry[],
  _totalHours?: number
) {
  const monthName = formatMonthName(month);
  const validEntries = entries.filter((e) => (Number(e.hours) || 0) > 0);
  const actualTotal = validEntries.reduce((sum, e) => sum + (Number(e.hours) || 0), 0);

  const rows: string[][] = [
    ['ORANGYY DESIGN — MONTHLY TIMESHEET REPORT'],
    [''],
    ['Project Name', project.projectName || '', 'Month / Period', monthName],
    ['Total Hours', `${actualTotal}h`],
    [''],
    ['Date', 'Day', 'Time', 'Remark', 'Resource'],
  ];

  validEntries.forEach((e) => {
    const { date, day } = parseDateAndDay(e.dayLabel, e.date);
    rows.push([
      date,
      day,
      String(e.hours || 0),
      `"${(e.description || '—').replace(/"/g, '""')}"`,
      `"${(e.resourceName || '—').replace(/"/g, '""')}"`,
    ]);
  });

  rows.push(['']);
  rows.push(['', '', `${actualTotal}h`, 'TOTAL HOURS', '']);
  rows.push(['EXPORTED AT', '', new Date().toLocaleString(), '', '']);

  const csvContent = '\uFEFF' + rows.map((r) => r.join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Timesheet_${(project.projectName || 'Project').replace(/\s+/g, '_')}_${month}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates and triggers browser print for a clean studio PDF report.
 */
export function exportTimesheetToPDF(
  project: ProjectTimesheetItem,
  month: string,
  entries: ExportEntry[],
  _totalHours?: number
) {
  const monthName = formatMonthName(month);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export printable PDF.');
    return;
  }

  // Filter out days with 0 hours logged and empty descriptions
  const validEntries = entries.filter((e) => (Number(e.hours) || 0) > 0);

  // Recalculate actual total hours from included work log entries
  const actualTotalHours = validEntries.reduce((sum, e) => sum + (Number(e.hours) || 0), 0);

  const rowsHtml = validEntries
    .map(
      (e) => `
      <tr style="border-bottom: 1px solid #e5e7eb; font-size: 11px;">
        <td style="padding: 8px 10px; font-weight: 600; text-align: left; white-space: nowrap;">${e.dayLabel || e.date}</td>
        <td style="padding: 8px 10px; font-weight: 600; color: #111827;">${e.resourceName || '—'}</td>
        <td style="padding: 8px 10px; color: #374151;">${e.description || '—'}</td>
        <td style="padding: 8px 10px; text-align: right; font-family: monospace; font-weight: 700;">${e.hours || 0}h</td>
      </tr>`
    )
    .join('');

  const logoUrl = `${window.location.origin}/orangyy-design-logo.png`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Timesheet - ${project.projectName} (${monthName})</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; margin: 0; padding: 20px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #FF5C00; padding-bottom: 12px; margin-bottom: 16px; }
          .logo-img { height: 42px; width: auto; object-fit: contain; display: block; }
          .grid-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; font-size: 11px; }
          .meta-item label { display: block; font-size: 9px; font-weight: 700; color: #6b7280; text-transform: uppercase; }
          .meta-item span { font-weight: 600; color: #111827; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th { background: #f3f4f6; text-align: left; padding: 8px 10px; font-size: 10px; font-weight: 700; color: #4b5563; text-transform: uppercase; border-bottom: 1px solid #d1d5db; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <img src="${logoUrl}" alt="orangyy design." class="logo-img" />
          </div>
          <div style="text-align: right;">
            <div style="font-size: 16px; font-weight: 700; color: #111827;">${project.projectName}</div>
          </div>
        </div>

        <div class="grid-meta">
          <div class="meta-item" style="text-align: left;"><label>Project Name</label><span>${project.projectName}</span></div>
          <div class="meta-item" style="text-align: center;"><label>Month / Period</label><span>${monthName}</span></div>
          <div class="meta-item" style="text-align: right;"><label>Total Hours</label><span style="color: #FF5C00; font-weight: 700;">${actualTotalHours}h</span></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 20%;">Date</th>
              <th style="width: 20%;">Resource</th>
              <th style="width: 45%;">Work Description</th>
              <th style="width: 15%; text-align: right;">Hours Logged</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e5e7eb; padding-top: 14px; margin-top: 12px;">
          <div style="font-size: 10.5px; color: #6b7280; font-weight: 500;">
            Time Sheet Generated on ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} via Orangyy Carpels
          </div>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 16px; font-size: 12px; font-weight: 700;">
            TOTAL HOURS: <span style="color: #FF5C00; font-family: monospace;">${actualTotalHours}h</span>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 250);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
