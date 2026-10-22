import { NextResponse } from 'next/server';
import { db } from '@/db';
import { authActivityLogs, users, companies } from '@/db/schema';
import { eq, desc, or, and, isNull, inArray } from 'drizzle-orm';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const role = searchParams.get('role');
    const eventType = searchParams.get('eventType');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build conditions based on company isolation rules
    const conditions = [];

    const isSuperAdmin = role === 'super_admin' || role === 'business_owner' || role === 'admin';

    // Allow enterprise admins to see all authentication activity across the platform;
    // only restrict if explicitly requested via scopeCompany=true or if user is non-admin
    const shouldScopeCompany = searchParams.get('scopeCompany') === 'true' || (!isSuperAdmin && companyId && companyId !== 'all');

    if (shouldScopeCompany && companyId && companyId !== 'demo-company-01') {
      const compUsers = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.companyId, companyId));

      const emails = compUsers.map((u) => u.email.toLowerCase()).filter(Boolean);

      if (emails.length > 0) {
        conditions.push(
          or(
            eq(authActivityLogs.companyId, companyId),
            and(isNull(authActivityLogs.companyId), inArray(authActivityLogs.email, emails))
          )
        );
      } else {
        conditions.push(eq(authActivityLogs.companyId, companyId));
      }
    } else if (!isSuperAdmin && !companyId) {
      // If unauthenticated or no valid companyId provided for regular user, return empty list
      return NextResponse.json({ success: true, logs: [] });
    }

    if (eventType && ['LOGIN', 'SIGNUP'].includes(eventType.toUpperCase())) {
      conditions.push(eq(authActivityLogs.eventType, eventType.toUpperCase()));
    }

    if (status && ['SUCCESS', 'FAILURE'].includes(status.toUpperCase())) {
      conditions.push(eq(authActivityLogs.status, status.toUpperCase()));
    }

    // Query auth_activity_logs with user details and company details
    let query = db
      .select({
        id: authActivityLogs.id,
        userId: authActivityLogs.userId,
        email: authActivityLogs.email,
        eventType: authActivityLogs.eventType,
        status: authActivityLogs.status,
        attemptedAt: authActivityLogs.attemptedAt,
        failureReason: authActivityLogs.failureReason,
        companyId: authActivityLogs.companyId,
        userName: users.name,
        userRole: users.role,
        companyName: companies.name,
      })
      .from(authActivityLogs)
      .leftJoin(users, eq(authActivityLogs.userId, users.id))
      .leftJoin(companies, eq(authActivityLogs.companyId, companies.id))
      .orderBy(desc(authActivityLogs.attemptedAt))
      .limit(300);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const rawLogs = await query;

    // Transform into standard audit log shape expected by Controls & Audit UI
    const formattedLogs = rawLogs.map((log) => {
      const isSuccess = log.status === 'SUCCESS';
      const actionName = log.eventType === 'LOGIN' ? 'Login Attempt' : 'Sign-up Attempt';
      const outcomeResult = isSuccess ? 'Success' : 'Failure';

      return {
        id: log.id,
        user: log.userName || (log.email ? log.email.split('@')[0] : 'Unknown User'),
        userEmail: log.email,
        userRole: log.userRole || (isSuccess ? (log.eventType === 'LOGIN' ? 'Authorized User' : 'New Registrant') : 'Unauthenticated'),
        action: actionName,
        resource: isSuccess
          ? (log.eventType === 'LOGIN' ? 'User Portal Session' : 'Account Registration')
          : `Auth Failed: ${log.failureReason || 'Invalid Credentials'}`,
        module: 'Authentication',
        deal: log.companyName || (log.companyId ? 'Corporate Access' : 'Identity & Access'),
        dealId: log.companyId || 'identity-auth-module',
        companyName: log.companyName || (log.companyId ? 'Associated Company' : 'Public / Unassigned'),
        result: outcomeResult, // 'Success' | 'Failure'
        timestamp: log.attemptedAt ? new Date(log.attemptedAt).toISOString() : new Date().toISOString(),
        ip: '—', // Strictly omitted: no IP address collected or stored
        device: '—', // Strictly omitted: no user-agent collected or stored
        duration: '—',
        eventType: log.eventType,
        outcome: log.status,
        failureReason: log.failureReason,
        permissionDecision: log.failureReason
          ? {
              rule: 'Authentication Verification',
              verdict: 'Denied',
              reason: log.failureReason,
            }
          : {
              rule: 'Authentication Verification',
              verdict: 'Permitted',
            },
        metadata: {
          eventType: log.eventType,
          outcome: log.status,
          ...(log.failureReason ? { failureReason: log.failureReason } : {}),
          company: log.companyName || (log.companyId ? log.companyId : 'Unassigned'),
        },
        jsonPayload: {
          event_type: `auth.${log.eventType.toLowerCase()}`,
          outcome: log.status,
          email: log.email,
          user_id: log.userId,
          company_id: log.companyId,
          company_name: log.companyName || null,
          attempted_at: log.attemptedAt,
          failure_reason: log.failureReason,
        },
      };
    });

    return NextResponse.json({ success: true, logs: formattedLogs });
  } catch (error) {
    console.error('[API /control-audits/audit-trail GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
