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
    const dealId = searchParams.get('dealId'); // 'all' or specific dealId uuid
    const eventType = searchParams.get('eventType');
    const status = searchParams.get('status');

    // Only super_admin sees all deals & users platform-wide.
    // Regular admin (e.g. Laxmi) only sees users belonging to her company deals/workspaces.
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
        })
        .from(groups)
        .innerJoin(userGroups, eq(groups.id, userGroups.groupId))
        .where(isNotNull(groups.workspaceId));
    } catch (e) {
      console.warn('[AuditTrail] Could not fetch deal group members:', e.message);
    }

    // 3. Build lookup maps:
    // - dealUsersMap: dealId -> { deal, userIds: Set, emails: Set }
    // - userPrimaryDealMap: userId/email -> deal info
    const dealUsersMap = new Map();
    const userPrimaryDealMap = new Map();

    for (const d of allDeals) {
      const userIds = new Set();
      const emails = new Set();

      if (d.buyerId) {
        userIds.add(d.buyerId);
        if (!userPrimaryDealMap.has(d.buyerId)) {
          userPrimaryDealMap.set(d.buyerId, d);
        }
      }
      if (d.buyerEmail) {
        const lowerEmail = d.buyerEmail.toLowerCase();
        emails.add(lowerEmail);
        if (!userPrimaryDealMap.has(lowerEmail)) {
          userPrimaryDealMap.set(lowerEmail, d);
        }
      }

      dealUsersMap.set(d.dealId, { deal: d, userIds, emails });
    }

    for (const gm of dealGroupMembers) {
      if (gm.dealId && dealUsersMap.has(gm.dealId)) {
        dealUsersMap.get(gm.dealId).userIds.add(gm.userId);
        if (!userPrimaryDealMap.has(gm.userId)) {
          userPrimaryDealMap.set(gm.userId, dealUsersMap.get(gm.dealId).deal);
        }
      }
    }

    // 4. Determine accessible deals for the current viewer
    let accessibleDeals = [];
    if (isSuperAdmin) {
      accessibleDeals = allDeals;
    } else if (companyId && companyId !== 'demo-company-01') {
      // Admin sees deals whose projects belong to their company,
      // or deals where the admin is an assigned group member
      accessibleDeals = allDeals.filter(
        (d) =>
          d.projectCompanyId === companyId ||
          (userId && dealUsersMap.get(d.dealId)?.userIds.has(userId))
      );
    }

    // 5. Determine which user IDs / emails the viewer is allowed to see
    const allowedUserIds = new Set();
    const allowedEmails = new Set();

    if (dealId && dealId !== 'all') {
      // Specifically filter to the selected deal
      const target = dealUsersMap.get(dealId);
      if (target) {
        target.userIds.forEach((id) => allowedUserIds.add(id));
        target.emails.forEach((em) => allowedEmails.add(em));
      }
    } else if (!isSuperAdmin) {
      // Admin without specific deal filter sees all users in their accessible deals
      for (const d of accessibleDeals) {
        const info = dealUsersMap.get(d.dealId);
        if (info) {
          info.userIds.forEach((id) => allowedUserIds.add(id));
          info.emails.forEach((em) => allowedEmails.add(em));
        }
      }

      // Also include internal members of the admin's company
      if (companyId && companyId !== 'demo-company-01') {
        const compUsers = await db
          .select({ id: users.id, email: users.email })
          .from(users)
          .where(eq(users.companyId, companyId));

        compUsers.forEach((u) => {
          if (u.id) allowedUserIds.add(u.id);
          if (u.email) allowedEmails.add(u.email.toLowerCase());
        });
      }
    }

    // 6. Query authActivityLogs
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

    // 7. Filter raw logs according to role and deal permissions
    const scopedLogs = rawLogs.filter((log) => {
      // Super Admin sees everything unless a specific dealId is selected
      if (isSuperAdmin && (!dealId || dealId === 'all')) return true;

      const lowerEmail = (log.email || '').toLowerCase();
      const matchesUserId = log.userId && allowedUserIds.has(log.userId);
      const matchesEmail = lowerEmail && allowedEmails.has(lowerEmail);

      return matchesUserId || matchesEmail;
    });

    // 8. Transform logs with real Deal & Project metadata
    const formattedLogs = scopedLogs.map((log) => {
      const isSuccess = log.status === 'SUCCESS';
      const actionName = log.eventType === 'LOGIN' ? 'Login Attempt' : 'Sign-up Attempt';
      const outcomeResult = isSuccess ? 'Success' : 'Failure';
      const lowerEmail = (log.email || '').toLowerCase();

      // Find matched deal for this log entry
      let matchedDeal = null;
      if (dealId && dealId !== 'all') {
        matchedDeal = allDeals.find((d) => d.dealId === dealId) || null;
      } else {
        matchedDeal =
          (log.userId && userPrimaryDealMap.get(log.userId)) ||
          (lowerEmail && userPrimaryDealMap.get(lowerEmail)) ||
          null;
      }

      // Friendly display label for Deal column
      const dealLabel = matchedDeal
        ? matchedDeal.dealName || matchedDeal.projectName
        : log.companyName
        ? `${log.companyName} (Admin)`
        : 'Corporate Access';

      const projectName = matchedDeal?.projectName || log.companyName || 'Corporate';

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
        deal: dealLabel,
        dealId: matchedDeal ? matchedDeal.dealId : log.companyId || 'identity-auth-module',
        projectName: projectName,
        companyName: log.companyName || (log.companyId ? 'Associated Company' : 'Public / Unassigned'),
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
          dealName: dealLabel,
          projectName: projectName,
          ...(log.failureReason ? { failureReason: log.failureReason } : {}),
          company: log.companyName || (log.companyId ? log.companyId : 'Unassigned'),
        },
        jsonPayload: {
          event_type: `auth.${log.eventType.toLowerCase()}`,
          outcome: log.status,
          email: log.email,
          user_id: log.userId,
          deal_id: matchedDeal ? matchedDeal.dealId : null,
          deal_name: dealLabel,
          project_name: projectName,
          company_id: log.companyId,
          company_name: log.companyName || null,
          attempted_at: log.attemptedAt,
          failure_reason: log.failureReason,
        },
      };
    });

    // 9. Format availableDeals for frontend Deal Selector
    const availableDeals = [
      {
        id: 'all',
        name: isSuperAdmin ? 'All Platform Deals' : 'All My Deals',
        code: 'ALL',
        projectName: isSuperAdmin ? 'Platform-wide' : 'My Projects',
      },
      ...accessibleDeals.map((d) => ({
        id: d.dealId,
        name: d.dealName || d.projectName || 'Untitled Deal',
        code: d.dealName ? d.dealName.slice(0, 4).toUpperCase() : 'DEAL',
        projectName: d.projectName || 'Project',
        buyerName: d.buyerName || null,
        buyerEmail: d.buyerEmail || null,
      })),
    ];

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      availableDeals,
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
