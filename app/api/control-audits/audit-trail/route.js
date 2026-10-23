import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
  authActivityLogs,
  users,
  companies,
  dmsDeals,
  dmsProjects,
  groups,
  userGroups,
} from '@/db/schema';
import { eq, desc, or, and, ne, isNull, inArray, isNotNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const companyId = searchParams.get('companyId');
    const role = searchParams.get('role');
    const dealIdParam = searchParams.get('dealId');
    const eventType = searchParams.get('eventType');
    const status = searchParams.get('status');

    const isSuperAdmin = role === 'super_admin' || role === 'business_owner';

    // 1. Fetch active deals joined with projects, companies, and buyer user details
    const allDeals = await db
      .select({
        dealId: dmsDeals.id,
        dealName: dmsDeals.dealName,
        buyerId: dmsDeals.buyerId,
        workspaceId: dmsDeals.workspaceId,
        projectId: dmsProjects.id,
        projectName: dmsProjects.name,
        projectCompanyId: dmsProjects.companyId,
        companyName: companies.name,
        buyerName: users.name,
        buyerEmail: users.email,
      })
      .from(dmsDeals)
      .leftJoin(dmsProjects, eq(dmsDeals.projectId, dmsProjects.id))
      .leftJoin(companies, eq(dmsProjects.companyId, companies.id))
      .leftJoin(users, eq(dmsDeals.buyerId, users.id))
      .where(or(ne(dmsDeals.status, 'trashed'), isNull(dmsDeals.status)));

    // 2. Fetch group memberships linked to deals/workspaces
    let dealGroupMembers = [];
    try {
      dealGroupMembers = await db
        .select({
          dealId: groups.workspaceId,
          userId: userGroups.userId,
          userEmail: users.email,
          userName: users.name,
        })
        .from(groups)
        .innerJoin(userGroups, eq(groups.id, userGroups.groupId))
        .leftJoin(users, eq(userGroups.userId, users.id))
        .where(isNotNull(groups.workspaceId));
    } catch (e) {
      console.warn('[AuditTrail] Could not fetch deal group members:', e.message);
    }

    // 3. Build deal members map: dealId -> { deal, userIds: Set, emails: Set }
    const dealMembersMap = new Map();
    for (const d of allDeals) {
      const userIds = new Set();
      const emails = new Set();

      if (d.buyerId) userIds.add(d.buyerId);
      if (d.buyerEmail) emails.add(d.buyerEmail.toLowerCase());

      const grps = dealGroupMembers.filter((g) => g.dealId === d.dealId);
      for (const gm of grps) {
        if (gm.userId) userIds.add(gm.userId);
        if (gm.userEmail) emails.add(gm.userEmail.toLowerCase());
      }

      dealMembersMap.set(d.dealId, { deal: d, userIds, emails });
    }

    // 4. Determine accessible deals for the current viewer
    let accessibleDeals = [];
    if (isSuperAdmin) {
      accessibleDeals = allDeals;
    } else if (companyId && companyId !== 'demo-company-01') {
      accessibleDeals = allDeals.filter(
        (d) =>
          d.projectCompanyId === companyId ||
          (userId && dealMembersMap.get(d.dealId)?.userIds.has(userId))
      );
    } else {
      accessibleDeals = allDeals;
    }

    if (accessibleDeals.length === 0) {
      return NextResponse.json({
        success: true,
        logs: [],
        availableDeals: [],
        activeDealId: null,
      });
    }

    // 5. Strictly resolve to a SINGLE ACTIVE DEAL (no "all deals")
    let activeDeal = null;
    if (dealIdParam && dealIdParam !== 'all') {
      activeDeal = accessibleDeals.find((d) => d.dealId === dealIdParam) || null;
    }

    // Fallback: If viewer belongs to a specific deal, prioritize that deal
    if (!activeDeal && userId) {
      activeDeal = accessibleDeals.find((d) => dealMembersMap.get(d.dealId)?.userIds.has(userId)) || null;
    }

    // Fallback: pick the first accessible deal if no valid deal was specified
    if (!activeDeal) {
      activeDeal = accessibleDeals[0];
    }

    // 6. Get the exact members of this active deal
    const dealInfo = dealMembersMap.get(activeDeal.dealId);
    const dealMemberUserIds = dealInfo?.userIds || new Set();
    const dealMemberEmails = dealInfo?.emails || new Set();

    // 7. Query authActivityLogs
    const logConditions = [];

    if (eventType && ['LOGIN', 'SIGNUP'].includes(eventType.toUpperCase())) {
      logConditions.push(eq(authActivityLogs.eventType, eventType.toUpperCase()));
    }

    if (status && ['SUCCESS', 'FAILURE'].includes(status.toUpperCase())) {
      logConditions.push(eq(authActivityLogs.status, status.toUpperCase()));
    }

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

    if (logConditions.length > 0) {
      query = query.where(and(...logConditions));
    }

    const rawLogs = await query;

    // 8. Filter strictly to members of this active deal ONLY
    const dealScopedLogs = rawLogs.filter((log) => {
      const lowerEmail = (log.email || '').toLowerCase();
      const matchesUserId = log.userId && dealMemberUserIds.has(log.userId);
      const matchesEmail = lowerEmail && dealMemberEmails.has(lowerEmail);

      return matchesUserId || matchesEmail;
    });

    // 9. Transform logs with active deal metadata
    const formattedLogs = dealScopedLogs.map((log) => {
      const isSuccess = log.status === 'SUCCESS';
      const actionName = log.eventType === 'LOGIN' ? 'Login Attempt' : 'Sign-up Attempt';
      const outcomeResult = isSuccess ? 'Success' : 'Failure';

      return {
        id: log.id,
        user: log.userName || (log.email ? log.email.split('@')[0] : 'Unknown User'),
        userEmail: log.email,
        userRole:
          log.userRole ||
          (isSuccess
            ? log.eventType === 'LOGIN'
              ? 'Authorized User'
              : 'New Registrant'
            : 'Unauthenticated'),
        action: actionName,
        resource: isSuccess
          ? log.eventType === 'LOGIN'
            ? 'User Portal Session'
            : 'Account Registration'
          : `Auth Failed: ${log.failureReason || 'Invalid Credentials'}`,
        module: 'Authentication',
        deal: activeDeal.dealName || activeDeal.projectName || 'Active Deal',
        dealId: activeDeal.dealId,
        projectName: activeDeal.projectName || 'Project',
        companyName: activeDeal.companyName || log.companyName || 'Associated Company',
        result: outcomeResult,
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
          dealName: activeDeal.dealName,
          projectName: activeDeal.projectName,
          ...(log.failureReason ? { failureReason: log.failureReason } : {}),
        },
        jsonPayload: {
          event_type: `auth.${log.eventType.toLowerCase()}`,
          outcome: log.status,
          email: log.email,
          user_id: log.userId,
          deal_id: activeDeal.dealId,
          deal_name: activeDeal.dealName,
          project_name: activeDeal.projectName,
          company_id: log.companyId,
          attempted_at: log.attemptedAt,
          failure_reason: log.failureReason,
        },
      };
    });

    // 10. Return ONLY the current active deal (other deals are never exposed)
    const availableDeals = activeDeal
      ? [
          {
            id: activeDeal.dealId,
            name: activeDeal.dealName || activeDeal.projectName || 'Active Deal',
            code: activeDeal.dealName ? activeDeal.dealName.slice(0, 4).toUpperCase() : 'DEAL',
            projectName: activeDeal.projectName || 'Project',
            buyerName: activeDeal.buyerName || null,
            buyerEmail: activeDeal.buyerEmail || null,
          },
        ]
      : [];

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      availableDeals,
      activeDealId: activeDeal.dealId,
      activeDealName: activeDeal.dealName,
      currentRole: role,
      isSuperAdmin,
    });
  } catch (error) {
    console.error('[API /control-audits/audit-trail GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
