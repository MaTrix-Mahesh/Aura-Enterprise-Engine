import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return transporter;
}

export const emailService = {
  /**
   * Dispatches payment receipt email with attached PDF.
   * Isolates email delivery errors to ensure payment state is never corrupted.
   *
   * @param {object} invoice
   * @param {Buffer} pdfBuffer
   * @returns {Promise<{ sent: boolean, error?: string }>}
   */
  async sendReceiptEmail(invoice, pdfBuffer) {
    const recipientEmail = invoice.clientInfo?.email;
    if (!recipientEmail) {
      console.warn(`[EmailService] No client email available for invoice ${invoice.invoiceNumber}`);
      return { sent: false, error: 'NO_RECIPIENT_EMAIL' };
    }

    const mailOptions = {
      from: env.EMAIL_FROM || 'Nexus Corporate Services <billing@nexus.com>',
      to: recipientEmail,
      subject: `Payment Confirmation & Official Receipt: ${invoice.invoiceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1E293B; line-height: 1.6;">
          <div style="background-color: #0F766E; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #FFFFFF; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: -0.02em;">
              Nexus Corporate Services
            </h1>
            <p style="color: #CCFBF1; margin: 4px 0 0; font-size: 13px;">Official Electronic Payment Confirmation</p>
          </div>
          
          <div style="padding: 28px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 15px; margin-top: 0;">Dear <strong>${invoice.clientInfo?.name || 'Valued Client'}</strong>,</p>
            <p>Thank you for your business. We have successfully verified your payment for invoice <strong>${invoice.invoiceNumber}</strong>.</p>
            
            <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 18px; margin: 20px 0;">
              <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                <tr>
                  <td style="color: #64748B; padding: 6px 0;">Invoice Number:</td>
                  <td style="font-weight: bold; text-align: right;">${invoice.invoiceNumber}</td>
                </tr>
                <tr>
                  <td style="color: #64748B; padding: 6px 0;">Amount Paid:</td>
                  <td style="font-weight: bold; color: #047857; text-align: right;">$${Number(invoice.amount).toFixed(2)} ${invoice.currency || 'USD'}</td>
                </tr>
                <tr>
                  <td style="color: #64748B; padding: 6px 0;">Payment Date:</td>
                  <td style="text-align: right;">${new Date(invoice.paidAt || Date.now()).toUTCString()}</td>
                </tr>
                <tr>
                  <td style="color: #64748B; padding: 6px 0;">Status:</td>
                  <td style="font-weight: bold; color: #047857; text-align: right;">PAID (Verified)</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 13px; color: #64748B;">
              Your official PDF receipt is attached to this email for your accounting and audit records.
            </p>

            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
            <p style="font-size: 12px; color: #94A3B8; text-align: center; margin: 0;">
              Nexus Corporate Services • 100 Enterprise Way, Suite 800, San Francisco, CA 94105<br/>
              Questions? Contact <a href="mailto:billing@nexus.com" style="color: #0F766E;">billing@nexus.com</a>
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `Receipt_${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    try {
      const info = await getTransporter().sendMail(mailOptions);
      console.log(`[EmailService] Receipt sent successfully for ${invoice.invoiceNumber} to ${recipientEmail} (ID: ${info.messageId})`);
      return { sent: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EmailService] Could not send receipt email to ${recipientEmail}:`, err.message);
      // Return error safely without throwing, so payment status remains intact
      return { sent: false, error: err.message };
    }
  },
};

export default emailService;
