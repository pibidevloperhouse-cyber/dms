import { db } from '@/db';
import { companies, users, plans } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import * as emailService from '@/services/emailService';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logAuthActivity } from '@/lib/auth-audit';

const FALLBACK_STORE_PATH = path.join(process.cwd(), '.vdr_workspace_requests.json');

/**
 * Read from local JSON fallback if DB table is missing extra columns.
 */
function readFallbackStore() {
  try {
    if (fs.existsSync(FALLBACK_STORE_PATH)) {
      const data = fs.readFileSync(FALLBACK_STORE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('[WorkspaceService] Error reading fallback store:', err);
  }
  return [];
}

/**
 * Write to local JSON fallback
 */
function writeFallbackStore(requests) {
  try {
    fs.writeFileSync(FALLBACK_STORE_PATH, JSON.stringify(requests, null, 2), 'utf8');
  } catch (err) {
    console.error('[WorkspaceService] Error writing fallback store:', err);
  }
}

/**
 * Map a company record from the DB/Store to the request object shape needed by admin UI
 */
function mapCompanyToRequest(company) {
  const rawStatus = String(company.status || 'pending').toLowerCase().trim();
  let s = 'pending';
  if (['active', 'approved', 'trial', 'enabled'].includes(rawStatus)) {
    s = 'approved';
  } else if (['rejected', 'suspended', 'disabled', 'cancelled', 'inactive'].includes(rawStatus)) {
    s = 'rejected';
  } else {
    s = 'pending';
  }

  return {
    id: company.id,
    deal_id: company.deal_id || null,
    project_id: company.project_id || null,
    deal_name: company.deal_name || null,
    request_type: company.request_type || (company.deal_id ? 'deal_vault' : 'company_registration'),
    applicant_name: company.applicant_name || null,
    applicant_email: company.applicant_email || null,
    company_id: company.company_id || company.id,
    company_name: company.company_name || company.name,
    super_admin_name: company.super_admin_name || company.admin_name || company.name || 'Admin',
    super_admin_email: company.super_admin_email || company.admin_email || company.email,
    plan_name: company.plan_name || 'Standard VDR',
    admin_name: company.super_admin_name || company.admin_name || company.name || 'Admin',
    admin_email: company.super_admin_email || company.admin_email || company.email,
    phone: company.phone_number || company.phoneNumber || '',
    plan_id: company.plan_id || '1',
    storage_limit_mb: company.storage_limit_mb || 51200,
    status: s,
    rejection_reason: company.rejection_reason || null,
    created_at: company.created_at || company.createdAt || new Date().toISOString()
  };
}

/**
 * Create a new workspace request when user clicks "Request Workspace"
 */
export async function createWorkspaceRequest({ companyName, adminName, adminEmail, phone, planId, password }) {
  if (!companyName || !adminName || !adminEmail || !planId) {
    await logAuthActivity({
      userId: null,
      email: adminEmail || 'unknown',
      eventType: 'SIGNUP',
      status: 'FAILURE',
      failureReason: 'Missing required fields for workspace request',
      companyId: null,
    });
    throw new Error("Missing required fields for workspace request.");
  }

  let planName = `Plan (${planId})`;
  try {
    const pDataList = await db.select({ name: plans.name }).from(plans).where(eq(plans.id, planId)).limit(1);
    if (pDataList.length > 0 && pDataList[0].name) {
      planName = pDataList[0].name;
    }
  } catch (err) {
    console.warn("[WorkspaceService] Note fetching plan name:", err.message);
  }

  // 1. Create company record
  let companyId = crypto.randomUUID();
  let companyData = {
    id: companyId,
    name: companyName,
    email: adminEmail,
    phoneNumber: phone,
    status: 'pending',
  };

  let legacyCompany = {
    ...companyData,
    phone_number: phone,
    super_admin_name: adminName,
    super_admin_email: adminEmail,
    plan_name: planName,
    plan_id: planId,
    created_at: new Date().toISOString()
  };

  try {
    await db.insert(companies).values(companyData);
    
    // Also save to fallback store for extra UI data (super_admin_name, etc.)
    const store = readFallbackStore();
    store.push(legacyCompany);
    writeFallbackStore(store);
  } catch (e) {
    console.warn("[WorkspaceService] Company create DB error (fallback to local):", e.message);
    const store = readFallbackStore();
    store.push(legacyCompany);
    writeFallbackStore(store);
  }

  // 2. Create user record directly in our DB (bypassing Supabase Auth for RDS compatibility)
  let userId = crypto.randomUUID();
  try {
    const existingUsers = await db.select({ id: users.id, companyId: users.companyId })
                                  .from(users)
                                  .where(eq(users.email, adminEmail))
                                  .limit(1);

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      companyId = existingUsers[0].companyId || companyId;
      await db.update(users).set({ requestStatus: 'pending' }).where(eq(users.id, userId));
    } else {
      await db.insert(users).values({
        id: userId,
        companyId: companyId,
        name: adminName,
        email: adminEmail,
        passwordHash: password || 'defaultHash',
        role: 'super_admin',
        status: 'active',
        ndaStatus: 'not_required',
        requestStatus: 'pending'
      });
    }

    // Record successful sign-up
    await logAuthActivity({
      userId: userId,
      email: adminEmail,
      eventType: 'SIGNUP',
      status: 'SUCCESS',
      failureReason: null,
      companyId: companyId,
    });
  } catch (e) {
    console.warn("[WorkspaceService] User insert exception:", e.message);
    await logAuthActivity({
      userId: null,
      email: adminEmail,
      eventType: 'SIGNUP',
      status: 'FAILURE',
      failureReason: e.message || 'User insert exception',
      companyId: companyId,
    });
  }

  // 3. Send email notification
  await emailService.sendRequestMailToAdmin({
    companyName,
    adminName,
    adminEmail,
    phone,
    planId,
    planName,
    requestId: companyId
  });

  return {
    success: true,
    request: mapCompanyToRequest(legacyCompany),
    company: legacyCompany,
    userId
  };
}

/**
 * Create a new Deal Vault Request when a seller accepts a buyer proposal with a storage package
 */
export async function createDealVaultRequest({
  dealId,
  projectId,
  projectName,
  dealName,
  companyName,
  sellerName,
  sellerEmail,
  planName = 'Pro Deal Vault (50 GB)',
  storageLimitMb = 51200,
  applicantName = '',
  applicantEmail = ''
}) {
  const requestId = `vault-${dealId}`;
  const legacyRequest = {
    id: requestId,
    deal_id: dealId,
    project_id: projectId,
    project_name: projectName || 'Project',
    company_id: dealId,
    company_name: `${companyName || projectName} — Deal: ${dealName}`,
    deal_name: dealName,
    super_admin_name: sellerName || 'Seller Admin',
    super_admin_email: sellerEmail || 'seller@vdr.com',
    admin_name: sellerName || 'Seller Admin',
    admin_email: sellerEmail || 'seller@vdr.com',
    applicant_name: applicantName,
    applicant_email: applicantEmail,
    plan_name: planName,
    plan_id: planName.toLowerCase().includes('enterprise') ? 'enterprise' : planName.toLowerCase().includes('free') ? 'free' : 'pro',
    storage_limit_mb: Number(storageLimitMb) || 51200,
    request_type: 'deal_vault',
    status: 'pending',
    created_at: new Date().toISOString()
  };

  const store = readFallbackStore();
  const existingIdx = store.findIndex(r => r.deal_id === dealId || r.id === requestId);
  if (existingIdx !== -1) {
    store[existingIdx] = { ...store[existingIdx], ...legacyRequest, status: 'pending' };
  } else {
    store.push(legacyRequest);
  }
  writeFallbackStore(store);

  return {
    success: true,
    request: mapCompanyToRequest(legacyRequest)
  };
}

export async function getPendingWorkspaceRequests() {
  return getWorkspaceRequestsByStatus('pending');
}

export async function getWorkspaceRequestsByStatus(status) {
  let allCompanies = [];
  try {
    allCompanies = await db.select().from(companies).orderBy(desc(companies.createdAt));
  } catch (e) {
    console.warn("[WorkspaceService] Drizzle getWorkspaceRequestsByStatus error:", e.message);
  }

  const store = readFallbackStore();
  const mergedMap = new Map();
  store.forEach(item => mergedMap.set(item.id, item));
  allCompanies.forEach(item => {
    const existing = mergedMap.get(item.id) || {};
    mergedMap.set(item.id, { 
      ...existing, 
      ...item,
    });
  });

  const mergedList = Array.from(mergedMap.values()).sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));

  return mergedList
    .map(mapCompanyToRequest)
    .filter(r => r.status === status);
}

export async function getAllWorkspaceRequests() {
  let allCompanies = [];
  try {
    allCompanies = await db.select().from(companies).orderBy(desc(companies.createdAt));
  } catch (e) {
    console.warn("[WorkspaceService] Drizzle getAll error:", e.message);
  }

  const store = readFallbackStore();
  const mergedMap = new Map();
  store.forEach(item => mergedMap.set(item.id, item));
  allCompanies.forEach(item => {
    const existing = mergedMap.get(item.id) || {};
    mergedMap.set(item.id, { 
      ...existing, 
      ...item,
    });
  });

  const mergedList = Array.from(mergedMap.values()).sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));

  return mergedList.map(mapCompanyToRequest);
}

export async function getUserRequestStatusByEmail(email) {
  if (!email) return { status: 'approved', rejection_reason: null };
  
  try {
    const data = await db.select().from(companies).where(eq(companies.email, email)).orderBy(desc(companies.createdAt)).limit(1);

    if (data.length > 0) {
      const s = data[0].status || 'pending';
      let mappedStatus = 'pending';
      if (s === 'active' || s === 'approved') mappedStatus = 'approved';
      else if (s === 'rejected' || s === 'suspended') mappedStatus = 'rejected';

      return { status: mappedStatus, rejection_reason: null };
    }
  } catch (e) {}

  const store = readFallbackStore();
  const found = store
    .filter(r => (r.super_admin_email || r.admin_email || r.email)?.toLowerCase() === email.toLowerCase())
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0];

  if (found) {
    const s = found.status || 'pending';
    let mappedStatus = 'pending';
    if (s === 'active' || s === 'approved') mappedStatus = 'approved';
    else if (s === 'rejected' || s === 'suspended') mappedStatus = 'rejected';
    return { status: mappedStatus, rejection_reason: found.rejection_reason };
  }

  return { status: 'approved', rejection_reason: null };
}

export async function approveWorkspaceRequest(requestId, adminUser) {
  if (!requestId) throw new Error("Missing Request ID for approval.");

  let company = null;
  const store = readFallbackStore();
  company = store.find(r => r.id === requestId);
  if (!company) {
    try {
      const data = await db.select().from(companies).where(eq(companies.id, requestId)).limit(1);
      if (data.length > 0) company = data[0];
    } catch (e) {}
  }
  if (!company) throw new Error("Request not found.");

  // If this is a deal vault request, activate the deal in dmsDeals
  if (company.deal_id) {
    try {
      const { dmsDeals } = require('@/db/schema');
      await db.update(dmsDeals).set({ 
        status: 'active', 
        updatedAt: new Date() 
      }).where(eq(dmsDeals.id, company.deal_id));
    } catch (e) {
      console.warn("[WorkspaceService] Error updating deal on approval:", e.message);
    }
  } else {
    try {
      await db.update(companies).set({ status: 'active' }).where(eq(companies.id, requestId));
    } catch (e) {}

    try {
      await db.update(users).set({ requestStatus: 'approved', status: 'active' }).where(eq(users.email, company.email || company.super_admin_email));
    } catch (e) {
      console.warn("[WorkspaceService] User status update note:", e.message);
    }
  }

  const index = store.findIndex(r => r.id === requestId);
  if (index !== -1) {
    store[index].status = 'active';
    writeFallbackStore(store);
  }

  const reqObj = mapCompanyToRequest(company);
  try {
    await emailService.sendApprovalMailToUser({
      userEmail: reqObj.admin_email,
      userName: reqObj.admin_name,
      companyName: reqObj.company_name,
      workspaceName: reqObj.deal_name || ""
    });
  } catch (e) {}

  return { success: true, requestId, status: 'approved' };
}

export async function rejectWorkspaceRequest(requestId, reason, adminUser) {
  if (!requestId) throw new Error("Missing Request ID for rejection.");

  let company = null;
  const store = readFallbackStore();
  company = store.find(r => r.id === requestId);
  if (!company) {
    try {
      const data = await db.select().from(companies).where(eq(companies.id, requestId)).limit(1);
      if (data.length > 0) company = data[0];
    } catch (e) {}
  }
  if (!company) throw new Error("Request not found.");

  // If this is a deal vault request, reject the deal in dmsDeals
  if (company.deal_id) {
    try {
      const { dmsDeals } = require('@/db/schema');
      await db.update(dmsDeals).set({ 
        status: 'rejected', 
        updatedAt: new Date() 
      }).where(eq(dmsDeals.id, company.deal_id));
    } catch (e) {
      console.warn("[WorkspaceService] Error updating deal on rejection:", e.message);
    }
  } else {
    try {
      await db.update(companies).set({ status: 'suspended' }).where(eq(companies.id, requestId));
    } catch (e) {}

    try {
      await db.update(users).set({ requestStatus: 'rejected', status: 'suspended' }).where(eq(users.email, company.email || company.super_admin_email));
    } catch (e) {}
  }

  const index = store.findIndex(r => r.id === requestId);
  if (index !== -1) {
    store[index].status = 'suspended';
    store[index].rejection_reason = reason || 'Not approved by admin';
    writeFallbackStore(store);
  }

  const reqObj = mapCompanyToRequest(company);
  try {
    await emailService.sendRejectionMailToUser({
      userEmail: reqObj.admin_email,
      userName: reqObj.admin_name,
      companyName: reqObj.company_name,
      reason: reason || ''
    });
  } catch (e) {}

  return { success: true, requestId, status: 'rejected' };
}
