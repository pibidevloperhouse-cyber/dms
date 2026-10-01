"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

// ============================================================================
// DEMO PERSONAS & CORPORATE ENTITIES
// ============================================================================
export const DEMO_USERS = {
  ravi: {
    id: 'ravi',
    name: 'Ravi',
    role: 'Seller Admin',
    side: 'seller',
    company: 'ABC Textiles',
    group: 'Seller Admin',
    email: 'ravi@abctextiles.com',
    avatar: 'R',
    color: 'from-blue-600 to-indigo-700',
  },
  lakshmi: {
    id: 'lakshmi',
    name: 'Lakshmi',
    role: 'Seller Finance Team',
    side: 'seller',
    company: 'ABC Textiles',
    group: 'Seller Finance Team',
    email: 'lakshmi@abctextiles.com',
    avatar: 'L',
    color: 'from-blue-500 to-cyan-600',
  },
  arjun: {
    id: 'arjun',
    name: 'Arjun',
    role: 'Buyer Admin',
    side: 'buyer',
    company: 'XYZ Capital',
    group: 'Buyer Admin',
    email: 'arjun@xyzcapital.com',
    avatar: 'A',
    color: 'from-teal-600 to-emerald-700',
  },
  priya: {
    id: 'priya',
    name: 'Priya Sharma',
    role: 'Buyer Legal Team',
    side: 'buyer',
    company: 'XYZ Capital',
    group: 'Buyer Legal Team',
    email: 'priya.sharma@xyzcapital.com',
    avatar: 'P',
    color: 'from-teal-500 to-green-600',
  },
};

export const SELLER_GROUPS = [
  'Seller Finance Team',
  'Seller Legal Team',
  'Seller Operations Team',
];

export const BUYER_GROUPS = [
  'Buyer Legal Team',
  'Buyer Finance Team',
  'Buyer Operations Team',
];

export const WORKSTREAMS = [
  'Legal',
  'Finance',
  'Operations',
  'Tax',
  'Commercial',
  'Compliance',
];

export const PRIORITIES = ['High', 'Medium', 'Low'];

export const DEAL_STAGES = [
  'Preparation',
  'Due Diligence',
  'Negotiation',
  'Closing',
  'Post-Closing',
];

// Initial demo tasks matching user specifications exactly
const INITIAL_DEMO_TASKS = [
  {
    task_id: 'TSK-1001',
    title: 'Upload 2023-24 Audited Financial Statements',
    description: 'Provide certified full-year audited financial statements including Balance Sheet, P&L, Cash Flow, and Auditor Notes for FY23-24.',
    created_by: 'Ravi',
    creator_role: 'Seller Admin',
    creator_company: 'ABC Textiles',
    creator_side: 'seller',
    assigned_to_group: 'Seller Finance Team',
    assigned_to_user: 'Lakshmi',
    target_company: 'ABC Textiles',
    target_side: 'seller',
    workstream: 'Finance',
    priority: 'High',
    deal_stage: 'Due Diligence',
    visibility: 'INTERNAL',
    status: 'DONE',
    due_date: '2026-09-20',
    linked_document: 'Audited_Financial_Statements_FY24.pdf',
    claimable_by_role: true,
    created_at: '2026-09-15 09:30 AM',
    updated_at: '2026-09-20 04:15 PM',
    completed_at: '20-Sep-2026 4:15 PM',
    completed_by: 'Lakshmi',
    digital_signature: null,
    audit_trail: [
      { action: 'Task Created', performed_by: 'Ravi', role: 'Seller Admin', timestamp: '2026-09-15 09:30 AM', ip: '192.168.1.12' },
      { action: 'Claimed by Assignee', performed_by: 'Lakshmi', role: 'Seller Finance Team', timestamp: '2026-09-16 10:15 AM', ip: '192.168.1.45' },
      { action: 'Document Uploaded', performed_by: 'Lakshmi', role: 'Seller Finance Team', timestamp: '2026-09-19 02:40 PM', ip: '192.168.1.45', doc: 'Audited_Financial_Statements_FY24.pdf' },
      { action: 'Submitted for Review', performed_by: 'Lakshmi', role: 'Seller Finance Team', timestamp: '2026-09-19 03:00 PM', ip: '192.168.1.45' },
      { action: 'Approved & Completed', performed_by: 'Ravi', role: 'Seller Admin', timestamp: '20-Sep-2026 4:15 PM', ip: '192.168.1.12' },
    ],
    comments: [
      { id: 'c1', author: 'Lakshmi', company: 'ABC Textiles', scope: 'INTERNAL', text: 'Auditor sign-off certificate verified against ledger entries.', timestamp: '2026-09-19 02:45 PM' },
      { id: 'c2', author: 'Ravi', company: 'ABC Textiles', scope: 'INTERNAL', text: 'Checked. Ready for VDR indexing when requested.', timestamp: '2026-09-20 04:14 PM' },
    ],
    subtasks: [
      { id: 'st_101', title: 'Verify Balance Sheet & P&L notes', assignedMember: 'Lakshmi', priority: 'High', dueDate: '2026-09-18', status: 'DONE' },
      { id: 'st_102', title: 'Reconcile Cash Flow ledger items', assignedMember: 'Ravi', priority: 'Medium', dueDate: '2026-09-19', status: 'DONE' },
      { id: 'st_103', title: 'Obtain statutory auditor signature certification', assignedMember: 'Lakshmi', priority: 'High', dueDate: '2026-09-20', status: 'DONE' },
    ],
  },
  {
    task_id: 'TSK-1002',
    title: "Review Seller's Financial Statements for red flags",
    description: 'Conduct forensic review of ABC Textiles FY23-24 financial statements. Check for revenue recognition consistency, contingent tax liabilities, and inventory valuation adjustments.',
    created_by: 'Arjun',
    creator_role: 'Buyer Admin',
    creator_company: 'XYZ Capital',
    creator_side: 'buyer',
    assigned_to_group: 'Buyer Legal Team',
    assigned_to_user: 'Priya Sharma',
    target_company: 'XYZ Capital',
    target_side: 'buyer',
    workstream: 'Legal',
    priority: 'High',
    deal_stage: 'Due Diligence',
    visibility: 'INTERNAL',
    status: 'IN_PROGRESS',
    due_date: '2026-09-28',
    linked_document: 'Financial_Risk_Assessment_Checklist.pdf',
    claimable_by_role: true,
    created_at: '2026-09-22 11:00 AM',
    updated_at: '2026-09-24 09:30 AM',
    completed_at: null,
    completed_by: null,
    digital_signature: null,
    audit_trail: [
      { action: 'Task Created', performed_by: 'Arjun', role: 'Buyer Admin', timestamp: '2026-09-22 11:00 AM', ip: '10.0.4.18' },
      { action: 'Claimed by Assignee', performed_by: 'Priya Sharma', role: 'Buyer Legal Team', timestamp: '2026-09-23 09:15 AM', ip: '10.0.4.92' },
      { action: 'Private Legal Notes Added', performed_by: 'Priya Sharma', role: 'Buyer Legal Team', timestamp: '2026-09-24 09:30 AM', ip: '10.0.4.92' },
    ],
    comments: [
      { id: 'c3', author: 'Priya Sharma', company: 'XYZ Capital', scope: 'INTERNAL', text: 'Flagged Note 14 on litigation risks regarding effluent treatment plant. Need to verify state environmental clearance.', timestamp: '2026-09-24 09:35 AM' },
      { id: 'c4', author: 'Arjun', company: 'XYZ Capital', scope: 'INTERNAL', text: 'Important observation. Do not disclose this inquiry until we finalize the Q&A schedule.', timestamp: '2026-09-24 10:00 AM' },
    ],
    subtasks: [
      { id: 'st_104', title: 'Check contingent tax liabilities', assignedMember: 'Priya Sharma', priority: 'High', dueDate: '2026-09-25', status: 'DONE' },
      { id: 'st_105', title: 'Review effluent plant environmental litigation note', assignedMember: 'Priya Sharma', priority: 'High', dueDate: '2026-09-27', status: 'TO_DO' },
    ],
  },
  {
    task_id: 'TSK-1003',
    title: 'Sign the NDA document',
    description: 'Please review and digitally sign the attached bilateral Mutual Non-Disclosure Agreement for Project Titan. Required prior to granting clean data room access.',
    created_by: 'Ravi',
    creator_role: 'Seller Admin',
    creator_company: 'ABC Textiles',
    creator_side: 'seller',
    assigned_to_group: 'Buyer Legal Team',
    assigned_to_user: null,
    target_company: 'XYZ Capital',
    target_side: 'buyer',
    workstream: 'Legal',
    priority: 'High',
    deal_stage: 'Preparation',
    visibility: 'EXTERNAL',
    status: 'TO_DO',
    due_date: '2026-09-30',
    linked_document: 'NDA_Draft.pdf',
    claimable_by_role: true,
    created_at: '2026-09-24 02:00 PM',
    updated_at: '2026-09-24 02:00 PM',
    completed_at: null,
    completed_by: null,
    digital_signature: null,
    audit_trail: [
      { action: 'Task Created & Dispatched', performed_by: 'Ravi', role: 'Seller Admin', timestamp: '2026-09-24 02:00 PM', ip: '192.168.1.12' },
      { action: 'Queued to Target Group', performed_by: 'System Workflow Engine', role: 'System', timestamp: '2026-09-24 02:00 PM', ip: '127.0.0.1' },
    ],
    comments: [
      { id: 'c5', author: 'Ravi', company: 'ABC Textiles', scope: 'EXTERNAL', text: 'Draft NDA is attached with standard 24-month confidentiality clause. Please review and countersign.', timestamp: '2026-09-24 02:05 PM' },
    ],
  },
  {
    task_id: 'TSK-1004',
    title: 'Review Material Contracts & Customer Concentration',
    description: 'Examine top 10 commercial contracts of ABC Textiles representing 68% of revenues. Check for change-of-control termination triggers.',
    created_by: 'Arjun',
    creator_role: 'Buyer Admin',
    creator_company: 'XYZ Capital',
    creator_side: 'buyer',
    assigned_to_group: 'Buyer Legal Team',
    assigned_to_user: null,
    target_company: 'XYZ Capital',
    target_side: 'buyer',
    workstream: 'Commercial',
    priority: 'Medium',
    deal_stage: 'Due Diligence',
    visibility: 'INTERNAL',
    status: 'TO_DO',
    due_date: '2026-10-05',
    linked_document: 'Material_Contracts_Summary.pdf',
    claimable_by_role: true,
    created_at: '2026-09-23 04:00 PM',
    updated_at: '2026-09-23 04:00 PM',
    completed_at: null,
    completed_by: null,
    digital_signature: null,
    audit_trail: [
      { action: 'Task Created', performed_by: 'Arjun', role: 'Buyer Admin', timestamp: '2026-09-23 04:00 PM', ip: '10.0.4.18' },
    ],
    comments: [],
  },
  {
    task_id: 'TSK-1005',
    title: 'Q2 Tax Return Compliance & Schedule Verification',
    description: 'Verify Q2 returns against the filing schedule.',
    created_by: 'Ravi',
    creator_role: 'Seller Admin',
    creator_company: 'ABC Textiles',
    creator_side: 'seller',
    assigned_to_group: 'Seller Finance Team',
    assigned_to_user: 'Lakshmi',
    target_company: 'ABC Textiles',
    target_side: 'seller',
    workstream: 'Tax',
    priority: 'Medium',
    deal_stage: 'Due Diligence',
    visibility: 'INTERNAL',
    status: 'REVIEW',
    due_date: '2026-10-02',
    linked_document: 'Q2_Tax_Compliance_Certificates.pdf',
    claimable_by_role: true,
    created_at: '2026-09-21 10:00 AM',
    updated_at: '2026-09-25 03:20 PM',
    completed_at: null,
    completed_by: null,
    digital_signature: null,
    subtasks: [
      { id: 'st_201', title: 'Match returns to ledger', assignedMember: 'Ravi', priority: 'Medium', dueDate: '2026-10-02', status: 'DONE' },
      { id: 'st_202', title: 'Reconcile GST challan filings', assignedMember: 'Arun', priority: 'Medium', dueDate: '2026-10-02', status: 'DONE' },
    ],
    audit_trail: [
      { action: 'Task Created', performed_by: 'Ravi', role: 'Seller Admin', timestamp: '2026-09-21 10:00 AM', ip: '192.168.1.12' },
      { action: 'Claimed by Assignee', performed_by: 'Lakshmi', role: 'Seller Finance Team', timestamp: '2026-09-22 11:30 AM', ip: '192.168.1.45' },
      { action: 'Submitted for Review', performed_by: 'Lakshmi', role: 'Seller Finance Team', timestamp: '2026-09-25 03:20 PM', ip: '192.168.1.45' },
    ],
    comments: [
      { id: 'c6', author: 'Lakshmi', company: 'ABC Textiles', scope: 'INTERNAL', text: 'All challans matched with zero outstanding penalty demands.', timestamp: '2026-09-25 03:15 PM' },
    ],
  },
  {
    task_id: 'TSK-1006',
    title: 'Provide Target Working Capital Benchmark Calculation',
    description: 'Buyer requests 12-month rolling average normalized working capital bridge and peg formula for the definitive agreement.',
    created_by: 'Arjun',
    creator_role: 'Buyer Admin',
    creator_company: 'XYZ Capital',
    creator_side: 'buyer',
    assigned_to_group: 'Seller Finance Team',
    assigned_to_user: 'Lakshmi',
    target_company: 'ABC Textiles',
    target_side: 'seller',
    workstream: 'Finance',
    priority: 'High',
    deal_stage: 'Negotiation',
    visibility: 'EXTERNAL',
    status: 'IN_PROGRESS',
    due_date: '2026-10-08',
    linked_document: 'Working_Capital_Model_v3.xlsx',
    claimable_by_role: true,
    created_at: '2026-09-25 11:30 AM',
    updated_at: '2026-09-26 02:00 PM',
    completed_at: null,
    completed_by: null,
    digital_signature: null,
    audit_trail: [
      { action: 'Task Created & Sent to Seller', performed_by: 'Arjun', role: 'Buyer Admin', timestamp: '2026-09-25 11:30 AM', ip: '10.0.4.18' },
      { action: 'Claimed by Seller Lead', performed_by: 'Lakshmi', role: 'Seller Finance Team', timestamp: '2026-09-26 02:00 PM', ip: '192.168.1.45' },
    ],
    comments: [
      { id: 'c7', author: 'Arjun', company: 'XYZ Capital', scope: 'EXTERNAL', text: 'Please ensure seasonal cotton inventory peaks in Q3 are smoothed out.', timestamp: '2026-09-25 11:32 AM' },
      { id: 'c8', author: 'Lakshmi', company: 'ABC Textiles', scope: 'INTERNAL', text: 'Working with CFO on the inventory exclusion schedule first.', timestamp: '2026-09-26 02:05 PM' },
    ],
  },
  {
    task_id: 'TSK-1007',
    title: 'D&O Insurance Policy & Pending Litigation Disclosure',
    description: 'Provide Director & Officer liability insurance policy schedules and formal certificate of no undisclosed litigation.',
    created_by: 'Ravi',
    creator_role: 'Seller Admin',
    creator_company: 'ABC Textiles',
    creator_side: 'seller',
    assigned_to_group: 'Buyer Legal Team',
    assigned_to_user: 'Priya Sharma',
    target_company: 'XYZ Capital',
    target_side: 'buyer',
    workstream: 'Compliance',
    priority: 'Medium',
    deal_stage: 'Preparation',
    visibility: 'EXTERNAL',
    status: 'DONE',
    due_date: '2026-09-22',
    linked_document: 'DO_Policy_Certificate_Signed.pdf',
    claimable_by_role: true,
    created_at: '2026-09-18 09:00 AM',
    updated_at: '2026-09-22 03:45 PM',
    completed_at: '22-Sep-2026 3:45 PM',
    completed_by: 'Priya Sharma',
    digital_signature: {
      signer: 'Priya Sharma',
      role: 'Buyer Legal Counsel',
      timestamp: '2026-09-22 15:45:12 UTC',
      ip: '198.51.100.42',
      hash: 'SHA256:d8a57e3f890b0e25b341aa9d91f28b4c2b9a712f840939529b533dc270bcfe30',
      document: 'DO_Policy_Certificate_Signed.pdf',
    },
    audit_trail: [
      { action: 'Task Created by Seller', performed_by: 'Ravi', role: 'Seller Admin', timestamp: '2026-09-18 09:00 AM', ip: '192.168.1.12' },
      { action: 'Claimed by Buyer Legal', performed_by: 'Priya Sharma', role: 'Buyer Legal Team', timestamp: '2026-09-19 10:15 AM', ip: '198.51.100.42' },
      { action: 'Document Signed & Verified', performed_by: 'Priya Sharma', role: 'Buyer Legal Team', timestamp: '2026-09-22 03:45 PM', ip: '198.51.100.42' },
      { action: 'Completed & Certified', performed_by: 'System Workflow Engine', role: 'System', timestamp: '22-Sep-2026 3:45 PM', ip: '127.0.0.1' },
    ],
    comments: [
      { id: 'c9', author: 'Priya Sharma', company: 'XYZ Capital', scope: 'EXTERNAL', text: 'Reviewed and countersigned for buyer transaction records.', timestamp: '2026-09-22 03:46 PM' },
    ],
  },
];

const DealWorkflowContext = createContext(null);

export function DealWorkflowProvider({ children }) {
  // Current logged in persona (default to Ravi - Seller Admin)
  const [currentUserId, setCurrentUserId] = useState('ravi');
  const [tasks, setTasks] = useState(INITIAL_DEMO_TASKS);
  const [isAuditModeActive, setIsAuditModeActive] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [signingModalTask, setSigningModalTask] = useState(null);
  const [certificateModalTask, setCertificateModalTask] = useState(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkstream, setSelectedWorkstream] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedVisibility, setSelectedVisibility] = useState('ALL');
  const [selectedDealStage, setSelectedDealStage] = useState('ALL');
  const [teamFilter, setTeamFilter] = useState('ALL'); // 'ALL' or 'MY_TEAM'
  const [dateFilter, setDateFilter] = useState('ALL'); // 'ALL', 'TODAY', 'THIS_WEEK', 'OVERDUE'

  // Load persisted state from localStorage on client mount
  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem('dms_deal_workflow_tasks_v4');
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
      const storedUser = localStorage.getItem('dms_deal_workflow_user_v4');
      if (storedUser && DEMO_USERS[storedUser]) {
        setCurrentUserId(storedUser);
      }
      const storedAudit = localStorage.getItem('dms_deal_workflow_audit_mode_v4');
      if (storedAudit !== null) {
        setIsAuditModeActive(JSON.parse(storedAudit));
      }
    } catch (e) {
      console.error('Error loading deal workflow storage:', e);
    }
  }, []);

  // Save tasks on changes
  useEffect(() => {
    try {
      localStorage.setItem('dms_deal_workflow_tasks_v4', JSON.stringify(tasks));
    } catch (e) {
      console.error('Error saving deal workflow tasks:', e);
    }
  }, [tasks]);

  // Save user on switch
  const switchUser = (userId) => {
    if (DEMO_USERS[userId]) {
      setCurrentUserId(userId);
      localStorage.setItem('dms_deal_workflow_user_v4', userId);
    }
  };

  const toggleAuditMode = () => {
    setIsAuditModeActive((prev) => {
      const next = !prev;
      localStorage.setItem('dms_deal_workflow_audit_mode_v4', JSON.stringify(next));
      return next;
    });
  };

  const currentUser = DEMO_USERS[currentUserId] || DEMO_USERS.ravi;

  // ============================================================================
  // STRICT DATA-LEVEL VISIBILITY ENFORCEMENT
  // ============================================================================
  // Rules:
  // 1. INTERNAL: Visible ONLY if creator_side === currentUser.side.
  //    (Seller internal task is NEVER visible to Buyer. Buyer internal task is NEVER visible to Seller!)
  // 2. EXTERNAL: Visible if creator_side === currentUser.side OR target_side === currentUser.side.
  const isTaskVisibleToUser = (task, user = currentUser) => {
    if (!task) return false;
    if (task.visibility === 'INTERNAL') {
      return task.creator_side === user.side;
    }
    if (task.visibility === 'EXTERNAL') {
      return task.creator_side === user.side || task.target_side === user.side;
    }
    return false;
  };

  // Base tasks permitted for the current user
  const permittedTasks = useMemo(() => {
    return tasks.filter((t) => isTaskVisibleToUser(t, currentUser));
  }, [tasks, currentUser]);

  // Filtered tasks based on active filters
  const visibleTasks = useMemo(() => {
    return permittedTasks.filter((task) => {
      // Search query filter (title, ID, description, document)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesId = task.task_id.toLowerCase().includes(q);
        const matchesDesc = task.description.toLowerCase().includes(q);
        const matchesDoc = task.linked_document?.toLowerCase().includes(q);
        const matchesGroup = task.assigned_to_group.toLowerCase().includes(q);
        const matchesAssignee = task.assigned_to_user?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesId && !matchesDesc && !matchesDoc && !matchesGroup && !matchesAssignee) {
          return false;
        }
      }

      // Workstream
      if (selectedWorkstream !== 'ALL' && task.workstream !== selectedWorkstream) {
        return false;
      }

      // Status
      if (selectedStatus !== 'ALL' && task.status !== selectedStatus) {
        return false;
      }

      // Priority
      if (selectedPriority !== 'ALL' && task.priority !== selectedPriority) {
        return false;
      }

      // Visibility
      if (selectedVisibility !== 'ALL' && task.visibility !== selectedVisibility) {
        return false;
      }

      // Deal Stage
      if (selectedDealStage !== 'ALL' && task.deal_stage !== selectedDealStage) {
        return false;
      }

      // My Team
      if (teamFilter === 'MY_TEAM') {
        const isMyTeamGroup = task.assigned_to_group === currentUser.group;
        const isAssignedToMe = task.assigned_to_user === currentUser.name;
        if (!isMyTeamGroup && !isAssignedToMe) return false;
      }

      // Due Date Filter
      if (dateFilter === 'TODAY') {
        // demo date check
        if (!task.due_date) return false;
      } else if (dateFilter === 'OVERDUE') {
        if (task.status !== 'DONE' && task.due_date && new Date(task.due_date) < new Date('2026-09-28')) {
          return true;
        }
        return false;
      }

      return true;
    });
  }, [
    permittedTasks,
    searchQuery,
    selectedWorkstream,
    selectedStatus,
    selectedPriority,
    selectedVisibility,
    selectedDealStage,
    teamFilter,
    dateFilter,
    currentUser,
  ]);

  // Keep selectedTask fresh if tasks state updates
  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find((t) => t.task_id === selectedTask.task_id);
      if (updated && isTaskVisibleToUser(updated, currentUser)) {
        setSelectedTask(updated);
      } else if (updated && !isTaskVisibleToUser(updated, currentUser)) {
        // If switched user and no longer permitted to see selected task, close drawer!
        setSelectedTask(null);
      }
    }
  }, [tasks, currentUser]);

  // Dynamic KPI counts computed from permitted tasks
  const kpiCounts = useMemo(() => {
    const total = permittedTasks.length;
    const todo = permittedTasks.filter((t) => t.status === 'TO_DO').length;
    const inProgress = permittedTasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const review = permittedTasks.filter((t) => t.status === 'REVIEW').length;
    const done = permittedTasks.filter((t) => t.status === 'DONE').length;
    return { total, todo, inProgress, review, done };
  }, [permittedTasks]);

  // ============================================================================
  // SMART GROUP DROPDOWN HELPER
  // ============================================================================
  // Rules from specification:
  // SELLER + INTERNAL -> show only Seller groups
  // SELLER + EXTERNAL -> show Buyer groups
  // BUYER + INTERNAL  -> show only Buyer groups
  // BUYER + EXTERNAL  -> show Seller groups
  const getSmartGroupsForVisibility = (visibility, user = currentUser) => {
    if (user.side === 'seller') {
      return visibility === 'INTERNAL' ? SELLER_GROUPS : BUYER_GROUPS;
    } else {
      return visibility === 'INTERNAL' ? BUYER_GROUPS : SELLER_GROUPS;
    }
  };

  const getTargetCompanyForVisibility = (visibility, user = currentUser) => {
    if (user.side === 'seller') {
      return visibility === 'INTERNAL' ? 'ABC Textiles' : 'XYZ Capital';
    } else {
      return visibility === 'INTERNAL' ? 'XYZ Capital' : 'ABC Textiles';
    }
  };

  const getTargetSideForVisibility = (visibility, user = currentUser) => {
    if (user.side === 'seller') {
      return visibility === 'INTERNAL' ? 'seller' : 'buyer';
    } else {
      return visibility === 'INTERNAL' ? 'buyer' : 'seller';
    }
  };

  // ============================================================================
  // WORKFLOW TRANSITIONS & PERMISSIONS
  // ============================================================================
  const canUserClaimTask = (task, user = currentUser) => {
    if (!task || task.status !== 'TO_DO') return false;
    // User must be on the receiving/target side of the task
    if (user.side !== task.target_side) return false;
    // If assigned to a group, user must belong to group OR be Admin of that company
    const isAdmin = user.role.includes('Admin');
    const isGroupMember = user.group === task.assigned_to_group;
    return isAdmin || isGroupMember;
  };

  const canUserSubmitForReview = (task, user = currentUser) => {
    if (!task || task.status !== 'IN_PROGRESS') return false;
    // Assignee, team member, or admin on target side
    if (user.side !== task.target_side) return false;
    const isAssignee = task.assigned_to_user === user.name;
    const isGroupMember = user.group === task.assigned_to_group;
    const isAdmin = user.role.includes('Admin');
    return isAssignee || isGroupMember || isAdmin;
  };

  const canUserApproveTask = (task, user = currentUser) => {
    if (!task || task.status !== 'REVIEW') return false;
    // Company admin on the side that owns/oversees review
    // For internal tasks: creator company admin
    // For external tasks: creator company admin or team reviewer
    const isCreatorSide = user.side === task.creator_side;
    const isAdmin = user.role.includes('Admin');
    return isCreatorSide && isAdmin;
  };

  // Action: Claim Task
  const claimTask = (taskId) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.task_id !== taskId) return t;
        const now = new Date();
        const formattedDate = `${now.getDate()}-${now.toLocaleString('default', { month: 'short' })}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        return {
          ...t,
          status: 'IN_PROGRESS',
          assigned_to_user: currentUser.name,
          updated_at: formattedDate,
          audit_trail: [
            ...t.audit_trail,
            {
              action: 'Task Claimed',
              performed_by: currentUser.name,
              role: currentUser.role,
              timestamp: formattedDate,
              ip: currentUser.side === 'seller' ? '192.168.1.45' : '198.51.100.42',
            },
          ],
        };
      })
    );
  };

  // Action: Submit for Review
  const submitForReview = (taskId) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.task_id !== taskId) return t;
        const now = new Date();
        const formattedDate = `${now.getDate()}-${now.toLocaleString('default', { month: 'short' })}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        return {
          ...t,
          status: 'REVIEW',
          updated_at: formattedDate,
          audit_trail: [
            ...t.audit_trail,
            {
              action: 'Submitted for Review',
              performed_by: currentUser.name,
              role: currentUser.role,
              timestamp: formattedDate,
              ip: currentUser.side === 'seller' ? '192.168.1.45' : '198.51.100.42',
            },
          ],
        };
      })
    );
  };

  // Action: Approve & Complete
  const approveAndComplete = (taskId) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.task_id !== taskId) return t;
        const now = new Date();
        const formattedDate = `${now.getDate()}-${now.toLocaleString('default', { month: 'short' })}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        return {
          ...t,
          status: 'DONE',
          completed_at: formattedDate,
          completed_by: currentUser.name,
          updated_at: formattedDate,
          audit_trail: [
            ...t.audit_trail,
            {
              action: 'Approved & Completed',
              performed_by: currentUser.name,
              role: currentUser.role,
              timestamp: formattedDate,
              ip: currentUser.side === 'seller' ? '192.168.1.12' : '10.0.4.18',
            },
          ],
        };
      })
    );
  };

  // Action: Send Back to In Progress (revisions requested)
  const sendBack = (taskId, reason = 'Revisions requested by reviewer') => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.task_id !== taskId) return t;
        const now = new Date();
        const formattedDate = `${now.getDate()}-${now.toLocaleString('default', { month: 'short' })}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        return {
          ...t,
          status: 'IN_PROGRESS',
          updated_at: formattedDate,
          audit_trail: [
            ...t.audit_trail,
            {
              action: 'Task Sent Back for Revisions',
              performed_by: currentUser.name,
              role: currentUser.role,
              timestamp: formattedDate,
              ip: currentUser.side === 'seller' ? '192.168.1.12' : '10.0.4.18',
              details: reason,
            },
          ],
        };
      })
    );
  };

  // Action: Digital Document Sign & Complete (specifically used for NDA and signed covenants)
  const signDocumentAndComplete = (taskId, signaturePayload) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.task_id !== taskId) return t;
        const now = new Date();
        const formattedDate = `${now.getDate()}-${now.toLocaleString('default', { month: 'short' })}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        const isoString = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

        const digitalSignature = {
          signer: currentUser.name,
          role: currentUser.role,
          timestamp: isoString,
          ip: currentUser.side === 'buyer' ? '198.51.100.42' : '192.168.1.55',
          hash: signaturePayload?.hash || `SHA256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
          document: t.linked_document || 'NDA_Draft.pdf',
          signatureDataUrl: signaturePayload?.dataUrl || null,
        };

        return {
          ...t,
          status: 'DONE',
          assigned_to_user: currentUser.name,
          completed_at: formattedDate,
          completed_by: currentUser.name,
          updated_at: formattedDate,
          digital_signature: digitalSignature,
          audit_trail: [
            ...t.audit_trail,
            {
              action: `${t.linked_document || 'Document'} Opened & Reviewed`,
              performed_by: currentUser.name,
              role: currentUser.role,
              timestamp: formattedDate,
              ip: digitalSignature.ip,
            },
            {
              action: `${t.linked_document || 'Document'} Digitally Signed`,
              performed_by: currentUser.name,
              role: currentUser.role,
              timestamp: formattedDate,
              ip: digitalSignature.ip,
              hash: digitalSignature.hash,
            },
            {
              action: 'Task Auto-Completed via Verified Digital Signature',
              performed_by: 'System Workflow Engine',
              role: 'System',
              timestamp: formattedDate,
              ip: '127.0.0.1',
            },
          ],
        };
      })
    );
  };

  // Action: Create New Task
  const createTask = (formData) => {
    const nextIndex = tasks.length + 1;
    const taskId = `TSK-${1000 + nextIndex}`;
    const now = new Date();
    const formattedDate = `${now.getDate()}-${now.toLocaleString('default', { month: 'short' })}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const targetSide = getTargetSideForVisibility(formData.visibility, currentUser);
    const targetCompany = getTargetCompanyForVisibility(formData.visibility, currentUser);

    const newTask = {
      task_id: taskId,
      title: formData.title,
      description: formData.description || '',
      created_by: currentUser.name,
      creator_role: currentUser.role,
      creator_company: currentUser.company,
      creator_side: currentUser.side,
      assigned_to_group: formData.assigned_to_group,
      assigned_to_user: null,
      target_company: targetCompany,
      target_side: targetSide,
      workstream: formData.workstream || 'General',
      priority: formData.priority || 'Medium',
      deal_stage: formData.deal_stage || 'Preparation',
      visibility: formData.visibility, // 'INTERNAL' or 'EXTERNAL'
      status: 'TO_DO',
      due_date: formData.due_date || '2026-10-15',
      linked_document: formData.linked_document || null,
      claimable_by_role: formData.claimable_by_role ?? true,
      subtasks: formData.subtasks || [],
      created_at: formattedDate,
      updated_at: formattedDate,
      completed_at: null,
      completed_by: null,
      digital_signature: null,
      audit_trail: [
        {
          action: formData.visibility === 'EXTERNAL' ? 'External Task Created & Dispatched' : 'Internal Task Created',
          performed_by: currentUser.name,
          role: currentUser.role,
          timestamp: formattedDate,
          ip: currentUser.side === 'seller' ? '192.168.1.12' : '10.0.4.18',
        },
      ],
      comments: [],
    };

    setTasks((prev) => [newTask, ...prev]);
    setIsCreateModalOpen(false);
    return newTask;
  };

  // Action: Toggle Subtask Status
  const toggleSubtask = (taskId, subtaskId) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.task_id !== taskId) return t;
        const currentSubtasks = t.subtasks || [];
        const updatedSubtasks = currentSubtasks.map((st) => {
          if (st.id === subtaskId) {
            const nextStatus = st.status === 'DONE' ? 'TO_DO' : 'DONE';
            return {
              ...st,
              status: nextStatus,
              completed_at: nextStatus === 'DONE' ? new Date().toISOString() : null,
            };
          }
          return st;
        });
        return {
          ...t,
          subtasks: updatedSubtasks,
        };
      })
    );
  };

  // Action: Add Scoped Comment
  const addComment = (taskId, text, scope = 'INTERNAL') => {
    if (!text.trim()) return;
    const now = new Date();
    const formattedDate = `${now.getDate()}-${now.toLocaleString('default', { month: 'short' })} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newComment = {
      id: `comm_${Date.now()}`,
      author: currentUser.name,
      company: currentUser.company,
      scope: scope, // 'INTERNAL' or 'EXTERNAL'
      text: text.trim(),
      timestamp: formattedDate,
    };

    setTasks((prev) =>
      prev.map((t) => {
        if (t.task_id !== taskId) return t;
        return {
          ...t,
          comments: [...t.comments, newComment],
          updated_at: formattedDate,
          audit_trail: [
            ...t.audit_trail,
            {
              action: `Added ${scope} comment`,
              performed_by: currentUser.name,
              role: currentUser.role,
              timestamp: formattedDate,
              ip: currentUser.side === 'seller' ? '192.168.1.45' : '198.51.100.42',
            },
          ],
        };
      })
    );
  };

  // Action: Reset Demo
  const resetToDemo = () => {
    setTasks(INITIAL_DEMO_TASKS);
    localStorage.removeItem('dms_deal_workflow_tasks_v2');
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedWorkstream('ALL');
    setSelectedStatus('ALL');
    setSelectedPriority('ALL');
    setSelectedVisibility('ALL');
    setSelectedDealStage('ALL');
    setTeamFilter('ALL');
    setDateFilter('ALL');
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    selectedWorkstream !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedPriority !== 'ALL' ||
    selectedVisibility !== 'ALL' ||
    selectedDealStage !== 'ALL' ||
    teamFilter !== 'ALL' ||
    dateFilter !== 'ALL'
  );

  return (
    <DealWorkflowContext.Provider
      value={{
        currentUser,
        currentUserId,
        switchUser,
        demoUsers: DEMO_USERS,
        tasks,
        permittedTasks,
        visibleTasks,
        kpiCounts,
        isAuditModeActive,
        toggleAuditMode,
        selectedTask,
        setSelectedTask,
        isCreateModalOpen,
        setIsCreateModalOpen,
        signingModalTask,
        setSigningModalTask,
        certificateModalTask,
        setCertificateModalTask,
        // Helpers
        getSmartGroupsForVisibility,
        getTargetCompanyForVisibility,
        getTargetSideForVisibility,
        isTaskVisibleToUser,
        canUserClaimTask,
        canUserSubmitForReview,
        canUserApproveTask,
        // Actions
        claimTask,
        submitForReview,
        approveAndComplete,
        sendBack,
        signDocumentAndComplete,
        createTask,
        toggleSubtask,
        addComment,
        resetToDemo,
        // Filters
        searchQuery,
        setSearchQuery,
        selectedWorkstream,
        setSelectedWorkstream,
        selectedStatus,
        setSelectedStatus,
        selectedPriority,
        setSelectedPriority,
        selectedVisibility,
        setSelectedVisibility,
        selectedDealStage,
        setSelectedDealStage,
        teamFilter,
        setTeamFilter,
        dateFilter,
        setDateFilter,
        clearFilters,
        hasActiveFilters,
      }}
    >
      {children}
    </DealWorkflowContext.Provider>
  );
}

export function useDealWorkflow() {
  const context = useContext(DealWorkflowContext);
  if (!context) {
    throw new Error('useDealWorkflow must be used within a DealWorkflowProvider');
  }
  return context;
}
