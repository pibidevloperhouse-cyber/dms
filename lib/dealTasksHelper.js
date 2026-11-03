/**
 * Shared formatter for deal task records from PostgreSQL
 * Ensures consistent snake_case schema between backend API endpoints and frontend React components
 */
export function formatTask(t) {
  if (!t) return null;

  const auditList = Array.isArray(t.auditTrail) ? t.auditTrail : (Array.isArray(t.audit_trail) ? t.audit_trail : []);
  const latestRiskAudit = [...auditList].reverse().find(
    (a) => a && (a.severity || a.problem_description || a.document_reference || a.risk_factor || a.risk_description || a.riskFactor || a.riskDescription || a.risk_level || a.riskLevel)
  );

  const resolvedSeverity = t.severity || t.riskLevel || t.risk_level || latestRiskAudit?.severity || latestRiskAudit?.risk_level || latestRiskAudit?.riskLevel || null;
  const resolvedProblemDescription = t.problemDescription || t.problem_description || t.riskDescription || t.risk_description || latestRiskAudit?.problem_description || latestRiskAudit?.risk_description || null;
  const resolvedDocumentReference = t.documentReference || t.document_reference || latestRiskAudit?.document_reference || latestRiskAudit?.documentReference || null;
  const resolvedCategory = t.category || latestRiskAudit?.category || t.department || t.workstream || 'Financial';

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
    assigned_to_role: t.assignedToRole || t.assigned_to_role || null,
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
    attachments: Array.isArray(t.attachments) ? t.attachments : [],
    audit_trail: Array.isArray(t.auditTrail) ? t.auditTrail : [],
    comments: Array.isArray(t.comments) ? t.comments : [],
    is_enabled: t.isEnabled ?? t.is_enabled ?? true,
    folder_id: t.folderId || t.folder_id || null,
    folder_name: t.folderName || t.folder_name || null,
    subfolder_id: t.subfolderId || t.subfolder_id || null,
    subfolder_name: t.subfolderName || t.subfolder_name || null,
    assigned_folder: t.folderName || t.folder_name || null,
    assigned_subfolder: t.subfolderName || t.subfolder_name || null,
    category: resolvedCategory,
    severity: resolvedSeverity,
    problem_description: resolvedProblemDescription,
    document_reference: resolvedDocumentReference,
    risk_level: resolvedSeverity,
    risk_description: resolvedProblemDescription,
  };
}
