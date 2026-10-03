"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ndaRoutes = void 0;
const prisma_1 = require("../../lib/prisma");
const crypto_1 = __importDefault(require("crypto"));
const emailService_1 = require("../../utils/emailService");
function maskPersonalEmail(email) {
    if (!email || !email.includes('@'))
        return '—';
    const [name, domain] = email.split('@');
    if (name.length <= 2)
        return `${name[0]}***@${domain}`;
    return `${name.substring(0, 2)}***${name[name.length - 1]}@${domain}`;
}
function hashOtp(otp) {
    return crypto_1.default.createHash('sha256').update(otp).digest('hex');
}
const ndaRoutes = async (fastify) => {
    // 1. Level 1 - Client List Summary (SA view)
    fastify.get('/ndas/clients-summary', async (request, reply) => {
        try {
            const clients = await prisma_1.prisma.client.findMany({
                orderBy: { name: 'asc' },
            });
            const summaryList = await Promise.all(clients.map(async (c) => {
                const ndasCount = await prisma_1.prisma.nDA.count({
                    where: { clientId: c.id },
                });
                const assignments = await prisma_1.prisma.nDAAssignment.findMany({
                    where: { nda: { clientId: c.id } },
                    select: { employeeId: true },
                });
                const uniqueAssignedEmployees = new Set(assignments.map((a) => a.employeeId)).size;
                return {
                    clientId: c.id,
                    clientCode: c.id,
                    clientName: c.name,
                    status: c.status || 'Active',
                    assignedEmployeesCount: uniqueAssignedEmployees,
                    ndasCount,
                };
            }));
            return summaryList;
        }
        catch (err) {
            return reply.status(500).send({ error: err.message || 'Failed to fetch clients NDA summary' });
        }
    });
    // 2. Level 2 - Client's NDA List
    fastify.get('/ndas/client/:clientId', async (request, reply) => {
        try {
            const { clientId } = request.params;
            const ndas = await prisma_1.prisma.nDA.findMany({
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
                    }
                    else if (signedCount === totalCount && totalCount > 0) {
                        computedStatus = `Submitted (${signedCount}/${totalCount})`;
                    }
                    else {
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
        }
        catch (err) {
            return reply.status(500).send({ error: err.message || 'Failed to fetch client NDAs' });
        }
    });
    // 3. Create New NDA (SA endpoint)
    fastify.post('/ndas', async (request, reply) => {
        try {
            const body = request.body;
            if (request.user?.role && request.user.role !== 'Super Admin') {
                return reply.status(403).send({ error: 'Only Super Admin has edit access inside the NDA module' });
            }
            if (!body.clientId || !body.ndaName || !body.employeeIds || body.employeeIds.length === 0) {
                return reply.status(400).send({ error: 'Client, NDA name, and assigned employees are required' });
            }
            const client = await prisma_1.prisma.client.findUnique({ where: { id: body.clientId } });
            if (!client) {
                return reply.status(404).send({ error: 'Client not found' });
            }
            // Auto-generate unique NDA code (e.g. NDA0005)
            const allNdas = await prisma_1.prisma.nDA.findMany({ select: { ndaCode: true } });
            let maxNum = 0;
            for (const n of allNdas) {
                const match = (n.ndaCode || '').match(/^NDA(\d+)$/i);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNum)
                        maxNum = num;
                }
            }
            const nextNum = maxNum + 1;
            const ndaCode = `NDA${String(nextNum).padStart(4, '0')}`;
            const createdBy = request.user?.userId ? String(request.user.userId) : 'SA';
            const nda = await prisma_1.prisma.nDA.create({
                data: {
                    ndaCode,
                    ndaName: body.ndaName,
                    clientId: body.clientId,
                    documentContent: body.documentContent || `NON DISCLOSURE AGREEMENT\n\nThis AGREEMENT is made by and between Orangyy Design LLP (the "Company") and _____________________ (the "Recipient") effective as of ____________.\n\nProject Reference: Information related, but not limited to, development projects and assignments to be performed by the Recipient for the Company.\n\nThe Company possesses competitively valuable Confidential Information (as hereinafter defined) regarding its current products, future products, research and development, and general business operations. Recipient may enter or has entered into a business relationship with the Company and in connection therewith may need to review or use the Company's Confidential Information and Materials or to create new Confidential Information and Materials for the Company. In consideration of the promises and covenants contained in this Agreement and the disclosure of Confidential Information and Materials from the Company to the Recipient, the parties hereto agree as follows:\n\n1. Confidential Information and Materials\n\n(a) "Confidential Information" shall mean any nonpublic information that the Company specifically marks and designates, either orally or in writing, as confidential or which, under the circumstances surrounding the disclosure, ought to be treated as confidential or which the Recipient creates or produces in the course of performing services for the Company. "Confidential Information" includes, but is not limited to, product schematics or drawings, descriptive material, specifications, software (source code or object code), sales and customer information, the Company's business policies or practices, information received from others that the Company is obligated to treat as confidential, and other materials and information of a confidential nature.\n\n(b) "Confidential Information" shall not include any materials or information which the Recipient shows: (i) is at the time of disclosure generally known by or available to the public or became so known or available thereafter through no fault of the Recipient; or (ii) is legally known to the Recipient at the time of disclosure by the Company; or (iii) is furnished by the Company to third parties without restriction; or (iv) is furnished to the Recipient by a third party who legally obtained said information and the right to disclose it; or (v) is developed independently by the Recipient either before or after the term of the Recipient’s engagement as a consultant or independent contractor to the Company where the Recipient can document such independent development.\n\n(c) "Confidential Materials" shall mean all tangible materials containing Confidential Information, including without limitation drawings, schematics, written or printed documents, computer disks, tapes, and compact disks (CD), whether machine or user readable.\n\n2. Restrictions\n\n(a) Recipient shall not disclose any Confidential Information to third parties without the prior written authorization of the Company. Notwithstanding the foregoing, Recipient shall not at any time disclose to any third party any Confidential Information comprising a trade secret of the Company or any Confidential Information of any other party to whom the Company owes an obligation. However, Recipient may disclose Confidential Information in accordance with judicial or other governmental orders, provided Recipient shall give the Company reasonable notice prior to such disclosure and shall comply with any applicable protective order or equivalent.\n\n(b) Recipient shall not use any Confidential Information or Confidential Materials of the Company for any purposes except those expressly contemplated hereby or as authorized by the Company.\n\n(c) Recipient shall take reasonable security precautions, which shall in any event be as great as the precautions it takes to protect its own confidential information, to keep confidential the Confidential Information. Recipient may disclose Confidential Information or Confidential Materials only to Recipient's employees or consultants on a need-to-know basis. Recipient shall instruct all employees given access to the information to maintain confidentiality and to refrain from making unauthorized copies. Recipient shall maintain appropriate written agreements with its employees, consultants, parent, subsidiaries, affiliates or related parties, who receive, or have access to, Confidential Information sufficient to enable it to comply with the terms of this Agreement.\n\n(d) Confidential Information and Confidential Materials may be disclosed, reproduced, summarized or distributed only in pursuance of Recipient's business relationship with the Company, and only as otherwise provided hereunder. Recipient agrees to segregate all such Confidential Materials from the confidential materials of others to prevent commingling.\n\n3. Rights and Remedies\n\n(a) Recipient shall notify the Company immediately upon discovery of any unauthorized use or disclosure of Confidential Information or Confidential Materials, or any other breach of this Agreement by Recipient, and will cooperate with the Company in every reasonable way to help the Company regain possession of the Confidential Information and/or Confidential Materials and prevent further unauthorized use or disclosure.\n\n(b) Recipient shall return all originals, copies, reproductions and summaries of Confidential Information and/or Confidential Materials then in Recipient's possession or control at the Company's request or, at the Company's option, certify destruction of the same.\n\n(c) Recipient acknowledges that monetary damages may not be a sufficient remedy for damages resulting from the unauthorized disclosure of Confidential Information and that the Company shall be entitled, without waiving any other rights or remedies, to seek such injunctive or equitable relief as may be deemed proper by a court of competent jurisdiction.\n\n(d) The Company may visit Recipient's premises, with reasonable prior notice and during normal business hours, to review Recipient's compliance with the terms of this Agreement.\n\n4. Miscellaneous\n\n(a) All Confidential Information and Confidential Materials are and shall remain the sole and exclusive property of the Company. By disclosing information to Recipient, the Company does not grant any express or implied right to Recipient to or under the Company patents, copyrights, trademarks, or trade secret information.\n\n(b) All Confidential Information and Materials are provided "AS IS" and the Company makes no warranty regarding the accuracy or reliability of such information or materials. The Company does not warrant that it will release any product concerning which information has been disclosed as a part of the Confidential Information or Confidential Materials. The Company will not be liable for any expenses or losses incurred or any action undertaken by the Recipient as a result of the receipt of Confidential Information or Confidential Materials. The entire risk arising out of the use of the Confidential Information and Confidential Materials remains with the Recipient.\n\n(c) Recipient agrees that it shall adhere to all Indian Export Administration laws and regulations and shall not export or re-export any technical data or products received from the Company or the direct product of such technical data to any proscribed country listed in the Indian Export Administration Regulations unless properly authorized by both the Company and the Indian Government.\n\n(d) This Agreement constitutes the entire Agreement between the parties with respect to the subject matter hereof. It shall not be modified except by a written agreement dated subsequent to the date of this Agreement and signed by both parties.\n\n(e) None of the provisions of this Agreement shall be deemed to have been waived by any act or acquiescence on the part of the Company, its agents, or employees but only by an instrument in writing signed by an authorized officer of the Company. No waiver of any provision of this Agreement shall constitute a waiver of any other provision(s) or of the same provision on another occasion. Failure of either party to enforce any provision of this Agreement shall not constitute waiver of such provision or any other provisions of this Agreement.\n\n(f) If any action at law or in equity is necessary to enforce or interpret the rights arising out of or relating to this Agreement, the prevailing party shall be entitled to recover reasonable attorney's fees, costs and necessary disbursements in addition to any other relief to which it may be entitled.\n\n(g) This Agreement shall be construed and governed by the laws of the State of Tamilnadu, and both parties further consent to jurisdiction by the state and federal courts sitting in Coimbatore, Tamilnadu.\n\n(h) If any provision of this Agreement shall be held by a court of competent jurisdiction to be illegal, invalid or unenforceable, the remaining provisions shall remain in full force and effect. Should any of the obligations of this Agreement be found illegal or unenforceable as being too broad with respect to the duration, scope or subject matter thereof, such obligations shall be deemed and construed to be reduced to the maximum duration, scope or subject matter allowable by law.\n\n(i) All obligations created by this Agreement shall survive change or termination of the parties' business relationship.\n\nIN WITNESS WHEREOF, the parties hereto have executed this Agreement by their duly authorized representatives as of the date first set forth above.\n\n\nOrangyy Design LLP`,
                    status: 'Draft',
                    createdBy,
                    createdByName: request.user?.email || 'Super Admin',
                },
            });
            // Create NDAAssignments & persistent notifications for employees
            for (const empId of body.employeeIds) {
                const emp = await prisma_1.prisma.employee.findUnique({ where: { employeeId: empId } });
                const empName = emp ? emp.fullName : empId;
                const pEmail = emp?.personalEmail || emp?.email || `${empId.toLowerCase()}@personal.com`;
                await prisma_1.prisma.nDAAssignment.create({
                    data: {
                        ndaId: nda.id,
                        employeeId: empId,
                        employeeName: empName,
                        personalEmail: pEmail,
                        status: 'Pending',
                    },
                });
                // Create persistent notification
                await prisma_1.prisma.notification.create({
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
        }
        catch (err) {
            return reply.status(500).send({ error: err.message || 'Failed to create NDA' });
        }
    });
    // 4. NDA Detail View
    fastify.get('/ndas/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const nda = await prisma_1.prisma.nDA.findUnique({
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
                }
                else if (signedCount === totalCount && totalCount > 0) {
                    computedStatus = `Submitted (${signedCount}/${totalCount})`;
                }
                else {
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
        }
        catch (err) {
            return reply.status(500).send({ error: err.message || 'Failed to fetch NDA details' });
        }
    });
    // 5. Close NDA (SA endpoint - lock permanently)
    fastify.post('/ndas/:id/close', async (request, reply) => {
        try {
            const { id } = request.params;
            const nda = await prisma_1.prisma.nDA.findUnique({
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
            const updated = await prisma_1.prisma.nDA.update({
                where: { id },
                data: {
                    status: 'Closed',
                    closedAt: new Date(),
                    submittedAt: nda.submittedAt || new Date(),
                    closedBy: request.user?.email || 'Super Admin',
                },
            });
            return updated;
        }
        catch (err) {
            return reply.status(500).send({ error: err.message || 'Failed to close NDA' });
        }
    });
    // 5b. Update NDA (SA endpoint)
    fastify.put('/ndas/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const body = request.body;
            if (request.user?.role && request.user.role !== 'Super Admin') {
                return reply.status(403).send({ error: 'Only Super Admin can edit NDAs' });
            }
            const existing = await prisma_1.prisma.nDA.findUnique({ where: { id } });
            if (!existing) {
                return reply.status(404).send({ error: 'NDA not found' });
            }
            if (existing.status === 'Closed') {
                return reply.status(400).send({ error: 'Closed NDAs cannot be edited' });
            }
            const updated = await prisma_1.prisma.nDA.update({
                where: { id },
                data: {
                    ndaName: body.ndaName || existing.ndaName,
                    documentContent: body.documentContent || existing.documentContent,
                },
            });
            if (body.employeeIds && Array.isArray(body.employeeIds)) {
                await prisma_1.prisma.nDAAssignment.deleteMany({ where: { ndaId: id } });
                for (const empId of body.employeeIds) {
                    const emp = await prisma_1.prisma.employee.findUnique({ where: { employeeId: empId } });
                    const empName = emp ? emp.fullName : empId;
                    const pEmail = emp?.personalEmail || emp?.email || `${empId.toLowerCase()}@personal.com`;
                    await prisma_1.prisma.nDAAssignment.create({
                        data: {
                            ndaId: id,
                            employeeId: empId,
                            employeeName: empName,
                            personalEmail: pEmail,
                            status: 'Pending',
                        },
                    });
                }
            }
            return updated;
        }
        catch (err) {
            return reply.status(500).send({ error: err.message || 'Failed to update NDA' });
        }
    });
    // 5c. Delete NDA (SA endpoint)
    fastify.delete('/ndas/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            if (request.user?.role && request.user.role !== 'Super Admin') {
                return reply.status(403).send({ error: 'Only Super Admin can delete NDAs' });
            }
            await prisma_1.prisma.nDAAssignment.deleteMany({ where: { ndaId: id } });
            await prisma_1.prisma.notification.deleteMany({ where: { ndaId: id } });
            await prisma_1.prisma.nDA.delete({ where: { id } });
            return { success: true, message: 'NDA deleted successfully' };
        }
        catch (err) {
            return reply.status(500).send({ error: err.message || 'Failed to delete NDA' });
        }
    });
    // 6. Send OTP to personal email (Employee / SA)
    fastify.post('/ndas/assignments/:assignmentId/send-otp', async (request, reply) => {
        try {
            const { assignmentId } = request.params;
            const body = (request.body || {});
            const assignment = await prisma_1.prisma.nDAAssignment.findUnique({
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
                await prisma_1.prisma.employee.updateMany({
                    where: { employeeId: assignment.employeeId },
                    data: { personalEmail: targetEmail },
                });
            }
            // Generate random 6-digit numeric OTP
            const otpCode = String(Math.floor(100000 + Math.random() * 900000));
            const codeHash = hashOtp(otpCode);
            const now = new Date();
            const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
            await prisma_1.prisma.nDAAssignment.update({
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
            const emailResult = await (0, emailService_1.sendNdaOtpEmail)({
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
        }
        catch (err) {
            return reply.status(500).send({ error: err.message || 'Failed to send OTP' });
        }
    });
    // 7. Verify OTP & E-Sign NDA (Employee)
    fastify.post('/ndas/assignments/:assignmentId/verify-otp', async (request, reply) => {
        try {
            const { assignmentId } = request.params;
            const { otpCode } = request.body;
            if (!otpCode || otpCode.trim().length === 0) {
                return reply.status(400).send({ error: 'Please enter the 6-digit OTP code sent to your personal email.' });
            }
            const assignment = await prisma_1.prisma.nDAAssignment.findUnique({
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
                await prisma_1.prisma.nDAAssignment.update({
                    where: { id: assignmentId },
                    data: { otpAttempts: { increment: 1 } },
                });
                return reply.status(400).send({ error: 'Incorrect OTP code. Please check your email and try again.' });
            }
            const now = new Date();
            const ip = request.ip || '127.0.0.1';
            const userAgent = request.headers['user-agent'] || 'Studio Web Browser';
            // Mark assignment as Signed
            await prisma_1.prisma.nDAAssignment.update({
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
            const updatedAssignments = await prisma_1.prisma.nDAAssignment.findMany({
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
            await prisma_1.prisma.nDA.update({
                where: { id: assignment.ndaId },
                data: {
                    status: newStatus,
                    submittedAt: submittedAtDate,
                },
            });
            // Mark notification as read
            await prisma_1.prisma.notification.updateMany({
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
        }
        catch (err) {
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
            const assignments = await prisma_1.prisma.nDAAssignment.findMany({
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
        }
        catch (err) {
            return reply.status(500).send({ error: err.message || 'Failed to fetch employee NDAs' });
        }
    });
    function formatDateSimple(dStr) {
        if (!dStr)
            return '';
        const d = new Date(dStr);
        if (isNaN(d.getTime()))
            return '';
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    function personalizeDocumentHtml(html, recipientName, signedDateStr) {
        let personalized = html || '';
        // 1. Replace first placeholder after "and" with recipientName
        const firstPlaceholderRegex = /(and\s*(?:<[^>]+>)*\s*)(_{2,}|-{2,}|—+|–+|<u[^>]*>[\s\S]*?<\/u>)/i;
        if (firstPlaceholderRegex.test(personalized)) {
            personalized = personalized.replace(firstPlaceholderRegex, `$1<strong>${recipientName}</strong>`);
        }
        else {
            personalized = personalized.replace(/(_{3,}|-{3,}|—+|–+)/i, `<strong>${recipientName}</strong>`);
        }
        // 2. Replace second placeholder after "effective as of" with signedDateStr
        const secondPlaceholderRegex = /(effective\s+as\s+of\s*(?:<[^>]+>)*\s*)(_{2,}|-{2,}|—+|–+|<u[^>]*>[\s\S]*?<\/u>)/i;
        if (secondPlaceholderRegex.test(personalized)) {
            personalized = personalized.replace(secondPlaceholderRegex, `$1<strong>${signedDateStr}</strong>`);
        }
        else {
            personalized = personalized.replace(/(_{3,}|-{3,}|—+|–+)/i, `<strong>${signedDateStr}</strong>`);
        }
        return personalized;
    }
    // 9. Export NDA as Word / PDF with Dynamic Signature Audit Trail
    fastify.get('/ndas/:id/export/:format', async (request, reply) => {
        try {
            const { id, format } = request.params;
            const { assignmentId, employeeId } = request.query;
            const nda = await prisma_1.prisma.nDA.findUnique({
                where: { id },
                include: { client: true, assignments: true },
            });
            if (!nda) {
                return reply.status(404).send({ error: 'NDA not found' });
            }
            // Export ONLY documents for employees who have signed
            const signedAssignments = nda.assignments.filter((a) => a.status === 'Signed' || Boolean(a.signedAt));
            let targetAssignments = signedAssignments;
            if (assignmentId) {
                targetAssignments = targetAssignments.filter((a) => a.id === assignmentId);
            }
            else if (employeeId) {
                targetAssignments = targetAssignments.filter((a) => a.employeeId === employeeId);
            }
            if (targetAssignments.length === 0) {
                return reply.status(400).send({
                    error: 'No signed NDA documents available to export. Only signed documents can be exported.',
                });
            }
            let documentPagesHtml = '';
            if (targetAssignments.length > 0) {
                documentPagesHtml = targetAssignments.map((a, idx) => {
                    const signedTimestamp = a.signedAt || a.otpVerifiedAt || a.createdAt;
                    const signedDateStr = formatDateSimple(signedTimestamp);
                    const personalizedContent = personalizeDocumentHtml(nda.documentContent || '', a.employeeName, signedDateStr);
                    const isSigned = a.status === 'Signed' || Boolean(a.signedAt);
                    const pageBreak = idx > 0 ? 'style="page-break-before: always; margin-top: 40px; padding-top: 40px; border-top: 2px dashed #CBD5E1;"' : '';
                    return `
            <div class="nda-page" ${pageBreak}>
              <div class="doc-header">
                <h2>OFFICIAL NON-DISCLOSURE AGREEMENT</h2>
                <p><strong>Document Code:</strong> ${nda.ndaCode} &nbsp;|&nbsp; <strong>Client:</strong> ${nda.client?.name || ''}</p>
                <p><strong>Assigned Recipient:</strong> ${a.employeeName} (${a.employeeId}) &nbsp;|&nbsp; <strong>Status:</strong> <span class="badge ${isSigned ? 'badge-signed' : 'badge-pending'}">${isSigned ? 'Signed' : 'Pending Signature'}</span></p>
              </div>
              <div class="document-body">
                ${personalizedContent}
              </div>
              <div class="certificate-box">
                <h3>E-SIGNATURE COMPLETION CERTIFICATE</h3>
                <table>
                  <tr><th>Recipient Name</th><td>${a.employeeName} (${a.employeeId})</td></tr>
                  <tr><th>Personal Email (Masked)</th><td>${maskPersonalEmail(a.personalEmail)}</td></tr>
                  <tr><th>OTP Verified / Signed At</th><td>${a.signedAt || a.otpVerifiedAt ? new Date(a.signedAt || a.otpVerifiedAt).toLocaleString('en-GB') : '—'}</td></tr>
                  <tr><th>IP Address</th><td>${a.ipAddress || '—'}</td></tr>
                  <tr><th>Verification Protocol</th><td>SHA-256 Hashed 6-Digit OTP Authentication</td></tr>
                </table>
              </div>
            </div>
          `;
                }).join('');
            }
            else {
                documentPagesHtml = `
          <div class="nda-page">
            <div class="doc-header">
              <h2>OFFICIAL NON-DISCLOSURE AGREEMENT</h2>
              <p><strong>Document Code:</strong> ${nda.ndaCode} &nbsp;|&nbsp; <strong>Client:</strong> ${nda.client?.name || ''}</p>
            </div>
            <div class="document-body">
              ${nda.documentContent || 'N/A'}
            </div>
          </div>
        `;
            }
            const exportHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8"/>
          <title>${nda.ndaCode} - ${nda.ndaName}</title>
          <style>
            @media print {
              body { padding: 0; }
              .nda-page { page-break-after: always; }
            }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1E293B; line-height: 1.6; background: #fff; }
            h2 { color: #0F172A; border-bottom: 2px solid #EA580C; padding-bottom: 8px; font-size: 18px; margin-top: 0; }
            h3 { color: #0F172A; font-size: 14px; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; }
            .badge { display: inline-block; padding: 2px 8px; background: #DCFCE7; color: #15803D; border-radius: 4px; font-weight: bold; font-size: 11px; }
            .doc-header { margin-bottom: 20px; font-size: 12px; color: #64748B; background: #F8FAFC; padding: 16px; border-radius: 8px; border: 1px solid #E2E8F0; }
            .document-body { background: #FFFFFF; border: 1px solid #E2E8F0; padding: 30px; border-radius: 8px; margin: 20px 0; font-size: 13px; color: #0F172A; line-height: 1.7; }
            .certificate-box { margin-top: 30px; padding: 20px; background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th { background: #F1F5F9; text-align: left; padding: 8px 12px; border: 1px solid #CBD5E1; font-weight: bold; color: #334155; }
            td { padding: 8px 12px; border: 1px solid #CBD5E1; color: #1E293B; }
          </style>
        </head>
        <body>
          ${documentPagesHtml}
        </body>
        </html>
      `;
            const filename = `${nda.ndaCode}_${nda.ndaName.replace(/[^a-zA-Z0-9]/g, '_')}.${format === 'word' ? 'doc' : 'html'}`;
            reply.header('Content-Type', format === 'word' ? 'application/msword' : 'text/html');
            reply.header('Content-Disposition', `attachment; filename="${filename}"`);
            return exportHtml;
        }
        catch (err) {
            return reply.status(500).send({ error: err.message || 'Export failed' });
        }
    });
};
exports.ndaRoutes = ndaRoutes;
