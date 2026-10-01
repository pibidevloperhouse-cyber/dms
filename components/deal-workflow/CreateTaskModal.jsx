"use client";

import React, { useState, useEffect } from 'react';
import { useDealWorkflow } from './DealWorkflowContext';
import { ChevronDown, X, Lock, Globe } from 'lucide-react';
import { WORKSTREAMS, PRIORITIES, DEAL_STAGES } from './DealWorkflowContext';

const PRESET_DOCUMENTS = [
  'None',
  'NDA_Draft.pdf',
  'Audited_Financial_Statements_FY24.pdf',
  'Financial_Risk_Assessment_Checklist.pdf',
  'Material_Contracts_Summary.pdf',
  'Q2_Tax_Compliance_Certificates.pdf',
  'Working_Capital_Model_v3.xlsx',
  'DO_Policy_Certificate_Signed.pdf',
];

export default function CreateTaskModal() {
  const {
    currentUser,
    isCreateModalOpen,
    setIsCreateModalOpen,
    createTask,
    getSmartGroupsForVisibility,
  } = useDealWorkflow();

  const [title, setTitle] = useState('Sign the NDA document');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('INTERNAL');
  const [assignedGroup, setAssignedGroup] = useState('Seller Finance Team');
  const [workstream, setWorkstream] = useState('Legal');
  const [priority, setPriority] = useState('High');
  const [dealStage, setDealStage] = useState('Preparation');
  const [dueDate, setDueDate] = useState('2026-09-30');
  const [linkedDoc, setLinkedDoc] = useState('None');
  const [claimableByRole, setClaimableByRole] = useState(true);

  // Available groups dynamically computed based on currentUser + visibility
  const availableGroups = getSmartGroupsForVisibility(visibility, currentUser);

  useEffect(() => {
    if (availableGroups.length > 0 && (!assignedGroup || !availableGroups.includes(assignedGroup))) {
      setAssignedGroup(availableGroups[0]);
    }
  }, [visibility, currentUser, availableGroups, assignedGroup]);

  if (!isCreateModalOpen) return null;

  const isSeller = currentUser.side === 'seller';
  const myParty = isSeller ? 'Seller' : 'Buyer';
  const otherParty = isSeller ? 'Buyer' : 'Seller';
  const oppositeCompany = isSeller ? 'XYZ Capital' : 'ABC Textiles';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTask({
      title: title.trim(),
      description: description.trim(),
      visibility,
      assigned_to_group: assignedGroup || availableGroups[0],
      workstream,
      priority,
      deal_stage: dealStage,
      due_date: dueDate,
      linked_document: linkedDoc === 'None' ? null : linkedDoc,
      claimable_by_role: claimableByRole,
    });

    setIsCreateModalOpen(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => setIsCreateModalOpen(false)}
    >
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-[530px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-slate-800 max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-3.5 border-b border-slate-200/80 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Create New Task
          </h2>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - scrollable if viewport is very short */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5">
          
          {/* Subtitle / Attribution */}
          <div className="text-xs text-slate-500">
            Creating as <strong className="text-slate-700 font-semibold">{currentUser.name}</strong> · {currentUser.company} ({isSeller ? 'Seller' : 'Buyer'})
          </div>

          {/* Task Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sign the NDA document"
              className="w-full px-3 py-1.5 text-sm text-slate-900 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:outline-none transition-all placeholder:text-slate-400"
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
              placeholder="What needs to be done?"
              className="w-full px-3 py-1.5 text-sm text-slate-900 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:outline-none transition-all placeholder:text-slate-400 resize-y"
            />
          </div>

          {/* Row: Visibility & Assign To Group */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Visibility */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Visibility
              </label>
              <div className="relative">
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full appearance-none px-3 py-1.5 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:outline-none bg-white transition-all cursor-pointer"
                >
                  <option value="INTERNAL">Internal</option>
                  <option value="EXTERNAL">External</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Assign To Group */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assign To Group
              </label>
              <div className="relative">
                <select
                  value={assignedGroup}
                  onChange={(e) => setAssignedGroup(e.target.value)}
                  className="w-full appearance-none px-3 py-1.5 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:outline-none bg-white transition-all cursor-pointer truncate"
                >
                  {availableGroups.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Security Callout Box */}
          <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-100 text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
            {visibility === 'INTERNAL' ? (
              <>
                <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-800">Internal — visible only to {myParty}.</strong> Groups shown belong to {currentUser.company}. {oppositeCompany} will never see this task.
                </span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-purple-800">External — visible to {otherParty}.</strong> Groups shown belong to {oppositeCompany}. Opposite party will see this task and can claim it.
                </span>
              </>
            )}
          </div>

          {/* Row: Workstream & Priority */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Workstream */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Workstream
              </label>
              <div className="relative">
                <select
                  value={workstream}
                  onChange={(e) => setWorkstream(e.target.value)}
                  className="w-full appearance-none px-3 py-1.5 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:outline-none bg-white transition-all cursor-pointer"
                >
                  {WORKSTREAMS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <div className="relative">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full appearance-none px-3 py-1.5 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:outline-none bg-white transition-all cursor-pointer"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row: Deal Stage & Due Date */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Deal Stage */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deal Stage
              </label>
              <div className="relative">
                <select
                  value={dealStage}
                  onChange={(e) => setDealStage(e.target.value)}
                  className="w-full appearance-none px-3 py-1.5 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:outline-none bg-white transition-all cursor-pointer"
                >
                  {DEAL_STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:outline-none bg-white transition-all cursor-pointer font-sans"
                />
              </div>
            </div>
          </div>

          {/* Linked Document */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Linked Document
            </label>
            <div className="relative">
              <select
                value={linkedDoc}
                onChange={(e) => setLinkedDoc(e.target.value)}
                className="w-full appearance-none px-3 py-1.5 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:outline-none bg-white transition-all cursor-pointer"
              >
                {PRESET_DOCUMENTS.map((doc) => (
                  <option key={doc} value={doc}>{doc}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Checkbox: Anyone in this role can claim this task */}
          <div className="pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={claimableByRole}
                onChange={(e) => setClaimableByRole(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
              />
              <span className="text-xs font-semibold text-slate-800">
                Anyone in this role can claim this task
              </span>
            </label>
          </div>

          {/* Modal Footer with Cancel & Create Task buttons */}
          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              Create Task
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
