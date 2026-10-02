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

// Tasks are loaded dynamically from the backend PostgreSQL database
const INITIAL_DEMO_TASKS = [];


const DealWorkflowContext = createContext(null);

export function DealWorkflowProvider({ children }) {
  // Current logged in persona (default to Ravi - Seller Admin)
  const [currentUserId, setCurrentUserId] = useState('ravi');
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // Fetch real deal tasks from PostgreSQL API
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/deal-tasks');
      const data = await res.json();
      if (data.success && Array.isArray(data.tasks)) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error('Error fetching deal tasks from API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      // Clear legacy dummy tasks from localStorage
      localStorage.removeItem('dms_deal_workflow_tasks_v4');
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

    fetchTasks();
  }, []);

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
  const claimTask = async (taskId) => {
    const now = new Date();
    const formattedDate = `${now.getDate()}-${now.toLocaleString('default', { month: 'short' })}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.task_id !== taskId) return t;
        return {
          ...t,
          status: 'IN_PROGRESS',
          assigned_to_user: currentUser.name,
          updated_at: formattedDate,
          audit_trail: [
            ...(t.audit_trail || []),
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
    try {
      await fetch(`/api/deal-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'claim',
          user: { name: currentUser.name, role: currentUser.role, side: currentUser.side },
          ipAddress: currentUser.side === 'seller' ? '192.168.1.45' : '198.51.100.42',
        }),
      });
    } catch (e) {
      console.error('Claim task API error:', e);
    }
  };

  // Action: Submit for Review
  const submitForReview = async (taskId) => {
    const now = new Date();
    const formattedDate = `${now.getDate()}-${now.toLocaleString('default', { month: 'short' })}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.task_id !== taskId) return t;
        return {
          ...t,
          status: 'REVIEW',
          updated_at: formattedDate,
          audit_trail: [
            ...(t.audit_trail || []),
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
    try {
      await fetch(`/api/deal-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_review',
          user: { name: currentUser.name, role: currentUser.role, side: currentUser.side },
          ipAddress: currentUser.side === 'seller' ? '192.168.1.45' : '198.51.100.42',
        }),
      });
    } catch (e) {
      console.error('Submit review API error:', e);
    }
  };

  // Action: Approve & Complete
  const approveAndComplete = async (taskId) => {
    const now = new Date();
    const formattedDate = `${now.getDate()}-${now.toLocaleString('default', { month: 'short' })}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.task_id !== taskId) return t;
        return {
          ...t,
          status: 'DONE',
          completed_at: formattedDate,
          completed_by: currentUser.name,
          updated_at: formattedDate,
          audit_trail: [
            ...(t.audit_trail || []),
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
    try {
      await fetch(`/api/deal-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          user: { name: currentUser.name, role: currentUser.role, side: currentUser.side },
          ipAddress: currentUser.side === 'seller' ? '192.168.1.12' : '10.0.4.18',
        }),
      });
    } catch (e) {
      console.error('Approve task API error:', e);
    }
  };

  // Action: Send Back to In Progress (revisions requested)
  const sendBack = async (taskId, reason = 'Revisions requested by reviewer') => {
    const now = new Date();
    const formattedDate = `${now.getDate()}-${now.toLocaleString('default', { month: 'short' })}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.task_id !== taskId) return t;
        return {
          ...t,
          status: 'IN_PROGRESS',
          updated_at: formattedDate,
          audit_trail: [
            ...(t.audit_trail || []),
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
    try {
      await fetch(`/api/deal-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_back',
          user: { name: currentUser.name, role: currentUser.role, side: currentUser.side },
          reason,
          ipAddress: currentUser.side === 'seller' ? '192.168.1.12' : '10.0.4.18',
        }),
      });
    } catch (e) {
      console.error('Send back API error:', e);
    }
  };

  // Action: Digital Document Sign & Complete (specifically used for NDA and signed covenants)
  const signDocumentAndComplete = async (taskId, signaturePayload) => {
    const now = new Date();
    const formattedDate = `${now.getDate()}-${now.toLocaleString('default', { month: 'short' })}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const isoString = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    const digitalSignature = {
      signer: currentUser.name,
      role: currentUser.role,
      timestamp: isoString,
      ip: currentUser.side === 'buyer' ? '198.51.100.42' : '192.168.1.55',
      hash: signaturePayload?.hash || `SHA256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      document: 'NDA_Draft.pdf',
      signatureDataUrl: signaturePayload?.dataUrl || null,
    };

    setTasks((prev) =>
      prev.map((t) => {
        if (t.task_id !== taskId) return t;
        return {
          ...t,
          status: 'DONE',
          assigned_to_user: currentUser.name,
          completed_at: formattedDate,
          completed_by: currentUser.name,
          updated_at: formattedDate,
          digital_signature: digitalSignature,
          audit_trail: [
            ...(t.audit_trail || []),
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

    try {
      await fetch(`/api/deal-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sign_document',
          user: { name: currentUser.name, role: currentUser.role, side: currentUser.side },
          signature: digitalSignature,
          ipAddress: digitalSignature.ip,
        }),
      });
    } catch (e) {
      console.error('Sign document API error:', e);
    }
  };

  // Action: Create New Task
  const createTask = async (formData) => {
    try {
      const targetSide = getTargetSideForVisibility(formData.visibility, currentUser);
      const targetCompany = getTargetCompanyForVisibility(formData.visibility, currentUser);

      const res = await fetch('/api/deal-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          creator_side: currentUser.side,
          creator_company: currentUser.company,
          target_side: targetSide,
          target_company: targetCompany,
          created_by: currentUser.name,
          creator_role: currentUser.role,
          ipAddress: currentUser.side === 'seller' ? '192.168.1.12' : '10.0.4.18',
        }),
      });

      const data = await res.json();
      if (data.success && data.task) {
        setTasks((prev) => [data.task, ...prev]);
        setIsCreateModalOpen(false);
        return data.task;
      }
    } catch (err) {
      console.error('Error creating task via API:', err);
    }
  };

  // Action: Toggle Subtask Status
  const toggleSubtask = async (taskId, subtaskId) => {
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

    try {
      await fetch(`/api/deal-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_subtask',
          subtaskId,
        }),
      });
    } catch (e) {
      console.error('Toggle subtask API error:', e);
    }
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
        refreshTasks: fetchTasks,
        isLoading,
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
