import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { logAuthActivity } from '@/lib/auth-audit';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'Please enter a valid work email address.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Verify user exists in the database
    const userList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        passwordHash: users.passwordHash,
        companyId: users.companyId,
      })
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    const user = userList[0];

    if (!user) {
      await logAuthActivity({
        userId: null,
        email: cleanEmail,
        eventType: 'PASSWORD_RESET_REQUEST',
        status: 'FAILURE',
        failureReason: 'User not found',
        companyId: null,
      });

      return NextResponse.json(
        { error: 'No account found with this work email address.' },
        { status: 404 }
      );
    }

    // 2. Generate secure single-use token and register in database (email_otps)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    // Remove any previous reset tokens for this email and register the single active token
    await supabaseAdmin
      .from('email_otps')
      .delete()
      .eq('email', cleanEmail);

    const { error: dbInsertErr } = await supabaseAdmin
      .from('email_otps')
      .insert({
        email: cleanEmail,
        otp: token,
        expires_at: expiresAt.toISOString(),
        verified: false,
      });

    if (dbInsertErr) {
      console.error('Failed to store reset token in email_otps:', dbInsertErr);
      return NextResponse.json(
        { error: 'Failed to generate password reset request. Please try again.' },
        { status: 500 }
      );
    }

    // 3. Construct the password reset link
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const resetUrl = `${appUrl}/dms/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    // 4. Configure email transporter (Nodemailer with SMTP credentials from .env)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: false, // Port 587 uses STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); overflow: hidden; border: 1px solid #e5e7eb;">
                <!-- Header -->
                <tr>
                  <td style="background-color: #0b1120; padding: 32px 36px; text-align: left;">
                    <div style="font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                      Secure <span style="color: #3b82f6;">DMS</span>
                    </div>
                    <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">
                      Deal Management & Virtual Data Room
                    </div>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 36px 36px 28px 36px;">
                    <h2 style="font-size: 20px; font-weight: 700; color: #1e293b; margin: 0 0 16px 0;">
                      Password Reset Request
                    </h2>
                    <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 16px 0;">
                      Hello <strong>${user.name || 'there'}</strong>,
                    </p>
                    <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 28px 0;">
                      We received a request to reset the password for your Secure DMS account associated with <strong>${user.email}</strong>. Click the button below to choose a new password:
                    </p>

                    <!-- Button -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                      <tr>
                        <td align="center">
                          <a href="${resetUrl}" target="_blank" style="display: inline-block; background-color: #3b82f6; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 36px; border-radius: 8px; box-shadow: 0 2px 6px rgba(59, 130, 246, 0.35);">
                            Change Password
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 12px 0;">
                      If the button above does not work, copy and paste this link into your browser:
                    </p>
                    <p style="font-size: 12px; color: #3b82f6; word-break: break-all; margin: 0 0 24px 0;">
                      <a href="${resetUrl}" style="color: #3b82f6; text-decoration: underline;">${resetUrl}</a>
                    </p>

                    <div style="padding: 14px 16px; background-color: #f8fafc; border-left: 3px solid #f59e0b; border-radius: 4px; margin-bottom: 20px;">
                      <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">
                        <strong>Security Notice:</strong> This link is valid for <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your account remains completely secure.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 36px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                    <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                      &copy; ${new Date().getFullYear()} Secure DMS. Confidential M&A Marketplace & Virtual Data Room.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Secure DMS" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Reset Your Secure DMS Password',
      html: emailHtml,
    });

    await logAuthActivity({
      userId: user.id,
      email: user.email,
      eventType: 'PASSWORD_RESET_REQUEST',
      status: 'SUCCESS',
      failureReason: null,
      companyId: user.companyId || null,
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset link sent to your work email.',
    });
  } catch (err) {
    console.error('Error in forgot-password API:', err);
    return NextResponse.json(
      { error: 'An error occurred while processing your request. Please try again later.' },
      { status: 500 }
    );
  }
}
