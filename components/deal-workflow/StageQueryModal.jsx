"use client";

import React, { useState } from 'react';
import { X, AlertTriangle, Send, CheckSquare, Square, FileText } from 'lucide-react';
import { useDealWorkflow } from './DealWorkflowContext';

export default function StageQueryModal({ isOpen, onClose, stageName }) {
  const {
    currentUser,
    tasks,
    normalizeStage,
    submitStageQuery,
  } = useDealWorkflow();

  const [queryText, setQueryText] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Filter tasks belonging to this stage
  const stageTasks = (tasks || []).filter(
    (t) => normalizeStage(t.deal_stage) === normalizeStage(stageName)
  );

  const toggleTaskSelection = (taskId) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const selectAllTasks = () => {
    if (selectedTaskIds.length === stageTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(stageTasks.map((t) => t.task_id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!queryText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await submitStageQuery({
        stageName,
        queryText: queryText.trim(),
        targetTaskIds: selectedTaskIds,
      });

      if (success) {
        setQueryText('');
        setSelectedTaskIds([]);
        onClose();
      }
    } catch (err) {
      console.error('Error submitting stage query:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-[560px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-slate-800 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/60">
          <div className="flex items-center gap-2.5">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Super Admin Stage Review — Raise Query
              </h2>
              <div className="text-xs text-slate-500">
                Stage: <span className="font-semibold text-amber-900">{stageName}</span> · Results require revisions
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Query message input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              What is the query / reason results are not OK? *
            </label>
            <textarea
              rows={3}
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="e.g., Financial statements reconciliation for Q3 is incomplete, please re-upload the signed schedule and resolve discrepancies..."
              className="w-full px-3 py-2 text-xs sm:text-sm text-slate-900 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all placeholder:text-slate-400 bg-white"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              This query will be notified to the team so they know what to fix before the stage can be approved.
            </p>
          </div>

          {/* Optional Task Selection for Rework */}
          {stageTasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Select tasks that need rework (Optional):
                </label>
                <button
                  type="button"
                  onClick={selectAllTasks}
                  className="text-[11px] font-medium text-[#006666] hover:underline cursor-pointer"
                >
                  {selectedTaskIds.length === stageTasks.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 border border-slate-200 rounded-lg p-2 bg-slate-50/60">
                {stageTasks.map((t) => {
                  const isChecked = selectedTaskIds.includes(t.task_id);
                  return (
                    <div
                      key={t.task_id}
                      onClick={() => toggleTaskSelection(t.task_id)}
                      className={`flex items-start gap-2.5 p-2 rounded-md border text-xs cursor-pointer transition-colors ${isChecked
                          ? 'bg-amber-50/90 border-amber-300 text-amber-950 font-medium'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                    >
                      <div className="mt-0.5 shrink-0 text-amber-700">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] text-slate-500">{t.task_id}</span>
                          <span className="truncate">{t.title}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>Group: {t.assigned_to_group || 'General'}</span>
                          {t.assigned_to_user && <span>Assignee: {t.assigned_to_user}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Selected tasks will automatically be moved back to <strong>In Progress</strong> with your query added to their comments.
              </p>
            </div>
          )}

          {/* Footer actions */}
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
              disabled={isSubmitting || !queryText.trim()}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Sending Query...' : 'Inform Query to Team'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
