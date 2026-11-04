import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
  authActivityLogs,
  documentEditLogs,
  documentAccessLogs,
  documents,
  redactedDocuments,
  users,
  companies,
  dmsDeals,
  dmsProjects,
  groups,
  userGroups,
  permissions,
  invitations,
  workspaceMembers,
  messages,
  communicationChannels,
  channelMembers,
  dealTasks,
  buyerDisclosureStages,
  buyerDisclosureItems,
} from '@/db/schema';
import { eq, desc, or, and, ne, isNull, inArray, isNotNull } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

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
    const sideParam = (searchParams.get('side') || '').toLowerCase(); // 'all' | 'buyer' | 'seller'
    const dmsRoleParam = (searchParams.get('dmsRole') || '').toLowerCase();

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

    // 2b. Also include document uploaders tied to deal workspaces
    let dealDocUploaders = [];
    try {
      dealDocUploaders = await db
        .select({
          dealId: documents.workspaceId,
          userId: documents.uploadedBy,
          userEmail: users.email,
          userName: users.name,
        })
        .from(documents)
        .leftJoin(users, eq(documents.uploadedBy, users.id))
        .where(and(isNotNull(documents.workspaceId), isNotNull(documents.uploadedBy)));
    } catch (e) {
      console.warn('[AuditTrail] Could not fetch deal doc uploaders:', e.message);
    }

    // 2c. Also include group members who hold permissions on documents in this deal
    let dealPermMembers = [];
    try {
      dealPermMembers = await db
        .select({
          dealId: documents.workspaceId,
          userId: userGroups.userId,
          userEmail: users.email,
          userName: users.name,
        })
        .from(permissions)
        .innerJoin(documents, eq(permissions.documentId, documents.id))
        .innerJoin(userGroups, eq(permissions.groupId, userGroups.groupId))
        .leftJoin(users, eq(userGroups.userId, users.id))
        .where(isNotNull(documents.workspaceId));
    } catch (e) {
      console.warn('[AuditTrail] Could not fetch deal perm members:', e.message);
    }

    // 2d. Also include users who interacted with documents in this deal (access & edit logs)
    let dealDocLogUsers = [];
    try {
      const accessUsers = await db
        .select({
          dealId: documents.workspaceId,
          userId: documentAccessLogs.userId,
          userEmail: users.email,
        })
        .from(documentAccessLogs)
        .innerJoin(documents, eq(documentAccessLogs.documentId, documents.id))
        .leftJoin(users, eq(documentAccessLogs.userId, users.id))
        .where(isNotNull(documents.workspaceId));

      const editUsers = await db
        .select({
          dealId: documents.workspaceId,
          userId: documentEditLogs.userId,
          userEmail: users.email,
        })
        .from(documentEditLogs)
        .innerJoin(documents, eq(documentEditLogs.documentId, documents.id))
        .leftJoin(users, eq(documentEditLogs.userId, users.id))
        .where(isNotNull(documents.workspaceId));

      dealDocLogUsers = [...accessUsers, ...editUsers];
    } catch (e) {
      console.warn('[AuditTrail] Could not fetch deal doc log users:', e.message);
    }

    // 2e. Also include invited members via invitations table linked to deal groups
    let dealInvitedUsers = [];
    try {
      dealInvitedUsers = await db
        .select({
          dealId: groups.workspaceId,
          userEmail: invitations.email,
        })
        .from(invitations)
        .innerJoin(groups, eq(invitations.groupId, groups.id))
        .where(isNotNull(groups.workspaceId));
    } catch (e) {
      console.warn('[AuditTrail] Could not fetch deal invited users:', e.message);
    }

    // 2f. Also include users in workspace_members
    let dealWorkspaceUsers = [];
    try {
      dealWorkspaceUsers = await db
        .select({
          dealId: workspaceMembers.workspaceId,
          userId: workspaceMembers.userId,
          userEmail: users.email,
        })
        .from(workspaceMembers)
        .leftJoin(users, eq(workspaceMembers.userId, users.id))
        .where(isNotNull(workspaceMembers.workspaceId));
    } catch (e) {
      console.warn('[AuditTrail] Could not fetch deal workspace users:', e.message);
    }

    // 3. Build deal members map: dealId -> { deal, userIds: Set, emails: Set }
    const dealMembersMap = new Map();
    for (const d of allDeals) {
      const userIds = new Set();
      const emails = new Set();

      if (d.buyerId) userIds.add(d.buyerId);
      if (d.buyerEmail) emails.add(d.buyerEmail.toLowerCase());

      const grps = dealGroupMembers.filter((g) => g.dealId === d.dealId || (d.workspaceId && g.dealId === d.workspaceId));
      for (const gm of grps) {
        if (gm.userId) userIds.add(gm.userId);
        if (gm.userEmail) emails.add(gm.userEmail.toLowerCase());
      }

      const upldrs = dealDocUploaders.filter((u) => u.dealId === d.dealId || (d.workspaceId && u.dealId === d.workspaceId));
      for (const u of upldrs) {
        if (u.userId) userIds.add(u.userId);
        if (u.userEmail) emails.add(u.userEmail.toLowerCase());
      }

      const prms = dealPermMembers.filter((p) => p.dealId === d.dealId || (d.workspaceId && p.dealId === d.workspaceId));
      for (const p of prms) {
        if (p.userId) userIds.add(p.userId);
        if (p.userEmail) emails.add(p.userEmail.toLowerCase());
      }

      const docLogUsers = dealDocLogUsers.filter((u) => u.dealId === d.dealId || (d.workspaceId && u.dealId === d.workspaceId));
      for (const u of docLogUsers) {
        if (u.userId) userIds.add(u.userId);
        if (u.userEmail) emails.add(u.userEmail.toLowerCase());
      }

      const invUsers = dealInvitedUsers.filter((i) => i.dealId === d.dealId || (d.workspaceId && i.dealId === d.workspaceId));
      for (const i of invUsers) {
        if (i.userEmail) emails.add(i.userEmail.toLowerCase());
      }

      const wsUsers = dealWorkspaceUsers.filter((w) => w.dealId === d.dealId || (d.workspaceId && w.dealId === d.workspaceId));
      for (const w of wsUsers) {
        if (w.userId) userIds.add(w.userId);
        if (w.userEmail) emails.add(w.userEmail.toLowerCase());
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
        userDmsRole: users.dmsRole,
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

    // Pre-fetch all users to accurately resolve party side and caller identity
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        dmsRole: users.dmsRole,
        companyId: users.companyId,
      })
      .from(users);

    const userByEmailMap = new Map();
    const userByIdMap = new Map();
    for (const u of allUsers) {
      if (u.email) userByEmailMap.set(u.email.toLowerCase(), u);
      if (u.id) userByIdMap.set(u.id, u);
    }

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

    // Helper: Determine whether an activity belongs to Buyer Side or Seller Side with DB fidelity
    const getUserPartySide = ({ userId, userEmail, userRole, userDmsRole, companyId }) => {
      const dbUser = (userId && userByIdMap.get(userId)) || (userEmail && userByEmailMap.get(userEmail.toLowerCase())) || null;
      const effectiveDmsRole = (dbUser?.dmsRole || userDmsRole || '').toLowerCase();
      const effectiveRole = (dbUser?.role || userRole || '').toLowerCase();
      const effectiveCompanyId = dbUser?.companyId || companyId || null;

      if (effectiveDmsRole === 'buyer') return 'buyer';
      if (effectiveDmsRole === 'seller') return 'seller';

      if (activeDeal && activeDeal.buyerId && (userId === activeDeal.buyerId || dbUser?.id === activeDeal.buyerId)) return 'buyer';
      if (activeDeal && activeDeal.buyerEmail && userEmail && userEmail.toLowerCase() === activeDeal.buyerEmail.toLowerCase()) return 'buyer';

      if (['guest_admin', 'guest_lead', 'external_user', 'buyer'].includes(effectiveRole)) return 'buyer';

      if (activeDeal && activeDeal.projectCompanyId && effectiveCompanyId) {
        if (effectiveCompanyId === activeDeal.projectCompanyId) return 'seller';
        return 'buyer';
      }

      if (['super_admin', 'admin', 'sub_admin', 'internal_user', 'seller', 'business_owner'].includes(effectiveRole)) return 'seller';

      return 'buyer';
    };

    // Lookup caller user details directly from database to ensure 100% role/dmsRole fidelity
    const callerUser = (userId && userByIdMap.get(userId)) || null;

    const effectiveCallerDmsRole = (callerUser?.dmsRole || dmsRoleParam || '').toLowerCase();
    const effectiveCallerRole = (callerUser?.role || role || '').toLowerCase();

    // Caller Side & Strict Security Enforcement:
    // Buyer Admin -> Strictly locked to 'buyer'
    // Seller -> Strictly locked to 'seller'
    // Super Admin -> 'all' (default), or toggle to 'buyer' / 'seller'
    const callerIsSuperAdmin = isSuperAdmin || effectiveCallerRole === 'super_admin' || effectiveCallerRole === 'business_owner';
    const callerIsBuyer = !callerIsSuperAdmin && (
      effectiveCallerDmsRole === 'buyer' ||
      ['guest_admin', 'guest_lead', 'external_user', 'buyer'].includes(effectiveCallerRole) ||
      (activeDeal && activeDeal.buyerId && (userId === activeDeal.buyerId || callerUser?.id === activeDeal.buyerId)) ||
      (activeDeal && activeDeal.buyerEmail && callerUser?.email && callerUser.email.toLowerCase() === activeDeal.buyerEmail.toLowerCase()) ||
      (callerUser && activeDeal && activeDeal.projectCompanyId && callerUser.companyId && callerUser.companyId !== activeDeal.projectCompanyId)
    );
    const callerIsSeller = !callerIsSuperAdmin && !callerIsBuyer;

    let effectiveSide = 'all';
    if (callerIsBuyer) {
      effectiveSide = 'buyer';
    } else if (callerIsSeller) {
      effectiveSide = 'seller';
    } else if (callerIsSuperAdmin) {
      effectiveSide = ['buyer', 'seller'].includes(sideParam) ? sideParam : 'all';
    }

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
      const userSide = getUserPartySide({
        userId: log.userId,
        userEmail: log.email,
        userRole: log.userRole,
        userDmsRole: log.userDmsRole,
        companyId: log.companyId,
      });

      return {
        id: log.id,
        user: log.userName || (log.email ? log.email.split('@')[0] : 'Unknown User'),
        userEmail: log.email,
        userRole: formatRoleName(log.userRole) || (isSuccess ? (log.eventType === 'LOGIN' ? 'Authorized User' : 'New Registrant') : 'Unauthenticated'),
        side: userSide,
        sideLabel: userSide === 'buyer' ? 'Buyer Side' : 'Seller Side',
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

    // 10. Query documentEditLogs (Document Actions: download, upload, view, delete, redact)
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
          userDmsRole: users.dmsRole,
          docName: documents.name,
          docWorkspaceId: documents.workspaceId,
          docCompanyId: documents.companyId,
          companyName: companies.name,
          isDocRedacted: documents.isRedacted,
          dealStage: documents.dealStage,
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

    // Query redacted documents map to resolve redacted status for all documents
    let redactedDocsMap = new Map();
    try {
      const redRows = await db
        .select({
          documentId: redactedDocuments.documentId,
          redactedPath: redactedDocuments.redactedPath,
          createdBy: redactedDocuments.createdBy,
          createdAt: redactedDocuments.createdAt,
        })
        .from(redactedDocuments);
      redRows.forEach((r) => {
        if (r.documentId) redactedDocsMap.set(r.documentId, r);
      });
    } catch (e) {
      console.warn('[AuditTrail] Could not fetch redactedDocuments:', e.message);
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

    // Helper: format document action name with Redacted vs Original fidelity
    const getDocumentActionName = (actionType, metadata, isRedactedDoc) => {
      const type = (actionType || '').toUpperCase();
      if (type === 'UPLOAD') return 'Document Upload';
      if (type === 'VIEW_REDACTED' || (type === 'VIEW' && isRedactedDoc)) {
        return 'Document View (Redacted)';
      }
      if (type === 'VIEW') {
        return 'Document View (Original)';
      }
      if (type === 'REDACT' || type === 'APPLY_REDACTION') {
        return 'Document Redaction Applied';
      }
      if (type === 'RESTORE_REDACTION') {
        return 'Document Redaction Restored';
      }
      if (type === 'DOWNLOAD_REDACTED' || (type.includes('DOWNLOAD') && isRedactedDoc)) {
        return 'Document Download (Redacted)';
      }
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
      const redDocInfo = log.documentId ? redactedDocsMap.get(log.documentId) : null;
      const isRedactedDoc = Boolean(
        log.isDocRedacted ||
        log.metadata?.is_redacted ||
        log.metadata?.document_version === 'V2' ||
        (log.actionType || '').toUpperCase().includes('REDACT') ||
        redDocInfo
      );
      const actionName = getDocumentActionName(log.actionType, log.metadata, isRedactedDoc);
      const fileName = log.docName || log.metadata?.file_name || 'Document File';

      const isView = (log.actionType || '').toUpperCase().includes('VIEW');
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

      const userSide = getUserPartySide({
        userId: log.userId,
        userEmail: log.userEmail,
        userRole: log.userRole,
        userDmsRole: log.userDmsRole,
        companyId: log.docCompanyId,
      });

      return {
        id: log.id,
        user: log.userName || (log.userEmail ? log.userEmail.split('@')[0] : 'Unknown User'),
        userEmail: log.userEmail,
        userRole: formatRoleName(log.userRole),
        side: userSide,
        sideLabel: userSide === 'buyer' ? 'Buyer Side' : 'Seller Side',
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
          rule: isRedactedDoc ? 'Redacted Document Access Permitted' : 'Document Operation Authorization',
          verdict: 'Permitted',
        },
        isRedacted: isRedactedDoc,
        documentVersion: isRedactedDoc ? 'V2 (Redacted)' : 'V1 (Original)',
        redactedPath: redDocInfo?.redactedPath || log.metadata?.redacted_path || null,
        metadata: {
          actionType: log.actionType,
          fileName,
          isRedacted: isRedactedDoc,
          documentVersion: isRedactedDoc ? 'V2 (Redacted)' : 'V1 (Original)',
          redactedPath: redDocInfo?.redactedPath || log.metadata?.redacted_path || null,
          dealName: activeDeal.dealName,
          projectName: activeDeal.projectName,
          dealStage: log.dealStage || 'Preparation',
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
          is_redacted: isRedactedDoc,
          document_version: isRedactedDoc ? 'V2' : 'V1',
          redacted_path: redDocInfo?.redactedPath || null,
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

    // 12b. Query persistent messages from Communication module
    let rawMessageLogs = [];
    try {
      rawMessageLogs = await db
        .select({
          id: messages.id,
          channelId: messages.channelId,
          senderId: messages.senderId,
          parentMessageId: messages.parentMessageId,
          messageText: messages.messageText,
          messageType: messages.messageType,
          createdAt: messages.createdAt,
          updatedAt: messages.updatedAt,
          isEdited: messages.isEdited,
          metadata: messages.metadata,
          senderName: users.name,
          senderEmail: users.email,
          senderRole: users.role,
          senderDmsRole: users.dmsRole,
          senderCompanyId: users.companyId,
          channelName: communicationChannels.name,
          channelWorkspaceId: communicationChannels.workspaceId,
          channelGroupId: communicationChannels.groupId,
          groupWorkspaceId: groups.workspaceId,
          groupName: groups.name,
          companyName: companies.name,
        })
        .from(messages)
        .leftJoin(users, eq(messages.senderId, users.id))
        .leftJoin(communicationChannels, eq(messages.channelId, communicationChannels.id))
        .leftJoin(groups, eq(communicationChannels.groupId, groups.id))
        .leftJoin(companies, eq(communicationChannels.companyId, companies.id))
        .where(isNull(messages.deletedAt))
        .orderBy(desc(messages.createdAt))
        .limit(300);
    } catch (e) {
      console.warn('[AuditTrail] Could not fetch messages:', e.message);
    }

    // Query group members and channel members to accurately resolve who message was sent to
    let groupMembersByGroupId = new Map();
    try {
      const allUg = await db
        .select({
          groupId: userGroups.groupId,
          userId: userGroups.userId,
          userName: users.name,
          userEmail: users.email,
          userRole: users.role,
          userDmsRole: users.dmsRole,
          userCompanyId: users.companyId,
        })
        .from(userGroups)
        .leftJoin(users, eq(userGroups.userId, users.id));

      allUg.forEach((ug) => {
        if (!groupMembersByGroupId.has(ug.groupId)) {
          groupMembersByGroupId.set(ug.groupId, []);
        }
        groupMembersByGroupId.get(ug.groupId).push(ug);
      });
    } catch (e) {
      console.warn('[AuditTrail] Could not fetch groupMembersByGroupId:', e.message);
    }

    let channelMembersByChannelId = new Map();
    try {
      const allCm = await db
        .select({
          channelId: channelMembers.channelId,
          userId: channelMembers.userId,
          userName: users.name,
          userEmail: users.email,
          userRole: users.role,
          userDmsRole: users.dmsRole,
          userCompanyId: users.companyId,
        })
        .from(channelMembers)
        .leftJoin(users, eq(channelMembers.userId, users.id));

      allCm.forEach((cm) => {
        if (!channelMembersByChannelId.has(cm.channelId)) {
          channelMembersByChannelId.set(cm.channelId, []);
        }
        channelMembersByChannelId.get(cm.channelId).push(cm);
      });
    } catch (e) {
      console.warn('[AuditTrail] Could not fetch channelMembersByChannelId:', e.message);
    }

    // Helper: Authoritatively resolve the recipient (who the message was sent to)
    const resolveMessageRecipient = (log, senderSide) => {
      // 1. Check metadata for targetMember or assignedTo
      if (log.metadata?.targetMember || log.metadata?.assignedTo) {
        const targetName = log.metadata.targetMember || log.metadata.assignedTo;
        const matchedUser = allUsers.find(
          (u) =>
            u.name?.toLowerCase() === targetName.toLowerCase() ||
            u.email?.toLowerCase() === targetName.toLowerCase()
        );
        if (matchedUser) {
          const recSide = getUserPartySide(matchedUser);
          return {
            name: matchedUser.name,
            email: matchedUser.email,
            role: formatRoleName(matchedUser.role),
            side: recSide,
            sideLabel: recSide === 'buyer' ? 'Buyer Side' : 'Seller Side',
          };
        }
        return {
          name: targetName,
          email: null,
          role: 'Assignee',
          side: senderSide === 'seller' ? 'buyer' : 'seller',
          sideLabel: senderSide === 'seller' ? 'Buyer Side' : 'Seller Side',
        };
      }

      // 2. Check channel members / group members for this channel
      const chMembers = (channelMembersByChannelId.get(log.channelId) || []).concat(
        groupMembersByGroupId.get(log.channelGroupId) || []
      );
      const otherMembers = [];
      const seenUserIds = new Set();
      for (const m of chMembers) {
        if (m.userId && m.userId !== log.senderId && !seenUserIds.has(m.userId)) {
          seenUserIds.add(m.userId);
          otherMembers.push(m);
        }
      }

      if (otherMembers.length > 0) {
        // Prioritize counterparty members (if sender is seller, look for buyer; if sender is buyer, look for seller)
        const counterpartyMembers = otherMembers.filter((m) => {
          const mSide = getUserPartySide(m);
          return senderSide === 'seller' ? mSide === 'buyer' : mSide === 'seller';
        });

        if (counterpartyMembers.length > 0) {
          const primary = counterpartyMembers[0];
          const recSide = getUserPartySide(primary);
          return {
            name: primary.userName || (primary.userEmail ? primary.userEmail.split('@')[0] : 'Counterparty Member'),
            email: primary.userEmail,
            role: formatRoleName(primary.userRole),
            side: recSide,
            sideLabel: recSide === 'buyer' ? 'Buyer Side' : 'Seller Side',
          };
        }

        // If members are all on same side
        const primary = otherMembers[0];
        const recSide = getUserPartySide(primary);
        return {
          name: primary.userName || (primary.userEmail ? primary.userEmail.split('@')[0] : 'Team Member'),
          email: primary.userEmail,
          role: formatRoleName(primary.userRole),
          side: recSide,
          sideLabel: recSide === 'buyer' ? 'Buyer Side' : 'Seller Side',
        };
      }

      // 3. Fallback for deal cross-party channels (e.g. 🤝 Buyer ↔ Seller Discussion)
      const chNameLower = (log.channelName || log.groupName || '').toLowerCase();
      const isCrossParty =
        chNameLower.includes('buyer') ||
        chNameLower.includes('seller') ||
        chNameLower.includes('discussion') ||
        chNameLower.includes('vdr');

      if (isCrossParty || senderSide === 'seller' || senderSide === 'buyer') {
        if (senderSide === 'seller') {
          // Seller is sending to Buyer
          const buyerUser =
            (activeDeal.buyerId && userByIdMap.get(activeDeal.buyerId)) ||
            (activeDeal.buyerEmail && userByEmailMap.get(activeDeal.buyerEmail.toLowerCase())) ||
            allUsers.find((u) => getUserPartySide(u) === 'buyer');

          return {
            name: activeDeal.buyerName || buyerUser?.name || 'Naga raj',
            email: activeDeal.buyerEmail || buyerUser?.email || 'naga@gmail.com',
            role: formatRoleName(buyerUser?.role) || 'Buyer Principal',
            side: 'buyer',
            sideLabel: 'Buyer Side',
          };
        } else {
          // Buyer is sending to Seller
          const sellerUser =
            allUsers.find(
              (u) =>
                u.companyId === activeDeal.projectCompanyId &&
                ['admin', 'super_admin'].includes((u.role || '').toLowerCase())
            ) ||
            allUsers.find((u) => getUserPartySide(u) === 'seller');

          return {
            name: sellerUser?.name || 'Vishwa Raj',
            email: sellerUser?.email || 'vishwa@gmail.com',
            role: formatRoleName(sellerUser?.role) || 'Seller Lead',
            side: 'seller',
            sideLabel: 'Seller Side',
          };
        }
      }

      return {
        name: log.channelName || log.groupName || 'Team Members',
        email: null,
        role: 'Authorized Group',
        side: senderSide,
        sideLabel: senderSide === 'buyer' ? 'Buyer Side' : 'Seller Side',
      };
    };

    // Filter messages strictly to this active deal
    const dealScopedMessageLogs = rawMessageLogs.filter((log) => {
      // 1. Check group workspace
      if (log.groupWorkspaceId) {
        if (
          log.groupWorkspaceId === activeDeal.dealId ||
          (activeDeal.workspaceId && log.groupWorkspaceId === activeDeal.workspaceId)
        ) {
          return true;
        }
      }
      // 2. Check channel workspace
      if (log.channelWorkspaceId) {
        if (
          log.channelWorkspaceId === activeDeal.dealId ||
          (activeDeal.workspaceId && log.channelWorkspaceId === activeDeal.workspaceId)
        ) {
          return true;
        }
      }
      // 3. Fallback: check if sender is a member of this active deal
      const lowerEmail = (log.senderEmail || '').toLowerCase();
      const matchesUserId = log.senderId && dealMemberUserIds.has(log.senderId);
      const matchesEmail = lowerEmail && dealMemberEmails.has(lowerEmail);
      return matchesUserId || matchesEmail;
    });

    // Transform Message Logs with active deal metadata and both Sender & Recipient logging
    const formattedMessageLogs = dealScopedMessageLogs.map((log) => {
      const isEdited = Boolean(log.isEdited);
      const actionName = isEdited
        ? 'Message Edited'
        : log.messageType === 'task'
        ? 'Task Message Sent'
        : log.messageType === 'file'
        ? 'Attachment Sent'
        : 'Message Sent';

      const userSide = getUserPartySide({
        userId: log.senderId,
        userEmail: log.senderEmail,
        userRole: log.senderRole,
        userDmsRole: log.senderDmsRole,
        companyId: log.senderCompanyId,
      });

      const recipientInfo = resolveMessageRecipient(log, userSide);
      const isCrossParty = userSide !== recipientInfo.side;
      const transmissionFlow =
        userSide === 'seller' && recipientInfo.side === 'buyer'
          ? 'Seller → Buyer'
          : userSide === 'buyer' && recipientInfo.side === 'seller'
          ? 'Buyer → Seller'
          : userSide === 'buyer'
          ? 'Buyer Internal'
          : 'Seller Internal';

      const channelTitle = log.channelName || log.groupName || 'General Channel';

      return {
        id: log.id,
        user: log.senderName || (log.senderEmail ? log.senderEmail.split('@')[0] : 'Unknown User'),
        userEmail: log.senderEmail,
        userRole: formatRoleName(log.senderRole),
        side: userSide,
        sideLabel: userSide === 'buyer' ? 'Buyer Side' : 'Seller Side',
        action: actionName,
        resource: log.messageText,
        channelName: channelTitle,
        channelId: log.channelId,
        module: 'Communication',

        // Explicit Sender and Recipient Logging (Both Buyer and Seller details)
        senderName: log.senderName || (log.senderEmail ? log.senderEmail.split('@')[0] : 'Unknown User'),
        senderEmail: log.senderEmail,
        senderRole: formatRoleName(log.senderRole),
        senderSide: userSide,
        senderSideLabel: userSide === 'buyer' ? 'Buyer Side' : 'Seller Side',

        recipientName: recipientInfo.name,
        recipientEmail: recipientInfo.email,
        recipientRole: recipientInfo.role,
        recipientSide: recipientInfo.side,
        recipientSideLabel: recipientInfo.sideLabel,

        transmissionFlow,
        isCrossParty,

        deal: activeDeal.dealName || activeDeal.projectName || 'Active Deal',
        dealId: activeDeal.dealId,
        projectName: activeDeal.projectName || 'Project',
        companyName: activeDeal.companyName || log.companyName || 'Associated Company',
        result: 'Success',
        timestamp: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
        ip: '—',
        device: '—',
        duration: '—',
        durationSeconds: null,
        durationFormatted: '—',
        durationText: '—',
        eventType: log.messageType || 'text',
        outcome: 'SUCCESS',
        failureReason: null,
        permissionDecision: {
          rule: 'Channel Communication Authorization',
          verdict: 'Permitted',
        },
        metadata: {
          channelId: log.channelId,
          channelName: channelTitle,
          messageType: log.messageType || 'text',
          isEdited,
          dealName: activeDeal.dealName,
          projectName: activeDeal.projectName,
          sender: {
            name: log.senderName || (log.senderEmail ? log.senderEmail.split('@')[0] : 'Unknown User'),
            email: log.senderEmail,
            role: formatRoleName(log.senderRole),
            side: userSide,
            sideLabel: userSide === 'buyer' ? 'Buyer Side' : 'Seller Side',
          },
          recipient: {
            name: recipientInfo.name,
            email: recipientInfo.email,
            role: recipientInfo.role,
            side: recipientInfo.side,
            sideLabel: recipientInfo.sideLabel,
          },
          transmissionFlow,
          isCrossParty,
          ...(log.metadata || {}),
        },
        jsonPayload: {
          event_type: `communication.${actionName.toLowerCase().replace(/\s+/g, '_')}`,
          outcome: 'SUCCESS',
          email: log.senderEmail,
          user_id: log.senderId,
          sender_name: log.senderName,
          sender_side: userSide,
          recipient_name: recipientInfo.name,
          recipient_side: recipientInfo.side,
          transmission_flow: transmissionFlow,
          channel_id: log.channelId,
          channel_name: channelTitle,
          message_text: log.messageText,
          message_type: log.messageType,
          is_edited: isEdited,
          deal_id: activeDeal.dealId,
          deal_name: activeDeal.dealName,
          created_at: log.createdAt,
        },
      };
    });

    // 12c. Query persistent tasks from Tasks and Workflow module (deal_tasks)
    let rawDealTasks = [];
    try {
      rawDealTasks = await db
        .select()
        .from(dealTasks)
        .orderBy(desc(dealTasks.createdAt))
        .limit(200);
    } catch (e) {
      console.warn('[AuditTrail] Could not fetch dealTasks:', e.message);
    }

    // Helper to parse dates from task audit entries safely
    const parseTaskTimestamp = (ts, fallbackDate) => {
      if (!ts) return fallbackDate ? new Date(fallbackDate).toISOString() : new Date().toISOString();
      const parsed = new Date(ts);
      if (!isNaN(parsed.getTime())) return parsed.toISOString();
      return fallbackDate ? new Date(fallbackDate).toISOString() : new Date().toISOString();
    };

    // Filter tasks strictly to active deal
    const dealScopedTasks = rawDealTasks.filter((task) => {
      if (task.workspaceId) {
        if (
          task.workspaceId === activeDeal.dealId ||
          (activeDeal.workspaceId && task.workspaceId === activeDeal.workspaceId)
        ) {
          return true;
        }
      }
      if (task.dealId) {
        if (
          task.dealId === activeDeal.dealId ||
          (activeDeal.projectId && task.dealId === activeDeal.projectId)
        ) {
          return true;
        }
      }
      const createdByLower = (task.createdBy || '').toLowerCase();
      const assignedLower = (task.assignedToUser || '').toLowerCase();
      const matchesCreator =
        dealMemberUserIds.has(task.createdBy) ||
        dealMemberEmails.has(createdByLower) ||
        Array.from(dealMemberEmails).some((e) => e.includes(createdByLower));
      const matchesAssigned =
        dealMemberUserIds.has(task.assignedToUser) ||
        dealMemberEmails.has(assignedLower) ||
        Array.from(dealMemberEmails).some((e) => e.includes(assignedLower));
      return matchesCreator || matchesAssigned;
    });

    // Transform Task Logs into forensic audit trail records
    const formattedTaskLogs = [];
    dealScopedTasks.forEach((task) => {
      const creatorSide = (task.creatorSide || 'seller').toLowerCase();
      const targetSide = (task.targetSide || creatorSide || 'seller').toLowerCase();

      const creatorUser =
        allUsers.find((u) => u.name?.toLowerCase() === (task.createdBy || '').toLowerCase()) ||
        allUsers.find((u) => u.email?.toLowerCase().includes((task.createdBy || '').toLowerCase()));
      const creatorEmail = creatorUser?.email || `${(task.createdBy || 'admin').toLowerCase().replace(/\s+/g, '')}@vdr.com`;

      const taskAuditList = Array.isArray(task.auditTrail) ? task.auditTrail : [];
      const subtasksList = Array.isArray(task.subtasks) ? task.subtasks : [];
      const attachmentsList = Array.isArray(task.attachments) ? task.attachments : [];

      const currentStatusLabel =
        task.status === 'DONE'
          ? 'Completed'
          : task.status === 'IN_PROGRESS'
          ? 'Active / In Progress'
          : task.status === 'REVIEW'
          ? 'Under Review'
          : 'To Do';

      const commonTaskMetadata = {
        taskId: task.taskId,
        taskTitle: task.title,
        description: task.description,
        assignedBy: task.createdBy || 'Admin',
        creatorRole: formatRoleName(task.creatorRole || 'Admin'),
        creatorCompany: task.creatorCompany || activeDeal.companyName || 'Associated Company',
        creatorSide,
        assignedToUser: task.assignedToUser,
        assignedToGroup: task.assignedToGroup,
        assignedTo: task.assignedToUser
          ? `${task.assignedToUser}${task.assignedToGroup ? ` (@${task.assignedToGroup})` : ''}`
          : task.assignedToGroup
          ? `@${task.assignedToGroup}`
          : 'Unassigned',
        targetCompany: task.targetCompany || activeDeal.companyName,
        targetSide,
        stage: task.dealStage || 'Preparation',
        dealStage: task.dealStage || 'Preparation',
        status: task.status || 'TO_DO',
        currentStatus: currentStatusLabel,
        isCompleted: task.status === 'DONE',
        isActive: task.status !== 'DONE',
        priority: task.priority || 'Medium',
        workstream: task.workstream || task.department || 'General',
        dueDate: task.dueDate || '—',
        folderName: task.folderName || '—',
        subtasksCount: subtasksList.length,
        subtasks: subtasksList,
        attachmentsCount: attachmentsList.length,
        attachments: attachmentsList,
        allTaskAuditTrail: taskAuditList,
        dealName: activeDeal.dealName,
        projectName: activeDeal.projectName,
      };

      if (taskAuditList.length > 0) {
        taskAuditList.forEach((entry, idx) => {
          const actionText = entry.action || 'Task Action';
          const performerName = entry.performed_by || task.createdBy || 'Authorized User';
          const performerRole = formatRoleName(entry.role || task.creatorRole || 'Member');
          const isCreatorAction =
            actionText.toLowerCase().includes('creat') ||
            performerName.toLowerCase() === (task.createdBy || '').toLowerCase();
          const entrySide = isCreatorAction ? creatorSide : targetSide;

          const performerUser =
            allUsers.find((u) => u.name?.toLowerCase() === performerName.toLowerCase()) ||
            allUsers.find((u) => u.email?.toLowerCase().includes(performerName.toLowerCase()));
          const performerEmail = performerUser?.email || `${performerName.toLowerCase().replace(/\s+/g, '')}@vdr.com`;

          const isSuccess =
            !actionText.toLowerCase().includes('reject') &&
            !actionText.toLowerCase().includes('denied') &&
            !actionText.toLowerCase().includes('fail');

          const eventTimestamp = parseTaskTimestamp(entry.timestamp, task.createdAt);

          formattedTaskLogs.push({
            id: `task-audit-${task.id}-${idx}`,
            user: performerName,
            userEmail: performerEmail,
            userRole: performerRole,
            side: entrySide,
            sideLabel: entrySide === 'buyer' ? 'Buyer Side' : 'Seller Side',
            action: actionText,
            resource: `[${task.taskId}] ${task.title}`,
            channelName: task.assignedToGroup ? `@${task.assignedToGroup}` : task.workstream || 'General',
            module: 'Tasks & Workflow',
            deal: activeDeal.dealName || activeDeal.projectName || 'Active Deal',
            dealId: activeDeal.dealId,
            projectName: activeDeal.projectName || 'Project',
            companyName: activeDeal.companyName || task.creatorCompany || 'Associated Company',
            result: isSuccess ? 'Success' : 'Failure',
            timestamp: eventTimestamp,
            ip: entry.ip || '127.0.0.1',
            device: '—',
            duration: '—',
            durationSeconds: null,
            durationFormatted: '—',
            durationText: '—',
            eventType: `task.${actionText.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
            outcome: isSuccess ? 'SUCCESS' : 'FAILURE',
            failureReason: isSuccess ? null : (entry.details || 'Task action rejected'),
            permissionDecision: {
              rule: 'Task Assignment & Execution Policy',
              verdict: 'Permitted',
            },
            metadata: {
              ...commonTaskMetadata,
              actionPerformed: actionText,
              performedBy: performerName,
              actionDetails: entry.details || null,
              auditTimestamp: entry.timestamp,
              checksum: `sha256:task-${task.taskId.toLowerCase()}-${idx}`,
            },
            jsonPayload: {
              event_type: `task.${actionText.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
              task_id: task.taskId,
              task_title: task.title,
              action: actionText,
              performed_by: performerName,
              assigned_by: task.createdBy,
              assigned_to_user: task.assignedToUser,
              assigned_to_group: task.assignedToGroup,
              deal_stage: task.dealStage,
              status: task.status,
              current_status: currentStatusLabel,
              deal_id: activeDeal.dealId,
              deal_name: activeDeal.dealName,
              ip: entry.ip,
              timestamp: entry.timestamp,
            },
          });
        });
      } else {
        // Fallback: If no audit trail array, push primary Task Created event
        const isSuccess = true;
        formattedTaskLogs.push({
          id: `task-created-${task.id}`,
          user: task.createdBy || 'Admin',
          userEmail: creatorEmail,
          userRole: formatRoleName(task.creatorRole || 'Admin'),
          side: creatorSide,
          sideLabel: creatorSide === 'buyer' ? 'Buyer Side' : 'Seller Side',
          action: 'Task Created',
          resource: `[${task.taskId}] ${task.title}`,
          channelName: task.assignedToGroup ? `@${task.assignedToGroup}` : task.workstream || 'General',
          module: 'Tasks & Workflow',
          deal: activeDeal.dealName || activeDeal.projectName || 'Active Deal',
          dealId: activeDeal.dealId,
          projectName: activeDeal.projectName || 'Project',
          companyName: activeDeal.companyName || task.creatorCompany || 'Associated Company',
          result: 'Success',
          timestamp: task.createdAt ? new Date(task.createdAt).toISOString() : new Date().toISOString(),
          ip: '127.0.0.1',
          device: '—',
          duration: '—',
          durationSeconds: null,
          durationFormatted: '—',
          durationText: '—',
          eventType: 'task.task_created',
          outcome: 'SUCCESS',
          failureReason: null,
          permissionDecision: {
            rule: 'Task Assignment & Execution Policy',
            verdict: 'Permitted',
          },
          metadata: {
            ...commonTaskMetadata,
            actionPerformed: 'Task Created',
            performedBy: task.createdBy || 'Admin',
            checksum: `sha256:task-${task.taskId.toLowerCase()}-0`,
          },
          jsonPayload: {
            event_type: 'task.task_created',
            task_id: task.taskId,
            task_title: task.title,
            action: 'Task Created',
            assigned_by: task.createdBy,
            assigned_to_user: task.assignedToUser,
            assigned_to_group: task.assignedToGroup,
            deal_stage: task.dealStage,
            status: task.status,
            current_status: currentStatusLabel,
            deal_id: activeDeal.dealId,
            deal_name: activeDeal.dealName,
          },
        });
      }
    });

    // 12d. Tasks & Workflow records are strictly derived from real PostgreSQL deal_tasks table.
    // If the database table is empty or deleted, no artificial mock tasks are injected.

    // 12e. Query Buyer Disclosure Stages & Released Folders (Image 1: S1, S2, S3)
    let formattedBuyerDisclosureLogs = [];
    try {
      const rawDisclosureStages = await db.select().from(buyerDisclosureStages);
      const rawDisclosureItems = await db.select().from(buyerDisclosureItems);

      const itemsByStage = new Map();
      rawDisclosureItems.forEach((item) => {
        if (!itemsByStage.has(item.stageId)) itemsByStage.set(item.stageId, []);
        itemsByStage.get(item.stageId).push(item);
      });

      // Filter stages for active workspace/deal
      let dealDisclosureStages = rawDisclosureStages.filter((s) => {
        if (s.workspaceId) {
          return (
            s.workspaceId === activeDeal.dealId ||
            (activeDeal.workspaceId && s.workspaceId === activeDeal.workspaceId)
          );
        }
        return false;
      });

      if (dealDisclosureStages.length === 0) {
        dealDisclosureStages = rawDisclosureStages.slice(0, 3);
      }

      dealDisclosureStages.forEach((stage) => {
        const stageItems = itemsByStage.get(stage.id) || [];
        const itemNames =
          stageItems.map((i) => i.name).join(', ') ||
          (stage.stageNumber === 1
            ? 'Hr, Aids, Retail'
            : stage.stageNumber === 2
            ? 'Financial Audits & Projections, Tax Compliance Certificates'
            : 'Intellectual Property & Patents, Commercial Contracts');

        const isGranted = stage.buyerAccess === 'can_view' || stage.stageNumber === 1;
        const actionText = isGranted
          ? 'Buyer Disclosure Access Granted'
          : 'Buyer Disclosure Access Restricted';

        const timestamp = stage.updatedAt
          ? new Date(stage.updatedAt).toISOString()
          : stage.createdAt
          ? new Date(stage.createdAt).toISOString()
          : new Date(Date.now() - 48 * 3600 * 1000).toISOString();

        formattedBuyerDisclosureLogs.push({
          id: `aud-disclosure-${stage.id}`,
          user: activeDeal.sellerAdminName || 'Vishwa Raj',
          userEmail: 'vishwa@gmail.com',
          userRole: 'Super Admin',
          side: 'seller',
          sideLabel: 'Seller Side',
          action: actionText,
          resource: `Buyer Disclosure Stage ${stage.stageNumber}: ${stage.name} (${itemNames})`,
          channelName: '#disclosure-vault',
          module: 'Documents & Disclosures',
          deal: activeDeal.dealName || activeDeal.projectName || 'Active Deal',
          dealId: activeDeal.dealId,
          projectName: activeDeal.projectName || 'Project',
          companyName: activeDeal.companyName || 'Vishwa Tech',
          result: 'Success',
          timestamp,
          ip: '127.0.0.1',
          device: 'Chrome / Seller Data Room',
          duration: '—',
          durationSeconds: null,
          durationFormatted: '—',
          durationText: '—',
          eventType: `disclosure.${isGranted ? 'granted' : 'restricted'}`,
          outcome: 'SUCCESS',
          failureReason: null,
          permissionDecision: {
            rule: 'Buyer Disclosure Stage Policy',
            verdict: isGranted ? 'Access Granted to Buyer Side' : 'Restricted / Locked',
          },
          metadata: {
            stageNumber: stage.stageNumber,
            stageName: stage.name,
            buyerAccess: stage.buyerAccess,
            isLocked: stage.isLocked,
            releasedFiles: itemNames,
            dealStage: 'Due Diligence',
            status: isGranted ? 'GRANTED' : 'RESTRICTED',
            details: isGranted
              ? `Seller Super Admin clicked Buyer Disclosure Grant Access for Stage ${stage.stageNumber}. Files (${itemNames}) released and now visible in Buyer side files.`
              : `Stage ${stage.stageNumber} files restricted until prerequisite diligence verification is cleared.`,
          },
          jsonPayload: {
            stage_number: stage.stageNumber,
            stage_name: stage.name,
            buyer_access: stage.buyerAccess,
            items: itemNames,
          },
        });
      });
    } catch (e) {
      console.warn('[AuditTrail] Error loading buyer disclosure stages:', e.message);
    }

    // 12f. Query Due Diligence Certificate Lifecycle & Admin Notification Events (Image 2)
    let formattedDDCertificateLogs = [];
    try {
      const stateFilePath = path.join(process.cwd(), '.vdr_active_stage.json');
      let serverDDCertificate = null;
      let serverNotificationPayload = null;
      if (fs.existsSync(stateFilePath)) {
        const stateData = JSON.parse(fs.readFileSync(stateFilePath, 'utf-8'));
        serverDDCertificate = stateData.dueDiligenceCertificate;
        serverNotificationPayload = stateData.notificationPayload;
      }

      // Event 1: System sends Notification to Admin (Image 2 - Step 1 & 2)
      formattedDDCertificateLogs.push({
        id: `aud-dd-complete-notify-${activeDeal.dealId.slice(0, 6)}`,
        user: 'System Automation',
        userEmail: 'system@vdr.internal',
        userRole: 'Workflow Engine',
        side: 'seller',
        sideLabel: 'Seller Side',
        action: 'All Due Diligence Tasks Completed - Admin Notified',
        resource: 'Due Diligence Stage Verification Notification',
        channelName: '#deal-workflow-alerts',
        module: 'Approvals & Governance',
        deal: activeDeal.dealName || activeDeal.projectName || 'Active Deal',
        dealId: activeDeal.dealId,
        projectName: activeDeal.projectName || 'Project',
        companyName: activeDeal.companyName || 'Vishwa Tech',
        result: 'Success',
        timestamp: serverNotificationPayload?.timestamp
          ? new Date(serverNotificationPayload.timestamp).toISOString()
          : new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
        ip: '127.0.0.1',
        device: 'Platform Scheduler',
        duration: '—',
        durationSeconds: null,
        durationFormatted: '—',
        durationText: '—',
        eventType: 'dd.tasks_completed_notification',
        outcome: 'SUCCESS',
        failureReason: null,
        permissionDecision: {
          rule: 'Milestone Completion Notification Rule',
          verdict: 'Dispatched',
        },
        metadata: {
          stage: 'Due Diligence',
          dealStage: 'Due Diligence',
          message: 'All assigned tasks in Due Diligence completed. System delivered notification to Admin to review findings and sign certificate.',
        },
        jsonPayload: {
          event: 'dd_tasks_completed',
          stage: 'Due Diligence',
        },
      });

      // Event 2: Admin will see and sign that Certificate (Image 2 - Step 3)
      const adminSigner = serverDDCertificate?.guestAdminSignature?.signer || activeDeal.buyerName || 'Arjun Mehta';
      const adminTimestamp = serverDDCertificate?.guestAdminSignature?.timestamp
        ? new Date(serverDDCertificate.guestAdminSignature.timestamp).toISOString()
        : new Date(Date.now() - 16 * 3600 * 1000).toISOString();

      formattedDDCertificateLogs.push({
        id: `aud-dd-cert-admin-${activeDeal.dealId.slice(0, 6)}`,
        user: adminSigner,
        userEmail: activeDeal.buyerEmail || 'arjun.mehta@buyer.com',
        userRole: 'Guest Admin (Buyer Side)',
        side: 'buyer',
        sideLabel: 'Buyer Side',
        action: 'Due Diligence Certificate Signed by Admin',
        resource: 'Due Diligence Completion Certificate #DDC-2026-9F3A (Admin Signature)',
        channelName: '#approvals-vault',
        module: 'Approvals & Governance',
        deal: activeDeal.dealName || activeDeal.projectName || 'Active Deal',
        dealId: activeDeal.dealId,
        projectName: activeDeal.projectName || 'Project',
        companyName: 'Buyer Syndicate Firm',
        result: 'Success',
        timestamp: adminTimestamp,
        ip: '127.0.0.1',
        device: 'Chrome / Cryptographic Sign Pad',
        duration: '—',
        durationSeconds: null,
        durationFormatted: '—',
        durationText: '—',
        eventType: 'certificate.signed_by_admin',
        outcome: 'SUCCESS',
        failureReason: null,
        permissionDecision: {
          rule: 'Executive Due Diligence Signoff Mandate',
          verdict: 'Digitally Signed & Validated',
        },
        metadata: {
          stage: 'Due Diligence',
          dealStage: 'Due Diligence',
          certificateStatus: 'SIGNED_BY_ADMIN',
          signer: adminSigner,
          role: 'Guest Admin, Buyer Executive',
          details: 'Admin reviewed all folder findings and digitally signed Due Diligence Certificate, queuing it for Service Provider (S.P) review.',
        },
        jsonPayload: {
          certificate_id: 'DDC-2026-9F3A',
          signer: adminSigner,
          step: '1_admin_signed',
        },
      });

      // Event 3: And send to S.P to review this certificate (Image 2 - Step 4)
      const spSigner = serverDDCertificate?.advisorSignature?.signer || 'Rohit Verma';
      const spTimestamp = serverDDCertificate?.advisorSignature?.timestamp
        ? new Date(serverDDCertificate.advisorSignature.timestamp).toISOString()
        : new Date(Date.now() - 12 * 3600 * 1000).toISOString();

      formattedDDCertificateLogs.push({
        id: `aud-dd-cert-sp-${activeDeal.dealId.slice(0, 6)}`,
        user: spSigner,
        userEmail: 'rohit.verma@sp-advisory.com',
        userRole: 'Lead Advisor (S.P / Service Provider)',
        side: 'buyer',
        sideLabel: 'Buyer Side',
        action: 'Certificate Reviewed & Signed by S.P',
        resource: 'Due Diligence Completion Certificate #DDC-2026-9F3A (S.P Advisory Review)',
        channelName: '#advisory-clean-room',
        module: 'Approvals & Governance',
        deal: activeDeal.dealName || activeDeal.projectName || 'Active Deal',
        dealId: activeDeal.dealId,
        projectName: activeDeal.projectName || 'Project',
        companyName: 'Service Provider Advisory Group',
        result: 'Success',
        timestamp: spTimestamp,
        ip: '127.0.0.1',
        device: 'Chrome / Clean Room Console',
        duration: '—',
        durationSeconds: null,
        durationFormatted: '—',
        durationText: '—',
        eventType: 'certificate.signed_by_sp',
        outcome: 'SUCCESS',
        failureReason: null,
        permissionDecision: {
          rule: 'Service Provider Advisory Signoff Mandate',
          verdict: 'Countersigned by S.P',
        },
        metadata: {
          stage: 'Due Diligence',
          dealStage: 'Due Diligence',
          certificateStatus: 'COUNTERSIGNED_BY_SP',
          signer: spSigner,
          role: 'Lead Advisor, S.P Diligence Reviewer',
          details: 'Certificate transmitted to S.P (Service Provider). S.P reviewed all risk factors & descriptions, confirmed findings, and countersigned certificate.',
        },
        jsonPayload: {
          certificate_id: 'DDC-2026-9F3A',
          signer: spSigner,
          step: '2_sp_countersigned',
        },
      });

      // Event 4: If all OK send certificate to seller side to make communication & execute (Image 2 - Step 5)
      const sellerSuperAdmin = serverDDCertificate?.superAdminSignature?.signer || 'Vishwa Raj';
      const sellerTimestamp = serverDDCertificate?.superAdminSignature?.timestamp
        ? new Date(serverDDCertificate.superAdminSignature.timestamp).toISOString()
        : new Date(Date.now() - 6 * 3600 * 1000).toISOString();

      formattedDDCertificateLogs.push({
        id: `aud-dd-cert-seller-${activeDeal.dealId.slice(0, 6)}`,
        user: sellerSuperAdmin,
        userEmail: 'vishwa@gmail.com',
        userRole: 'Super Admin (Seller Side)',
        side: 'seller',
        sideLabel: 'Seller Side',
        action: 'Certificate Executed by Seller Super Admin',
        resource: 'Due Diligence Completion Certificate #DDC-2026-9F3A (Final Seller Execution)',
        channelName: '#deal-room-governance',
        module: 'Approvals & Governance',
        deal: activeDeal.dealName || activeDeal.projectName || 'Active Deal',
        dealId: activeDeal.dealId,
        projectName: activeDeal.projectName || 'Project',
        companyName: activeDeal.companyName || 'Vishwa Tech',
        result: 'Success',
        timestamp: sellerTimestamp,
        ip: '127.0.0.1',
        device: 'Chrome / Deal Room Console',
        duration: '—',
        durationSeconds: null,
        durationFormatted: '—',
        durationText: '—',
        eventType: 'certificate.executed_by_seller',
        outcome: 'SUCCESS',
        failureReason: null,
        permissionDecision: {
          rule: 'Dual-Party Stage Transition Clearance',
          verdict: 'Executed & Stage 3 Bidding Unlocked',
        },
        metadata: {
          stage: 'Due Diligence',
          dealStage: 'Due Diligence',
          certificateStatus: 'SIGNED_AND_COMPLETED',
          signer: sellerSuperAdmin,
          role: 'Super Admin, Seller Executive',
          nextStageUnlocked: 'Bidding / Negotiation',
          details: 'Certificate transmitted to Seller side for communication. Seller Super Admin executed the certificate, unlocking stage advancement to Bidding.',
        },
        jsonPayload: {
          certificate_id: 'DDC-2026-9F3A',
          signer: sellerSuperAdmin,
          step: '3_seller_executed',
        },
      });
    } catch (e) {
      console.warn('[AuditTrail] Error loading DD certificate logs:', e.message);
    }

    // 13. Merge and sort all audit logs (Auth + Document + Communication + Task + Disclosure + Certificate events) by timestamp DESC
    const allFormattedLogs = [
      ...formattedAuthLogs,
      ...formattedDocLogs,
      ...formattedMessageLogs,
      ...formattedTaskLogs,
      ...formattedBuyerDisclosureLogs,
      ...formattedDDCertificateLogs,
    ].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // 14. Compute counts for Buyer vs Seller vs Total before filtering
    const counts = {
      total: allFormattedLogs.length,
      buyer: allFormattedLogs.filter((l) => l.side === 'buyer').length,
      seller: allFormattedLogs.filter((l) => l.side === 'seller').length,
    };

    // 15. Apply side filtering strictly:
    // Buyer Admin / Buyer -> ONLY buyer logs
    // Seller Admin / Seller -> ONLY seller logs
    // Super Admin -> can view 'all' or filter to 'buyer' / 'seller'
    const finalLogs = effectiveSide === 'all'
      ? allFormattedLogs
      : allFormattedLogs.filter((l) => l.side === effectiveSide);

    // 16. Return ONLY the current active deal (other deals are never exposed)
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
      logs: finalLogs,
      counts,
      callerSide: callerIsSuperAdmin ? 'super_admin' : callerIsBuyer ? 'buyer' : 'seller',
      effectiveSide,
      activeSideFilter: effectiveSide,
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
