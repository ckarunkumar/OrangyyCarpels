import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { prisma } from '../../lib/prisma';
import crypto from 'crypto';
import { sendNdaOtpEmail } from '../../utils/emailService';

function maskPersonalEmail(email?: string | null): string {
  if (!email || !email.includes('@')) return '—';
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name.substring(0, 2)}***${name[name.length - 1]}@${domain}`;
}

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export const ndaRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // 1. Level 1 - Client List Summary (SA view)
  fastify.get('/ndas/clients-summary', async (request, reply) => {
    try {
      const clients = await prisma.client.findMany({
        orderBy: { name: 'asc' },
      });

      const summaryList = await Promise.all(
        clients.map(async (c) => {
          const ndasCount = await prisma.nDA.count({
            where: { clientId: c.id },
          });

          const assignments = await prisma.nDAAssignment.findMany({
            where: { nda: { clientId: c.id } },
            select: { employeeId: true },
          });

          const uniqueAssignedEmployees = new Set(assignments.map((a) => a.employeeId)).size;

          return {
            clientId: c.id,
            clientCode: c.id,
            clientName: c.name,
            assignedEmployeesCount: uniqueAssignedEmployees,
            ndasCount,
          };
        })
      );

      return summaryList;
    } catch (err: any) {
      return reply.status(500).send({ error: err.message || 'Failed to fetch clients NDA summary' });
    }
  });

  // 2. Level 2 - Client's NDA List
  fastify.get('/ndas/client/:clientId', async (request, reply) => {
    try {
      const { clientId } = request.params as { clientId: string };
      const ndas = await prisma.nDA.findMany({
        where: { clientId },
        include: {
          assignments: true,
          client: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const formatted = ndas.map((nda) => {
        const totalCount = nda.assignments.length;
        const signedCount = nda.assignments.filter((a) => a.status === 'Signed').length;
        const assignedEmployeeNames = nda.assignments.map((a) => a.employeeName);

        let computedStatus = nda.status;
        if (nda.status !== 'Closed') {
          if (signedCount === 0) {
            computedStatus = 'Draft';
          } else if (signedCount === totalCount && totalCount > 0) {
            computedStatus = `Submitted (${signedCount}/${totalCount})`;
          } else {
            computedStatus = `Partially Submitted (${signedCount}/${totalCount})`;
          }
        }

        return {
          id: nda.id,
          ndaCode: nda.ndaCode,
          ndaName: nda.ndaName,
          clientId: nda.clientId,
          clientName: nda.client?.name || '',
          createdAt: nda.createdAt,
          submittedAt: nda.submittedAt,
          closedAt: nda.closedAt,
          status: computedStatus,
          rawStatus: nda.status,
          totalCount,
          signedCount,
          assignedEmployeeNames,
        };
      });

      return formatted;
    } catch (err: any) {
      return reply.status(500).send({ error: err.message || 'Failed to fetch client NDAs' });
    }
  });

  // 3. Create New NDA (SA endpoint)
  fastify.post('/ndas', async (request, reply) => {
    try {
      const body = request.body as {
        clientId: string;
        ndaName: string;
        documentContent?: string;
        employeeIds: string[];
      };

      if (!body.clientId || !body.ndaName || !body.employeeIds || body.employeeIds.length === 0) {
        return reply.status(400).send({ error: 'Client, NDA name, and assigned employees are required' });
      }

      const client = await prisma.client.findUnique({ where: { id: body.clientId } });
      if (!client) {
        return reply.status(404).send({ error: 'Client not found' });
      }

      // Auto-generate NDA code (e.g. NDA0001)
      const count = await prisma.nDA.count();
      const ndaCode = `NDA${String(count + 1).padStart(4, '0')}`;

      const createdBy = request.user?.userId ? String(request.user.userId) : 'SA';

      const nda = await prisma.nDA.create({
        data: {
          ndaCode,
          ndaName: body.ndaName,
          clientId: body.clientId,
          documentContent: body.documentContent || `NON-DISCLOSURE AGREEMENT\n\nThis Non-Disclosure Agreement ("Agreement") is entered into for ${client.name}.\n\n1. Confidentiality: The undersigned employee agrees to protect all proprietary technical and commercial information.\n2. Scope: Covers all source code, business logic, client communications, and design specifications.\n3. Governing Law: This agreement shall be governed in accordance with studio policies.\n\nBy completing OTP verification, the employee legally signs this agreement.`,
          status: 'Draft',
          createdBy,
          createdByName: request.user?.email || 'Super Admin',
        },
      });

      // Create NDAAssignments & persistent notifications for employees
      for (const empId of body.employeeIds) {
        const emp = await prisma.employee.findUnique({ where: { employeeId: empId } });
        const empName = emp ? emp.fullName : empId;
        const pEmail = emp?.personalEmail || emp?.email || `${empId.toLowerCase()}@personal.com`;

        await prisma.nDAAssignment.create({
          data: {
            ndaId: nda.id,
            employeeId: empId,
            employeeName: empName,
            personalEmail: pEmail,
            status: 'Pending',
          },
        });

        // Create persistent notification
        await prisma.notification.create({
          data: {
            role: 'Employee',
            userId: empId,
            title: `NDA E-Signing Required: ${nda.ndaName}`,
            message: `You have been assigned ${ndaCode} (${nda.ndaName}) for client ${client.name}. Please complete OTP e-signing.`,
            type: 'nda_signature_request',
            ndaId: nda.id,
            isRead: false,
          },
        });
      }

      return nda;
    } catch (err: any) {
      return reply.status(500).send({ error: err.message || 'Failed to create NDA' });
    }
  });

  // 4. NDA Detail View
  fastify.get('/ndas/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const nda = await prisma.nDA.findUnique({
        where: { id },
        include: {
          client: true,
          assignments: true,
        },
      });

      if (!nda) {
        return reply.status(404).send({ error: 'NDA not found' });
      }

      const totalCount = nda.assignments.length;
      const signedCount = nda.assignments.filter((a) => a.status === 'Signed').length;

      let computedStatus = nda.status;
      if (nda.status !== 'Closed') {
        if (signedCount === 0) {
          computedStatus = 'Draft';
        } else if (signedCount === totalCount && totalCount > 0) {
          computedStatus = `Submitted (${signedCount}/${totalCount})`;
        } else {
          computedStatus = `Partially Submitted (${signedCount}/${totalCount})`;
        }
      }

      const formattedAssignments = nda.assignments.map((a) => ({
        id: a.id,
        employeeId: a.employeeId,
        employeeName: a.employeeName,
        personalEmail: a.personalEmail,
        maskedEmail: maskPersonalEmail(a.personalEmail),
        otpSentAt: a.otpSentAt,
        otpVerifiedAt: a.otpVerifiedAt,
        signedAt: a.signedAt,
        status: a.status,
        ipAddress: a.ipAddress,
      }));

      return {
        id: nda.id,
        ndaCode: nda.ndaCode,
        ndaName: nda.ndaName,
        clientId: nda.clientId,
        clientName: nda.client?.name || '',
        documentContent: nda.documentContent,
        createdAt: nda.createdAt,
        submittedAt: nda.submittedAt,
        closedAt: nda.closedAt,
        status: computedStatus,
        rawStatus: nda.status,
        isClosed: nda.status === 'Closed',
        totalCount,
        signedCount,
        assignments: formattedAssignments,
      };
    } catch (err: any) {
      return reply.status(500).send({ error: err.message || 'Failed to fetch NDA details' });
    }
  });

  // 5. Close NDA (SA endpoint - lock permanently)
  fastify.post('/ndas/:id/close', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const nda = await prisma.nDA.findUnique({
        where: { id },
        include: { assignments: true },
      });

      if (!nda) {
        return reply.status(404).send({ error: 'NDA not found' });
      }

      if (nda.status === 'Closed') {
        return reply.status(400).send({ error: 'NDA is already closed and locked' });
      }

      const totalCount = nda.assignments.length;
      const signedCount = nda.assignments.filter((a) => a.status === 'Signed').length;

      if (signedCount < totalCount) {
        return reply.status(400).send({
          error: `Cannot close NDA until all assigned employees have signed (${signedCount}/${totalCount} completed)`,
        });
      }

      const updated = await prisma.nDA.update({
        where: { id },
        data: {
          status: 'Closed',
          closedAt: new Date(),
          closedBy: request.user?.email || 'Super Admin',
        },
      });

      return updated;
    } catch (err: any) {
      return reply.status(500).send({ error: err.message || 'Failed to close NDA' });
    }
  });

  // 6. Send OTP to personal email (Employee / SA)
  fastify.post('/ndas/assignments/:assignmentId/send-otp', async (request, reply) => {
    try {
      const { assignmentId } = request.params as { assignmentId: string };
      const body = (request.body || {}) as { personalEmail?: string };

      const assignment = await prisma.nDAAssignment.findUnique({
        where: { id: assignmentId },
        include: { nda: true },
      });

      if (!assignment) {
        return reply.status(404).send({ error: 'NDA Assignment record not found' });
      }

      if (assignment.nda.status === 'Closed') {
        return reply.status(400).send({ error: 'This NDA is closed and locked. No further changes allowed.' });
      }

      if (assignment.status === 'Signed') {
        return reply.status(400).send({ error: 'This NDA has already been e-signed by this employee.' });
      }

      let targetEmail = assignment.personalEmail;
      if (body.personalEmail && body.personalEmail.trim().length > 0) {
        targetEmail = body.personalEmail.trim();
        // Sync to employee record if exists
        await prisma.employee.updateMany({
          where: { employeeId: assignment.employeeId },
          data: { personalEmail: targetEmail },
        });
      }

      // Generate random 6-digit numeric OTP
      const otpCode = String(Math.floor(100000 + Math.random() * 900000));
      const codeHash = hashOtp(otpCode);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

      await prisma.nDAAssignment.update({
        where: { id: assignmentId },
        data: {
          personalEmail: targetEmail,
          otpCodeHash: codeHash,
          otpSentAt: now,
          otpExpiresAt: expiresAt,
          otpAttempts: 0,
        },
      });

      // Dispatch email via Nodemailer
      const emailResult = await sendNdaOtpEmail({
        toEmail: targetEmail,
        employeeName: assignment.employeeName,
        otpCode,
        ndaCode: assignment.nda.ndaCode,
        ndaName: assignment.nda.ndaName,
        clientName: '',
      });

      return {
        success: true,
        message: emailResult.success
          ? `OTP code successfully sent to personal email ${targetEmail}. (Valid for 10 mins)`
          : `OTP generated for ${targetEmail}. (${emailResult.message})`,
        maskedEmail: maskPersonalEmail(targetEmail),
        targetEmail,
        devOtp: otpCode,
      };
    } catch (err: any) {
      return reply.status(500).send({ error: err.message || 'Failed to send OTP' });
    }
  });

  // 7. Verify OTP & E-Sign NDA (Employee)
  fastify.post('/ndas/assignments/:assignmentId/verify-otp', async (request, reply) => {
    try {
      const { assignmentId } = request.params as { assignmentId: string };
      const { otpCode } = request.body as { otpCode: string };

      if (!otpCode || otpCode.trim().length === 0) {
        return reply.status(400).send({ error: 'Please enter the 6-digit OTP code sent to your personal email.' });
      }

      const assignment = await prisma.nDAAssignment.findUnique({
        where: { id: assignmentId },
        include: { nda: { include: { assignments: true } } },
      });

      if (!assignment) {
        return reply.status(404).send({ error: 'NDA Assignment not found' });
      }

      if (assignment.nda.status === 'Closed') {
        return reply.status(400).send({ error: 'NDA is closed and locked.' });
      }

      if (assignment.status === 'Signed') {
        return reply.status(400).send({ error: 'You have already signed this NDA.' });
      }

      if (!assignment.otpExpiresAt || new Date() > assignment.otpExpiresAt) {
        return reply.status(400).send({ error: 'OTP code has expired. Please click "Resend OTP" to receive a new code.' });
      }

      const inputHash = hashOtp(otpCode.trim());
      if (inputHash !== assignment.otpCodeHash) {
        await prisma.nDAAssignment.update({
          where: { id: assignmentId },
          data: { otpAttempts: { increment: 1 } },
        });
        return reply.status(400).send({ error: 'Incorrect OTP code. Please check your email and try again.' });
      }

      const now = new Date();
      const ip = request.ip || '127.0.0.1';
      const userAgent = request.headers['user-agent'] || 'Studio Web Browser';

      // Mark assignment as Signed
      await prisma.nDAAssignment.update({
        where: { id: assignmentId },
        data: {
          status: 'Signed',
          otpVerifiedAt: now,
          signedAt: now,
          ipAddress: ip,
          userAgent,
        },
      });

      // Recalculate NDA overall status
      const updatedAssignments = await prisma.nDAAssignment.findMany({
        where: { ndaId: assignment.ndaId },
      });

      const totalCount = updatedAssignments.length;
      const signedCount = updatedAssignments.filter((a) => a.status === 'Signed').length;

      let newStatus = 'Partially Submitted';
      let submittedAtDate = undefined;

      if (signedCount === totalCount) {
        newStatus = 'Submitted';
        submittedAtDate = now;
      }

      await prisma.nDA.update({
        where: { id: assignment.ndaId },
        data: {
          status: newStatus,
          submittedAt: submittedAtDate,
        },
      });

      // Mark notification as read
      await prisma.notification.updateMany({
        where: {
          ndaId: assignment.ndaId,
          userId: assignment.employeeId,
        },
        data: {
          isRead: true,
          readAt: now,
        },
      });

      return {
        success: true,
        message: 'OTP verified successfully! Non-Disclosure Agreement has been legally e-signed.',
        signedAt: now,
      };
    } catch (err: any) {
      return reply.status(500).send({ error: err.message || 'Failed to verify OTP' });
    }
  });

  // 8. Employee's own assigned NDAs endpoint
  fastify.get('/ndas/my-ndas', async (request, reply) => {
    try {
      const empId = request.user?.userId ? String(request.user.userId) : '';
      if (!empId) {
        return reply.status(401).send({ error: 'User session invalid' });
      }

      const assignments = await prisma.nDAAssignment.findMany({
        where: { employeeId: empId },
        include: {
          nda: {
            include: {
              client: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const formatted = assignments.map((a) => ({
        assignmentId: a.id,
        ndaId: a.ndaId,
        ndaCode: a.nda.ndaCode,
        ndaName: a.nda.ndaName,
        clientName: a.nda.client?.name || '',
        assignedDate: a.createdAt,
        signedAt: a.signedAt,
        status: a.status === 'Signed' ? 'Signed' : 'Pending Signature',
        personalEmail: a.personalEmail,
        isNdaClosed: a.nda.status === 'Closed',
      }));

      return formatted;
    } catch (err: any) {
      return reply.status(500).send({ error: err.message || 'Failed to fetch employee NDAs' });
    }
  });

  // 9. Export NDA as Word / PDF with Signature Audit Trail
  fastify.get('/ndas/:id/export/:format', async (request, reply) => {
    try {
      const { id, format } = request.params as { id: string; format: string };
      const nda = await prisma.nDA.findUnique({
        where: { id },
        include: { client: true, assignments: true },
      });

      if (!nda) {
        return reply.status(404).send({ error: 'NDA not found' });
      }

      const auditRows = nda.assignments.map((a) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #CBD5E1;">${a.employeeName} (${a.employeeId})</td>
          <td style="padding: 8px; border: 1px solid #CBD5E1;">${maskPersonalEmail(a.personalEmail)}</td>
          <td style="padding: 8px; border: 1px solid #CBD5E1;">${a.status}</td>
          <td style="padding: 8px; border: 1px solid #CBD5E1;">${a.otpVerifiedAt ? new Date(a.otpVerifiedAt).toLocaleString() : '—'}</td>
          <td style="padding: 8px; border: 1px solid #CBD5E1;">${a.signedAt ? new Date(a.signedAt).toLocaleString() : '—'}</td>
          <td style="padding: 8px; border: 1px solid #CBD5E1;">${a.ipAddress || '—'}</td>
        </tr>
      `).join('');

      const exportHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8"/>
          <title>${nda.ndaCode} - ${nda.ndaName}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1E293B; line-height: 1.6; }
            h1 { color: #0F172A; border-bottom: 2px solid #E2E8F0; padding-bottom: 10px; }
            .badge { display: inline-block; padding: 4px 12px; background: #EFF6FF; color: #1D4ED8; border-radius: 4px; font-weight: bold; }
            .content-box { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 20px; border-radius: 8px; margin: 20px 0; white-space: pre-wrap; font-family: monospace; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th { background: #F1F5F9; text-align: left; padding: 8px; border: 1px solid #CBD5E1; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>NON-DISCLOSURE AGREEMENT (NDA)</h1>
          <p><strong>Document Code:</strong> ${nda.ndaCode}</p>
          <p><strong>Document Name:</strong> ${nda.ndaName}</p>
          <p><strong>Client:</strong> ${nda.client?.name || ''}</p>
          <p><strong>Status:</strong> <span class="badge">${nda.status}</span></p>
          <p><strong>Creation Date:</strong> ${new Date(nda.createdAt).toLocaleString()}</p>
          
          <h2>AGREEMENT CONTENT</h2>
          <div class="content-box">${nda.documentContent || 'N/A'}</div>

          <h2>E-SIGNATURE AUDIT TRAIL & COMPLETION CERTIFICATE</h2>
          <p>Verified via OTP authentication to personal email address on record.</p>
          <table>
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Personal Email (Masked)</th>
                <th>Status</th>
                <th>OTP Verified At</th>
                <th>Signed Timestamp</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              ${auditRows}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const filename = `${nda.ndaCode}_${nda.ndaName.replace(/[^a-zA-Z0-9]/g, '_')}.${format === 'word' ? 'doc' : 'html'}`;

      reply.header('Content-Type', format === 'word' ? 'application/msword' : 'text/html');
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      return exportHtml;
    } catch (err: any) {
      return reply.status(500).send({ error: err.message || 'Export failed' });
    }
  });
};
