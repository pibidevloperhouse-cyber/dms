"use client";

import React, { useState, useRef } from 'react';
import { useDealWorkflow } from './DealWorkflowContext';
import {
  ShieldAlert,
  X,
  ArrowRight,
  FileText,
  AlertTriangle,
  Paperclip,
  Trash2,
  FileSpreadsheet,
  Tag,
} from 'lucide-react';

const SEVERITY_LEVELS = [
  {
    level: 'Critical',
    label: 'Critical',
    dotClass: 'bg-rose-500',
    activeClass: 'ring-2 ring-rose-500 bg-rose-50/90 border-rose-400 text-rose-950 font-bold shadow-xs',
  },
  {
    level: 'High',
    label: 'High',
    dotClass: 'bg-orange-500',
    activeClass: 'ring-2 ring-orange-500 bg-orange-50/90 border-orange-400 text-orange-950 font-bold shadow-xs',
  },
  {
    level: 'Medium',
    label: 'Medium',
    dotClass: 'bg-amber-500',
    activeClass: 'ring-2 ring-amber-500 bg-amber-50/90 border-amber-400 text-amber-950 font-bold shadow-xs',
  },
  {
    level: 'Low',
    label: 'Low',
    dotClass: 'bg-emerald-500',
    activeClass: 'ring-2 ring-emerald-500 bg-emerald-50/90 border-emerald-400 text-emerald-950 font-bold shadow-xs',
  },
];

function DueDiligenceRiskModalContent({ task, onClose, submitForReview }) {
  const fileInputRef = useRef(null);

  const initialCategory =
    task.category || task.department || task.workstream || 'Financial';

  const [category] = useState(initialCategory);
  const [severity, setSeverity] = useState(task.severity || task.risk_level || 'Medium');
  const [problemDescription, setProblemDescription] = useState(
    task.problem_description || task.risk_description || ''
  );
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFilesAdded = async (filesList) => {
    if (!filesList || filesList.length === 0) return;

    const readFileData = (f) =>
      new Promise((resolve) => {
        if (typeof window === 'undefined' || !(f instanceof Blob)) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(f);
      });

    const newFiles = await Promise.all(
      Array.from(filesList).map(async (f) => {
        const isSpreadsheet =
          f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv');
        const dataUrl = await readFileData(f);
        return {
          id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: f.name,
          size:
            f.size > 1024 * 1024
              ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
              : `${Math.round(f.size / 1024)} KB`,
          type: f.type || 'application/octet-stream',
          dataUrl,
          rawFile: f,
          isSpreadsheet,
        };
      })
    );

    setAttachedFiles((prev) => [...prev, ...newFiles]);
    if (errorMsg) setErrorMsg('');
  };

  const handleRemoveFile = (indexToRemove) => {
    setAttachedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!problemDescription.trim()) {
      setErrorMsg('Please enter problem description.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const formattedFilesPayload = attachedFiles.map((af) => ({
        id: af.id,
        name: af.name,
        size: af.size,
        type: af.type,
        dataUrl: af.dataUrl,
      }));

      const docReferenceString =
        attachedFiles.length > 0
          ? attachedFiles.map((f) => f.name).join(', ')
          : (task.document_reference || '');

      await submitForReview(task.task_id, {
        category,
        severity,
        problemDescription: problemDescription.trim(),
        documentReference: docReferenceString,
        files: formattedFilesPayload,
        riskLevel: severity,
        riskDescription: problemDescription.trim(),
      });
      onClose();
    } catch (err) {
      console.error('Error submitting review:', err);
      setErrorMsg('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => !isSubmitting && onClose()}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#006666]/10 text-[#006666] flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Submit Task for Review
                </h3>
                <span className="text-[10px] font-semibold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-md border border-teal-200">
                  Due Diligence
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Task ID: <span className="font-mono font-medium text-slate-700">{task.task_id}</span> · {task.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clean, Spacious Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Row 1: Category Strip (Clean & Uncrowded) */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <Tag className="w-3.5 h-3.5 text-teal-600" />
              <span>Category</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-teal-100 text-[#006666] text-xs font-bold uppercase tracking-wider border border-teal-200">
                {category}
              </span>
              <span className="text-[10px] text-slate-400">
                (Fixed)
              </span>
            </div>
          </div>

          {/* Row 2: Severity (Full Width, Spacious 4 Columns) */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-2">
              Severity <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2 w-full">
              {SEVERITY_LEVELS.map((item) => {
                const isSelected = severity === item.level;
                return (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setSeverity(item.level)}
                    className={`py-2 px-3 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      isSelected
                        ? item.activeClass
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${item.dotClass}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Problem Description (Clean & Simple) */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Problem Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={problemDescription}
              onChange={(e) => {
                setProblemDescription(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder=""
              className="w-full px-3.5 py-2.5 text-xs text-slate-800 rounded-xl border border-slate-300 hover:border-slate-400 focus:border-[#006666] focus:ring-2 focus:ring-[#006666]/10 focus:outline-none transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Row 4: Attach Document */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-800">
                Attach Document
              </label>
              <span className="text-[10px] text-slate-400">
                {attachedFiles.length > 0 ? `${attachedFiles.length} file(s) selected` : 'Optional'}
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFilesAdded(e.target.files);
                e.target.value = '';
              }}
            />

            {/* Attach Trigger */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-[#006666] bg-slate-50 hover:bg-teal-50/30 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer text-xs font-medium"
            >
              <Paperclip className="w-4 h-4 text-[#006666]" />
              <span>
                {attachedFiles.length > 0 ? 'Attach Another Document' : 'Click to Attach Document'}
              </span>
            </button>

            {/* Attached Files List */}
            {attachedFiles.length > 0 && (
              <div className="mt-2 space-y-1.5 max-h-28 overflow-y-auto pr-0.5">
                {attachedFiles.map((file, idx) => (
                  <div
                    key={file.id || idx}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-teal-50/80 border border-teal-200 text-xs text-slate-800"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {file.isSpreadsheet ? (
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-[#006666] shrink-0" />
                      )}
                      <span className="font-semibold text-slate-900 truncate">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                        ({file.size})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0 ml-1"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#006666] hover:bg-[#005252] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <span>Submit Review</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DueDiligenceRiskModal() {
  const {
    dueDiligenceReviewTask,
    setDueDiligenceReviewTask,
    submitForReview,
  } = useDealWorkflow();

  if (!dueDiligenceReviewTask) return null;

  return (
    <DueDiligenceRiskModalContent
      key={dueDiligenceReviewTask.task_id}
      task={dueDiligenceReviewTask}
      onClose={() => setDueDiligenceReviewTask(null)}
      submitForReview={submitForReview}
    />
  );
}
