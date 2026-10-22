import { db } from '@/db';
import { authActivityLogs } from '@/db/schema';

/**
 * Reusable server-side function to record authentication events (login / sign-up).
 * 
 * Requirements:
 * - Accept user ID when available (nullable for unknown users)
 * - Accept attempted email address
 * - Accept event type: 'LOGIN' or 'SIGNUP'
 * - Accept outcome: 'SUCCESS' or 'FAILURE'
 * - Accept optional failure reason
 * - Accept company ID when available (nullable when unavailable)
 * - Automatically records timestamp using database defaults
 * - STRICTLY DOES NOT include IP address or user-agent fields.
 * 
 * @param {Object} params
 * @param {string|null} [params.userId]
 * @param {string} params.email
 * @param {'LOGIN'|'SIGNUP'} params.eventType
 * @param {'SUCCESS'|'FAILURE'} params.status
 * @param {string|null} [params.failureReason]
 * @param {string|null} [params.companyId]
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
 */
export async function logAuthActivity(param1, ...rest) {
  let userId = null;
  let email = '';
  let eventType = 'LOGIN';
  let status = 'SUCCESS';
  let failureReason = null;
  let companyId = null;

  // Support both object syntax: logAuthActivity({ userId, email, eventType, status, failureReason, companyId })
  // and positional syntax: logAuthActivity(userId, email, eventType, status, failureReason, companyId)
  if (typeof param1 === 'object' && param1 !== null && !Array.isArray(param1)) {
    userId = param1.userId || null;
    email = param1.email || '';
    eventType = param1.eventType || 'LOGIN';
    status = param1.status || 'SUCCESS';
    failureReason = param1.failureReason || null;
    companyId = param1.companyId || null;
  } else {
    userId = param1 || null;
    email = rest[0] || '';
    eventType = rest[1] || 'LOGIN';
    status = rest[2] || 'SUCCESS';
    failureReason = rest[3] || null;
    companyId = rest[4] || null;
  }

  // Normalize inputs
  eventType = String(eventType || 'LOGIN').toUpperCase().trim();
  if (eventType !== 'SIGNUP') {
    eventType = 'LOGIN';
  }

  status = String(status || 'SUCCESS').toUpperCase().trim();
  if (status !== 'FAILURE') {
    status = 'SUCCESS';
  }

  email = String(email || '').trim().toLowerCase();

  try {
    const [inserted] = await db
      .insert(authActivityLogs)
      .values({
        userId: userId || null,
        email: email,
        eventType: eventType,
        status: status,
        failureReason: failureReason ? String(failureReason).slice(0, 500) : null,
        companyId: companyId || null,
      })
      .returning();

    return { success: true, data: inserted };
  } catch (err) {
    // Fail safely: Never let an audit-logging failure break the authentication flow
    // or turn an authentication outcome into something else.
    console.error('[AuthAudit] Failed to record auth activity log:', err.message || err);
    return { success: false, error: err.message || 'Audit logging failed' };
  }
}

export default logAuthActivity;
