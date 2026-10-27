import { resend } from '@/lib/resend';
import { db } from '@/lib/db';
import nodemailer from 'nodemailer';

const getSenderEmail = () => {
  return process.env.RESEND_FROM_EMAIL || 'VDR System <onboarding@resend.dev>';
};

/**
 * Robust Email Sender: Tries Resend first if RESEND_API_KEY exists,
 * otherwise automatically falls back to Nodemailer SMTP (Gmail in .env).
 */
async function sendEmail({ to, subject, html }) {
  if (process.env.RESEND_API_KEY) {
    try {
      const result = await resend.emails.send({
        from: getSenderEmail(),
        to,
        subject,
        html
      });
      console.log('[EmailService] Sent via Resend:', result);
      return { success: true, result, provider: 'resend' };
    } catch (err) {
      console.warn('[EmailService] Resend email failed, trying SMTP fallback:', err.message);
    }
  }

  // Automatic Fallback to Nodemailer SMTP (e.g. Gmail in .env)
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const info = await transporter.sendMail({
      from: `"VDR Portal" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });
    console.log('[EmailService] Sent via SMTP:', info.messageId);
    return { success: true, result: info, provider: 'smtp' };
  }

  throw new Error("Neither RESEND_API_KEY nor SMTP credentials (SMTP_USER/SMTP_PASS) are set in .env.");
}

/**
 * Dynamically find the Business Owner / Admin email to send notification to,
 * falling back to env ADMIN_EMAIL or SMTP_USER (your default email).
 */
async function getAdminEmail() {
  if (process.env.ADMIN_EMAIL) {
    return process.env.ADMIN_EMAIL;
  }
  try {
    const { data: boUsers, error } = await db
      .from('businessowners_users')
      .select('email')
      .limit(1);
    if (!error && boUsers && boUsers.length > 0 && boUsers[0].email) {
      return boUsers[0].email;
    }
  } catch (err) {
    console.error('Could not fetch BO email from db:', err);
  }
  return process.env.ADMIN_EMAIL || 'k.r.nagaraj2002@gmail.com';
}

/**
 * Send email notification to Business Owner/Admin when a user requests a workspace.
 */
export async function sendRequestMailToAdmin({ companyName, adminName, adminEmail, phone, planId, planName, requestId }) {
  try {
    const adminRecipient = await getAdminEmail();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const htmlContent = `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0;">New Workspace Request</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">A new organization is awaiting executive approval</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #f1f5f9; margin-bottom: 24px;">
          <h2 style="color: #1e293b; font-size: 16px; font-weight: 600; margin-top: 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">Request Details</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Company Name:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${companyName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Super Admin Name:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${adminName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Super Admin Email:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${adminEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Phone:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${phone || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Selected Plan:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${planName || planId}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center;">
          <a href="${appUrl}/business-owner/workspace-requests" style="display: inline-block; background-color: #1C7F9F; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(28, 127, 159, 0.25);">
            Review in Admin Dashboard
          </a>
        </div>
      </div>
    `;

    const result = await sendEmail({
      to: adminRecipient,
      subject: `[Pending Approval] Workspace Request from ${companyName}`,
      html: htmlContent,
    });

    return result;
  } catch (error) {
    console.error('[EmailService] Failed to send request mail to admin:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send approval email to the user when their workspace is approved.
 */
export async function sendApprovalMailToUser({ userEmail, userName, companyName, workspaceName }) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const htmlContent = `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background-color: #dcfce7; color: #16a34a; padding: 10px 16px; border-radius: 9999px; font-weight: 600; font-size: 14px; margin-bottom: 16px;">
            ✓ Approved
          </div>
          <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0;">Your workspace has been approved</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 6px;">Welcome to PiBi VDR, ${userName}!</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #f1f5f9; margin-bottom: 24px;">
          <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-top: 0;">
            Your organization <strong>${companyName}</strong> has been verified and your workspace <strong>${workspaceName || `${companyName} Workspace`}</strong> is now active.
          </p>
          <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 0;">
            You now have full access to your Virtual Data Room dashboard, document vaults, and team management tools.
          </p>
        </div>

        <div style="text-align: center;">
          <a href="${appUrl}/login" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);">
            Access Your Workspace
          </a>
        </div>
      </div>
    `;

    const result = await sendEmail({
      to: userEmail,
      subject: `Your workspace has been approved - ${companyName}`,
      html: htmlContent,
    });

    return result;
  } catch (error) {
    console.error('[EmailService] Failed to send approval mail to user:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send rejection email to user when their workspace request is rejected.
 */
export async function sendRejectionMailToUser({ userEmail, userName, companyName, reason }) {
  try {
    const htmlContent = `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background-color: #fee2e2; color: #ef4444; padding: 10px 16px; border-radius: 9999px; font-weight: 600; font-size: 14px; margin-bottom: 16px;">
            Request Not Approved
          </div>
          <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0;">Workspace Request Status Update</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 6px;">Regarding your registration for ${companyName}</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #f1f5f9; margin-bottom: 24px;">
          <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-top: 0;">
            Hello ${userName},
          </p>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">
            We have reviewed your request for the <strong>${companyName}</strong> workspace. Unfortunately, we are unable to approve your workspace request at this time.
          </p>
          ${reason ? `
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
              <p style="color: #991b1b; font-size: 14px; margin: 0;"><strong>Reason:</strong> ${reason}</p>
            </div>
          ` : ''}
          <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 0;">
            Your plan request has been rejected. Please contact support if you believe this was in error or need further assistance.
          </p>
        </div>

        <div style="text-align: center; color: #64748b; font-size: 13px;">
          <p>Need help? Reach out to support@pibivdr.com</p>
        </div>
      </div>
    `;

    const result = await sendEmail({
      to: userEmail,
      subject: `Update regarding your workspace request - ${companyName}`,
      html: htmlContent,
    });

    return result;
  } catch (error) {
    console.error('[EmailService] Failed to send rejection mail to user:', error);
    return { success: false, error: error.message };
  }
}
