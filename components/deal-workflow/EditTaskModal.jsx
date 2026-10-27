"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useDealWorkflow } from './DealWorkflowContext';
import { ChevronDown, User, Calendar, Trash2, Paperclip, X, Users, Edit3, Plus, ShieldCheck, Globe, Folder, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { PRIORITIES, DEAL_STAGES, normalizeStage } from './DealWorkflowContext';

export default function EditTaskModal({ task, isOpen, onClose }) {
  const {
    currentUser,
    updateTask,
    departments,
    externalDepartments = [],
    workflowGroups,
    externalGroups,
    getGroupsForDepartment,
    getAssignableMembersForGroup,
    roleHierarchy,
    normalizeRole,
    getRoleLabel,
    dealFolders = [],
    fetchFolders,
  } = useDealWorkflow();

  const userSide = currentUser?.side || 'seller';
  const oppositeSide = userSide === 'buyer' ? 'seller' : 'buyer';
  const oppositeLabel = oppositeSide === 'buyer' ? 'Buyer' : 'Seller';
  const internalLabel = userSide === 'buyer' ? 'Buyer' : 'Seller';

  const isSuperAdmin = normalizeRole(currentUser?.role) === 'super_admin';

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

  // Subtask creation state
  const [isAddSubtaskModalOpen, setIsAddSubtaskModalOpen] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskDescription, setSubtaskDescription] = useState('');
  const [subtaskMember, setSubtaskMember] = useState('');
  const [subtaskPriority, setSubtaskPriority] = useState('High');
  const [subtaskDueDate, setSubtaskDueDate] = useState('');
  const [subtaskAttachments, setSubtaskAttachments] = useState([]);

  // Fetch folders from documents section when modal opens
  useEffect(() => {
    if (isOpen) {
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
        .catch((e) => console.error('Error fetching folders in edit modal:', e));
    }
  }, [isOpen, fetchFolders]);

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
    // Reset subfolder
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

  // Populate form with task details whenever task changes or modal opens
  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setVisibility(task.visibility || 'INTERNAL');
      setDepartment(task.department || task.workstream || (departments[0] || 'General'));
      setAssignedGroup(task.assigned_to_group || '');
      setAssignedMember(task.assigned_to_user || '');
      setPriority(task.priority || 'High');
      setDealStage(task.deal_stage || 'Preparation');
      setDueDate(task.due_date || '');
      setSubtasks(Array.isArray(task.subtasks) ? [...task.subtasks] : []);
      setAssignedFolderId(task.folder_id || '');
      setAssignedFolderName(task.folder_name || task.assigned_folder || '');
      setAssignedSubfolderId(task.subfolder_id || '');
      setAssignedSubfolderName(task.subfolder_name || task.assigned_subfolder || '');
    }
  }, [task, isOpen, departments]);

  // Restrict visibility: Preparation stage is strictly internal
  useEffect(() => {
    if (normalizeStage(dealStage) === 'Preparation' && visibility === 'EXTERNAL') {
      setVisibility('INTERNAL');
    }
  }, [dealStage, visibility]);

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
  // - Super Admin can assign task to: Admin, Sub Admin, Internal User groups
  // - Admin can assign task to: Sub Admin, Internal User groups
  // - Sub Admin can assign task to: Internal User groups
  const allowedGroupsForCreator = useMemo(() => {
    const isExternal = visibility === 'EXTERNAL';
    if (isExternal) {
      return Array.isArray(externalGroups) && externalGroups.length > 0
        ? externalGroups.filter((g) => (g.side || '').toLowerCase() === oppositeSide.toLowerCase() || !g.side)
        : [];
    }

    const allMySideGroups = Array.isArray(workflowGroups) && workflowGroups.length > 0
      ? workflowGroups.filter((g) => (g.side || '').toLowerCase() === userSide.toLowerCase() || !g.side)
      : [];

    const creatorRole = normalizeRole(currentUser?.role);
    const allowedRoles = roleHierarchy?.[creatorRole]?.canAssignTo || [];

    return allMySideGroups.filter((g) => {
      if (task?.assigned_to_group && g.name === task.assigned_to_group) return true;
      const gRole = resolveGroupRole(g);
      return allowedRoles.includes(gRole);
    });
  }, [visibility, externalGroups, workflowGroups, userSide, oppositeSide, currentUser?.role, roleHierarchy, task?.assigned_to_group]);

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

    const fromAllowed = allowedGroupsForCreator
      .map((g) => g.department || 'General')
      .filter(Boolean);
    const unique = Array.from(new Set(fromAllowed));
    if (task?.department && !unique.includes(task.department)) {
      unique.unshift(task.department);
    }
    return unique;
  }, [allowedGroupsForCreator, visibility, externalDepartments, task?.department]);

  // 3. Groups list dynamically reflects only allowed groups belonging to the chosen Department
  const availableGroups = useMemo(() => {
    const isExternal = visibility === 'EXTERNAL';

    let list = allowedGroupsForCreator;

    if (department && department !== 'ALL') {
      list = list.filter(
        (g) => (g.department || 'General').trim().toLowerCase() === department.trim().toLowerCase()
      );
    }

    // Always preserve currently assigned group if editing
    if (task?.assigned_to_group && !list.some((g) => g.name === task.assigned_to_group)) {
      const allGroupsPool = isExternal ? externalGroups : workflowGroups;
      const foundInPool = (allGroupsPool || []).find((g) => g.name === task.assigned_to_group);
      if (foundInPool) {
        list = [foundInPool, ...list];
      }
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
  }, [allowedGroupsForCreator, department, visibility, task?.assigned_to_group, externalGroups, workflowGroups, oppositeSide, userSide, currentUser?.company, getRoleLabel]);

  // Selected group object matching assignedGroup
  const selectedGroupObj = useMemo(() => {
    return (
      availableGroups.find((g) => g.name === assignedGroup || g.id === assignedGroup) ||
      (Array.isArray(workflowGroups) ? workflowGroups.find((g) => g.name === assignedGroup || g.id === assignedGroup) : null) ||
      null
    );
  }, [availableGroups, workflowGroups, assignedGroup]);

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
      console.error('Error rechecking folder access in edit modal:', e);
    } finally {
      setIsCheckingAccess(false);
    }
  }, [assignedFolderId, assignedSubfolderId, selectedGroupObj]);

  // Trigger real-time access verification whenever folder, subfolder, or assigned group changes
  useEffect(() => {
    if (isOpen && normalizeStage(dealStage) === 'Preparation' && assignedFolderId && selectedGroupObj?.id) {
      recheckAccess();
    }
  }, [dealStage, assignedFolderId, assignedSubfolderId, selectedGroupObj?.id, isOpen, recheckAccess]);

  // Window focus listener: auto re-check if user was in Access Control granting access
  useEffect(() => {
    const onFocus = () => {
      if (isOpen && assignedFolderId && selectedGroupObj) {
        recheckAccess();
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [isOpen, assignedFolderId, selectedGroupObj, recheckAccess]);

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

    return {
      hasAccess: hasPerm,
      folderName: assignedFolderName,
      groupName: selectedGroupObj.name,
      groupId: selectedGroupObj.id,
      accessUrl: `/documents/access?group=${selectedGroupObj.id}`,
    };
  }, [dealStage, assignedFolderId, assignedSubfolderId, assignedFolderName, selectedGroupObj, selectedMainFolder, folderPermissions, liveAccessResult]);

  // Subordinate members available for assignment strictly within assignedGroup
  const assignableMembers = useMemo(() => {
    if (!assignedGroup) return [];
    if (getAssignableMembersForGroup) {
      return getAssignableMembersForGroup(assignedGroup, currentUser);
    }
    return [];
  }, [assignedGroup, getAssignableMembersForGroup, currentUser]);

  // Sync subtask default member when modal opens
  useEffect(() => {
    if (assignableMembers.length > 0) {
      if (!subtaskMember || !assignableMembers.some((m) => m.name === subtaskMember)) {
        setSubtaskMember(assignableMembers[0].name);
      }
    } else {
      setSubtaskMember('');
    }
  }, [assignableMembers, subtaskMember, isAddSubtaskModalOpen]);

  if (!isOpen || !task) return null;

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

  const handleRemoveAttachment = (idxToRemove) => {
    setSubtaskAttachments((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleAddSubtaskSubmit = (e) => {
    if (e) e.preventDefault();
    if (!subtaskTitle.trim()) return;

    const newSubtask = {
      id: `sub_${Date.now()}`,
      title: subtaskTitle.trim(),
      description: subtaskDescription.trim(),
      assignedGroup: assignedGroup || '',
      assignedMember: subtaskMember || (assignableMembers.length > 0 ? assignableMembers[0].name : 'Unassigned'),
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

  const handleRemoveSubtask = (idxToRemove) => {
    setSubtasks((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleUpdateSubtaskMember = (subtaskId, newMember) => {
    setSubtasks((prev) =>
      prev.map((st) => (st.id === subtaskId ? { ...st, assignedMember: newMember } : st))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    // Check final assignee
    const firstAssigned = subtasks.find((st) => st.assignedMember && st.assignedMember !== 'Unassigned');
    const finalAssignee = assignedMember || firstAssigned?.assignedMember || null;

    // RULE: Task creator cannot assign to themselves
    if (finalAssignee && currentUser?.name && finalAssignee.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) {
      alert('Task creator cannot assign tasks to themselves. Please select a subordinate team member.');
      return;
    }

    const isPrep = normalizeStage(dealStage) === 'Preparation';

    // Access Validation Guard: In preparation stage, assigned group must have access to assigned folder
    if (isPrep && assignedFolderId && folderAccessStatus && !folderAccessStatus.hasAccess) {
      alert(`"${selectedGroupObj?.name || 'Assigned Group'}" does not have access to folder "${assignedFolderName}". Please grant access in the Access section before saving.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const isPrep = normalizeStage(dealStage) === 'Preparation';
      const effectiveVisibility = isPrep ? 'INTERNAL' : visibility;
      const isExternal = effectiveVisibility === 'EXTERNAL';
      const targetSide = isExternal ? (currentUser?.side === 'seller' ? 'buyer' : 'seller') : (currentUser?.side || 'seller');
      const targetCompany = isExternal ? (currentUser?.side === 'seller' ? 'XYZ Capital' : 'ABC Textiles') : (currentUser?.company || 'Company');

      await updateTask(task.task_id, {
        title: title.trim(),
        description: description.trim(),
        visibility: effectiveVisibility,
        target_side: targetSide,
        target_company: targetCompany,
        department: department || 'General',
        workstream: department || 'General',
        assigned_to_group: assignedGroup || '',
        assigned_to_user: finalAssignee,
        priority,
        deal_stage: dealStage,
        due_date: dueDate || null,
        subtasks,
        folder_id: isPrep ? (assignedFolderId || null) : null,
        folder_name: isPrep ? (assignedFolderName || null) : null,
        subfolder_id: isPrep ? (assignedSubfolderId || null) : null,
        subfolder_name: isPrep ? (assignedSubfolderName || null) : null,
        assigned_folder: isPrep ? (assignedFolderName || null) : null,
        assigned_subfolder: isPrep ? (assignedSubfolderName || null) : null,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-[540px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-slate-800 max-h-[94vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#006666] flex items-center justify-center border border-teal-200">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Edit Task Details
                </h2>
                <div className="text-xs text-slate-500">
                  Editing task <span className="font-mono font-semibold text-slate-700">{task.task_id}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
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
                placeholder="Add task details, requirements, or instructions..."
                className="w-full px-3 py-1.5 text-sm text-slate-900 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none transition-all resize-y bg-white min-h-[58px]"
              />
            </div>

            {/* Row: Visibility & Department */}
            <div className="grid grid-cols-2 gap-3.5">
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
                      const nextVis = e.target.value;
                      setVisibility(nextVis);
                      const nextIsExt = nextVis === 'EXTERNAL';
                      const nextDepts = nextIsExt
                        ? Array.from(new Set([...(externalGroups || []).filter((g) => (g.side || '').toLowerCase() === oppositeSide.toLowerCase() || !g.side).map((g) => g.department).filter(Boolean), ...(externalDepartments || [])]))
                        : Array.from(new Set([...(workflowGroups || []).filter((g) => (g.side || '').toLowerCase() === userSide.toLowerCase() || !g.side).map((g) => g.department).filter(Boolean), ...(departments || [])]));
                      if (nextDepts.length > 0 && !nextDepts.includes(department)) {
                        setDepartment(nextDepts[0]);
                      }
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
                    {availableDepartments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* External Assignment Notification Banner */}
            {visibility === 'EXTERNAL' && (
              <div className="bg-purple-50/90 border border-purple-200/90 rounded-xl p-2.5 flex items-start gap-2 text-purple-950 text-xs">
                <Globe className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Assigning to External {oppositeLabel} Group</span> — This task will be assigned across party lines to <span className="font-semibold">{oppositeSide === 'buyer' ? 'XYZ Capital (Buyer)' : 'ABC Textiles (Seller)'}</span>.
                </div>
              </div>
            )}

            {/* Row: Assign to group & Priority */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>{visibility === 'EXTERNAL' ? `Assign to ${oppositeLabel.toLowerCase()} group *` : 'Assign to group *'}</span>
                  {visibility === 'EXTERNAL' && (
                    <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 font-medium">
                      Counterparty
                    </span>
                  )}
                </label>
                <div className="relative">
                  <select
                    value={assignedGroup}
                    onChange={(e) => setAssignedGroup(e.target.value)}
                    className="w-full appearance-none px-3 py-2 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all cursor-pointer truncate"
                    required
                  >
                    {availableGroups.length === 0 ? (
                      <option value="">No {visibility === 'EXTERNAL' ? oppositeLabel.toLowerCase() : 'subordinate'} groups in department</option>
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
                              Group <strong className="font-semibold text-slate-900 underline">{selectedGroupObj.name}</strong> does not have permission to view or upload to folder <strong className="font-semibold text-slate-900 underline">{assignedSubfolderName ? `${assignedFolderName} / ${assignedSubfolderName}` : assignedFolderName}</strong>. Please grant access in the documents access section before saving.
                            </p>

                            {/* Direct Action - navigates in the SAME tab */}
                            <div className="mt-3 flex items-center">
                              <Link
                                href={folderAccessStatus?.accessUrl || `/documents/access?group=${selectedGroupObj.id}`}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#006666] hover:bg-[#005252] text-white font-semibold text-xs shadow-xs hover:shadow transition-all cursor-pointer"
                              >
                                <span>Grant Access in Access Section</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Row: Deal stage & Due date */}
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
                        const nextDepts = Array.from(new Set([...(workflowGroups || []).filter((g) => (g.side || '').toLowerCase() === userSide.toLowerCase() || !g.side).map((g) => g.department).filter(Boolean), ...(departments || [])]));
                        if (nextDepts.length > 0 && !nextDepts.includes(department)) {
                          setDepartment(nextDepts[0]);
                        }
                      }
                    }}
                    className="w-full appearance-none px-3 py-2 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all cursor-pointer"
                  >
                    {DEAL_STAGES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Due date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Subtasks Section */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Assigned Subtasks ({subtasks.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Re-assign members or add new subtask deliverables
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddSubtaskModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-[#006666] font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subtask</span>
                </button>
              </div>

              {subtasks.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                  No subtasks configured yet
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {subtasks.map((st, idx) => (
                    <div
                      key={st.id || idx}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs flex flex-col gap-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-900 truncate flex-1">
                          {st.title}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border uppercase ${
                            st.status === 'DONE' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {st.status === 'DONE' ? 'Done' : 'To Do'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubtask(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Remove subtask"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        {/* Assignee Selector for Subtask */}
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-teal-600" />
                          <select
                            value={st.assignedMember || ''}
                            onChange={(e) => handleUpdateSubtaskMember(st.id, e.target.value)}
                            className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#006666]"
                          >
                            <option value="">Unassigned</option>
                            {assignableMembers.map((m) => (
                              <option key={m.id || m.name} value={m.name}>
                                {m.name} ({m.roleLabel || m.role})
                              </option>
                            ))}
                          </select>
                        </div>

                        {st.dueDate && <span>Due {st.dueDate}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
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
                className="px-5 py-2 rounded-lg bg-[#006666] hover:bg-[#005555] text-white text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADD SUBTASK MODAL */}
      {/* ========================================================================= */}
      {isAddSubtaskModalOpen && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsAddSubtaskModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-[440px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Add Subtask
              </h3>
              <button
                type="button"
                onClick={() => setIsAddSubtaskModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubtaskSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subtask title *
                </label>
                <input
                  type="text"
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  placeholder="e.g. Verify tax filings for FY 2024"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#006666]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign To Subordinate *
                </label>
                <div className="relative">
                  <select
                    value={subtaskMember}
                    onChange={(e) => setSubtaskMember(e.target.value)}
                    className="w-full appearance-none px-3 py-2 pr-8 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#006666] bg-white cursor-pointer"
                    required
                  >
                    {assignableMembers.length === 0 ? (
                      <option value="">No subordinate members in group</option>
                    ) : (
                      assignableMembers.map((m) => (
                        <option key={m.id || m.name} value={m.name}>
                          {m.name} ({m.roleLabel || m.role})
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={subtaskPriority}
                    onChange={(e) => setSubtaskPriority(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#006666] bg-white"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due date
                  </label>
                  <input
                    type="date"
                    value={subtaskDueDate}
                    onChange={(e) => setSubtaskDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#006666] bg-white font-sans"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSubtaskModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#006666] hover:bg-[#005555] text-white text-xs font-semibold shadow-xs"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
