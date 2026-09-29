"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNdaOtpEmail = sendNdaOtpEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
async function sendNdaOtpEmail(options) {
    const { toEmail, employeeName, otpCode, ndaCode, ndaName, clientName } = options;
    console.log(`\n==================================================`);
    console.log(`[EMAIL SERVICE] Sending OTP to: ${toEmail}`);
    console.log(`[EMAIL SERVICE] OTP Code: ${otpCode}`);
    console.log(`[EMAIL SERVICE] NDA Code: ${ndaCode} (${ndaName}) for Client: ${clientName}`);
    console.log(`==================================================\n`);
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || '"Orangyy Carpels Compliance" <no-reply@orangyycarpels.com>';
    let transporter = null;
    if (smtpHost && smtpUser && smtpPass) {
        transporter = nodemailer_1.default.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });
    }
    else {
        // If no custom SMTP is specified in environment, attempt ethereal test account or log
        try {
            const testAccount = await nodemailer_1.default.createTestAccount();
            transporter = nodemailer_1.default.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            console.log(`[EMAIL SERVICE] Created fallback Ethereal test mail account: ${testAccount.user}`);
        }
        catch (e) {
            console.warn(`[EMAIL SERVICE] Could not create Ethereal test account: ${e.message}`);
        }
    }
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #ea580c; padding: 20px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">Orangyy Carpels</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Non-Disclosure Agreement E-Signature Authorization</p>
      </div>
      <div style="padding: 24px; color: #1e293b;">
        <p style="font-size: 14px; margin-top: 0;">Hello <strong>${employeeName}</strong>,</p>
        <p style="font-size: 14px; color: #475569;">You have initiated the e-signature process for Non-Disclosure Agreement <strong>${ndaCode} (${ndaName})</strong> for client <strong>${clientName}</strong>.</p>
        
        <div style="margin: 24px 0; padding: 18px; background-color: #fff7ed; border: 1px solid #ffedd5; border-radius: 8px; text-align: center;">
          <span style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #c2410c; letter-spacing: 1px; display: block; margin-bottom: 6px;">Your 6-Digit E-Sign OTP Code</span>
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ea580c; font-family: monospace;">${otpCode}</div>
          <span style="font-size: 11px; color: #9a3412; margin-top: 6px; display: block;">This OTP is valid for 10 minutes. Do not share this code with anyone.</span>
        </div>
        
        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">Entering this code inside Orangyy Carpels legally authorizes your electronic signature and timestamp on document ${ndaCode}.</p>
      </div>
      <div style="background-color: #f8fafc; padding: 14px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} Orangyy Carpels. All rights reserved. Self-contained E-Signature Service.
      </div>
    </div>
  `;
    if (transporter) {
        try {
            const info = await transporter.sendMail({
                from: smtpFrom,
                to: toEmail,
                subject: `[Orangyy Carpels] OTP Code: ${otpCode} for NDA ${ndaCode}`,
                text: `Your OTP code for NDA ${ndaCode} is ${otpCode}. It is valid for 10 minutes.`,
                html: htmlContent,
            });
            console.log(`[EMAIL SERVICE] Email sent successfully! MessageId: ${info.messageId}`);
            if (nodemailer_1.default.getTestMessageUrl(info)) {
                console.log(`[EMAIL SERVICE] Preview URL: ${nodemailer_1.default.getTestMessageUrl(info)}`);
            }
            return { success: true, message: `Email dispatched to ${toEmail}` };
        }
        catch (err) {
            console.error(`[EMAIL SERVICE ERROR] Failed to send email via SMTP:`, err.message);
            return { success: false, message: `SMTP error: ${err.message}` };
        }
    }
    return { success: true, message: `OTP logged to server console for testing.` };
}
