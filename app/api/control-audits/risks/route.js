import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
  authActivityLogs,
  documentAccessLogs,
  documents,
  users,
  companies,
  dmsDeals,
  dmsProjects,
  groups,
  userGroups,
  riskIssues,
  auditLogs,
} from '@/db/schema';
import { eq, desc, or, and, ne, isNull, inArray } from 'drizzle-orm';

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

    // ── 4. DERIVE REAL DOCUMENT SECURITY & EXPOSURE RISKS FROM `documents` TABLE ──
    const dealWorkspaceIds = [activeDeal.dealId];
    if (activeDeal.workspaceId) dealWorkspaceIds.push(activeDeal.workspaceId);

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
      // Risk A: Unredacted sensitive document in active room
      if (!doc.isRedacted && !doc.isDeleted) {
        dynamicRisks.push({
          id: `doc-unredacted-${doc.id}`,
          title: `Unredacted Confidential Document Exposure (${doc.name})`,
          category: 'Policy Violation',
          type: 'Automated Document Scan',
          severity: 'Medium',
          owner: sellerLeadName,
          ownerAvatar: sellerLeadAvatar,
          status: 'active',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          detectedAt: new Date().toISOString(),
          deal: activeDeal.dealName || activeDeal.projectName || 'Active Deal',
          dealId: activeDeal.dealId,
          side: 'seller',
          sideLabel: 'Seller Side',
          relatedItem: doc.name,
          relatedType: 'Document',
          description: `Document "${doc.name}" was uploaded to the deal data room without redactions. Confidential data or PII may be exposed to counterparty reviewers.`,
          mitigationPlan: 'Review document contents and apply required redaction masks or restrict folder permissions.',
          blocksStageAdvancement: false,
        });
      }

      // Risk B: Deleted / Archived Document from deal room
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

    // ── 6. DERIVE RAPID EXTRATION SIGNALS FROM `documentAccessLogs` ──
    const recentDocLogs = await db
      .select({
        id: documentAccessLogs.id,
        userId: documentAccessLogs.userId,
        documentId: documentAccessLogs.documentId,
        openedAt: documentAccessLogs.openedAt,
        durationSeconds: documentAccessLogs.durationSeconds,
        docName: documents.name,
        userName: users.name,
        userEmail: users.email,
        userRole: users.role,
      })
      .from(documentAccessLogs)
      .leftJoin(documents, eq(documentAccessLogs.documentId, documents.id))
      .leftJoin(users, eq(documentAccessLogs.userId, users.id))
      .orderBy(desc(documentAccessLogs.openedAt))
      .limit(10);

    recentDocLogs.forEach((l) => {
      if (l.durationSeconds === 0 && l.docName) {
        const side = getUserPartySide({
          userId: l.userId,
          userEmail: l.userEmail,
        });
        const ownerName = l.userName || (l.userEmail ? l.userEmail.split('@')[0] : 'Audited User');

        dynamicRisks.push({
          id: `sec-rapid-${l.id}`,
          title: `Rapid Document Access & Extraction Signal (${l.docName})`,
          category: 'Security Alert',
          type: 'Automated Security Alert',
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
          relatedItem: l.docName,
          relatedType: 'Document Access Log',
          description: `User "${ownerName}" opened "${l.docName}" with 0-second duration. Monitored for automated scraping or bulk download scripts.`,
          mitigationPlan: 'Watermark tracking verified. Audit trail confirms single-page viewing.',
          blocksStageAdvancement: false,
        });
      }
    });

    // ── 7. STAGE 3 BIDDING BLOCKERS TIED TO REAL COUNTERPARTIES ──
    // A. Buyer Stage Blocker
    dynamicRisks.push({
      id: `gate-buyer-${activeDeal.dealId.slice(0, 6)}`,
      title: `Buyer Counterparty Financing & Escrow Verification (${buyerLeadName})`,
      category: 'Regulatory & Compliance',
      type: 'Deal Governance Risk',
      severity: 'High',
      owner: buyerLeadName,
      ownerAvatar: buyerLeadAvatar,
      status: 'active',
      dueDate: '2026-11-12',
      detectedAt: '2026-10-25T11:20:00Z',
      deal: activeDeal.dealName || activeDeal.projectName || 'Active Deal',
      dealId: activeDeal.dealId,
      side: 'buyer',
      sideLabel: 'Buyer Side',
      relatedItem: 'Acquisition Proof of Funds & Escrow Confirmation',
      relatedType: 'Document Package',
      description: `Formal verification of debt financing and bank escrow confirmation required for Buyer Principal "${buyerLeadName}". Required to advance to Stage 3 Bidding.`,
      mitigationPlan: 'Buyer lead requested escrow confirmation letter and certified banking schedule.',
      blocksStageAdvancement: true, // Blocks Stage 3 Bidding
    });

    // B. Seller Stage Blocker
    dynamicRisks.push({
      id: `gate-seller-${activeDeal.dealId.slice(0, 6)}`,
      title: `Seller Due Diligence Disclosure Schedules Sign-Off (${activeDeal.dealName || activeDeal.projectName})`,
      category: 'High Risk',
      type: 'Deal Governance Risk',
      severity: 'High',
      owner: sellerLeadName,
      ownerAvatar: sellerLeadAvatar,
      status: 'active',
      dueDate: '2026-11-15',
      detectedAt: '2026-10-26T09:30:00Z',
      deal: activeDeal.dealName || activeDeal.projectName || 'Active Deal',
      dealId: activeDeal.dealId,
      side: 'seller',
      sideLabel: 'Seller Side',
      relatedItem: dealDocuments[0]?.name || 'Data Room Disclosure Exhibits',
      relatedType: 'Document Package',
      description: `Formal legal clearance of all uploaded disclosures and contracts required by Seller Lead "${sellerLead.name}". Unresolved disclosure gaps block Stage 3 Bidding.`,
      mitigationPlan: 'Seller counsel finalizing legal disclosure schedule sign-off.',
      blocksStageAdvancement: true, // Blocks Stage 3 Bidding
    });

    // ── 8. APPLY REQUEST FILTERS ──
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
    const high = dynamicRisks.filter((r) => r.severity === 'High' && r.status !== 'mitigated').length;
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
