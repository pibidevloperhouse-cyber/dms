import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
  authActivityLogs,
  documentEditLogs,
  documentAccessLogs,
  documents,
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

    const rawAuthLogs = await query;

    // Helper: format user role
    const formatRoleName = (r) => {
      if (!r) return 'Authorized User';
      const map = {
        super_admin: 'Super Admin',
        admin: 'Admin',
        sub_admin: 'Sub Admin',
        internal_user: 'Internal User',
        guest_admin: 'Guest Admin',
        guest_lead: 'Guest Lead',
        external_user: 'External User',
        buyer: 'Buyer',
        seller: 'Seller',
        business_owner: 'Business Owner',
      };
      return map[r.toLowerCase()] || r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    };

    // 8. Filter strictly to members of this active deal ONLY for Auth Logs
    const dealScopedAuthLogs = rawAuthLogs.filter((log) => {
      const lowerEmail = (log.email || '').toLowerCase();
      const matchesUserId = log.userId && dealMemberUserIds.has(log.userId);
      const matchesEmail = lowerEmail && dealMemberEmails.has(lowerEmail);

      return matchesUserId || matchesEmail;
    });

    // 9. Transform Auth Logs with active deal metadata
    const formattedAuthLogs = dealScopedAuthLogs.map((log) => {
      const isSuccess = log.status === 'SUCCESS';
      const actionName = log.eventType === 'LOGIN' ? 'Login Attempt' : 'Sign-up Attempt';
      const outcomeResult = isSuccess ? 'Success' : 'Failure';

      return {
        id: log.id,
        user: log.userName || (log.email ? log.email.split('@')[0] : 'Unknown User'),
        userEmail: log.email,
        userRole: formatRoleName(log.userRole) || (isSuccess ? (log.eventType === 'LOGIN' ? 'Authorized User' : 'New Registrant') : 'Unauthenticated'),
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
        durationSeconds: null,
        durationFormatted: '—',
        durationText: '—',
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
          duration: '—',
          duration_seconds: null,
          duration_formatted: '—',
          duration_text: '—',
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
          duration_seconds: null,
          duration_formatted: '—',
          duration_text: '—',
        },
      };
    });

    // 10. Query documentEditLogs (Document Actions: download, upload, view, delete)
    let rawDocLogs = [];
    try {
      rawDocLogs = await db
        .select({
          id: documentEditLogs.id,
          userId: documentEditLogs.userId,
          documentId: documentEditLogs.documentId,
          actionType: documentEditLogs.actionType,
          metadata: documentEditLogs.metadata,
          changedAt: documentEditLogs.changedAt,
          userName: users.name,
          userEmail: users.email,
          userRole: users.role,
          docName: documents.name,
          docWorkspaceId: documents.workspaceId,
          docCompanyId: documents.companyId,
          companyName: companies.name,
        })
        .from(documentEditLogs)
        .leftJoin(users, eq(documentEditLogs.userId, users.id))
        .leftJoin(documents, eq(documentEditLogs.documentId, documents.id))
        .leftJoin(companies, eq(documents.companyId, companies.id))
        .orderBy(desc(documentEditLogs.changedAt))
        .limit(300);
    } catch (e) {
      console.warn('[AuditTrail] Could not fetch documentEditLogs:', e.message);
    }

    // Query documentAccessLogs to link view durations for VIEW actions
    let rawAccessLogs = [];
    try {
      rawAccessLogs = await db
        .select({
          id: documentAccessLogs.id,
          userId: documentAccessLogs.userId,
          documentId: documentAccessLogs.documentId,
          openedAt: documentAccessLogs.openedAt,
          closedAt: documentAccessLogs.closedAt,
          durationSeconds: documentAccessLogs.durationSeconds,
          durationFormatted: documentAccessLogs.durationFormatted,
        })
        .from(documentAccessLogs)
        .orderBy(desc(documentAccessLogs.openedAt))
        .limit(500);
    } catch (e) {
      console.warn('[AuditTrail] Could not fetch documentAccessLogs:', e.message);
    }

    const accessLogsById = new Map();
    rawAccessLogs.forEach((al) => {
      if (al.id) accessLogsById.set(al.id, al);
    });

    // Helper: format duration to human friendly text
    const formatDurationDisplay = (durationSeconds, durationFormatted) => {
      let secs = null;
      if (durationSeconds !== null && durationSeconds !== undefined) {
        secs = parseInt(durationSeconds, 10);
      } else if (durationFormatted && durationFormatted !== '—' && durationFormatted !== '00:00') {
        const parts = String(durationFormatted).split(':');
        if (parts.length === 2) {
          secs = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
        } else if (parts.length === 3) {
          secs = (parseInt(parts[0], 10) || 0) * 3600 + (parseInt(parts[1], 10) || 0) * 60 + (parseInt(parts[2], 10) || 0);
        }
      }

      if (secs === null || isNaN(secs) || secs < 0) {
        return {
          durationSeconds: 0,
          durationFormatted: durationFormatted || '00:00',
          durationText: '< 5s',
        };
      }

      if (secs === 0) {
        return {
          durationSeconds: 0,
          durationFormatted: durationFormatted || '00:00',
          durationText: '< 5s',
        };
      }

      const hours = Math.floor(secs / 3600);
      const mins = Math.floor((secs % 3600) / 60);
      const remSecs = secs % 60;

      let text = '';
      if (hours > 0) {
        text = `${hours}h ${mins}m ${remSecs > 0 ? `${remSecs}s` : ''}`.trim();
      } else if (mins > 0) {
        text = `${mins}m ${remSecs > 0 ? `${remSecs}s` : ''}`.trim();
      } else {
        text = `${remSecs}s`;
      }

      const formatted = durationFormatted && durationFormatted !== '00:00' && durationFormatted !== '—'
        ? durationFormatted
        : (hours > 0
            ? `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`
            : `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`);

      return {
        durationSeconds: secs,
        durationFormatted: formatted,
        durationText: text,
      };
    };

    // Helper: format document action name
    const getDocumentActionName = (actionType, metadata) => {
      const type = (actionType || '').toUpperCase();
      if (type === 'UPLOAD') return 'Document Upload';
      if (type === 'VIEW') return 'Document View';
      if (type === 'DOWNLOAD_ORIGINAL') return 'Document Download (Original)';
      if (type === 'DOWNLOAD_SECURE') return 'Document Download (Secure)';
      if (type.includes('DOWNLOAD')) return 'Document Download';
      if (type === 'DELETE') {
        return metadata?.mode === 'permanent'
          ? 'Document Permanently Deleted'
          : 'Document Moved to Trash';
      }
      const pretty = type
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return `Document ${pretty}`;
    };

    // 11. Filter Document Logs strictly to this active deal
    const dealScopedDocLogs = rawDocLogs.filter((log) => {
      // If the document has a specific workspace_id, it MUST match this active deal
      if (log.docWorkspaceId) {
        return log.docWorkspaceId === activeDeal.dealId;
      }
      // If metadata has workspace_id, check it
      if (log.metadata?.workspace_id) {
        return log.metadata.workspace_id === activeDeal.dealId;
      }
      // Fallback: check if the acting user is a member of this active deal
      const lowerEmail = (log.userEmail || '').toLowerCase();
      const matchesUserId = log.userId && dealMemberUserIds.has(log.userId);
      const matchesEmail = lowerEmail && dealMemberEmails.has(lowerEmail);
      return matchesUserId || matchesEmail;
    });

    // 12. Transform Document Logs with active deal metadata
    const formattedDocLogs = dealScopedDocLogs.map((log) => {
      const actionName = getDocumentActionName(log.actionType, log.metadata);
      const fileName = log.docName || log.metadata?.file_name || 'Document File';

      const isView = (log.actionType || '').toUpperCase() === 'VIEW';
      let durationSeconds = null;
      let durationFormatted = '—';
      let durationText = '—';

      if (isView) {
        // 1. Check metadata
        if (log.metadata?.duration_seconds !== undefined && log.metadata?.duration_seconds !== null) {
          durationSeconds = log.metadata.duration_seconds;
        }
        if (log.metadata?.duration_formatted) {
          durationFormatted = log.metadata.duration_formatted;
        }

        // 2. Check direct access_log_id in metadata
        if (log.metadata?.access_log_id && accessLogsById.has(log.metadata.access_log_id)) {
          const al = accessLogsById.get(log.metadata.access_log_id);
          if (al.durationSeconds !== null && al.durationSeconds !== undefined) {
            durationSeconds = al.durationSeconds;
          }
          if (al.durationFormatted) {
            durationFormatted = al.durationFormatted;
          }
        }

        // 3. Fallback: match by user_id and document_id close in time (within 30s)
        if (durationSeconds === null || durationSeconds === undefined) {
          const logTime = new Date(log.changedAt).getTime();
          const matched = rawAccessLogs.find((al) => {
            if (al.userId === log.userId && al.documentId === log.documentId) {
              const openTime = new Date(al.openedAt).getTime();
              return Math.abs(openTime - logTime) <= 30000;
            }
            return false;
          });
          if (matched) {
            durationSeconds = matched.durationSeconds;
            durationFormatted = matched.durationFormatted || '00:00';
          }
        }

        const durationInfo = formatDurationDisplay(durationSeconds, durationFormatted);
        durationSeconds = durationInfo.durationSeconds;
        durationFormatted = durationInfo.durationFormatted;
        durationText = durationInfo.durationText;
      }

      return {
        id: log.id,
        user: log.userName || (log.userEmail ? log.userEmail.split('@')[0] : 'Unknown User'),
        userEmail: log.userEmail,
        userRole: formatRoleName(log.userRole),
        action: actionName,
        resource: fileName,
        module: 'Documents',
        deal: activeDeal.dealName || activeDeal.projectName || 'Active Deal',
        dealId: activeDeal.dealId,
        projectName: activeDeal.projectName || 'Project',
        companyName: activeDeal.companyName || log.companyName || 'Associated Company',
        result: 'Success',
        timestamp: log.changedAt ? new Date(log.changedAt).toISOString() : new Date().toISOString(),
        ip: '—', // Strictly omitted per privacy policy
        device: '—',
        duration: durationText,
        durationSeconds,
        durationFormatted,
        durationText,
        eventType: log.actionType,
        outcome: 'SUCCESS',
        failureReason: null,
        permissionDecision: {
          rule: 'Document Operation Authorization',
          verdict: 'Permitted',
        },
        metadata: {
          actionType: log.actionType,
          fileName,
          dealName: activeDeal.dealName,
          projectName: activeDeal.projectName,
          duration: durationText,
          duration_seconds: durationSeconds,
          duration_formatted: durationFormatted,
          duration_text: durationText,
          ...(log.metadata || {}),
        },
        jsonPayload: {
          event_type: `document.${(log.actionType || '').toLowerCase()}`,
          outcome: 'SUCCESS',
          email: log.userEmail,
          user_id: log.userId,
          document_id: log.documentId,
          file_name: fileName,
          deal_id: activeDeal.dealId,
          deal_name: activeDeal.dealName,
          project_name: activeDeal.projectName,
          company_id: log.docCompanyId,
          changed_at: log.changedAt,
          duration_seconds: durationSeconds,
          duration_formatted: durationFormatted,
          duration_text: durationText,
        },
      };
    });

    // 13. Merge and sort all audit logs (Auth + Document events) by timestamp DESC
    const allFormattedLogs = [...formattedAuthLogs, ...formattedDocLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // 14. Return ONLY the current active deal (other deals are never exposed)
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
      logs: allFormattedLogs,
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
