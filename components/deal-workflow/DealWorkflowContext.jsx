"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/utils/supabase/client';

// ============================================================================
// ROLE HIERARCHY & TASK DELEGATION PERMISSIONS
// 1. Super Admin can assign to Admin, Sub Admin, Internal User
// 2. Admin can assign to Sub Admin, Internal User
// 3. Sub Admin can assign to Internal User
// 4. Internal User cannot assign to other roles
// ============================================================================
export const ROLE_HIERARCHY = {
  super_admin: {
    level: 4,
    label: 'Super Admin',
    badge: '👑 Super Admin',
    canAssignTo: ['admin', 'sub_admin', 'internal_user'],
    desc: 'Can assign to Admin, Sub Admin, and Internal User',
  },
  admin: {
    level: 3,
    label: 'Admin',
    badge: '👔 Admin',
    canAssignTo: ['sub_admin', 'internal_user'],
    desc: 'Can assign to Sub Admin and Internal User',
  },
  sub_admin: {
    level: 2,
    label: 'Sub Admin',
    badge: '⚡ Sub Admin',
    canAssignTo: ['internal_user'],
    desc: 'Can assign to Internal User',
  },
  internal_user: {
    level: 1,
    label: 'Internal User',
    badge: '👤 Internal User',
    canAssignTo: [],
    desc: 'Task executor (Cannot assign to other roles)',
  },
};

export const normalizeRole = (roleStr) => {
  if (!roleStr) return 'internal_user';
  const lower = roleStr.toLowerCase().replace(/[\s-_]+/g, '_');
  if (lower.includes('super')) return 'super_admin';
  if (lower.includes('sub')) return 'sub_admin';
  if (lower.includes('admin')) return 'admin';
  if (lower.includes('internal') || lower.includes('user') || lower.includes('member') || lower.includes('guest')) return 'internal_user';
  return 'internal_user';
};

export const getRoleLabel = (roleStr) => {
  const norm = normalizeRole(roleStr);
  return ROLE_HIERARCHY[norm]?.label || roleStr;
};

export const canRoleAssignTo = (creatorRole, targetRole) => {
  const cNorm = normalizeRole(creatorRole);
  const tNorm = normalizeRole(targetRole);
  const allowed = ROLE_HIERARCHY[cNorm]?.canAssignTo || [];
  return allowed.includes(tNorm);
};

// ============================================================================
// DEMO PERSONAS & CORPORATE ENTITIES
// ============================================================================
export const DEMO_USERS = {
  ravi: {
    id: 'ravi',
    name: 'Ravi Shankar',
    role: 'super_admin',
    roleLabel: 'Super Admin',
    side: 'seller',
    company: 'ABC Textiles',
    group: 'Executive Board',
    email: 'ravi@abctextiles.com',
    avatar: 'R',
    color: 'from-indigo-600 to-violet-700',
  },
  suresh: {
    id: 'suresh',
    name: 'Suresh Kumar',
    role: 'admin',
    roleLabel: 'Admin',
    side: 'seller',
    company: 'ABC Textiles',
    group: 'Seller Admin',
    email: 'suresh@abctextiles.com',
    avatar: 'S',
    color: 'from-blue-600 to-cyan-700',
  },
  lakshmi: {
    id: 'lakshmi',
    name: 'Lakshmi Narayanan',
    role: 'sub_admin',
    roleLabel: 'Sub Admin',
    side: 'seller',
    company: 'ABC Textiles',
    group: 'Seller Finance Team',
    email: 'lakshmi@abctextiles.com',
    avatar: 'L',
    color: 'from-teal-600 to-emerald-700',
  },
  karthik: {
    id: 'karthik',
    name: 'Karthik Raja',
    role: 'internal_user',
    roleLabel: 'Internal User',
    side: 'seller',
    company: 'ABC Textiles',
    group: 'Finance Operations',
    email: 'karthik@abctextiles.com',
    avatar: 'K',
    color: 'from-amber-600 to-orange-700',
  },
  arjun: {
    id: 'arjun',
    name: 'Arjun Mehta',
    role: 'admin',
    roleLabel: 'Buyer Admin',
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
    role: 'sub_admin',
    roleLabel: 'Buyer Sub Admin',
    side: 'buyer',
    company: 'XYZ Capital',
    group: 'Buyer Legal Team',
    email: 'priya.sharma@xyzcapital.com',
    avatar: 'P',
    color: 'from-purple-600 to-pink-700',
  },
};

export const SELLER_GROUPS = [];
export const BUYER_GROUPS = [
  {
    id: 'buyer_legal',
    name: 'Buyer Legal Team',
    department: 'Legal',
    role: 'sub_admin',
    side: 'buyer',
    company: 'XYZ Capital',
    members: ['Priya Sharma'],
  },
  {
    id: 'buyer_finance',
    name: 'Buyer Finance Team',
    department: 'Finance',
    role: 'sub_admin',
    side: 'buyer',
    company: 'XYZ Capital',
    members: ['Arjun Mehta', 'Priya Sharma'],
  },
  {
    id: 'buyer_admin',
    name: 'Buyer Admin',
    department: 'General',
    role: 'admin',
    side: 'buyer',
    company: 'XYZ Capital',
    members: ['Arjun Mehta'],
  },
  {
    id: 'buyer_diligence',
    name: 'Buyer Due Diligence Team',
    department: 'Operations',
    role: 'internal_user',
    side: 'buyer',
    company: 'XYZ Capital',
    members: ['Priya Sharma'],
  },
];
export const DEFAULT_DEPARTMENTS = [];
export const DEPARTMENTS = DEFAULT_DEPARTMENTS;
export const WORKSTREAMS = DEPARTMENTS; // Alias for backward compatibility

export const PRIORITIES = ['High', 'Medium', 'Low'];

export const DEAL_STAGES = [
  'Preparation',
  'Due Diligence',
  'Negotiation',
];

export const normalizeStage = (stage) => {
  if (!stage) return 'Preparation';
  const s = stage.trim().toLowerCase();
  if (s.includes('prep')) return 'Preparation';
  if (s.includes('due') || s.includes('diligence')) return 'Due Diligence';
  if (s.includes('neg')) return 'Negotiation';
  return 'Preparation';
};

export const getStageIndex = (stage) => {
  const norm = normalizeStage(stage);
  if (norm === 'Preparation') return 0;
  if (norm === 'Due Diligence') return 1;
  if (norm === 'Negotiation') return 2;
  return 0;
};

// Tasks are loaded dynamically from the backend PostgreSQL database
const INITIAL_DEMO_TASKS = [];


const DealWorkflowContext = createContext(null);

// ============================================================================
// HELPER: Read authenticated user from vdr_session
// ============================================================================
export const readSessionUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const rawSession = localStorage.getItem('vdr_session');
    if (!rawSession) return null;
    const s = JSON.parse(rawSession);
    if (s && (s.name || s.id || s.email)) {
      const roleStr = s.role || 'internal_user';
      return {
        id: s.id || 'session_user',
        name: (s.name || s.email?.split('@')[0] || 'User').trim(),
        email: s.email || '',
        role: roleStr,
        roleLabel: getRoleLabel(roleStr),
        side: s.dms_role || (['guest_admin', 'buyer', 'guest_lead'].includes(s.role) ? 'buyer' : 'seller'),
        company: s.company_name || (s.dms_role === 'buyer' ? 'XYZ Capital' : 'ABC Textiles'),
        group: s.group || s.role || 'General',
        avatar: (s.name || s.email || 'U')[0].toUpperCase(),
        color: 'from-blue-600 to-indigo-700',
      };
    }
  } catch (e) {
    console.error('Error reading session user:', e);
  }
  return null;
};

export function DealWorkflowProvider({ children }) {
  // Current logged in user: Always prioritize the authenticated session
  const [sessionUser, setSessionUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [dbGroups, setDbGroups] = useState([]);
  const [workflowGroups, setWorkflowGroups] = useState([]);
  const [externalGroupsState, setExternalGroupsState] = useState([]);
  const [groupMembersMap, setGroupMembersMap] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);

  // Memoized external groups (always guarantees standard BUYER_GROUPS are available)
  const externalGroups = useMemo(() => {
    const list = [...BUYER_GROUPS];
    if (Array.isArray(externalGroupsState)) {
      externalGroupsState.forEach((g) => {
        if (!list.some((item) => item.name.toLowerCase() === g.name.toLowerCase())) {
          list.push(g);
        }
      });
    }
    return list;
  }, [externalGroupsState]);

  const [isLoading, setIsLoading] = useState(true);
  const [isAuditModeActive, setIsAuditModeActive] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [signingModalTask, setSigningModalTask] = useState(null);
  const [certificateModalTask, setCertificateModalTask] = useState(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedVisibility, setSelectedVisibility] = useState('ALL');
  const [selectedDealStage, setSelectedDealStage] = useState('Preparation');

  // ============================================================================
  // ACTIVE DEAL STAGE: Exclusively activated by Super Admin
  // (Preparation, Due Diligence, Negotiation). Default: Preparation
  // ============================================================================
  const [activeDealStage, setActiveDealStage] = useState('Preparation');
  const [stageNotification, setStageNotification] = useState(null);

  // Load saved stage on client mount after hydration
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dms_active_deal_stage');
      if (saved && DEAL_STAGES.some((s) => normalizeStage(s) === normalizeStage(saved))) {
        setActiveDealStage(saved);
        setSelectedDealStage(saved);
      }
    } catch (e) {}
  }, []);

  // Fetch active stage from server backend
  const fetchActiveStage = async () => {
    try {
      const res = await fetch('/api/deal-workflow/active-stage');
      const data = await res.json();
      if (data.success && data.activeStage) {
        const matched = DEAL_STAGES.find((s) => normalizeStage(s) === normalizeStage(data.activeStage)) || data.activeStage;
        setActiveDealStage((prev) => {
          if (normalizeStage(prev) !== normalizeStage(matched)) {
            setSelectedDealStage(matched);
            return matched;
          }
          return prev;
        });

        if (data.notificationPayload) {
          const isDismissed = typeof window !== 'undefined'
            ? localStorage.getItem(`dms_stage_dismissed_${data.notificationPayload.id}`)
            : false;
          if (!isDismissed) {
            setStageNotification(data.notificationPayload);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching active stage from server:', e);
    }
  };

  // Super Admin stage activation handler
  const activateStage = async (stageName) => {
    const normRole = normalizeRole(currentUser?.role);
    if (normRole !== 'super_admin') {
      console.warn('Only Super Admin can activate stages.');
      return;
    }
    const matched = DEAL_STAGES.find((s) => normalizeStage(s) === normalizeStage(stageName)) || stageName;
    setActiveDealStage(matched);
    setSelectedDealStage(matched);

    // Automatically enable all tasks belonging to the newly activated stage in state
    setTasks((prev) =>
      prev.map((t) =>
        normalizeStage(t.deal_stage) === normalizeStage(matched)
          ? { ...t, is_enabled: true }
          : t
      )
    );

    const notificationPayload = {
      id: `stage-activate-${matched}-${Date.now()}`,
      stage: matched,
      activatedBy: currentUser?.name || 'Super Admin',
      timestamp: Date.now(),
      message: `Super Admin has activated the ${matched} stage! Tasks created for ${matched} stage are now active.`,
    };

    setStageNotification(notificationPayload);

    if (typeof window !== 'undefined') {
      localStorage.setItem('dms_active_deal_stage', matched);
      localStorage.setItem('dms_stage_notification', JSON.stringify(notificationPayload));
      window.dispatchEvent(new CustomEvent('dms_active_stage_changed', { detail: { stage: matched } }));
      window.dispatchEvent(new CustomEvent('dms_stage_notification_event', { detail: notificationPayload }));
    }

    try {
      await fetch('/api/deal-workflow/active-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: matched,
          notificationPayload,
        }),
      });
    } catch (err) {
      console.error('Error saving active stage to server:', err);
    }
  };

  const dismissStageNotification = () => {
    if (stageNotification?.id && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`dms_stage_dismissed_${stageNotification.id}`, 'true');
      } catch (e) {}
    }
    setStageNotification(null);
  };

  // Sync active deal stage changes and notifications across tabs / storage events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Restore un-dismissed stage notification on mount
    try {
      const storedNotice = localStorage.getItem('dms_stage_notification');
      if (storedNotice) {
        const parsed = JSON.parse(storedNotice);
        const isDismissed = localStorage.getItem(`dms_stage_dismissed_${parsed.id}`);
        // Show if not dismissed and within the last 48 hours
        if (!isDismissed && parsed.timestamp && (Date.now() - parsed.timestamp < 48 * 60 * 60 * 1000)) {
          setStageNotification(parsed);
        }
      }
    } catch (e) {}

    const handleStageEvent = (e) => {
      const stage = e.detail?.stage || localStorage.getItem('dms_active_deal_stage');
      if (stage && DEAL_STAGES.some((s) => normalizeStage(s) === normalizeStage(stage))) {
        setActiveDealStage(stage);
        setSelectedDealStage(stage);
      }
    };

    const handleNoticeEvent = (e) => {
      if (e.detail) {
        setStageNotification(e.detail);
      }
    };

    const handleStorageEvent = (e) => {
      if (e.key === 'dms_active_deal_stage' && e.newValue) {
        setActiveDealStage(e.newValue);
        setSelectedDealStage(e.newValue);
      }
      if (e.key === 'dms_stage_notification' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const isDismissed = localStorage.getItem(`dms_stage_dismissed_${parsed.id}`);
          if (!isDismissed) {
            setStageNotification(parsed);
          }
        } catch (err) {}
      }
    };

    window.addEventListener('dms_active_stage_changed', handleStageEvent);
    window.addEventListener('dms_stage_notification_event', handleNoticeEvent);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('dms_active_stage_changed', handleStageEvent);
      window.removeEventListener('dms_stage_notification_event', handleNoticeEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);
  const [teamFilter, setTeamFilter] = useState('ALL'); // 'ALL' or 'MY_TEAM'
  const [memberFilter, setMemberFilter] = useState('ALL'); // 'ALL', 'MY_TASKS', or specific member name
  const [dateFilter, setDateFilter] = useState('ALL'); // 'ALL', 'TODAY', 'THIS_WEEK', 'OVERDUE'

  // Fetch real deal tasks and dynamic department/group structure
  const fetchTasks = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetch('/api/deal-tasks');
      const data = await res.json();
      if (data.success && Array.isArray(data.tasks)) {
        setTasks(data.tasks);

        if (Array.isArray(data.groups) && data.groups.length > 0) {
          setWorkflowGroups(data.groups);
          setDbGroups(data.groups.map((g) => g.name));
        }
        if (data.groupMembersMap && Object.keys(data.groupMembersMap).length > 0) {
          setGroupMembersMap(data.groupMembersMap);
        }
        if (Array.isArray(data.users) && data.users.length > 0) {
          setAllUsers(data.users);
        }
        if (Array.isArray(data.departments) && data.departments.length > 0) {
          setDepartments(data.departments);
        }
      }
    } catch (err) {
      console.error('Error fetching deal tasks from API:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const fetchDepartmentsAndGroups = async () => {
    try {
      const rawSession = typeof window !== 'undefined' ? localStorage.getItem('vdr_session') : null;
      const session = rawSession ? JSON.parse(rawSession) : null;
      const companyId = session?.company_id || '';

      const res = await fetch(`/api/deal-workflow/departments-groups?companyId=${companyId}`);
      const data = await res.json();
      if (data.success) {
        setWorkflowGroups(data.groups || []);
        if (Array.isArray(data.externalGroups)) {
          setExternalGroupsState(data.externalGroups);
        }
        setGroupMembersMap(data.groupMembersMap || {});
        setAllUsers(data.users || []);

        // Read local custom departments if any
        let localDepts = [];
        try {
          const savedCustom = JSON.parse(localStorage.getItem('dms_custom_departments') || '[]');
          if (Array.isArray(savedCustom)) localDepts = savedCustom.filter(Boolean);
        } catch (e) { }

        const mergedDepts = Array.from(
          new Set([...(data.departments || []), ...localDepts])
        );
        setDepartments(mergedDepts);
        setDbGroups((data.groups || []).map((g) => g.name));
      }
    } catch (err) {
      console.error('Error loading departments and groups:', err);
    }
  };

  useEffect(() => {
    try {
      // Clear legacy dummy tasks from localStorage
      localStorage.removeItem('dms_deal_workflow_tasks_v4');

      // Sync active session user immediately
      const activeUser = readSessionUser();
      if (activeUser) {
        setSessionUser(activeUser);
      } else {
        const storedUser = localStorage.getItem('dms_deal_workflow_user_v4');
        if (storedUser && DEMO_USERS[storedUser]) {
          setCurrentUserId(storedUser);
        }
      }

      const storedAudit = localStorage.getItem('dms_deal_workflow_audit_mode_v4');
      if (storedAudit !== null) {
        setIsAuditModeActive(JSON.parse(storedAudit));
      }
    } catch (e) {
      console.error('Error loading deal workflow storage:', e);
    }

    fetchTasks(true);
    fetchDepartmentsAndGroups();
    fetchActiveStage();

    // Poll active stage and tasks every 3 seconds for seamless cross-user/session synchronization
    const syncInterval = setInterval(() => {
      fetchActiveStage();
      fetchTasks(false);
    }, 3000);

    // Listen to storage and focus events so when another user logs in, state updates immediately
    const handleStorageChange = (e) => {
      if (!e || e.key === 'vdr_session') {
        const freshUser = readSessionUser();
        setSessionUser(freshUser);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  // Save user on switch (for testing demo personas)
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

  // Logged-in session user takes absolute priority over demo fallback
  const currentUser = useMemo(() => {
    if (sessionUser && sessionUser.name) {
      return sessionUser;
    }
    if (currentUserId && DEMO_USERS[currentUserId]) {
      return DEMO_USERS[currentUserId];
    }
    return DEMO_USERS.ravi;
  }, [sessionUser, currentUserId]);

  // 2 Tracking Sections: 'ASSIGNED_TO_ME' (Tasks assigned to you by others) vs 'CREATED_BY_ME' (Tasks created by you) vs 'ALL'
  const [trackingSection, setTrackingSection] = useState(() => {
    const roleNorm = normalizeRole(currentUser?.role);
    if (roleNorm === 'super_admin') return 'CREATED_BY_ME';
    return 'ASSIGNED_TO_ME';
  });

  // Super admin only tracks created tasks; Internal user cannot create tasks and only tracks assigned tasks
  useEffect(() => {
    const roleNorm = normalizeRole(currentUser?.role);
    if (roleNorm === 'super_admin') {
      setTrackingSection('CREATED_BY_ME');
    } else if (roleNorm === 'internal_user') {
      setTrackingSection('ASSIGNED_TO_ME');
    }
  }, [currentUser?.role]);

  // Enrich sessionUser with group if known from groupMembersMap
  useEffect(() => {
    if (sessionUser?.name && groupMembersMap && Object.keys(groupMembersMap).length > 0) {
      const sName = sessionUser.name.trim().toLowerCase();
      for (const [gName, members] of Object.entries(groupMembersMap)) {
        if (Array.isArray(members) && members.some((m) => (typeof m === 'string' ? m : m.name || '').trim().toLowerCase() === sName)) {
          if (sessionUser.group !== gName) {
            setSessionUser((prev) => (prev ? { ...prev, group: gName } : prev));
          }
          break;
        }
      }
    }
  }, [groupMembersMap, sessionUser?.name]);

  // ============================================================================
  // TASK CREATOR & ASSIGNEE RECOGNITION HELPERS
  // ============================================================================
  const isTaskCreator = (task, user = currentUser) => {
    if (!task || !user) return false;
    const userName = (user.name || '').trim().toLowerCase();
    const userEmail = (user.email || '').trim().toLowerCase();
    const userId = (user.id || '').trim().toLowerCase();
    const createdBy = (task.created_by || '').trim().toLowerCase();

    if (!createdBy) return false;
    if (userName && createdBy === userName) return true;
    if (userId && createdBy === userId) return true;
    if (userEmail && createdBy === userEmail) return true;

    // Fuzzy & partial name matches (e.g. 'lakshmi' in 'Lakshmi Narayanan' or vice versa)
    const firstUserName = userName.split(' ')[0];
    const firstCreatedBy = createdBy.split(' ')[0];
    if (firstUserName && firstCreatedBy && firstUserName === firstCreatedBy) return true;
    if (userName && createdBy && (userName.includes(createdBy) || createdBy.includes(userName))) return true;

    // Email username match (e.g. 'suresh' from 'suresh@abctextiles.com' matching 'suresh')
    if (userEmail && userEmail.split('@')[0] === createdBy) return true;

    return false;
  };

  // Helper for tasks accessible/manageable in Task Creation Studio (Only tasks created by that user)
  const canManageTaskInStudio = (task, user = currentUser) => {
    if (!task || !user) return false;
    return isTaskCreator(task, user);
  };

  const isTaskAssignee = (task, user = currentUser) => {
    if (!task || !user) return false;
    const userName = (user.name || '').trim().toLowerCase();
    const userEmail = (user.email || '').trim().toLowerCase();
    const userId = (user.id || '').trim().toLowerCase();
    const userGroup = (user.group || '').trim().toLowerCase();

    const assignedToUser = (task.assigned_to_user || '').trim().toLowerCase();
    if (assignedToUser && (assignedToUser === userName || assignedToUser === userEmail || (userId !== 'session_user' && assignedToUser === userId))) {
      return true;
    }

    if (Array.isArray(task.subtasks) && task.subtasks.some((st) => {
      const stMember = (st.assignedMember || st.assigned_to_user || '').trim().toLowerCase();
      return stMember && (stMember === userName || stMember === userEmail || (userId !== 'session_user' && stMember === userId));
    })) {
      return true;
    }

    const assignedToGroup = (task.assigned_to_group || '').trim().toLowerCase();
    if (userGroup && assignedToGroup && userGroup === assignedToGroup) {
      return true;
    }

    return false;
  };

  // Task assigned to user by other users (creator excluded)
  const isAssignedByOthers = (task, user = currentUser) => {
    if (!task || !user) return false;
    if (isTaskCreator(task, user)) return false;
    return isTaskAssignee(task, user);
  };

  // ============================================================================
  // SEQUENTIAL STAGE GATING HELPERS
  // Rule: Preparation -> Due Diligence -> Negotiation.
  // 1. Preparation is unlocked initially.
  // 2. Due Diligence unlocks ONLY when ALL tasks in Preparation are completed (DONE).
  // 3. Negotiation unlocks ONLY when ALL tasks in Due Diligence are completed (DONE).
  // Assigned users only see and can only work on tasks for unlocked stages.
  // Task creators can view and oversee all stages they created to track deal room progress.
  // ============================================================================
  const getMaxUnlockedStageIndex = (tasksList = tasks) => {
    if (!tasksList || tasksList.length === 0) return 0;

    // Check Stage 0: Preparation
    const prepTasks = tasksList.filter((t) => normalizeStage(t.deal_stage) === 'Preparation');
    if (prepTasks.length > 0) {
      const isPrepDone = prepTasks.every((t) => t.status === 'DONE');
      if (!isPrepDone) {
        return 0; // Preparation has pending tasks
      }
    }

    // Preparation is complete. Check Stage 1: Due Diligence
    const ddTasks = tasksList.filter((t) => normalizeStage(t.deal_stage) === 'Due Diligence');
    if (ddTasks.length > 0) {
      const isDdDone = ddTasks.every((t) => t.status === 'DONE');
      if (!isDdDone) {
        return 1; // Due Diligence has pending tasks
      }
    }

    // Both Preparation and Due Diligence are completed!
    return 2;
  };

  const stageTrackerInfo = useMemo(() => {
    const stages = DEAL_STAGES.map((stageName, idx) => {
      // Deal-wide statistics for this stage (used for analysis shown to Super Admin)
      // Calculates all tasks created by all users for this stage across the deal room
      const dealStageTasks = tasks.filter((t) => normalizeStage(t.deal_stage) === stageName);
      const dealTotal = dealStageTasks.length;
      const dealDone = dealStageTasks.filter((t) => t.status === 'DONE').length;
      const dealPending = Math.max(0, dealTotal - dealDone);
      const isDealStageCompleted = dealTotal > 0 && dealDone === dealTotal;
      const percent = dealTotal > 0 ? Math.round((dealDone / dealTotal) * 100) : 0;

      const inProgress = dealStageTasks.filter((t) => t.status === 'IN_PROGRESS').length;
      const review = dealStageTasks.filter((t) => t.status === 'REVIEW').length;
      const todo = dealStageTasks.filter((t) => t.status === 'TO_DO').length;

      // User specific assigned tasks in this stage
      const myStageTasks = dealStageTasks.filter((t) => isTaskAssignee(t, currentUser));
      const myTotal = myStageTasks.length;
      const myDone = myStageTasks.filter((t) => t.status === 'DONE').length;
      const isMyTasksCompleted = myTotal > 0 && myDone === myTotal;

      // Stage status based on Super Admin's active stage
      const isActive = normalizeStage(stageName) === normalizeStage(activeDealStage);
      const isDisabled = !isActive;

      return {
        name: stageName,
        index: idx,
        total: dealTotal,
        done: dealDone,
        pending: dealPending,
        dealTotal,
        dealDone,
        dealPending,
        inProgress,
        review,
        todo,
        percent,
        isCompleted: isDealStageCompleted,
        isUnlocked: isActive,
        isLocked: isDisabled,
        isActive,
        isDisabled,
        myTotal,
        myDone,
        isMyTasksCompleted,
      };
    });

    const activeStage = stages.find((s) => s.isActive) || stages[0];
    const totalDealTasks = tasks.length;
    const completedDealTasks = tasks.filter((t) => t.status === 'DONE').length;
    const overallPercent = totalDealTasks > 0 ? Math.round((completedDealTasks / totalDealTasks) * 100) : 0;
    const allStagesComplete = totalDealTasks > 0 && completedDealTasks === totalDealTasks;

    return {
      stages,
      activeDealStage,
      activeStageName: activeStage.name,
      activeStageIndex: activeStage.index,
      allStagesComplete,
      totalDealTasks,
      completedDealTasks,
      overallPercent,
    };
  }, [tasks, activeDealStage, currentUser]);

  const isStageLockedForUser = (task, user = currentUser) => {
    if (!task || !user) return false;
    // Task creator is never locked out of tracking tasks they created in Task Creation
    if (isTaskCreator(task, user) && trackingSection === 'TASK_CREATION') return false;

    // A task is locked if its stage is not the currently active stage activated by Super Admin
    return normalizeStage(task.deal_stage) !== normalizeStage(activeDealStage);
  };

  // Keep selectedDealStage in sync with activeDealStage on stage switches
  useEffect(() => {
    if (activeDealStage && selectedDealStage !== activeDealStage) {
      setSelectedDealStage(activeDealStage);
    }
  }, [activeDealStage]);

  // ============================================================================
  // TASK VISIBILITY PERMISSION LOGIC
  // ============================================================================
  const isTaskVisibleToUser = (task, user = currentUser) => {
    if (!task) return false;
    if (!user) return true;

    // In Task Creation studio, show all tasks manageable in studio across ALL stages
    if (trackingSection === 'TASK_CREATION') {
      return canManageTaskInStudio(task, user);
    }

    // For live board (ASSIGNED_TO_ME and CREATED_BY_ME):
    // 1. Task MUST be enabled to appear on the live board!
    if (task.is_enabled === false) {
      return false;
    }

    // 2. Task MUST belong to the active deal stage activated by Super Admin!
    if (normalizeStage(task.deal_stage) !== normalizeStage(activeDealStage)) {
      return false;
    }

    // Creator sees their own active stage tasks
    if (isTaskCreator(task, user)) return true;

    const normRole = normalizeRole(user.role);
    // Super Admins, Admins, and Sub Admins see all tasks in active stage
    if (normRole === 'super_admin' || normRole === 'admin' || normRole === 'sub_admin') return true;

    // Assignees see tasks assigned to them or their group in active stage
    if (isTaskAssignee(task, user)) return true;

    return false;
  };

  // ============================================================================
  // DEPARTMENT -> GROUP & GROUP -> MEMBERS CASCADE HELPERS
  // ============================================================================
  const getGroupsForDepartment = (deptName, visibility) => {
    let source = workflowGroups;
    if (visibility === 'EXTERNAL') {
      source = externalGroups;
    } else if (visibility === 'INTERNAL') {
      source = workflowGroups.filter((g) => g.side !== 'buyer');
    } else {
      source = [...workflowGroups, ...externalGroups];
    }

    if (!deptName || deptName === 'ALL') {
      return Array.from(new Set(source.map((g) => g.name)));
    }
    const matched = source
      .filter((g) => (g.department || '').trim().toLowerCase() === deptName.trim().toLowerCase())
      .map((g) => g.name);
    return Array.from(new Set(matched));
  };

  const getMembersForGroup = (groupName) => {
    // Ensure groupName is a non-empty string before using string methods
    const resolvedGroupName = typeof groupName === 'string' ? groupName : (Array.isArray(groupName) ? groupName[0] : null);
    if (!resolvedGroupName) {
      const raw = allUsers.length > 0 ? allUsers.map((u) => (typeof u === 'string' ? u : u.name)) : (currentUser ? [currentUser.name] : []);
      return Array.from(new Set(raw.filter(Boolean)));
    }
    const groupName_ = resolvedGroupName;
    const membersSet = new Set();

    if (groupMembersMap[groupName_] && Array.isArray(groupMembersMap[groupName_])) {
      groupMembersMap[groupName_].forEach((m) => {
        const name = typeof m === 'string' ? m : m?.name;
        if (name) membersSet.add(name);
      });
    }

    const found = workflowGroups.find((g) => g.name === groupName_ || g.id === groupName_);
    if (found && Array.isArray(found.members)) {
      found.members.forEach((m) => {
        const name = typeof m === 'string' ? m : m?.name;
        if (name) membersSet.add(name);
      });
    }

    const foundExternal = externalGroups.find((g) => g.name === groupName_ || g.id === groupName_);
    if (foundExternal && Array.isArray(foundExternal.members)) {
      foundExternal.members.forEach((m) => {
        const name = typeof m === 'string' ? m : m?.name;
        if (name) membersSet.add(name);
      });
    }

    // Match demo users whose group name matches
    Object.values(DEMO_USERS).forEach((u) => {
      if (u.group && typeof u.group === 'string' && u.group.trim().toLowerCase() === groupName_.trim().toLowerCase()) {
        if (u.name) membersSet.add(u.name);
      }
    });

    return Array.from(membersSet);
  };

  const getMembersForDepartment = (deptName) => {
    if (!deptName || deptName === 'ALL') {
      const raw = allUsers.length > 0 ? allUsers.map((u) => (typeof u === 'string' ? u : u.name)) : (currentUser ? [currentUser.name] : []);
      return Array.from(new Set(raw.filter(Boolean)));
    }
    const groupsInDept = getGroupsForDepartment(deptName);
    const membersSet = new Set();
    groupsInDept.forEach((g) => {
      getMembersForGroup(g).forEach((m) => {
        const name = typeof m === 'string' ? m : m?.name;
        if (name) membersSet.add(name);
      });
    });
    return Array.from(membersSet);
  };

  // Base tasks permitted for the current user
  const permittedTasks = useMemo(() => {
    return tasks.filter((t) => isTaskVisibleToUser(t, currentUser));
  }, [tasks, currentUser, stageTrackerInfo, activeDealStage, trackingSection]);

  // Counts for tracking sections: Assigned to You, Created by You, Task Creation
  const trackingCounts = useMemo(() => {
    // All tasks belonging to the active deal stage are automatically enabled
    const activeStageTasks = tasks.filter((t) =>
      normalizeStage(t.deal_stage) === normalizeStage(activeDealStage)
    );

    const totalAssignedByOthers = activeStageTasks.filter((t) => isAssignedByOthers(t, currentUser)).length;
    const totalCreatedByMe = activeStageTasks.filter((t) => isTaskCreator(t, currentUser)).length;

    // Task Creation section: all tasks manageable in studio across all stages
    const taskCreationTasks = tasks.filter((t) => canManageTaskInStudio(t, currentUser));
    const totalTaskCreation = taskCreationTasks.length;

    return {
      assignedByOthers: totalAssignedByOthers,
      createdByMe: totalCreatedByMe,
      allStage: activeStageTasks.length,
      totalAssignedByOthers,
      totalCreatedByMe,
      totalTaskCreation,
      totalAll: tasks.length,
    };
  }, [tasks, activeDealStage, currentUser]);

  // Filtered tasks based on active filters
  const visibleTasks = useMemo(() => {
    return permittedTasks.filter((task) => {
      // 3 Tracking Sections: 'ASSIGNED_TO_ME' vs 'CREATED_BY_ME' vs 'TASK_CREATION'
      if (trackingSection === 'ASSIGNED_TO_ME') {
        if (!isAssignedByOthers(task, currentUser)) {
          return false;
        }
        if (normalizeStage(task.deal_stage) !== normalizeStage(activeDealStage)) {
          return false;
        }
      } else if (trackingSection === 'CREATED_BY_ME') {
        if (!isTaskCreator(task, currentUser)) {
          return false;
        }
        if (normalizeStage(task.deal_stage) !== normalizeStage(activeDealStage)) {
          return false;
        }
      } else if (trackingSection === 'TASK_CREATION') {
        if (!canManageTaskInStudio(task, currentUser)) {
          return false;
        }
      }

      // Search query filter
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

      // Department filter
      if (selectedDepartment !== 'ALL') {
        const taskDept = task.department || task.workstream || '';
        if (taskDept.toLowerCase() !== selectedDepartment.toLowerCase()) {
          return false;
        }
      }

      // Group filter
      if (selectedGroup !== 'ALL') {
        const taskGroup = task.assigned_to_group || '';
        if (taskGroup.toLowerCase() !== selectedGroup.toLowerCase()) {
          return false;
        }
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
      if (selectedDealStage !== 'ALL') {
        if (normalizeStage(task.deal_stage) !== normalizeStage(selectedDealStage)) {
          return false;
        }
      }

      // My Team
      if (teamFilter === 'MY_TEAM') {
        const isMyTeamGroup = task.assigned_to_group === currentUser.group;
        const isAssignedToMe = task.assigned_to_user === currentUser.name;
        if (!isMyTeamGroup && !isAssignedToMe) return false;
      }

      // Assignee / Member filter
      if (memberFilter === 'MY_TASKS') {
        const isTaskAssignee = task.assigned_to_user === currentUser.name;
        const isSubtaskAssignee = (task.subtasks || []).some(
          (st) => st.assignedMember === currentUser.name || st.assigned_to_user === currentUser.name
        );
        if (!isTaskAssignee && !isSubtaskAssignee) return false;
      } else if (memberFilter !== 'ALL') {
        const isTaskAssignee = task.assigned_to_user === memberFilter;
        const isSubtaskAssignee = (task.subtasks || []).some(
          (st) => st.assignedMember === memberFilter || st.assigned_to_user === memberFilter
        );
        if (!isTaskAssignee && !isSubtaskAssignee) return false;
      }

      // Due Date Filter
      if (dateFilter === 'TODAY') {
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
    selectedDepartment,
    selectedGroup,
    selectedStatus,
    selectedPriority,
    selectedVisibility,
    selectedDealStage,
    trackingSection,
    teamFilter,
    memberFilter,
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
  // SMART GROUP DROPDOWN HELPER (Includes dynamic DB groups from Groups page)
  // ============================================================================
  const getSmartGroupsForVisibility = (visibility, user = currentUser) => {
    return Array.from(new Set(workflowGroups.map((g) => g.name)));
  };

  const getTargetCompanyForVisibility = (visibility, user = currentUser) => {
    if (visibility === 'EXTERNAL') {
      return user?.side === 'seller' ? 'XYZ Capital' : (user?.company || 'ABC Textiles');
    }
    return user?.company || (user?.side === 'seller' ? 'ABC Textiles' : 'XYZ Capital');
  };

  const getTargetSideForVisibility = (visibility, user = currentUser) => {
    if (user?.side === 'seller') {
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

    // RULE 0: Stage Gated - Cannot claim if stage is locked for user
    if (isStageLockedForUser(task, user)) return false;

    // RULE 1: Task Creator CANNOT claim their own task!
    if (isTaskCreator(task, user)) return false;

    const userName = (user.name || '').trim().toLowerCase();
    const userEmail = (user.email || '').trim().toLowerCase();
    const userId = (user.id || '').trim().toLowerCase();
    const assignedToUser = (task.assigned_to_user || '').trim().toLowerCase();

    // If task was assigned to a specific user, that user can claim it
    if (assignedToUser) {
      if (assignedToUser === userName || assignedToUser === userEmail || (userId !== 'session_user' && assignedToUser === userId)) {
        return true;
      }
    }

    // Check if user is assigned to any subtask
    if (Array.isArray(task.subtasks) && task.subtasks.some((st) => {
      const stMember = (st.assignedMember || st.assigned_to_user || '').trim().toLowerCase();
      return stMember && (stMember === userName || stMember === userEmail || (userId !== 'session_user' && stMember === userId));
    })) {
      return true;
    }

    // If task has no specific assignee assigned yet:
    // Group members or same-side admin can claim
    if (!assignedToUser) {
      const isTargetSide = user.side === task.target_side || (task.visibility === 'INTERNAL' && user.side === task.creator_side);
      const isGroupMember =
        Boolean(user.group && task.assigned_to_group && user.group.trim().toLowerCase() === task.assigned_to_group.trim().toLowerCase()) ||
        Boolean(task.assigned_to_group && getMembersForGroup(task.assigned_to_group).some((m) => {
          const mStr = (typeof m === 'string' ? m : m.name || '').trim().toLowerCase();
          return mStr && (mStr === userName || mStr === userEmail || (userId !== 'session_user' && mStr === userId));
        }));
      const normRole = normalizeRole(user.role);
      const isAdmin = normRole === 'admin' || normRole === 'super_admin';

      return Boolean(isGroupMember || (isTargetSide && isAdmin));
    }

    return false;
  };

  const canUserSubmitForReview = (task, user = currentUser) => {
    if (!task || task.status !== 'IN_PROGRESS') return false;

    // RULE 0: Stage Gated - Cannot submit if stage is locked for user
    if (isStageLockedForUser(task, user)) return false;

    // RULE 2: Task creator just views the progress, CANNOT submit to review!
    if (isTaskCreator(task, user)) return false;

    const userName = (user.name || '').trim().toLowerCase();
    const assignedToUser = (task.assigned_to_user || '').trim().toLowerCase();

    // RULE: If task has subtasks, ALL subtasks must be completed by assignees before submitting to review!
    if (Array.isArray(task.subtasks) && task.subtasks.length > 0) {
      const allSubtasksDone = task.subtasks.every((st) => st.status === 'DONE');
      if (!allSubtasksDone) return false;
    }

    // Direct assignee (the claimed or assigned user)
    if (assignedToUser && assignedToUser === userName) return true;

    // Subtask assigned member (only if all subtasks are done)
    if (Array.isArray(task.subtasks) && task.subtasks.some((st) => {
      const stMember = (st.assignedMember || st.assigned_to_user || '').trim().toLowerCase();
      return stMember === userName;
    })) {
      return true;
    }

    // Group member if unassigned
    if (!assignedToUser && user.group && task.assigned_to_group && user.group.trim().toLowerCase() === task.assigned_to_group.trim().toLowerCase()) {
      return true;
    }

    return false;
  };

  const canUserApproveTask = (task, user = currentUser) => {
    if (!task || task.status !== 'REVIEW') return false;
    // Only task creator or Super Admin can approve task & mark as done
    const isCreator = isTaskCreator ? isTaskCreator(task, user) : false;
    const isSuperAdmin = normalizeRole(user?.role) === 'super_admin';
    return isCreator || isSuperAdmin;
  };

  // ============================================================================
  // HIERARCHICAL TASK DELEGATION
  // Super Admin -> Admin, Sub Admin, Internal User
  // Admin -> Sub Admin, Internal User
  // Sub Admin -> Internal User
  // ============================================================================
  const getAssignableMembersForUser = (user = currentUser) => {
    if (!user) return [];
    const userNormRole = normalizeRole(user.role);
    const allowedRoles = ROLE_HIERARCHY[userNormRole]?.canAssignTo || [];
    if (allowedRoles.length === 0) return [];

    const candidates = [];
    const seen = new Set();

    const currentUserName = (user.name || '').trim().toLowerCase();
    const currentUserEmail = (user.email || '').trim().toLowerCase();
    const currentUserId = (user.id || '').trim().toLowerCase();

    const addCandidate = (u) => {
      const name = u.name;
      if (!name || seen.has(name.toLowerCase())) return;
      // Task creator cannot assign the task to their own
      if (currentUserName && name.toLowerCase() === currentUserName) return;
      if (currentUserEmail && u.email && u.email.toLowerCase() === currentUserEmail) return;
      if (currentUserId && currentUserId !== 'session_user' && u.id && u.id.toLowerCase() === currentUserId) return;

      const targetNormRole = normalizeRole(u.role || u.dmsRole || 'internal_user');
      if (allowedRoles.includes(targetNormRole)) {
        seen.add(name.toLowerCase());
        candidates.push({
          id: u.id,
          name: u.name,
          role: targetNormRole,
          roleLabel: ROLE_HIERARCHY[targetNormRole]?.label || u.role,
          group: u.group || 'General',
          email: u.email || '',
          side: u.side || 'seller',
        });
      }
    };

    allUsers.forEach(addCandidate);
    Object.values(DEMO_USERS).forEach(addCandidate);

    return candidates.sort((a, b) => (ROLE_HIERARCHY[b.role]?.level || 0) - (ROLE_HIERARCHY[a.role]?.level || 0));
  };

  // Subordinate members for a SPECIFIC group based on Role Hierarchy (Creator excluded)
  const getAssignableMembersForGroup = (groupName, user = currentUser) => {
    if (!user || !groupName) return [];
    const userNormRole = normalizeRole(user.role);
    const allowedRoles = ROLE_HIERARCHY[userNormRole]?.canAssignTo || [];
    if (allowedRoles.length === 0) return [];

    // Cross-party delegation rule: ONLY Super Admin can assign tasks/subtasks to external buyer groups
    const isSuperAdmin = userNormRole === 'super_admin';
    const isExternalGroup = externalGroups.some(
      (eg) => (eg.name || '').trim().toLowerCase() === groupName.trim().toLowerCase()
    );
    if (isExternalGroup && !isSuperAdmin) {
      return [];
    }

    const memberNames = getMembersForGroup(groupName);
    const currentUserName = (user.name || '').trim().toLowerCase();
    const currentUserEmail = (user.email || '').trim().toLowerCase();
    const currentUserId = (user.id || '').trim().toLowerCase();

    const candidates = [];
    const seen = new Set();

    memberNames.forEach((mName) => {
      if (!mName) return;
      const cleanName = typeof mName === 'string' ? mName.trim() : (mName.name || '').trim();
      if (!cleanName) return;
      // Task creator cannot assign the task to their own
      if (currentUserName && cleanName.toLowerCase() === currentUserName) return;
      if (seen.has(cleanName.toLowerCase())) return;

      // Find user details from allUsers or DEMO_USERS
      const dbUser = allUsers.find((u) => (u.name || '').trim().toLowerCase() === cleanName.toLowerCase());
      const demoUser = Object.values(DEMO_USERS).find((u) => (u.name || '').trim().toLowerCase() === cleanName.toLowerCase());

      if (currentUserEmail && (dbUser?.email?.toLowerCase() === currentUserEmail || demoUser?.email?.toLowerCase() === currentUserEmail)) return;
      if (currentUserId && currentUserId !== 'session_user' && (dbUser?.id?.toLowerCase() === currentUserId || demoUser?.id?.toLowerCase() === currentUserId)) return;

      const rawRole = dbUser?.role || demoUser?.role || (typeof mName === 'object' ? mName.role : 'internal_user');
      const targetNormRole = normalizeRole(rawRole);

      if (allowedRoles.includes(targetNormRole)) {
        seen.add(cleanName.toLowerCase());
        candidates.push({
          id: dbUser?.id || demoUser?.id || cleanName,
          name: cleanName,
          role: targetNormRole,
          roleLabel: ROLE_HIERARCHY[targetNormRole]?.label || rawRole,
          email: dbUser?.email || demoUser?.email || '',
          group: groupName,
          side: dbUser?.side || demoUser?.side || user.side,
        });
      }
    });

    return candidates.sort((a, b) => (ROLE_HIERARCHY[b.role]?.level || 0) - (ROLE_HIERARCHY[a.role]?.level || 0));
  };

  // Action: Claim Task
  const claimTask = async (taskId) => {
    const now = new Date();
    const formattedDate = `${now.getDate()}-${now.toLocaleString('default', { month: 'short' })}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const ip = currentUser.side === 'seller' ? '192.168.1.45' : '198.51.100.42';

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
              ip,
            },
          ],
        };
      })
    );
    try {
      const res = await fetch(`/api/deal-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'claim',
          user: { name: currentUser.name, role: currentUser.role, side: currentUser.side, company: currentUser.company },
          ipAddress: ip,
        }),
      });
      const data = await res.json();
      if (data.success && data.task) {
        setTasks((prev) => prev.map((t) => (t.task_id === taskId ? data.task : t)));
        if (selectedTask?.task_id === taskId) {
          setSelectedTask(data.task);
        }
      }
    } catch (e) {
      console.error('Claim task API error:', e);
    }
  };

  // Action: Submit for Review
  const submitForReview = async (taskId) => {
    const now = new Date();
    const formattedDate = `${now.getDate()}-${now.toLocaleString('default', { month: 'short' })}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const ip = currentUser.side === 'seller' ? '192.168.1.45' : '198.51.100.42';

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
              ip,
            },
          ],
        };
      })
    );
    try {
      const res = await fetch(`/api/deal-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_review',
          user: { name: currentUser.name, role: currentUser.role, side: currentUser.side, company: currentUser.company },
          ipAddress: ip,
        }),
      });
      const data = await res.json();
      if (data.success && data.task) {
        setTasks((prev) => prev.map((t) => (t.task_id === taskId ? data.task : t)));
        if (selectedTask?.task_id === taskId) {
          setSelectedTask(data.task);
        }
      }
    } catch (e) {
      console.error('Submit review API error:', e);
    }
  };

  // Action: Approve & Complete
  const approveAndComplete = async (taskId) => {
    const target = tasks.find((t) => t.task_id === taskId);
    if (target && Array.isArray(target.subtasks) && target.subtasks.length > 0) {
      const pendingSubtasks = target.subtasks.filter((st) => st.status !== 'DONE');
      if (pendingSubtasks.length > 0) {
        alert(`Cannot mark task as Done: ${pendingSubtasks.length} subtask(s) are still pending. All assignees must complete their subtasks first.`);
        return;
      }
    }

    const now = new Date();
    const formattedDate = `${now.getDate()}-${now.toLocaleString('default', { month: 'short' })}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const ip = currentUser.side === 'seller' ? '192.168.1.12' : '10.0.4.18';

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
              ip,
            },
          ],
        };
      })
    );
    try {
      const res = await fetch(`/api/deal-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          user: { name: currentUser.name, role: currentUser.role, side: currentUser.side, company: currentUser.company },
          ipAddress: ip,
        }),
      });
      const data = await res.json();
      if (data.success && data.task) {
        setTasks((prev) => prev.map((t) => (t.task_id === taskId ? data.task : t)));
        if (selectedTask?.task_id === taskId) {
          setSelectedTask(data.task);
        }
      }
    } catch (e) {
      console.error('Approve task API error:', e);
    }
  };

  // Action: Send Back to In Progress (revisions requested)
  const sendBack = async (taskId, reason = 'Revisions requested by reviewer') => {
    const now = new Date();
    const formattedDate = `${now.getDate()}-${now.toLocaleString('default', { month: 'short' })}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const ip = currentUser.side === 'seller' ? '192.168.1.12' : '10.0.4.18';

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
              ip,
              details: reason,
            },
          ],
        };
      })
    );
    try {
      const res = await fetch(`/api/deal-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_back',
          user: { name: currentUser.name, role: currentUser.role, side: currentUser.side, company: currentUser.company },
          reason,
          ipAddress: ip,
        }),
      });
      const data = await res.json();
      if (data.success && data.task) {
        setTasks((prev) => prev.map((t) => (t.task_id === taskId ? data.task : t)));
        if (selectedTask?.task_id === taskId) {
          setSelectedTask(data.task);
        }
      }
    } catch (e) {
      console.error('Send back API error:', e);
    }
  };

  // Action: Digital Document Sign & Complete
  const signDocumentAndComplete = async (taskId, signaturePayload) => {
    const now = new Date();
    const formattedDate = `${now.getDate()}-${now.toLocaleString('default', { month: 'short' })}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const isoString = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const ip = currentUser.side === 'buyer' ? '198.51.100.42' : '192.168.1.55';

    const digitalSignature = {
      signer: currentUser.name,
      role: currentUser.role,
      timestamp: isoString,
      ip,
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
      const res = await fetch(`/api/deal-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sign_document',
          user: { name: currentUser.name, role: currentUser.role, side: currentUser.side, company: currentUser.company },
          signature: digitalSignature,
          ipAddress: digitalSignature.ip,
        }),
      });
      const data = await res.json();
      if (data.success && data.task) {
        setTasks((prev) => prev.map((t) => (t.task_id === taskId ? data.task : t)));
        if (selectedTask?.task_id === taskId) {
          setSelectedTask(data.task);
        }
      }
    } catch (e) {
      console.error('Sign document API error:', e);
    }
  };

  // Action: Create New Task
  const createTask = async (formData) => {
    try {
      const rawSession = typeof window !== 'undefined' ? localStorage.getItem('vdr_session') : null;
      const session = rawSession ? JSON.parse(rawSession) : null;
      const workspaceId = session?.active_workspace_id || null;

      const targetSide = formData.target_side || getTargetSideForVisibility(formData.visibility, currentUser);
      const targetCompany = formData.target_company || getTargetCompanyForVisibility(formData.visibility, currentUser);

      const resolvedDept = formData.department || formData.workstream || 'General';
      const taskStage = formData.deal_stage || 'Preparation';

      // Default is_enabled: if provided explicitly, use it;
      // otherwise, if the task belongs to the active stage, default to true, else false (staged)
      const isEnabled = formData.is_enabled !== undefined
        ? Boolean(formData.is_enabled)
        : (normalizeStage(taskStage) === normalizeStage(activeDealStage));

      const res = await fetch('/api/deal-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          is_enabled: isEnabled,
          department: resolvedDept,
          workstream: resolvedDept,
          workspaceId,
          creator_side: currentUser?.side || 'seller',
          creator_company: currentUser?.company || 'ABC Textiles',
          target_side: targetSide,
          target_company: targetCompany,
          created_by: currentUser?.name || formData.created_by || 'Admin',
          creator_role: currentUser?.role || formData.creator_role || 'admin',
          ipAddress: currentUser?.side === 'seller' ? '192.168.1.12' : '10.0.4.18',
        }),
      });

      const data = await res.json();
      if (data.success && data.task) {
        setTasks((prev) => [data.task, ...prev.filter((t) => t.task_id !== data.task.task_id)]);
        setIsCreateModalOpen(false);
        // Refresh tasks from DB in background to ensure all counters and relations are synced
        fetchTasks();
        return data.task;
      } else {
        console.error('Task creation API error:', data.error);
        alert(data.error || 'Failed to create task. Please try again.');
        return null;
      }
    } catch (err) {
      console.error('Error creating task via API:', err);
      alert('Error creating task: ' + (err.message || 'Network error'));
      return null;
    }
  };

  // Action: Toggle Task Enabled / Staged State (Super Admin, Admin, Sub Admin)
  const toggleTaskEnabled = async (taskId, nextEnabledState) => {
    const targetTask = tasks.find((t) => t.task_id === taskId);
    if (!targetTask) return;

    const willBeEnabled = nextEnabledState !== undefined ? Boolean(nextEnabledState) : !targetTask.is_enabled;

    // Rule: Tasks can ONLY be enabled if their stage is currently activated by Super Admin!
    if (willBeEnabled && normalizeStage(targetTask.deal_stage) !== normalizeStage(activeDealStage)) {
      alert(`Cannot enable task: '${targetTask.deal_stage}' stage is currently disabled. Wait for Super Admin to activate this stage.`);
      return;
    }

    // Optimistic local update
    setTasks((prev) =>
      prev.map((t) => (t.task_id === taskId ? { ...t, is_enabled: willBeEnabled } : t))
    );

    try {
      const res = await fetch(`/api/deal-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_enable',
          isEnabled: willBeEnabled,
          user: {
            name: currentUser?.name || 'Creator',
            role: currentUser?.role || 'admin',
            side: currentUser?.side || 'seller',
            company: currentUser?.company || '',
          },
          ipAddress: currentUser?.side === 'seller' ? '192.168.1.12' : '10.0.4.18',
        }),
      });
      const data = await res.json();
      if (data.success && data.task) {
        setTasks((prev) => prev.map((t) => (t.task_id === taskId ? data.task : t)));
        if (selectedTask?.task_id === taskId) {
          setSelectedTask(data.task);
        }
      }
    } catch (err) {
      console.error('Error toggling task enable state:', err);
    }
  };

  // Action: Update / Edit Task by Creator
  const updateTask = async (taskId, updatedData) => {
    try {
      const res = await fetch(`/api/deal-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit_task',
          ...updatedData,
          user: {
            name: currentUser?.name || 'Creator',
            role: currentUser?.role || 'admin',
            side: currentUser?.side || 'seller',
            company: currentUser?.company || '',
          },
          ipAddress: currentUser?.side === 'seller' ? '192.168.1.12' : '10.0.4.18',
        }),
      });

      const data = await res.json();
      if (data.success && data.task) {
        setTasks((prev) => prev.map((t) => (t.task_id === taskId ? data.task : t)));
        if (selectedTask?.task_id === taskId) {
          setSelectedTask(data.task);
        }
        return data.task;
      }
    } catch (err) {
      console.error('Error updating task via API:', err);
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

        // RULE: Only when ALL subtasks are complete does the main task advance to REVIEW
        const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.status === 'DONE');
        const hasIncomplete = updatedSubtasks.some((st) => st.status !== 'DONE');

        let nextStatus = t.status;
        if (allCompleted && t.status === 'IN_PROGRESS') {
          nextStatus = 'REVIEW';
        } else if (hasIncomplete && t.status === 'REVIEW') {
          nextStatus = 'IN_PROGRESS';
        }

        return {
          ...t,
          status: nextStatus,
          subtasks: updatedSubtasks,
        };
      })
    );

    setSelectedTask((prev) => {
      if (prev && prev.task_id === taskId) {
        const currentSubtasks = prev.subtasks || [];
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

        const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.status === 'DONE');
        const hasIncomplete = updatedSubtasks.some((st) => st.status !== 'DONE');

        let nextStatus = prev.status;
        if (allCompleted && prev.status === 'IN_PROGRESS') {
          nextStatus = 'REVIEW';
        } else if (hasIncomplete && prev.status === 'REVIEW') {
          nextStatus = 'IN_PROGRESS';
        }

        return {
          ...prev,
          status: nextStatus,
          subtasks: updatedSubtasks,
        };
      }
      return prev;
    });

    try {
      const res = await fetch(`/api/deal-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_subtask',
          subtaskId,
          user: { name: currentUser.name, role: currentUser.role, side: currentUser.side, company: currentUser.company },
        }),
      });
      const data = await res.json();
      if (data.success && data.task) {
        setTasks((prev) => prev.map((t) => (t.task_id === taskId ? data.task : t)));
        if (selectedTask?.task_id === taskId) {
          setSelectedTask(data.task);
        }
      }
    } catch (e) {
      console.error('Toggle subtask API error:', e);
    }
  };

  // Action: Add Scoped Comment (fully persisted to PostgreSQL backend)
  const addComment = async (taskId, text, scope = 'INTERNAL') => {
    if (!text || !text.trim()) return;
    const now = new Date();
    const formattedDate = `${now.getDate()}-${now.toLocaleString('default', { month: 'short' })} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const ip = currentUser.side === 'seller' ? '192.168.1.45' : '198.51.100.42';

    const newComment = {
      id: `comm_${Date.now()}`,
      author: currentUser.name,
      company: currentUser.company,
      scope: scope, // 'INTERNAL' or 'EXTERNAL'
      text: text.trim(),
      timestamp: formattedDate,
    };

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => {
        if (t.task_id !== taskId) return t;
        return {
          ...t,
          comments: [...(t.comments || []), newComment],
          updated_at: formattedDate,
          audit_trail: [
            ...(t.audit_trail || []),
            {
              action: `${scope} Note Added`,
              performed_by: currentUser.name,
              role: currentUser.role,
              timestamp: formattedDate,
              ip,
            },
          ],
        };
      })
    );

    // Persist to PostgreSQL backend via PATCH API
    try {
      const res = await fetch(`/api/deal-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_comment',
          text,
          scope,
          user: {
            name: currentUser.name,
            role: currentUser.role,
            side: currentUser.side,
            company: currentUser.company,
          },
          ipAddress: ip,
        }),
      });
      const data = await res.json();
      if (data.success && data.task) {
        setTasks((prev) => prev.map((t) => (t.task_id === taskId ? data.task : t)));
        if (selectedTask?.task_id === taskId) {
          setSelectedTask(data.task);
        }
      }
    } catch (e) {
      console.error('Add comment API error:', e);
    }
  };

  // Action: Delete Task (persisted to PostgreSQL backend)
  const deleteTask = async (taskId) => {
    try {
      const res = await fetch(`/api/deal-tasks/${taskId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setTasks((prev) => prev.filter((t) => t.task_id !== taskId && t.id !== taskId));
        if (selectedTask?.task_id === taskId || selectedTask?.id === taskId) {
          setSelectedTask(null);
        }
        return true;
      }
    } catch (e) {
      console.error('Delete task API error:', e);
    }
    return false;
  };


  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('ALL');
    setSelectedGroup('ALL');
    setSelectedStatus('ALL');
    setSelectedPriority('ALL');
    setSelectedVisibility('ALL');
    setTeamFilter('ALL');
    setMemberFilter('ALL');
    setDateFilter('ALL');
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    selectedDepartment !== 'ALL' ||
    selectedGroup !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedPriority !== 'ALL' ||
    selectedVisibility !== 'ALL' ||
    teamFilter !== 'ALL' ||
    memberFilter !== 'ALL' ||
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
        getGroupsForDepartment,
        getMembersForGroup,
        isTaskVisibleToUser,
        isTaskCreator,
        canManageTaskInStudio,
        isTaskAssignee,
        canUserClaimTask,
        canUserSubmitForReview,
        canUserApproveTask,
        getAssignableMembersForUser,
        getAssignableMembersForGroup,
        roleHierarchy: ROLE_HIERARCHY,
        normalizeRole,
        getRoleLabel,
        canRoleAssignTo,
        // Stage Tracker & Progression
        stageTrackerInfo,
        isStageLockedForUser,
        getMaxUnlockedStageIndex,
        dealStages: DEAL_STAGES,
        DEAL_STAGES,
        normalizeStage,
        getStageIndex,
        // Actions
        activeDealStage,
        setActiveDealStage,
        activateStage,
        stageNotification,
        dismissStageNotification,
        toggleTaskEnabled,
        claimTask,
        submitForReview,
        approveAndComplete,
        sendBack,
        signDocumentAndComplete,
        createTask,
        updateTask,
        toggleSubtask,
        addComment,
        deleteTask,
        departments,
        workflowGroups,
        externalGroups,
        buyerGroups: BUYER_GROUPS,
        allUsers,
        dbGroups,
        refreshTasks: fetchTasks,
        isLoading,
        // Filters
        searchQuery,
        setSearchQuery,
        selectedDepartment,
        setSelectedDepartment,
        selectedGroup,
        setSelectedGroup,
        getMembersForDepartment,
        selectedWorkstream: selectedDepartment,
        setSelectedWorkstream: setSelectedDepartment,
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
        memberFilter,
        setMemberFilter,
        dateFilter,
        setDateFilter,
        trackingSection,
        setTrackingSection,
        trackingCounts,
        isAssignedByOthers,
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
