/**
 * Shared formatter for deal task records from PostgreSQL
 * Ensures consistent snake_case schema between backend API endpoints and frontend React components
 */
export function formatTask(t) {
  if (!t) return null;
  return {
    id: t.id,
    task_id: t.taskId,
    deal_id: t.dealId,
    workspace_id: t.workspaceId,
    title: t.title,
    description: t.description || '',
    status: t.status || 'TO_DO',
    priority: t.priority || 'Medium',
    department: t.department || t.workstream || 'General',
    workstream: t.department || t.workstream || 'General',
    deal_stage: t.dealStage || 'Preparation',
    due_date: t.dueDate || null,
    visibility: t.visibility || 'INTERNAL',
    creator_side: t.creatorSide || 'seller',
    target_side: t.targetSide || 'seller',
    target_company: t.targetCompany || '',
    assigned_to_group: t.assignedToGroup || '',
    assigned_to_user: t.assignedToUser || null,
    claimable_by_role: t.claimableByRole ?? true,
    linked_document: t.linkedDocument || null,
    digital_signature: t.digitalSignature || null,
    created_by: t.createdBy || 'User',
    creator_role: t.creatorRole || 'Member',
    creator_company: t.creatorCompany || '',
    completed_by: t.completedBy || null,
    completed_at: t.completedAt || null,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
    subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
    audit_trail: Array.isArray(t.auditTrail) ? t.auditTrail : [],
    comments: Array.isArray(t.comments) ? t.comments : [],
  };
}
