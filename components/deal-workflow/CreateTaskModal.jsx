"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useDealWorkflow } from './DealWorkflowContext';
import { ChevronDown, User, Calendar, Trash2, Paperclip, FileText, X, Users, Lock, Globe, Folder, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { PRIORITIES, DEAL_STAGES, normalizeStage } from './DealWorkflowContext';

export default function CreateTaskModal() {
  const {
    currentUser,
    isCreateModalOpen,
    setIsCreateModalOpen,
    createTask,
    departments,
    externalDepartments = [],
    workflowGroups,
    externalGroups,
    getGroupsForDepartment,
    getMembersForGroup,
    getAssignableMembersForGroup,
    roleHierarchy,
    normalizeRole,
    getRoleLabel,
    selectedDealStage,
    activeDealStage,
    dealFolders = [],
    fetchFolders,
  } = useDealWorkflow();

  const userSide = currentUser?.side || 'seller';
  const oppositeSide = userSide === 'buyer' ? 'seller' : 'buyer';
  const oppositeLabel = oppositeSide === 'buyer' ? 'Buyer' : 'Seller';
  const internalLabel = userSide === 'buyer' ? 'Buyer' : 'Seller';
  const userNormRole = normalizeRole(currentUser?.role);
  const isSuperAdmin = userNormRole === 'super_admin';
  const isAdminRole = userNormRole === 'admin' || isSuperAdmin;

  // Main task fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('INTERNAL');
  const [department, setDepartment] = useState('');
  const [assignedGroup, setAssignedGroup] = useState('');
  const [assignedMember, setAssignedMember] = useState('');
  const [priority, setPriority] = useState('High');
  const [dealStage, setDealStage] = useState('Preparation');
  const [dueDate, setDueDate] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Folder assignment state (for Preparation stage)
  const [assignedFolderId, setAssignedFolderId] = useState('');
  const [assignedFolderName, setAssignedFolderName] = useState('');
  const [assignedSubfolderId, setAssignedSubfolderId] = useState('');
  const [assignedSubfolderName, setAssignedSubfolderName] = useState('');
  const [localFolders, setLocalFolders] = useState([]);
  const [folderPermissions, setFolderPermissions] = useState([]);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [liveAccessResult, setLiveAccessResult] = useState(null);

  // Subtask modal state
  const [isAddSubtaskModalOpen, setIsAddSubtaskModalOpen] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskDescription, setSubtaskDescription] = useState('');
  const [subtaskMember, setSubtaskMember] = useState('');
  const [subtaskPriority, setSubtaskPriority] = useState('High');
  const [subtaskDueDate, setSubtaskDueDate] = useState('');
  const [subtaskAttachments, setSubtaskAttachments] = useState([]);
  const pendingDraftRef = React.useRef(null);

  // Restore draft when returning from Grant Access in Documents page
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? sessionStorage.getItem('deal_workflow_create_task_draft') : null;
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft) {
          pendingDraftRef.current = draft;
          if (draft.title !== undefined) setTitle(draft.title);
          if (draft.description !== undefined) setDescription(draft.description);
          if (draft.visibility !== undefined) setVisibility(draft.visibility);
          if (draft.priority !== undefined) setPriority(draft.priority);
          if (draft.dealStage !== undefined) setDealStage(draft.dealStage);
          if (draft.dueDate !== undefined) setDueDate(draft.dueDate);
          if (Array.isArray(draft.subtasks)) setSubtasks(draft.subtasks);
          if (draft.assignedFolderId !== undefined) setAssignedFolderId(draft.assignedFolderId);
          if (draft.assignedFolderName !== undefined) setAssignedFolderName(draft.assignedFolderName);
          if (draft.assignedSubfolderId !== undefined) setAssignedSubfolderId(draft.assignedSubfolderId);
          if (draft.assignedSubfolderName !== undefined) setAssignedSubfolderName(draft.assignedSubfolderName);
          if (draft.assignedMember !== undefined) setAssignedMember(draft.assignedMember);
          if (draft.department !== undefined) setDepartment(draft.department);
          if (draft.assignedGroup !== undefined) setAssignedGroup(draft.assignedGroup);

          setIsCreateModalOpen(true);
        }
      }
    } catch (e) {
      console.error('Error restoring task draft:', e);
    }
  }, [setIsCreateModalOpen]);

  // Helper to normalize dates to YYYY-MM-DD for date inputs
  const normalizeDateForInput = (dateVal) => {
    if (!dateVal) return '';
    const str = String(dateVal).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
    }
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      try {
        return parsed.toISOString().split('T')[0];
      } catch (e) {}
    }
    return '';
  };

  // Helper to resolve group's normalized role
  const resolveGroupRole = (g) => {
    if (g?.role) return normalizeRole(g.role);
    const lower = (g?.name || '').toLowerCase();
    if (lower.includes('super')) return 'super_admin';
    if (lower.includes('sub')) return 'sub_admin';
    if (lower.includes('admin')) return 'admin';
    return 'internal_user';
  };

  // 1. Candidate groups allowed for the current logged-in role based on delegation rules:
  // - Super Admin can assign task to: Admin groups ONLY
  // - Admin can assign task to: Sub Admin groups ONLY
  // - Sub Admin can assign task to: Internal User groups ONLY
  const allowedGroupsForCreator = useMemo(() => {
    const creatorRole = normalizeRole(currentUser?.role);
    const allowedRoles = roleHierarchy?.[creatorRole]?.canAssignTo || (
      creatorRole === 'super_admin' ? ['admin'] : creatorRole === 'admin' ? ['sub_admin'] : ['internal_user']
    );

    const isExternal = visibility === 'EXTERNAL';
    if (isExternal) {
      const allExt = Array.isArray(externalGroups) && externalGroups.length > 0
        ? externalGroups.filter((g) => (g.side || '').toLowerCase() === oppositeSide.toLowerCase() || !g.side)
        : [];
      return allExt.filter((g) => {
        const gRole = resolveGroupRole(g);
        return allowedRoles.includes(gRole);
      });
    }

    const allMySideGroups = Array.isArray(workflowGroups) && workflowGroups.length > 0
      ? workflowGroups.filter((g) => (g.side || '').toLowerCase() === userSide.toLowerCase() || !g.side)
      : [];

    return allMySideGroups.filter((g) => {
      const gRole = resolveGroupRole(g);
      return allowedRoles.includes(gRole);
    });
  }, [visibility, externalGroups, workflowGroups, userSide, oppositeSide, currentUser?.role, roleHierarchy]);

  // 2. Departments list strictly reflects the departments of groups allowed for this role
  const availableDepartments = useMemo(() => {
    const isExternal = visibility === 'EXTERNAL';
    if (isExternal) {
      const fromExt = allowedGroupsForCreator
        .map((g) => g.department || 'General')
        .filter(Boolean);
      const combined = Array.from(new Set([...fromExt, ...(externalDepartments || [])]));
      return combined.length > 0 ? combined : ['Finance', 'Legal', 'Operations', 'General'];
    }

    // For internal assignment: ONLY list departments that contain allowed groups for this user's role
    const fromAllowed = allowedGroupsForCreator
      .map((g) => g.department || 'General')
      .filter(Boolean);
    return Array.from(new Set(fromAllowed));
  }, [allowedGroupsForCreator, visibility, externalDepartments]);

  // 3. Groups list dynamically reflects only allowed groups belonging to the chosen Department
  const availableGroups = useMemo(() => {
    const isExternal = visibility === 'EXTERNAL';

    let list = allowedGroupsForCreator;

    if (department && department !== 'ALL') {
      list = list.filter(
        (g) => (g.department || 'General').trim().toLowerCase() === department.trim().toLowerCase()
      );
    }

    return list.map((g) => {
      const gRole = resolveGroupRole(g);
      const roleStr = getRoleLabel ? getRoleLabel(gRole) : gRole;
      const targetSide = isExternal ? oppositeSide : userSide;
      const sideText = targetSide === 'buyer' ? 'Buyer' : 'Seller';
      return {
        id: g.id || g.name,
        name: g.name,
        department: g.department || 'General',
        role: gRole,
        roleLabel: roleStr,
        isExternal,
        side: g.side || targetSide,
        company: g.company || (isExternal ? (oppositeSide === 'buyer' ? 'XYZ Capital' : 'ABC Textiles') : (currentUser?.company || 'Company')),
        displayName: isExternal
          ? `${g.name} (${roleStr}) · ${sideText} Group`
          : `${g.name} (${roleStr})`,
      };
    });
  }, [allowedGroupsForCreator, department, visibility, oppositeSide, userSide, currentUser?.company, getRoleLabel]);

  // Subordinate members available for subtask assignment strictly within assignedGroup
  const subtaskAssignableMembers = useMemo(() => {
    if (!assignedGroup) return [];
    if (getAssignableMembersForGroup) {
      return getAssignableMembersForGroup(assignedGroup, currentUser);
    }
    return [];
  }, [assignedGroup, getAssignableMembersForGroup, currentUser]);

  // Sync default department when availableDepartments or visibility change
  useEffect(() => {
    const draft = pendingDraftRef.current;
    if (draft?.department) {
      if (availableDepartments.some((d) => d.toLowerCase() === draft.department.toLowerCase())) {
        const match = availableDepartments.find((d) => d.toLowerCase() === draft.department.toLowerCase());
        setDepartment(match || draft.department);
        return;
      }
      if (availableDepartments.length === 0) return;
    }

    if (availableDepartments.length > 0) {
      if (!department || !availableDepartments.includes(department)) {
        setDepartment(availableDepartments[0]);
      }
    } else {
      setDepartment('');
    }
  }, [availableDepartments, visibility]);

  // Sync default deal stage from currently viewed board stage
  useEffect(() => {
    if (isCreateModalOpen) {
      if (selectedDealStage && selectedDealStage !== 'ALL') {
        setDealStage(selectedDealStage);
        if (normalizeStage(selectedDealStage) === 'Preparation' && visibility === 'EXTERNAL') {
          setVisibility('INTERNAL');
        }
      }
    }
  }, [isCreateModalOpen, selectedDealStage, visibility]);

  // Restrict visibility: Preparation stage is strictly internal
  useEffect(() => {
    if (normalizeStage(dealStage) === 'Preparation' && visibility === 'EXTERNAL') {
      setVisibility('INTERNAL');
    }
  }, [dealStage, visibility]);

  // Sync assigned group when availableGroups change
  useEffect(() => {
    const draft = pendingDraftRef.current;
    if (draft?.assignedGroup) {
      if (availableGroups.some((g) => g.name === draft.assignedGroup || g.id === draft.assignedGroup)) {
        setAssignedGroup(draft.assignedGroup);
        pendingDraftRef.current = null;
        try {
          sessionStorage.removeItem('deal_workflow_create_task_draft');
        } catch (e) {}
        return;
      }
      if (availableGroups.length === 0) return;
    }

    if (availableGroups.length > 0) {
      if (!assignedGroup || !availableGroups.some((g) => g.name === assignedGroup)) {
        setAssignedGroup(availableGroups[0].name);
      }
    } else {
      setAssignedGroup('');
    }
  }, [availableGroups, assignedGroup]);

  // Sync subtask member when subtaskAssignableMembers change or subtask modal opens
  useEffect(() => {
    if (subtaskAssignableMembers.length > 0) {
      if (!subtaskMember || !subtaskAssignableMembers.some((m) => m.name === subtaskMember)) {
        setSubtaskMember(subtaskAssignableMembers[0].name);
      }
    } else {
      setSubtaskMember('');
    }
  }, [subtaskAssignableMembers, subtaskMember, isAddSubtaskModalOpen]);

  // Selected group object matching assignedGroup
  const selectedGroupObj = useMemo(() => {
    return (
      availableGroups.find((g) => g.name === assignedGroup || g.id === assignedGroup) ||
      (Array.isArray(workflowGroups) ? workflowGroups.find((g) => g.name === assignedGroup || g.id === assignedGroup) : null) ||
      null
    );
  }, [availableGroups, workflowGroups, assignedGroup]);

  // Fetch folders and permissions from documents section when modal opens
  useEffect(() => {
    if (isCreateModalOpen) {
      if (fetchFolders) {
        fetchFolders();
      }
      fetch('/api/deal-workflow/folders')
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            if (Array.isArray(d.folders)) setLocalFolders(d.folders);
            if (Array.isArray(d.permissions)) setFolderPermissions(d.permissions);
          }
        })
        .catch((e) => console.error('Error fetching folders in modal:', e));
    }
  }, [isCreateModalOpen, fetchFolders]);

  const availableFolders = useMemo(() => {
    if (Array.isArray(dealFolders) && dealFolders.length > 0) {
      return dealFolders;
    }
    return localFolders;
  }, [dealFolders, localFolders]);

  const selectedMainFolder = useMemo(() => {
    return availableFolders.find((f) => f.id === assignedFolderId);
  }, [availableFolders, assignedFolderId]);

  const availableSubfolders = useMemo(() => {
    return selectedMainFolder?.subfolders || [];
  }, [selectedMainFolder]);

  const handleFolderChange = (folderId) => {
    setAssignedFolderId(folderId);
    const sel = availableFolders.find((f) => f.id === folderId);
    setAssignedFolderName(sel?.name || '');
    // Reset subfolder whenever main folder changes
    setAssignedSubfolderId('');
    setAssignedSubfolderName('');
    setLiveAccessResult(null);
  };

  const handleSubfolderChange = (subId) => {
    setAssignedSubfolderId(subId);
    const selSub = availableSubfolders.find((sf) => sf.id === subId);
    setAssignedSubfolderName(selSub?.name || '');
    setLiveAccessResult(null);
  };

  // Re-check access dynamically against backend
  const recheckAccess = useCallback(async () => {
    if (!assignedFolderId || !selectedGroupObj) return;
    setIsCheckingAccess(true);
    try {
      const targetId = assignedSubfolderId || assignedFolderId;
      const res = await fetch(
        `/api/deal-workflow/check-folder-access?groupId=${selectedGroupObj.id}&groupName=${encodeURIComponent(
          selectedGroupObj.name
        )}&folderId=${targetId}`
      );
      const data = await res.json();
      if (data.success) {
        setLiveAccessResult(data);
      }
      const folRes = await fetch('/api/deal-workflow/folders');
      const folData = await folRes.json();
      if (folData.success && Array.isArray(folData.permissions)) {
        setFolderPermissions(folData.permissions);
      }
    } catch (e) {
      console.error('Error rechecking folder access:', e);
    } finally {
      setIsCheckingAccess(false);
    }
  }, [assignedFolderId, assignedSubfolderId, selectedGroupObj]);

  // Trigger real-time access verification whenever folder, subfolder, or assigned group changes
  useEffect(() => {
    if (isCreateModalOpen && normalizeStage(dealStage) === 'Preparation' && assignedFolderId && selectedGroupObj?.id) {
      recheckAccess();
    }
  }, [dealStage, assignedFolderId, assignedSubfolderId, selectedGroupObj?.id, isCreateModalOpen, recheckAccess]);

  // Window focus listener: auto re-check if user was in Access Control granting access
  useEffect(() => {
    const onFocus = () => {
      if (isCreateModalOpen && assignedFolderId && selectedGroupObj) {
        recheckAccess();
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [isCreateModalOpen, assignedFolderId, selectedGroupObj, recheckAccess]);

  // Live access status determination
  const folderAccessStatus = useMemo(() => {
    if (normalizeStage(dealStage) !== 'Preparation' || !assignedFolderId || !selectedGroupObj) {
      return null;
    }

    const targetId = assignedSubfolderId || assignedFolderId;
    if (
      liveAccessResult &&
      liveAccessResult.folderId === targetId &&
      (liveAccessResult.groupId === selectedGroupObj.id || liveAccessResult.groupName === selectedGroupObj.name)
    ) {
      return liveAccessResult;
    }

    const hasPerm = folderPermissions.some((p) => {
      const groupMatches = p.groupId === selectedGroupObj.id;
      const folderMatches = p.folderId === targetId || (selectedMainFolder && p.folderId === selectedMainFolder.id);
      return groupMatches && folderMatches && (p.canView || p.canUpload);
    });

    const targetGroupId = selectedGroupObj?.id || selectedGroupObj?.name || '';
    return {
      hasAccess: hasPerm,
      folderName: assignedFolderName,
      groupName: selectedGroupObj.name,
      groupId: targetGroupId,
      accessUrl: `/documents/access?group=${encodeURIComponent(targetGroupId)}&returnTo=/deal-workflow`,
    };
  }, [dealStage, assignedFolderId, assignedSubfolderId, assignedFolderName, selectedGroupObj, selectedMainFolder, folderPermissions, liveAccessResult]);

  if (!isCreateModalOpen) return null;

  const isSeller = currentUser?.side === 'seller';

  const handleClose = () => {
    pendingDraftRef.current = null;
    try {
      sessionStorage.removeItem('deal_workflow_create_task_draft');
    } catch (e) {}
    setTitle('');
    setDescription('');
    setVisibility('INTERNAL');
    setDepartment(availableDepartments[0] || '');
    setAssignedGroup(availableGroups[0]?.name || '');
    setAssignedMember('');
    setAssignedFolderId('');
    setAssignedFolderName('');
    setAssignedSubfolderId('');
    setAssignedSubfolderName('');
    setLiveAccessResult(null);
    setPriority('High');
    setDealStage('Preparation');
    setDueDate('');
    setSubtasks([]);
    setSubtaskAttachments([]);
    setIsAddSubtaskModalOpen(false);
    setIsCreateModalOpen(false);
  };

  const handleGrantAccess = (e, targetUrl) => {
    e.preventDefault();
    e.stopPropagation();

    const draft = {
      title,
      description,
      visibility,
      department,
      assignedGroup,
      assignedMember,
      assignedFolderId,
      assignedFolderName,
      assignedSubfolderId,
      assignedSubfolderName,
      priority,
      dealStage,
      dueDate,
      subtasks,
    };
    try {
      sessionStorage.setItem('deal_workflow_create_task_draft', JSON.stringify(draft));
    } catch (err) {
      console.error('Failed to save draft:', err);
    }

    setIsCreateModalOpen(false);
    window.location.href = targetUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    // First assigned subordinate from subtasks if available
    const firstAssigned = subtasks.find((st) => st.assignedMember && st.assignedMember !== 'Unassigned');
    const finalAssignee = assignedMember || firstAssigned?.assignedMember || null;

    // RULE: Task creator cannot assign the task to their own
    if (finalAssignee && currentUser?.name && finalAssignee.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) {
      alert('Task creator cannot assign tasks to themselves. Please select a subordinate team member.');
      return;
    }

    const isPrep = normalizeStage(dealStage) === 'Preparation';

    // Access Validation Guard: In preparation stage, assigned group must have access to assigned folder
    if (isPrep && assignedFolderId && folderAccessStatus && !folderAccessStatus.hasAccess) {
      alert(`"${selectedGroupObj?.name || 'Assigned Group'}" does not have access to folder "${assignedFolderName}". Please grant access in the Access section before assigning this task.`);
      return;
    }

    const effectiveVisibility = isPrep ? 'INTERNAL' : visibility;
    const isStageActive = normalizeStage(dealStage) === normalizeStage(activeDealStage);
    const isExternal = effectiveVisibility === 'EXTERNAL';
    const targetSide = isExternal ? oppositeSide : userSide;
    const targetCompany = isExternal 
      ? (oppositeSide === 'buyer' ? 'XYZ Capital' : 'ABC Textiles') 
      : (currentUser?.company || 'Company');

    setIsSubmitting(true);
    try {
      const created = await createTask({
        title: title.trim(),
        description: description.trim(),
        workspaceId: currentUser?.workspaceId,
        visibility: effectiveVisibility,
        target_side: targetSide,
        target_company: targetCompany,
        creator_side: currentUser?.side || 'seller',
        creator_company: currentUser?.company || 'ABC Textiles',
        department: department || 'General',
        workstream: department || 'General',
        assigned_to_group: assignedGroup || '',
        assigned_to_user: finalAssignee,
        priority,
        deal_stage: dealStage,
        is_enabled: isStageActive,
        due_date: dueDate || null,
        subtasks: isAdminRole ? [] : subtasks,
        claimable_by_role: true,
        created_by: currentUser?.name || 'Creator',
        creator_role: currentUser?.role || 'admin',
        assigned_to_role: selectedGroupObj ? resolveGroupRole(selectedGroupObj) : 'internal_user',
        folder_id: isPrep ? (assignedFolderId || null) : null,
        folder_name: isPrep ? (assignedFolderName || null) : null,
        subfolder_id: isPrep ? (assignedSubfolderId || null) : null,
        subfolder_name: isPrep ? (assignedSubfolderName || null) : null,
        assigned_folder: isPrep ? (assignedFolderName || null) : null,
        assigned_subfolder: isPrep ? (assignedSubfolderName || null) : null,
      });

      if (created) {
        handleClose();
      }
    } catch (err) {
      console.error('Error submitting new task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newFiles = Array.from(e.target.files).map((f) => ({
      name: f.name,
      size: f.size > 1024 * 1024
        ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(f.size / 1024)} KB`,
    }));
    setSubtaskAttachments((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const handleRemoveAttachment = (indexToRemove) => {
    setSubtaskAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddSubtaskSubmit = (e) => {
    if (e) e.preventDefault();
    if (!subtaskTitle.trim()) return;

    const newSubtask = {
      id: `sub_${Date.now()}`,
      title: subtaskTitle.trim(),
      description: subtaskDescription.trim(),
      assignedGroup: assignedGroup || '',
      assignedMember: subtaskMember || (subtaskAssignableMembers.length > 0 ? subtaskAssignableMembers[0].name : 'Unassigned'),
      priority: subtaskPriority,
      dueDate: subtaskDueDate,
      attachments: subtaskAttachments,
      status: 'TO_DO',
    };

    setSubtasks((prev) => [...prev, newSubtask]);
    setSubtaskTitle('');
    setSubtaskDescription('');
    setSubtaskDueDate('');
    setSubtaskPriority('High');
    setSubtaskAttachments([]);
    setIsAddSubtaskModalOpen(false);
  };

  const handleRemoveSubtask = (indexToRemove) => {
    setSubtasks((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  if (!isCreateModalOpen) return null;
  if (normalizeRole(currentUser?.role) === 'internal_user') return null;

  return (
    <>
      {/* ========================================================================= */}
      {/* MAIN CREATE NEW TASK MODAL */}
      {/* ========================================================================= */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={handleClose}
      >
        <div
          className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-[500px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-slate-800 max-h-[94vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5">
            {/* Modal Title & Subtitle */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Create New Task
              </h2>
              <div className="text-xs text-slate-500 mt-0.5">
                Creating as <span className="font-semibold text-slate-700">{currentUser?.name || 'User'}</span> · {currentUser?.company || 'Company'} ({isSeller ? 'Seller' : 'Buyer'})
              </div>
            </div>

            {/* Task Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Task title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Complete Financial Due Diligence"
                className="w-full px-3 py-2 text-sm text-slate-900 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none transition-all placeholder:text-slate-400 bg-white"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add task details, requirements, or links..."
                className="w-full px-3 py-1.5 text-sm text-slate-900 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none transition-all resize-y bg-white min-h-[58px]"
              />
            </div>

            {/* Row 1: Deal stage & Visibility */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deal stage
                </label>
                <div className="relative">
                  <select
                    value={dealStage}
                    onChange={(e) => {
                      const nextStage = e.target.value;
                      setDealStage(nextStage);
                      if (normalizeStage(nextStage) === 'Preparation' && visibility === 'EXTERNAL') {
                        setVisibility('INTERNAL');
                      }
                    }}
                    className="w-full appearance-none px-3 py-2 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all cursor-pointer"
                  >
                    {DEAL_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s} {normalizeStage(s) === normalizeStage(activeDealStage) ? '(Active)' : '(Disabled)'}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Visibility</span>
                  {normalizeStage(dealStage) === 'Preparation' && (
                    <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200 font-medium">
                      Internal Only
                    </span>
                  )}
                </label>
                <div className="relative">
                  <select
                    value={visibility}
                    onChange={(e) => {
                      setVisibility(e.target.value);
                    }}
                    className="w-full appearance-none px-3 py-2 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all cursor-pointer"
                  >
                    <option value="INTERNAL">Internal ({currentUser?.company || `${internalLabel} Team`})</option>
                    {normalizeStage(dealStage) !== 'Preparation' && (
                      <option value="EXTERNAL">External ({oppositeLabel} Side - Counterparty)</option>
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Row 2: Department & Assign to group */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Department Field (Replaces Workstream) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {visibility === 'EXTERNAL' ? `${oppositeLabel} Department *` : 'Department *'}
                </label>
                <div className="relative">
                  <select
                    value={department}
                    onChange={(e) => {
                      const newDept = e.target.value;
                      setDepartment(newDept);
                      const inDept = allowedGroupsForCreator.filter(
                        (g) => (g.department || 'General').trim().toLowerCase() === (newDept || '').trim().toLowerCase()
                      );
                      if (inDept.length > 0) {
                        setAssignedGroup(inDept[0].name);
                      }
                    }}
                    className="w-full appearance-none px-3 py-2 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all cursor-pointer truncate"
                    required
                  >
                    {availableDepartments.length === 0 ? (
                      <option value="">No departments found</option>
                    ) : (
                      availableDepartments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Dynamic Group List based on chosen Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>{visibility === 'EXTERNAL' ? `Assign to ${oppositeLabel.toLowerCase()} group *` : 'Assign to group *'}</span>
                </label>
                <div className="relative">
                  <select
                    value={assignedGroup}
                    onChange={(e) => setAssignedGroup(e.target.value)}
                    className="w-full appearance-none px-3 py-2 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all cursor-pointer truncate"
                    required
                  >
                    {availableGroups.length === 0 ? (
                      <option value="">No {visibility === 'EXTERNAL' ? oppositeLabel.toLowerCase() : (userNormRole === 'super_admin' ? 'admin' : userNormRole === 'admin' ? 'sub admin' : 'internal user')} groups in this department</option>
                    ) : (
                      availableGroups.map((g) => (
                        <option key={g.id || g.name} value={g.name}>
                          {g.displayName}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Preparation Stage Folder Assignment: Assign folder & Assign subfolder */}
            {normalizeStage(dealStage) === 'Preparation' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Assign folder */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Folder className="w-3.5 h-3.5 text-[#006666]" />
                        <span>Assign folder *</span>
                      </span>
                      <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200 font-medium">
                        Documents
                      </span>
                    </label>
                    <div className="relative">
                      <select
                        value={assignedFolderId}
                        onChange={(e) => handleFolderChange(e.target.value)}
                        className="w-full appearance-none px-3 py-2 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all cursor-pointer truncate"
                        required={availableFolders.length > 0}
                      >
                        <option value="">-- Select Folder --</option>
                        {availableFolders.map((f) => (
                          <option key={f.id} value={f.id}>
                            📁 {f.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Assign subfolder (Optional) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Folder className="w-3.5 h-3.5 text-slate-400" />
                        <span>Assign subfolder</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Optional
                      </span>
                    </label>
                    <div className="relative">
                      <select
                        value={assignedSubfolderId}
                        onChange={(e) => handleSubfolderChange(e.target.value)}
                        disabled={!assignedFolderId || availableSubfolders.length === 0}
                        className="w-full appearance-none px-3 py-2 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all cursor-pointer truncate disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {!assignedFolderId
                            ? 'Select a main folder first'
                            : availableSubfolders.length === 0
                              ? 'No subfolders in this folder'
                              : '-- None (Entire Folder) --'}
                        </option>
                        {availableSubfolders.map((sf) => (
                          <option key={sf.id} value={sf.id}>
                            📂 {sf.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* ACCESS CHECK NOTIFICATION / WARNING */}
                {assignedFolderId && selectedGroupObj && (
                  <div className="mt-1">
                    {folderAccessStatus?.hasAccess ? (
                      /* ACCESS CONFIRMED - WHITE CARD WITH BLACK TEXT */
                      <div className="bg-white border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5 text-slate-900 text-xs shadow-xs animate-in fade-in duration-150">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">
                            <span className="text-emerald-700 font-bold">Access Confirmed:</span>
                            <span className="bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded font-mono text-[11px] border border-slate-200">
                              {selectedGroupObj.name}
                            </span>
                            <span>has access to</span>
                            <span className="font-medium underline decoration-emerald-500">
                              {assignedSubfolderName ? `${assignedFolderName} / ${assignedSubfolderName}` : assignedFolderName}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] mt-1">
                            This group can view and upload documents into this folder during the Preparation stage. Task can be assigned safely.
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* NO ACCESS - WHITE CARD WITH BLACK TEXT */
                      <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-900 shadow-xs animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm">
                                This group does not have access to this folder. Please grant access.
                              </span>
                              <span className="bg-amber-100 text-amber-900 text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
                                Access Required
                              </span>
                            </div>
                            <p className="text-slate-700 text-xs mt-1.5 leading-relaxed">
                              Group <strong className="font-semibold text-slate-900 underline">{selectedGroupObj.name}</strong> does not have permission to view or upload to folder <strong className="font-semibold text-slate-900 underline">{assignedSubfolderName ? `${assignedFolderName} / ${assignedSubfolderName}` : assignedFolderName}</strong>. Please grant access in the documents access section before assigning this task.
                            </p>

                            {/* Direct Action - navigates directly to Access Control */}
                            <div className="mt-3 flex items-center">
                              {(() => {
                                const targetGroupId = selectedGroupObj?.id || selectedGroupObj?.name || '';
                                const targetUrl = folderAccessStatus?.accessUrl || `/documents/access?group=${encodeURIComponent(targetGroupId)}&returnTo=/deal-workflow`;
                                return (
                                  <a
                                    href={targetUrl}
                                    onClick={(e) => handleGrantAccess(e, targetUrl)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#006666] hover:bg-[#005252] text-white font-semibold text-xs shadow-xs hover:shadow transition-all cursor-pointer"
                                  >
                                    <span>Grant Access in Access Section</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Row 3: Priority & Due date */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Priority
                </label>
                <div className="relative">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full appearance-none px-3 py-2 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all cursor-pointer"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Due date
                </label>
                <div className="relative flex items-center">
                  <input
                    type="date"
                    value={normalizeDateForInput(dueDate)}
                    onChange={(e) => setDueDate(e.target.value)}
                    onClick={(e) => {
                      try {
                        e.target.showPicker?.();
                      } catch (err) {}
                    }}
                    className="w-full px-3 py-2 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all font-sans cursor-pointer"
                  />
                  {dueDate && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDueDate('');
                      }}
                      className="absolute right-8 text-slate-400 hover:text-slate-600 p-1 text-xs transition-colors cursor-pointer"
                      title="Clear due date"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Informative Staging Note for Non-Active Stage Creation */}
            {normalizeStage(dealStage) !== normalizeStage(activeDealStage) && (
              <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-2.5 flex items-start gap-2 text-amber-900 text-xs">
                <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">{dealStage} is currently disabled</span> (Active stage is <span className="font-bold">{activeDealStage}</span>). This task will be saved in <span className="font-bold">Task Creation</span> and can be enabled once Super Admin activates {dealStage}.
                </div>
              </div>
            )}

            {/* Subtasks Section - Admin can only create main task for Sub Admin; Subtasks option is not available for Admin role */}
            {!isAdminRole && (
              <div className="pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">
                    Subtasks
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddSubtaskModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-medium text-xs transition-colors cursor-pointer"
                  >
                    + Add Subtask
                  </button>
                </div>

                {subtasks.length === 0 ? (
                  <p className="text-sm text-slate-500 font-normal mt-2.5">
                    No subtasks added yet
                  </p>
                ) : (
                  <div className="space-y-2 mt-3 max-h-44 overflow-y-auto pr-1">
                    {subtasks.map((st, idx) => (
                      <div
                        key={st.id || idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs hover:border-slate-300 transition-colors"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="font-semibold text-slate-900 truncate">
                            {st.title}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                            {st.assignedGroup && (
                              <span className="inline-flex items-center gap-1 text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                                <Users className="w-3 h-3 text-slate-400" />
                                {st.assignedGroup}
                              </span>
                            )}
                            {st.assignedMember && (
                              <span className="inline-flex items-center gap-1 text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold">
                                <User className="w-3 h-3 text-teal-600" />
                                {st.assignedMember}
                              </span>
                            )}
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${st.priority === 'High'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : st.priority === 'Medium'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                            >
                              {st.priority}
                            </span>
                            {st.dueDate && (
                              <span className="text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {st.dueDate}
                              </span>
                            )}
                            {st.attachments && st.attachments.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                <Paperclip className="w-3 h-3 text-slate-400" />
                                {st.attachments.length} {st.attachments.length === 1 ? 'file' : 'files'}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtask(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Remove subtask"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Footer with Cancel & Create Main Task buttons */}
            <div className="pt-4 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  (normalizeStage(dealStage) === 'Preparation' &&
                    Boolean(assignedFolderId) &&
                    folderAccessStatus &&
                    !folderAccessStatus.hasAccess)
                }
                title={
                  normalizeStage(dealStage) === 'Preparation' &&
                  Boolean(assignedFolderId) &&
                  folderAccessStatus &&
                  !folderAccessStatus.hasAccess
                    ? 'This group does not have access to this folder. Please grant access.'
                    : undefined
                }
                className="px-5 py-2 rounded-lg bg-[#006666] hover:bg-[#005252] text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Main Task</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADD SUBTASK MODAL - DYNAMIC GROUP -> MEMBERS CASCADE (Non-admin only) */}
      {/* ========================================================================= */}
      {!isAdminRole && isAddSubtaskModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsAddSubtaskModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-[490px] p-5 sm:p-6 space-y-3.5 overflow-hidden animate-in zoom-in-95 duration-150 text-slate-800 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-0.5">
              {/* Header */}
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Add Subtask
                </h2>
                <div className="text-xs text-slate-500 mt-1">
                  Parent task: <span className="font-semibold text-slate-700">{title.trim() || 'New task'}</span> · Group: <span className="font-semibold text-[#006666]">{assignedGroup || 'General'}</span>
                </div>
              </div>

              {/* Subtask Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subtask title *
                </label>
                <input
                  type="text"
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  placeholder="e.g. Prepare financial statement reconciliation"
                  className="w-full px-3 py-2 text-sm text-slate-900 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none transition-all placeholder:text-slate-400 bg-white"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={subtaskDescription}
                  onChange={(e) => setSubtaskDescription(e.target.value)}
                  placeholder="Add specific instructions for this subtask..."
                  className="w-full px-3 py-2 text-sm text-slate-900 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none transition-all resize-y bg-white min-h-[58px]"
                />
              </div>

              {/* Assign Member (Members of selected group according to role hierarchy) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Assign member *
                  </label>
                  {assignedGroup && (
                    <span className="text-[10px] font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {assignedGroup}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <select
                    value={subtaskMember}
                    onChange={(e) => setSubtaskMember(e.target.value)}
                    className="w-full appearance-none px-3 py-2 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all cursor-pointer truncate"
                    required
                  >
                    {subtaskAssignableMembers.length === 0 ? (
                      <option value="">No subordinate members available in {assignedGroup || 'group'}</option>
                    ) : (
                      subtaskAssignableMembers.map((m) => (
                        <option key={m.id || m.name} value={m.name}>
                          {m.name} ({m.roleLabel || m.role})
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {subtaskAssignableMembers.length > 0 ? (
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                    <span>
                      {roleHierarchy?.[normalizeRole(currentUser?.role)]?.desc || 'Select subordinate member in this group'}
                    </span>
                  </div>
                ) : (
                  <div className="mt-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                    <p className="font-semibold">⚠️ Cannot assign members in {assignedGroup || 'this group'}</p>
                    <p className="mt-0.5">
                      {roleHierarchy?.[normalizeRole(currentUser?.role)]?.desc || 'You can only assign to lower roles.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Row: Priority & Due Date */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <div className="relative">
                    <select
                      value={subtaskPriority}
                      onChange={(e) => setSubtaskPriority(e.target.value)}
                      className="w-full appearance-none px-3 py-2 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all cursor-pointer"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due date
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="date"
                      value={normalizeDateForInput(subtaskDueDate)}
                      onChange={(e) => setSubtaskDueDate(e.target.value)}
                      onClick={(e) => {
                        try {
                          e.target.showPicker?.();
                        } catch (err) {}
                      }}
                      className="w-full px-3 py-2 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all font-sans cursor-pointer"
                    />
                    {subtaskDueDate && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSubtaskDueDate('');
                        }}
                        className="absolute right-8 text-slate-400 hover:text-slate-600 p-1 text-xs transition-colors cursor-pointer"
                        title="Clear due date"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Attachments Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Attachments
                </label>
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    id="subtask-file-upload"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="subtask-file-upload"
                    className="flex items-center justify-between w-full px-3 py-2 text-xs text-slate-600 rounded-lg border border-dashed border-slate-300 hover:border-[#006666] bg-slate-50/70 hover:bg-slate-50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-slate-400 group-hover:text-[#006666] transition-colors" />
                      <span className="font-medium text-slate-600 group-hover:text-slate-800">
                        Attach documents or files
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium px-2 py-0.5 rounded bg-white border border-slate-200 shadow-2xs group-hover:border-[#006666]/40 transition-colors">
                      Browse
                    </span>
                  </label>
                </div>

                {/* Attached Files List */}
                {subtaskAttachments.length > 0 && (
                  <div className="mt-2 space-y-1.5 max-h-24 overflow-y-auto pr-0.5">
                    {subtaskAttachments.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-[#006666] shrink-0" />
                          <span className="truncate font-medium text-slate-800 max-w-[240px]">
                            {file.name}
                          </span>
                          {file.size && (
                            <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                              ({file.size})
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Remove file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer with Cancel & Add Subtask buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddSubtaskModalOpen(false)}
                className="px-5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddSubtaskSubmit}
                className="px-5 py-2 rounded-lg bg-[#006666] hover:bg-[#005252] text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
              >
                Add Subtask
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
