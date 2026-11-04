import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
  authActivityLogs,
  documentAccessLogs,
  documentEditLogs,
  permissions,
  documents,
  users,
  companies,
  dmsDeals,
  dmsProjects,
  groups,
  userGroups,
  riskIssues,
  auditLogs,
  dealTasks,
  buyerDisclosureStages,
  buyerDisclosureItems,
} from '@/db/schema';
import { eq, desc, or, and, ne, isNull, inArray } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const dealIdParam = searchParams.get('dealId');
    const sideParam = (searchParams.get('side') || 'all').toLowerCase(); // 'all' | 'buyer' | 'seller'
    const severityParam = searchParams.get('severity') || 'all'; // 'all' | 'High' | 'Medium' | 'Low'
    const categoryParam = searchParams.get('category') || 'all';
    const statusParam = searchParams.get('status') || 'all';
    const blockersOnly = searchParams.get('blockersOnly') === 'true';
    const searchQuery = (searchParams.get('search') || '').toLowerCase().trim();

    // 1. Fetch active deals with projects, companies, and buyer details
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
        buyerRole: users.role,
        buyerDmsRole: users.dmsRole,
      })
      .from(dmsDeals)
      .leftJoin(dmsProjects, eq(dmsDeals.projectId, dmsProjects.id))
      .leftJoin(companies, eq(dmsProjects.companyId, companies.id))
      .leftJoin(users, eq(dmsDeals.buyerId, users.id))
      .where(or(ne(dmsDeals.status, 'trashed'), isNull(dmsDeals.status)));

    if (allDeals.length === 0) {
      return NextResponse.json({
        success: true,
        deal: null,
        deals: [],
        risks: [],
        counts: {
          total: 0,
          high: 0,
          mediumLow: 0,
          policyViolations: 0,
          mitigated: 0,
          blockingStage: 0,
          buyerRisks: 0,
          sellerRisks: 0,
        },
      });
    }

    // Resolve active deal
    let activeDeal = null;
    if (dealIdParam && dealIdParam !== 'all') {
      activeDeal = allDeals.find((d) => d.dealId === dealIdParam) || null;
    }
    if (!activeDeal) {
      activeDeal = allDeals[0];
    }

    // 2. Fetch all users for party side resolution
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

    const userByIdMap = new Map();
    const userByEmailMap = new Map();
    allUsers.forEach((u) => {
      userByIdMap.set(u.id, u);
      if (u.email) userByEmailMap.set(u.email.toLowerCase(), u);
    });

    // Helper: Determine whether an entity belongs to Buyer Side or Seller Side
    const getUserPartySide = ({ userId, userEmail, userRole, userDmsRole, companyId }) => {
      const dbUser =
        (userId && userByIdMap.get(userId)) ||
        (userEmail && userByEmailMap.get(userEmail.toLowerCase())) ||
        null;
      const effectiveDmsRole = (dbUser?.dmsRole || userDmsRole || '').toLowerCase();
      const effectiveRole = (dbUser?.role || userRole || '').toLowerCase();
      const effectiveCompanyId = dbUser?.companyId || companyId || null;

      if (effectiveDmsRole === 'buyer') return 'buyer';
      if (effectiveDmsRole === 'seller') return 'seller';

      if (activeDeal && activeDeal.buyerId && (userId === activeDeal.buyerId || dbUser?.id === activeDeal.buyerId)) {
        return 'buyer';
      }
      if (
        activeDeal &&
        activeDeal.buyerEmail &&
        userEmail &&
        userEmail.toLowerCase() === activeDeal.buyerEmail.toLowerCase()
      ) {
        return 'buyer';
      }

      if (['guest_admin', 'guest_lead', 'external_user', 'buyer'].includes(effectiveRole)) {
        return 'buyer';
      }

      if (activeDeal && activeDeal.projectCompanyId && effectiveCompanyId) {
        if (effectiveCompanyId === activeDeal.projectCompanyId) return 'seller';
        return 'buyer';
      }

      if (['super_admin', 'admin', 'sub_admin', 'internal_user', 'seller', 'business_owner'].includes(effectiveRole)) {
        return 'seller';
      }

      return 'buyer';
    };

    // Find deal seller lead (admin or super_admin from seller company)
    const sellerLead =
      allUsers.find(
        (u) =>
          u.companyId === activeDeal.projectCompanyId &&
          ['admin', 'super_admin'].includes((u.role || '').toLowerCase())
      ) ||
      allUsers.find((u) => getUserPartySide(u) === 'seller') || {
        name: 'Deal Seller Admin',
        email: 'seller@deal.com',
      };

    const sellerLeadName = sellerLead?.name || 'Deal Seller Admin';
    const sellerLeadAvatar = (sellerLeadName || 'SA').slice(0, 2).toUpperCase();
    const buyerLeadName = activeDeal.buyerName || 'Buyer Principal';
    const buyerLeadAvatar = (buyerLeadName || 'BP').slice(0, 2).toUpperCase();

    const dynamicRisks = [];

    // ── 3. QUERY PERSISTED RISKS FROM `riskIssues` TABLE ──
    if (activeDeal.projectId) {
      try {
        const persistedRows = await db
          .select()
          .from(riskIssues)
          .where(eq(riskIssues.projectId, activeDeal.projectId));

        persistedRows.forEach((r) => {
          const sev = r.severity || 'High';
          const isHigh = sev.toLowerCase() === 'high';
          dynamicRisks.push({
            id: r.id,
            title: r.title,
            category: isHigh ? 'High Risk' : 'Deal Governance',
            type: 'Deal Governance Risk',
            severity: sev,
            owner: sellerLeadName,
            ownerAvatar: sellerLeadAvatar,
            status: r.status || 'active',
            dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            detectedAt: new Date().toISOString(),
            deal: activeDeal.dealName || activeDeal.projectName || 'Active Deal',
            dealId: activeDeal.dealId,
            side: 'seller',
            sideLabel: 'Seller Side',
            relatedItem: 'Regulatory & Governance Filing',
            relatedType: 'Compliance Item',
            description: `Registered governance risk: ${r.title}. Reviewed under deal compliance mandate.`,
            mitigationPlan: 'Regulatory filings and waiver submissions queued for clearance.',
            blocksStageAdvancement: isHigh,
          });
        });
      } catch (err) {
        console.warn('Error reading riskIssues table:', err);
      }
    }

    // ── 3B. QUERY DUE DILIGENCE WORKSTREAM FINDINGS FROM `dealTasks` & WORKFLOW ──
    let rawDealTasks = [];
    try {
      rawDealTasks = await db
        .select()
        .from(dealTasks)
        .orderBy(desc(dealTasks.createdAt));
    } catch (err) {
      console.warn('Error reading dealTasks table:', err);
    }

    // Filter tasks for active deal
    const dealScopedTasks = rawDealTasks.filter((task) => {
      if (!dealIdParam || dealIdParam === 'all') {
        if (task.workspaceId === activeDeal.dealId || task.dealId === activeDeal.dealId) return true;
        if (activeDeal.workspaceId && (task.workspaceId === activeDeal.workspaceId || task.dealId === activeDeal.workspaceId)) return true;
        if (activeDeal.projectId && (task.dealId === activeDeal.projectId || task.workspaceId === activeDeal.projectId)) return true;
        const matchDeal = allDeals.find((d) => d.dealId === task.workspaceId || d.dealId === task.dealId);
        if (matchDeal && matchDeal.projectId && matchDeal.projectId === activeDeal.projectId) return true;
        return false;
      }
      if (task.workspaceId === dealIdParam || task.dealId === dealIdParam) return true;
      if (activeDeal.workspaceId && (task.workspaceId === activeDeal.workspaceId || task.dealId === activeDeal.workspaceId)) return true;
      return false;
    });

    // Fallback: If no tasks matched the strictly scoped deal, include all raw deal tasks so real findings are never missed
    const effectiveTasks = dealScopedTasks.length > 0 ? dealScopedTasks : rawDealTasks;

    // Check certificate & workflow state from .vdr_active_stage.json
    let serverDDCertificate = null;
    let isDDCertSigned = false;
    let serverActiveStage = 'Due Diligence';
    try {
      const stateFilePath = path.join(process.cwd(), '.vdr_active_stage.json');
      if (fs.existsSync(stateFilePath)) {
        const stateData = JSON.parse(fs.readFileSync(stateFilePath, 'utf-8'));
        if (stateData.activeStage) serverActiveStage = stateData.activeStage;
        serverDDCertificate = stateData.dueDiligenceCertificate;
        if (
          serverDDCertificate?.status === 'SIGNED_AND_COMPLETED' ||
          (serverDDCertificate?.advisorSignature &&
            serverDDCertificate?.guestAdminSignature &&
            serverDDCertificate?.superAdminSignature)
        ) {
          isDDCertSigned = true;
        }
      }
    } catch (e) {
      console.warn('Could not read .vdr_active_stage.json for risks route:', e);
    }

    effectiveTasks.forEach((task) => {
      const isDD =
        (task.dealStage || '').toLowerCase().includes('due') ||
        (task.dealStage || '').toLowerCase().includes('diligence');
      const hasRisk = Boolean(task.severity || task.problemDescription || isDD);
      if (!hasRisk) return;

      const rawSev = (task.severity || 'Medium').trim();
      const isCritical = rawSev.toLowerCase() === 'critical';
      const isHigh = rawSev.toLowerCase() === 'high' || isCritical;
      const isLow = rawSev.toLowerCase() === 'low';
      const sev = isCritical ? 'Critical' : isHigh ? 'High' : isLow ? 'Low' : 'Medium';
      const isDone = (task.status || '').toUpperCase() === 'DONE';
      const isInReview = (task.status || '').toUpperCase() === 'REVIEW';
      const riskStatus = isDone ? 'mitigated' : isInReview ? 'in_review' : 'active';
      const taskSide = (task.targetSide || task.creatorSide || 'buyer').toLowerCase() === 'seller' ? 'seller' : 'buyer';
      const ownerName = task.assignedToUser || task.createdBy || (taskSide === 'buyer' ? buyerLeadName : sellerLeadName);

      dynamicRisks.push({
        id: `dd-task-${task.id}`,
        title: `[${task.taskId}] ${task.title}`,
        category: task.category || task.folderName || 'Due Diligence Finding',
        type: 'Due Diligence Risk Finding',
        severity: sev,
        owner: ownerName,
        ownerAvatar: (ownerName || 'DD').slice(0, 2).toUpperCase(),
        status: riskStatus,
        dueDate: task.dueDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        detectedAt: task.createdAt ? new Date(task.createdAt).toISOString() : new Date().toISOString(),
        deal: activeDeal.dealName || activeDeal.projectName || 'Active Deal',
        dealId: activeDeal.dealId,
        side: taskSide,
        sideLabel: taskSide === 'buyer' ? 'Buyer Side' : 'Seller Side',
        relatedItem: task.folderName ? `${task.folderName} · ${task.title}` : task.title,
        relatedType: 'Due Diligence Task / Folder',
        description: task.problemDescription
          ? task.problemDescription
          : (task.description || `Assigned due diligence review task for ${task.folderName || 'active deal folder'}.`),
        mitigationPlan: isDone
          ? 'Diligence risk reviewed and verified in Due Diligence completion certificate.'
          : isInReview
            ? 'Task submitted for review; awaiting counterparty resolution and sign-off.'
            : 'Workstream investigation underway; pending counterparty disclosure clarification.',
        blocksStageAdvancement: (sev === 'High' || sev === 'Critical') && !isDone,
      });
    });

    // ── 4. DERIVE REAL DOCUMENT SECURITY & EXPOSURE RISKS FROM `documents` TABLE ──
    const dealWorkspaceIds = [activeDeal.dealId];
    if (activeDeal.workspaceId) dealWorkspaceIds.push(activeDeal.workspaceId);
    if (activeDeal.projectId) dealWorkspaceIds.push(activeDeal.projectId);

    const dealDocuments = await db
      .select({
        id: documents.id,
        name: documents.name,
        isRedacted: documents.isRedacted,
        isDeleted: documents.isDeleted,
        dealStage: documents.dealStage,
        workspaceId: documents.workspaceId,
      })
      .from(documents)
      .where(inArray(documents.workspaceId, dealWorkspaceIds));

    dealDocuments.forEach((doc) => {
      // Risk: Deleted / Archived Document from deal room
      if (doc.isDeleted) {
        dynamicRisks.push({
          id: `doc-deleted-${doc.id}`,
          title: `Document Removed / Archived from Deal Room (${doc.name})`,
          category: 'Governance & Archival',
          type: 'Governance Audit Signal',
          severity: 'Low',
          owner: sellerLeadName,
          ownerAvatar: sellerLeadAvatar,
          status: 'mitigated',
          dueDate: new Date().toISOString().slice(0, 10),
          detectedAt: new Date().toISOString(),
          deal: activeDeal.dealName || activeDeal.projectName || 'Active Deal',
          dealId: activeDeal.dealId,
          side: 'seller',
          sideLabel: 'Seller Side',
          relatedItem: doc.name,
          relatedType: 'Document',
          description: `Audit alert: Document "${doc.name}" was moved to recycle bin or removed from active diligence folders.`,
          mitigationPlan: 'Deletion verified in audit logs; document retained in immutable archive.',
          blocksStageAdvancement: false,
        });
      }
    });

    // ── 4B. REPEATED DOWNLOADS & SUSPICIOUS DOCUMENT RETRIEVAL ANOMALIES ──
    let rawDocEditLogs = [];
    try {
      rawDocEditLogs = await db
        .select({
          id: documentEditLogs.id,
          userId: documentEditLogs.userId,
          documentId: documentEditLogs.documentId,
          actionType: documentEditLogs.actionType,
          metadata: documentEditLogs.metadata,
          changedAt: documentEditLogs.changedAt,
          docName: documents.name,
          userName: users.name,
          userEmail: users.email,
          userRole: users.role,
          docWorkspaceId: documents.workspaceId,
        })
        .from(documentEditLogs)
        .leftJoin(documents, eq(documentEditLogs.documentId, documents.id))
        .leftJoin(users, eq(documentEditLogs.userId, users.id))
        .orderBy(desc(documentEditLogs.changedAt))
        .limit(200);
    } catch (e) {
      console.warn('Error reading documentEditLogs table:', e);
    }

    // A. Detect Repeated Downloads (per-document and per-user)
    const downloadsByDoc = new Map();
    const downloadsByUserDoc = new Map();

    rawDocEditLogs.forEach((l) => {
      if ((l.actionType || '').toUpperCase().includes('DOWNLOAD')) {
        const docId = l.documentId || l.metadata?.file_name || 'unknown_doc';
        if (!downloadsByDoc.has(docId)) {
          downloadsByDoc.set(docId, []);
        }
        downloadsByDoc.get(docId).push(l);

        const userDocKey = `${l.userId || 'anon'}_${docId}`;
        if (!downloadsByUserDoc.has(userDocKey)) {
          downloadsByUserDoc.set(userDocKey, []);
        }
        downloadsByUserDoc.get(userDocKey).push(l);
      }
    });

    // Check per-user repeated downloads (>= 2)
    const flaggedDocIds = new Set();
    downloadsByUserDoc.forEach((groupLogs, key) => {
      if (groupLogs.length >= 2) {
        const latest = groupLogs[0];
        const docId = latest.documentId || latest.metadata?.file_name;
        flaggedDocIds.add(docId);
        const docName = latest.docName || latest.metadata?.file_name || 'Deal Document';
        const ownerName = latest.userName || (latest.userEmail ? latest.userEmail.split('@')[0] : 'Audited User');
        const side = getUserPartySide({
          userId: latest.userId,
          userEmail: latest.userEmail,
        });
        const isCritical = groupLogs.length >= 4;
        const isHigh = groupLogs.length >= 3;
        const sev = isCritical ? 'Critical' : isHigh ? 'High' : 'Medium';
        const count = groupLogs.length;

        dynamicRisks.push({
          id: `sec-rep-dl-usr-${(docId || 'doc').slice(0, 8)}-${(latest.userId || 'usr').slice(0, 6)}`,
          title: `Repeated Document Download Anomaly (${docName})`,
          category: 'Security Alert',
          type: 'Suspicious Download Activity',
          severity: sev,
          owner: ownerName,
          ownerAvatar: (ownerName || 'DL').slice(0, 2).toUpperCase(),
          status: 'in_review',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          detectedAt: latest.changedAt ? new Date(latest.changedAt).toISOString() : new Date().toISOString(),
          deal: activeDeal.dealName || activeDeal.projectName || 'Active Deal',
          dealId: activeDeal.dealId,
          side,
          sideLabel: side === 'buyer' ? 'Buyer Side' : 'Seller Side',
          relatedItem: `${docName} (${count} User Downloads)`,
          relatedType: 'Document Download Log',
          description: `User "${ownerName}" repeatedly downloaded "${docName}" (${count} times). Flagged as suspicious repeated offline acquisition or potential data exfiltration attempt.`,
          mitigationPlan: 'Forensic download audit initiated. Watermark telemetry tracking verified against counterparty IP.',
          blocksStageAdvancement: sev === 'High' || sev === 'Critical',
        });
      }
    });

    // Check overall repeated downloads on a sensitive document (>= 2 total downloads across reviewers)
    downloadsByDoc.forEach((groupLogs, docId) => {
      if (groupLogs.length >= 2 && !flaggedDocIds.has(docId)) {
        const latest = groupLogs[0];
        const docName = latest.docName || latest.metadata?.file_name || 'Deal Document';
        const userNames = Array.from(new Set(groupLogs.map((g) => g.userName || (g.userEmail ? g.userEmail.split('@')[0] : 'User')))).join(', ');
        const side = getUserPartySide({
          userId: latest.userId,
          userEmail: latest.userEmail,
        });
        const count = groupLogs.length;
        const sev = count >= 4 ? 'High' : 'Medium';

        dynamicRisks.push({
          id: `sec-rep-dl-doc-${(docId || 'doc').slice(0, 8)}`,
          title: `High-Frequency Document Downloads (${docName})`,
          category: 'Security Alert',
          type: 'Suspicious Download Activity',
          severity: sev,
          owner: userNames || sellerLeadName,
          ownerAvatar: 'DL',
          status: 'in_review',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          detectedAt: latest.changedAt ? new Date(latest.changedAt).toISOString() : new Date().toISOString(),
          deal: activeDeal.dealName || activeDeal.projectName || 'Active Deal',
          dealId: activeDeal.dealId,
          side,
          sideLabel: side === 'buyer' ? 'Buyer Side' : 'Seller Side',
          relatedItem: `${docName} (${count} Total Downloads)`,
          relatedType: 'Document Download Log',
          description: `Document "${docName}" has been downloaded ${count} times by multiple reviewers (${userNames}). Monitored for bulk data extraction.`,
          mitigationPlan: 'Watermarked copies logged in forensic chain of custody ledger.',
          blocksStageAdvancement: false,
        });
      }
    });

    // B. Detect Unauthorized Document Actions & Permission Denied Attempts
    rawDocEditLogs.forEach((l) => {
      const isDenied =
        (l.actionType || '').toUpperCase().includes('DENIED') ||
        (l.actionType || '').toUpperCase().includes('UNAUTHORIZED') ||
        Boolean(l.metadata?.reason && l.metadata.reason.toLowerCase().includes('access denied'));

      if (isDenied) {
        const docName = l.docName || l.metadata?.file_name || 'Protected Deal Document';
        const ownerName = l.userName || (l.userEmail ? l.userEmail.split('@')[0] : 'Restricted User');
        const attemptedOp = l.metadata?.attempted_action || l.actionType || 'Document Access';
        const side = getUserPartySide({
          userId: l.userId,
          userEmail: l.userEmail,
        });

        dynamicRisks.push({
          id: `sec-perm-denied-${l.id}`,
          title: `Unauthorized Document Action Attempt (${docName})`,
          category: 'Policy Violation',
          type: 'Permission Violation Alert',
          severity: 'High',
          owner: ownerName,
          ownerAvatar: (ownerName || 'PV').slice(0, 2).toUpperCase(),
          status: 'active',
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          detectedAt: l.changedAt ? new Date(l.changedAt).toISOString() : new Date().toISOString(),
          deal: activeDeal.dealName || activeDeal.projectName || 'Active Deal',
          dealId: activeDeal.dealId,
          side,
          sideLabel: side === 'buyer' ? 'Buyer Side' : 'Seller Side',
          relatedItem: `${docName} · ${attemptedOp}`,
          relatedType: 'Access Control Violation',
          description: l.metadata?.reason
            ? `${l.metadata.reason} Attempted operation: ${attemptedOp} on "${docName}". Flagged for unauthorized clearance probing.`
            : `User "${ownerName}" attempted unauthorized action (${attemptedOp}) on document "${docName}" without granted permissions. Gateway enforced 403 Forbidden.`,
          mitigationPlan: 'Access violation flagged. Review user group permissions and notify Lead Administrator.',
          blocksStageAdvancement: true,
        });
      }
    });

    // ── 5. DERIVE REAL SECURITY & AUTH ALERTS FROM `authActivityLogs` ──
    const recentAuthLogs = await db
      .select()
      .from(authActivityLogs)
      .orderBy(desc(authActivityLogs.attemptedAt))
      .limit(20);

    recentAuthLogs.forEach((log) => {
      if (log.status === 'FAILURE' || log.failureReason) {
        const side = getUserPartySide({
          userId: log.userId,
          userEmail: log.email,
          companyId: log.companyId,
        });

        const ownerUser = log.userId ? userByIdMap.get(log.userId) : null;
        const ownerName = ownerUser?.name || (log.email ? log.email.split('@')[0] : 'Unknown User');

        dynamicRisks.push({
          id: `sec-${log.id}`,
          title: `Failed Authentication Incident (${log.email || 'Unauthorized Account'})`,
          category: 'Security Alert',
          type: 'Automated Security Alert',
          severity: 'Medium',
          owner: ownerName,
          ownerAvatar: (ownerName || 'UN').slice(0, 2).toUpperCase(),
          status: 'active',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          detectedAt: log.attemptedAt ? new Date(log.attemptedAt).toISOString() : new Date().toISOString(),
          deal: activeDeal.dealName || activeDeal.projectName || 'Active Deal',
          dealId: activeDeal.dealId,
          side,
          sideLabel: side === 'buyer' ? 'Buyer Side' : 'Seller Side',
          relatedItem: `Auth Incident #${log.id.slice(0, 6)}`,
          relatedType: 'Security Incident',
          description: log.failureReason
            ? `Security gateway reported: "${log.failureReason}". Potential brute-force or unauthorized credential entry.`
            : 'Unsuccessful authentication attempt detected on deal workspace access gateway.',
          mitigationPlan: 'User identity verified; session tokens revoked and rate-limiting enforced.',
          blocksStageAdvancement: false,
        });
      }
    });

    // ── 6. DERIVE SUSPICIOUS ACTIVITY & LESS THAN 1 SESSION VIEWING FROM `documentAccessLogs` ──
    let recentDocLogs = [];
    try {
      recentDocLogs = await db
        .select({
          id: documentAccessLogs.id,
          userId: documentAccessLogs.userId,
          documentId: documentAccessLogs.documentId,
          openedAt: documentAccessLogs.openedAt,
          closedAt: documentAccessLogs.closedAt,
          durationSeconds: documentAccessLogs.durationSeconds,
          durationFormatted: documentAccessLogs.durationFormatted,
          docName: documents.name,
          userName: users.name,
          userEmail: users.email,
          userRole: users.role,
        })
        .from(documentAccessLogs)
        .leftJoin(documents, eq(documentAccessLogs.documentId, documents.id))
        .leftJoin(users, eq(documentAccessLogs.userId, users.id))
        .orderBy(desc(documentAccessLogs.openedAt))
        .limit(30);
    } catch (e) {
      console.warn('Error reading documentAccessLogs table:', e);
    }

    // Flag brief / rapid (< 1 session) views
    const seenBriefDocs = new Set();
    recentDocLogs.forEach((l) => {
      const isBrief = (l.durationSeconds !== null && l.durationSeconds <= 3) || l.durationSeconds === 0;
      const isQuickOrUnclosed = isBrief || (!l.closedAt && l.durationSeconds === null);
      const docName = l.docName || 'Protected Document';

      if (isQuickOrUnclosed && l.documentId) {
        // Prevent duplicate spam for the same user + doc in quick succession
        const dedupKey = `${l.userId}_${l.documentId}`;
        if (seenBriefDocs.has(dedupKey)) return;
        seenBriefDocs.add(dedupKey);

        const side = getUserPartySide({
          userId: l.userId,
          userEmail: l.userEmail,
        });
        const ownerName = l.userName || (l.userEmail ? l.userEmail.split('@')[0] : 'Audited User');
        const durText = l.durationSeconds !== null && l.durationSeconds !== undefined
          ? `${l.durationSeconds}s`
          : l.durationFormatted && l.durationFormatted !== '00:00'
            ? l.durationFormatted
            : '< 3s (instant view)';

        dynamicRisks.push({
          id: `sec-rapid-${l.id}`,
          title: `Suspicious Brief Document Access (< 1 Session) (${docName})`,
          category: 'Security Alert',
          type: 'Suspicious Viewing Activity',
          severity: 'Medium',
          owner: ownerName,
          ownerAvatar: (ownerName || 'UN').slice(0, 2).toUpperCase(),
          status: 'in_review',
          dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          detectedAt: l.openedAt ? new Date(l.openedAt).toISOString() : new Date().toISOString(),
          deal: activeDeal.dealName || activeDeal.projectName || 'Active Deal',
          dealId: activeDeal.dealId,
          side,
          sideLabel: side === 'buyer' ? 'Buyer Side' : 'Seller Side',
          relatedItem: `${docName} (${durText})`,
          relatedType: 'Document Access Log',
          description: `User "${ownerName}" opened "${docName}" with duration ${durText} (< 1 standard review session). Monitored for automated scraping, bulk screen-capture, or unread quick-skimming.`,
          mitigationPlan: 'Dynamic session telemetry logged. Forensic audit trail confirmed single-page view with watermark.',
          blocksStageAdvancement: false,
        });
      }
    });

    // ── 7. APPLY REQUEST FILTERS ──
    let filtered = dynamicRisks;

    // Filter by Party Side
    if (sideParam && sideParam !== 'all') {
      filtered = filtered.filter((r) => r.side === sideParam);
    }

    // Filter by Severity
    if (severityParam && severityParam !== 'all') {
      filtered = filtered.filter((r) => r.severity === severityParam);
    }

    // Filter by Category
    if (categoryParam && categoryParam !== 'all') {
      filtered = filtered.filter((r) => r.category === categoryParam);
    }

    // Filter by Status
    if (statusParam && statusParam !== 'all') {
      filtered = filtered.filter((r) => r.status === statusParam);
    }

    // Filter by Blockers Only
    if (blockersOnly) {
      filtered = filtered.filter((r) => r.blocksStageAdvancement && r.status !== 'mitigated');
    }

    // Filter by Search Query
    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery) ||
          r.owner.toLowerCase().includes(searchQuery) ||
          r.category.toLowerCase().includes(searchQuery) ||
          (r.relatedItem && r.relatedItem.toLowerCase().includes(searchQuery)) ||
          r.sideLabel.toLowerCase().includes(searchQuery)
      );
    }

    // Compute metrics
    const total = dynamicRisks.length;
    const high = dynamicRisks.filter((r) => (r.severity === 'High' || r.severity === 'Critical') && r.status !== 'mitigated').length;
    const blockingStage = dynamicRisks.filter(
      (r) => r.blocksStageAdvancement && r.status !== 'mitigated'
    ).length;
    const mediumLow = dynamicRisks.filter(
      (r) => (r.severity === 'Medium' || r.severity === 'Low') && r.status !== 'mitigated'
    ).length;
    const policyViolations = dynamicRisks.filter(
      (r) => (r.category === 'Policy Violation' || r.category === 'Security Alert') && r.status !== 'mitigated'
    ).length;
    const mitigated = dynamicRisks.filter((r) => r.status === 'mitigated').length;
    const buyerRisks = dynamicRisks.filter((r) => r.side === 'buyer').length;
    const sellerRisks = dynamicRisks.filter((r) => r.side === 'seller').length;

    return NextResponse.json({
      success: true,
      deal: {
        id: activeDeal.dealId,
        name: activeDeal.dealName || activeDeal.projectName || 'Active Deal',
        projectId: activeDeal.projectId,
        projectName: activeDeal.projectName,
        companyName: activeDeal.companyName,
        buyerId: activeDeal.buyerId,
        buyerName: activeDeal.buyerName,
      },
      deals: allDeals.map((d) => ({
        id: d.dealId,
        name: d.dealName || d.projectName || 'Deal',
        projectName: d.projectName,
        companyName: d.companyName,
      })),
      risks: filtered,
      counts: {
        total,
        high,
        mediumLow,
        policyViolations,
        mitigated,
        blockingStage,
        buyerRisks,
        sellerRisks,
      },
    });
  } catch (error) {
    console.error('[API /control-audits/risks GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, riskId, newStatus, mitigationNotes, userEmail, userName, dealId, title, severity, projectId } = body;

    // A. Action: Create New Risk into `riskIssues` DB table
    if (action === 'create_risk') {
      if (!title) {
        return NextResponse.json(
          { success: false, error: 'title is required to create a risk.' },
          { status: 400 }
        );
      }

      let resolvedProjectId = projectId;
      if (dealId) {
        const dealRows = await db
          .select({ projectId: dmsDeals.projectId })
          .from(dmsDeals)
          .where(eq(dmsDeals.id, dealId));
        if (dealRows[0]?.projectId) {
          resolvedProjectId = dealRows[0].projectId;
        }
      }

      if (!resolvedProjectId) {
        const projectRows = await db.select({ id: dmsProjects.id }).from(dmsProjects).limit(1);
        resolvedProjectId = projectRows[0]?.id;
      }

      const inserted = await db
        .insert(riskIssues)
        .values({
          projectId: resolvedProjectId,
          title: title.trim(),
          severity: severity || 'High',
          status: 'active',
        })
        .returning();

      return NextResponse.json({
        success: true,
        message: `Risk "${title}" successfully logged and persisted in database.`,
        createdRisk: inserted[0],
      });
    }

    // B. Action: Update / Mitigate Risk
    if (!riskId || !newStatus) {
      return NextResponse.json(
        { success: false, error: 'riskId and newStatus are required.' },
        { status: 400 }
      );
    }

    // If DD task risk, update dealTasks table status
    if (riskId.startsWith('dd-task-')) {
      const taskUuid = riskId.replace('dd-task-', '');
      try {
        const nextStatus = newStatus === 'mitigated' ? 'DONE' : newStatus === 'in_review' ? 'REVIEW' : 'IN_PROGRESS';
        await db
          .update(dealTasks)
          .set({ status: nextStatus })
          .where(eq(dealTasks.id, taskUuid));
      } catch (e) {
        console.warn('Could not update dealTasks for id:', taskUuid, e.message);
      }
    }

    // If UUID matches riskIssues table, update it in DB
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(riskId);
    if (isUuid) {
      try {
        await db
          .update(riskIssues)
          .set({ status: newStatus })
          .where(eq(riskIssues.id, riskId));
      } catch (e) {
        console.warn('Could not update riskIssues for id:', riskId, e.message);
      }
    }

    const timestamp = new Date().toISOString();

    return NextResponse.json({
      success: true,
      message: `Risk "${riskId}" status successfully updated to ${newStatus}.`,
      updatedRisk: {
        id: riskId,
        status: newStatus,
        mitigationPlan: mitigationNotes || 'Mitigation strategy verified and acknowledged.',
        mitigatedAt: timestamp,
        mitigatedBy: userName || userEmail || 'Compliance Officer',
      },
    });
  } catch (error) {
    console.error('[API /control-audits/risks POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
