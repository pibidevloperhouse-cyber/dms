import { pgTable, uuid, text, timestamp, integer, date, boolean, bigint, varchar, doublePrecision, jsonb, primaryKey, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ENUMS
export const companyStatusEnum = pgEnum('company_status', ['pending', 'active', 'suspended', 'rejected']);
export const planStatusEnum = pgEnum('plan_status', ['active', 'expired', 'cancelled', 'trial']);
export const userRoleEnum = pgEnum('user_role', ['super_admin', 'admin', 'sub_admin', 'internal_user', 'guest_admin', 'guest_lead', 'external_user']);
export const userStatusEnum = pgEnum('user_status', ['invited', 'active', 'suspended', 'revoked']);
export const permissionScopeEnum = pgEnum('permission_scope', ['group', 'document', 'folder', 'workspace', 'files']);
export const channelTypeEnum = pgEnum('channel_type', ['public', 'private', 'direct_message']);
export const visibilityEnum = pgEnum('visibility', ['internal', 'external', 'all']);

// TABLES

export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  status: companyStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  ndaText: text('nda_text'),
  phoneNumber: text('phone_number'),
});

export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').default('active'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull(),
  storageLimitMb: integer('storage_limit_mb').notNull(),
  maxUsers: integer('max_users').notNull(),
  startDate: date('start_date').notNull(),
  expiryDate: date('expiry_date').notNull(),
  planStatus: planStatusEnum('plan_status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id'), // Removed notNull() for DMS buyers/sellers
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  // DMS specific fields
  jobTitle: text('job_title'),
  investorType: text('investor_type'),
  investmentRange: text('investment_range'),
  companyType: text('company_type'),
  dmsRole: text('dms_role'), // 'buyer' or 'seller'
  role: userRoleEnum('role').default('external_user').notNull(),
  status: userStatusEnum('status').default('invited').notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  phoneNumber: text('phone_number'),
  companyName: text('company_name'),
  twoFaEnabled: boolean('two_fa_enabled').default(false),
  ndaStatus: text('nda_status').default('not_required'),
  ndaAcceptedAt: timestamp('nda_accepted_at', { withTimezone: true }),
  requestStatus: text('request_status').default('approved'),
  workspaceId: uuid('workspace_id'),
  ndaSignaturePath: text('nda_signature_path'),
  ndaSignatureUrl: text('nda_signature_url'),
  ndaSignatureType: varchar('nda_signature_type'),
  ndaIpAddress: text('nda_ip_address'),
  ndaUserId: text('nda_user_id'),
});

export const folders = pgTable('folders', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull(),
  parentFolderId: uuid('parent_folder_id'),
  name: text('name').notNull(),
  indexNumber: integer('index_number'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
  creatorRevoked: boolean('creator_revoked').default(false),
  version: integer('version').default(1),
  workspaceId: uuid('workspace_id'),
  dealStage: text('deal_stage').default('Preparation'),
});

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull(),
  folderId: uuid('folder_id'),
  uploadedBy: uuid('uploaded_by'),
  name: text('name').notNull(),
  filePath: text('file_path').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }).notNull(),
  version: integer('version').default(1).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  dekRef: text('dek_ref'),
  index: text('index'),
  dealStage: text('deal_stage').default('Preparation'),
  security: text('security'),
  isBookmarked: boolean('is_bookmarked'),
  isDownloaded: boolean('is_downloaded'),
  fileData: text('file_data'),
  originalFilePath: text('original_file_path'),
  deletedBy: uuid('deleted_by'),
  isRedacted: boolean('is_redacted').default(false),
  storageBucket: text('storage_bucket').default('original-files'),
  creatorRevoked: boolean('creator_revoked').default(false),
  workspaceId: uuid('workspace_id'),
  uploadComment: text('upload_comment'),
  indexingStatus: text('indexing_status').default('not_indexed'),
  indexingError: text('indexing_error'),
});

export const groups = pgTable('groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  role: text('role'),
  workspaceId: uuid('workspace_id'),
  type: text('type').default('group'),
});

export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull(),
  groupId: uuid('group_id'),
  userId: uuid('user_id'),
  documentId: uuid('document_id'),
  folderId: uuid('folder_id'),
  scope: permissionScopeEnum('scope').notNull(),
  canView: boolean('can_view').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  canEdit: boolean('can_edit').default(false).notNull(),
  canDelete: boolean('can_delete').default(false).notNull(),
  canAddMembers: boolean('can_add_members').default(false).notNull(),
  canRemoveMembers: boolean('can_remove_members').default(false).notNull(),
  canCreateGroup: boolean('can_create_group').default(false).notNull(),
  canDeleteGroup: boolean('can_delete_group').default(false).notNull(),
  canUpload: boolean('can_upload').default(false),
  canDownloadSecure: boolean('can_download_secure').default(false),
  canDownloadOriginal: boolean('can_download_original').default(false),
  canAccessGroups: boolean('can_access_groups'),
  canAccessSettings: boolean('can_access_settings'),
  canCreateFolder: boolean('can_create_folder').default(false),
  canMergeFolder: boolean('can_merge_folder').default(false),
  canDeleteFolder: boolean('can_delete_folder').default(false),
  canAccessBranding: boolean('can_access_branding').default(false),
  canAccessWatermarks: boolean('can_access_watermarks').default(false),
  canAccessDocuments: boolean('can_access_documents').default(false),
  canAccessEditPermissions: boolean('can_access_edit_permissions'),
  canRedaction: boolean('can_redaction').default(false),
  canRedact: boolean('can_redact').default(false),
  canAccessQa: boolean('can_access_qa').default(false),
  canAskQa: boolean('can_ask_qa').default(true),
  canAnswerQa: boolean('can_answer_qa').default(false),
  canAccessNda: boolean('can_access_nda').default(false),
  canAccessDeals: boolean('can_access_deals').default(false),
  canAccessTasks: boolean('can_access_tasks').default(false),
  canAccessCommunication: boolean('can_access_communication').default(false),
  canAccessControlAudits: boolean('can_access_control_audits').default(false),
  canViewBuyer: boolean('can_view_buyer').default(false),
  canViewSellerMembers: boolean('can_view_seller_members').default(false),
  canViewSellerGroups: boolean('can_view_seller_groups').default(false),
});

export const userGroups = pgTable('user_groups', {
  userId: uuid('user_id').notNull(),
  groupId: uuid('group_id').notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.groupId] })
}));

export const vdrUserOverrides = pgTable('vdr_user_overrides', {
  userId: uuid('user_id').notNull(),
  documentId: uuid('document_id').notNull(),
  isRevoked: boolean('is_revoked').default(false),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.documentId] })
}));

export const documentAccessLogs = pgTable('document_access_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  documentId: uuid('document_id').notNull(),
  openedAt: timestamp('opened_at', { withTimezone: true }).defaultNow(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  durationSeconds: integer('duration_seconds'),
  durationFormatted: text('duration_formatted'),
});

export const documentEditLogs = pgTable('document_edit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  documentId: uuid('document_id').notNull(),
  actionType: text('action_type').notNull(),
  metadata: jsonb('metadata'),
  changedAt: timestamp('changed_at', { withTimezone: true }).defaultNow(),
});

export const workspaceSettings = pgTable('workspace_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull(),
  brandName: varchar('brand_name'),
  logoUrl: text('logo_url'),
  activeTheme: varchar('active_theme'),
  adminName: varchar('admin_name'),
  adminEmail: varchar('admin_email'),
  adminPhone: varchar('admin_phone'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const watermarkSettings = pgTable('watermark_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull(),
  watermarkType: varchar('watermark_type'),
  customText: varchar('custom_text'),
  fontSize: integer('font_size'),
  textColor: varchar('text_color'),
  textOpacity: integer('text_opacity'),
  rotation: integer('rotation'),
  attributes: jsonb('attributes'),
  positions: jsonb('positions'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  emailAddress: varchar('email_address'),
});

export const qnaThreads = pgTable('qna_threads', {
  id: uuid('id').defaultRandom().primaryKey(),
  fileId: uuid('file_id').references(() => documents.id),
  subject: text('subject').notNull(),
  category: text('category').default('General').notNull(),
  priority: text('priority').default('MEDIUM').notNull(),
  status: text('status').default('open').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  companyId: uuid('company_id').references(() => companies.id),
  workspaceId: uuid('workspace_id'),
  folderId: uuid('folder_id').references(() => folders.id),
  createdBy: uuid('created_by').references(() => users.id),
  creatorGroupId: uuid('creator_group_id').references(() => groups.id),
  documentOwnerId: uuid('document_owner_id').references(() => users.id),
  description: text('description'),
  attachmentPath: text('attachment_path'),
  attachmentName: text('attachment_name'),
  officialAnswer: text('official_answer'),
  officialAnsweredBy: uuid('official_answered_by').references(() => users.id),
  officialAnsweredAt: timestamp('official_answered_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const qnaMessages = pgTable('qna_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  threadId: uuid('thread_id').references(() => qnaThreads.id).notNull(),
  sender: text('sender').notNull(),
  text: text('text').notNull(),
  isUser: boolean('is_user').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  senderId: uuid('sender_id').references(() => users.id),
  senderRole: varchar('sender_role'),
  messageType: varchar('message_type').default('internal_suggestion'),
  isOfficial: boolean('is_official').default(false),
  attachmentPath: text('attachment_path'),
  attachmentName: text('attachment_name'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const watermarkTemplates = pgTable('watermark_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull(),
  name: text('name').notNull(),
  watermarkType: text('watermark_type').default('dynamic'),
  customText: text('custom_text').default('Confidential'),
  fontSize: integer('font_size').default(14),
  textColor: text('text_color').default('#64748B'),
  textOpacity: integer('text_opacity').default(25),
  rotation: integer('rotation').default(-30),
  attributes: jsonb('attributes'),
  positions: jsonb('positions'),
  logoPath: text('logo_path'),
  logoOpacity: doublePrecision('logo_opacity').default(0.2),
  logoPosition: text('logo_position').default('middle-center'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  present: varchar('present'),
  emailAddress: varchar('email_address'),
});

export const invitations = pgTable('invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupId: uuid('group_id').references(() => groups.id).notNull(),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  description: text('description'),
  invitedBy: uuid('invited_by').references(() => users.id).notNull(),
  status: text('status').default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).default(sql`now() + interval '7 days'`),
  requiresNda: boolean('requires_nda').default(false),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
});

export const emailOtps = pgTable('email_otps', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  otp: text('otp').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  verified: boolean('verified').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const documentRedactions = pgTable('document_redactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').references(() => documents.id).notNull().unique(),
  visibilityMode: text('visibility_mode').notNull(),
  pageRanges: jsonb('page_ranges').default('[]').notNull(),
  totalPages: integer('total_pages'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  boxes: jsonb('boxes').default('[]'),
});

export const documentTextRedactions = pgTable('document_text_redactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').references(() => documents.id).notNull(),
  pageNumber: integer('page_number').notNull(),
  selectedText: text('selected_text'),
  x: doublePrecision('x').notNull(),
  y: doublePrecision('y').notNull(),
  width: doublePrecision('width').notNull(),
  height: doublePrecision('height').notNull(),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const redactedDocuments = pgTable('redacted_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').references(() => documents.id).notNull().unique(),
  redactedPath: text('redacted_path').notNull(),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const loginHistory = pgTable('login_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  companyId: uuid('company_id').notNull(),
  action: text('action').default('LOGIN').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const businessownersUsers = pgTable('businessowners_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: text('role').default('business_owner'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  globalStorageLimitGb: integer('global_storage_limit_gb').default(1000),
});

export const plans = pgTable('plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  price: text('price').notNull(),
  storageLimitMb: integer('storage_limit_mb').notNull(),
  usersLimit: integer('users_limit').notNull(),
  description: text('description'),
  features: jsonb('features').default('[]'),
  status: text('status').default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const workspaceMembers = pgTable('workspace_members', {
  workspaceId: uuid('workspace_id').references(() => workspaces.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  workspaceRole: text('workspace_role').default('member'),
  addedBy: uuid('added_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.workspaceId, t.userId] })
}));

export const workspaceRequests = pgTable('workspace_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  companyId: uuid('company_id').references(() => companies.id),
  companyName: text('company_name').notNull(),
  phone: text('phone'),
  planId: text('plan_id').notNull(),
  status: text('status').default('pending').notNull(),
  rejectionReason: text('rejection_reason'),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  superAdminName: varchar('super_admin_name'),
  superAdminEmail: varchar('super_admin_email'),
  planName: varchar('plan_name'),
});

export const documentVersions = pgTable('document_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').references(() => documents.id),
  versionNumber: integer('version_number').notNull(),
  name: text('name').notNull(),
  filePath: text('file_path').notNull(),
  originalFilePath: text('original_file_path').notNull(),
  storageBucket: text('storage_bucket'),
  mimeType: text('mime_type'),
  fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }),
  workspaceId: text('workspace_id'),
  companyId: text('company_id'),
  folderId: text('folder_id'),
  dekRef: text('dek_ref').notNull(),
  security: text('security'),
  creatorRevoked: boolean('creator_revoked').default(false),
  isRedacted: boolean('is_redacted').default(false),
  index: text('index'),
  fileData: jsonb('file_data'),
  uploadedBy: uuid('uploaded_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  uploadComment: text('upload_comment'),
  restoredAt: timestamp('restored_at', { withTimezone: true }),
  restoredBy: uuid('restored_by'),
});

export const qnaActivityLogs = pgTable('qna_activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id),
  workspaceId: uuid('workspace_id'),
  threadId: uuid('thread_id').references(() => qnaThreads.id),
  userId: uuid('user_id').references(() => users.id),
  userName: varchar('user_name'),
  actionType: varchar('action_type').notNull(),
  details: jsonb('details').default('{}'),
  ipAddress: varchar('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// --- COMMUNICATION MODULE ---

export const communicationChannels = pgTable('communication_channels', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  name: text('name'),
  description: text('description'),
  type: channelTypeEnum('type').default('public').notNull(),
  visibility: visibilityEnum('visibility').default('internal').notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).defaultNow(),
});

export const channelMembers = pgTable('channel_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  channelId: uuid('channel_id').references(() => communicationChannels.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').default('member').notNull(), // 'admin', 'member', 'guest'
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  lastReadAt: timestamp('last_read_at', { withTimezone: true }).defaultNow(),
  isMuted: boolean('is_muted').default(false),
  isPinned: boolean('is_pinned').default(false),
});

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  channelId: uuid('channel_id').references(() => communicationChannels.id, { onDelete: 'cascade' }).notNull(),
  senderId: uuid('sender_id').references(() => users.id).notNull(),
  parentMessageId: uuid('parent_message_id'), // Self-reference for threads
  messageText: text('message_text').notNull(),
  messageType: text('message_type').default('text').notNull(), // text, file, system, task, approval
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  isEdited: boolean('is_edited').default(false),
  isPinned: boolean('is_pinned').default(false),
  attachments: jsonb('attachments').default('[]'),
  metadata: jsonb('metadata').default('{}'),
});

export const messageReactions = pgTable('message_reactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  messageId: uuid('message_id').references(() => messages.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  emoji: text('emoji').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const messageMentions = pgTable('message_mentions', {
  id: uuid('id').defaultRandom().primaryKey(),
  messageId: uuid('message_id').references(() => messages.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const announcementPosts = pgTable('announcement_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  title: text('title').notNull(),
  content: text('content').notNull(),
  priority: text('priority').default('normal').notNull(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  targetAudience: jsonb('target_audience').default('[]'),
  attachments: jsonb('attachments').default('[]'),
});

export const dmsDealInvitations = pgTable('dms_deal_invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => dmsProjects.id).notNull(),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  status: text('status').default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const communicationAuditLogs = pgTable('communication_audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// DMS TABLES

export const dmsProjects = pgTable('dms_projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  status: text('status').default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const dmsTeasers = pgTable('dms_teasers', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => dmsProjects.id).notNull().unique(),
  dealName: text('deal_name').notNull(),
  sector: text('sector'),
  geography: text('geography'),
  companyOverview: text('company_overview'),
  revenue: text('revenue'),
  ebitda: text('ebitda'),
  yoyGrowth: text('yoy_growth'),
  employees: text('employees'),
  status: text('status').default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const dmsDealProposals = pgTable('dms_deal_proposals', {
  id: uuid('id').defaultRandom().primaryKey(),
  teaserId: uuid('teaser_id').references(() => dmsTeasers.id).notNull(),
  buyerId: uuid('buyer_id').references(() => users.id).notNull(),
  status: text('status').default('pending'),
  message: text('message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const dmsDeals = pgTable('dms_deals', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => dmsProjects.id).notNull(),
  buyerId: uuid('buyer_id').references(() => users.id).notNull(),
  dealName: text('deal_name'),
  proposalId: uuid('proposal_id').references(() => dmsDealProposals.id),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  ndaStatus: text('nda_status').default('pending'),
  ndaSignature: text('nda_signature'),
  featureQa: boolean('feature_qa').default(false),
  featureBidding: boolean('feature_bidding').default(false),
  featureTasks: boolean('feature_tasks').default(false),
  featureGroups: boolean('feature_groups').default(false),
  featureCommunication: boolean('feature_communication').default(false),
  guestCanCreateGroups: boolean('guest_can_create_groups').default(true),
  guestCanInviteMembers: boolean('guest_can_invite_members').default(true),
  guestCanUploadDocs: boolean('guest_can_upload_docs').default(false),
  guestCanDownloadDocs: boolean('guest_can_download_docs').default(true),
  guestCanCreateFolders: boolean('guest_can_create_folders').default(false),
  currentStage: text('current_stage').default('Preparation'),
  status: text('status').default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
