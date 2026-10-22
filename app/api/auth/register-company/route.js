import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { logAuthActivity } from '@/lib/auth-audit';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  let attemptedEmail = '';
  try {
    const { companyName, adminName, adminEmail, password, phone, planId } = await req.json();
    attemptedEmail = adminEmail || '';

    if (!companyName || !adminName || !adminEmail || !password || !phone || !planId) {
      await logAuthActivity({
        userId: null,
        email: attemptedEmail || 'unknown',
        eventType: 'SIGNUP',
        status: 'FAILURE',
        failureReason: 'Missing required fields',
        companyId: null,
      });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Check if plan exists
    const { data: plan, error: planErr } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planErr || !plan) {
      await logAuthActivity({
        userId: null,
        email: attemptedEmail,
        eventType: 'SIGNUP',
        status: 'FAILURE',
        failureReason: 'Selected plan is invalid or not found',
        companyId: null,
      });
      return NextResponse.json({ error: "Selected plan is invalid or not found." }, { status: 400 });
    }

    // 2. Create the company
    const { data: company, error: companyErr } = await supabaseAdmin
      .from('companies')
      .insert([
        { 
          name: companyName,
          email: adminEmail,
          phone_number: phone, // Changed to phone_number as requested
          status: 'pending' // As per our implementation plan
        }
      ])
      .select()
      .single();

    if (companyErr) throw new Error("Failed to create company: " + companyErr.message);

    // 3. Create the auth user in Supabase Auth
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: password,
      email_confirm: true,
    });

    let userId = authData?.user?.id || crypto.randomUUID();

    // 4. Create the user in the custom users table
    const { error: userErr } = await supabaseAdmin.from('users').insert([
      {
        id: userId,
        company_id: company.id,
        name: adminName,
        email: adminEmail,
        password_hash: password, // As requested by current architecture
        role: 'super_admin', // Company superadmin
        status: 'active',
        nda_status: 'not_required'
      }
    ]);

    if (userErr) throw new Error("Failed to create user record: " + userErr.message);

    // 5. Create the subscription record
    // Using current date for start_date and +1 month for expiry_date as defaults (BO will update these on approval)
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const { error: subErr } = await supabaseAdmin.from('subscriptions').insert([
      {
        company_id: company.id,
        // The schema does not have plan_id. If you need plan_id, you must add it to the DB table.
        storage_limit_mb: plan.storage_limit_mb,
        max_users: plan.users_limit,
        start_date: today.toISOString().split('T')[0],
        expiry_date: nextMonth.toISOString().split('T')[0],
        // Assuming your plan_status enum has 'pending' or similar. If it fails, remove this line to use the 'active' default.
        // plan_status: 'pending' 
      }
    ]);

    if (subErr) {
      console.error("Failed to create subscription:", subErr.message);
    }

    // 6. Send email notification to the Business Owner
    try {
      // Fetch Business Owner email from businessowner_users table
      const { data: boUsers, error: boErr } = await supabaseAdmin
        .from('businessowner_users')
        .select('email')
        .limit(1);

      let boEmail = "owner@pibivdr.com"; // Fallback email
      if (!boErr && boUsers && boUsers.length > 0 && boUsers[0].email) {
        boEmail = boUsers[0].email;
      }

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: `"VDR System" <${process.env.SMTP_USER}>`,
        to: boEmail, // Dynamically fetched Business Owner email
        subject: `New Organization Registration: ${companyName}`,
        html: `
          <h2>New Registration Requires Approval</h2>
          <p>A new organization has registered and is awaiting approval.</p>
          <ul>
            <li><strong>Company Name:</strong> ${companyName}</li>
            <li><strong>Admin Name:</strong> ${adminName}</li>
            <li><strong>Admin Email:</strong> ${adminEmail}</li>
            <li><strong>Selected Plan ID:</strong> ${plan.name}</li>
          </ul>
          <p>Please log in to your Business Owner dashboard to set the Storage limit and Users limit, and approve this registration.</p>
        `,
      };

      await transporter.sendMail(mailOptions);
    } catch (mailErr) {
      console.error("Failed to send notification email to Business Owner:", mailErr);
      // We don't throw here to ensure the registration still completes successfully
    }

    // Record successful sign-up
    await logAuthActivity({
      userId: userId,
      email: attemptedEmail,
      eventType: 'SIGNUP',
      status: 'SUCCESS',
      failureReason: null,
      companyId: company?.id || null,
    });

    return NextResponse.json({ success: true, company });

  } catch (err) {
    console.error("Registration error:", err);
    if (attemptedEmail) {
      await logAuthActivity({
        userId: null,
        email: attemptedEmail,
        eventType: 'SIGNUP',
        status: 'FAILURE',
        failureReason: err.message || 'Registration error',
        companyId: null,
      });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
