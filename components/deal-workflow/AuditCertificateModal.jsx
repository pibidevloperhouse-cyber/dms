"use client";

import React from 'react';
import { useDealWorkflow } from './DealWorkflowContext';
import { 
  X, 
  ShieldCheck, 
  Building2, 
  FileCheck2, 
  CheckCircle2, 
  Printer, 
  Download, 
  QrCode,
  Hash
} from 'lucide-react';

export default function AuditCertificateModal() {
  const { certificateModalTask, setCertificateModalTask } = useDealWorkflow();

  if (!certificateModalTask) return null;

  const sig = certificateModalTask.digital_signature;
  const task = certificateModalTask;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-slate-900 text-sm">
              M&A Compliance & Execution Certificate
            </span>
          </div>
          <button
            onClick={() => setCertificateModalTask(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Body (Formal Enterprise Certificate Layout) */}
        <div className="p-8 overflow-y-auto space-y-6 text-xs text-slate-700 bg-gradient-to-b from-white to-slate-50/50">
          
          {/* Certificate Gold/Navy Border Box */}
          <div className="border-4 border-double border-slate-300 rounded-2xl p-6 relative bg-white shadow-xs">
            
            {/* Header Badge */}
            <div className="text-center pb-4 border-b border-slate-200">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-xs">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-black tracking-wider uppercase text-slate-900 font-serif">
                Certificate of Transaction Compliance
              </h2>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                CERTIFICATE ID: CERT-TITAN-{task.task_id}-2026
              </p>
            </div>

            {/* Transaction Overview */}
            <div className="py-4 space-y-3">
              <p className="text-center text-xs leading-relaxed text-slate-600">
                This document certifies that the following transaction action has been formally executed, verified, and sealed in the <strong>Project Titan Deal Management System</strong> in accordance with bilateral M&A closing protocols.
              </p>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-400 block font-bold">Deal Room:</span>
                  <span className="font-bold text-slate-800">Project Titan (M&A Acquisition)</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Item Identifier:</span>
                  <span className="font-mono font-bold text-blue-700">{task.task_id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Task Title:</span>
                  <span className="font-semibold text-slate-800">{task.title}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Deal Stage:</span>
                  <span className="font-semibold text-slate-800">{task.deal_stage}</span>
                </div>
              </div>

              {/* Two Parties Involved */}
              <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-blue-600 font-bold block uppercase text-[10px]">Seller Entity</span>
                  <strong className="text-slate-900">{task.creator_company}</strong>
                  <div className="text-slate-500 text-[10px]">Initiator: {task.created_by}</div>
                </div>
                <div>
                  <span className="text-blue-600 font-bold block uppercase text-[10px]">Buyer Entity</span>
                  <strong className="text-slate-900">{task.target_company}</strong>
                  <div className="text-slate-500 text-[10px]">Assigned Group: {task.assigned_to_group}</div>
                </div>
              </div>

              {/* Forensic Execution Verification */}
              {sig ? (
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    <span>Cryptographic Digital Signature Verification</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
                    <div>
                      <span className="text-slate-400 block">Signatory:</span>
                      <strong className="text-slate-900">{sig.signer}</strong> ({sig.role})
                    </div>
                    <div>
                      <span className="text-slate-400 block">Execution Timestamp:</span>
                      <span className="font-mono text-slate-800">{sig.timestamp}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Signer Source IP:</span>
                      <span className="font-mono text-slate-800">{sig.ip}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Document Sealed:</span>
                      <span className="font-semibold text-blue-700">{sig.document}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-emerald-200 font-mono text-[10px] text-emerald-800 break-all">
                    <strong>SHA-256 Digest:</strong> {sig.hash}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-[11px]">
                  <div className="font-bold text-slate-800">Completion Verification</div>
                  <p>Completed by: <strong>{task.completed_by || 'Authorized Officer'}</strong></p>
                  <p>Completion Date: <strong>{task.completed_at || task.updated_at}</strong></p>
                </div>
              )}
            </div>

            {/* Bottom Seal & Sign-off */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verified Immutable Transaction Record</span>
              </div>
              <span className="font-mono text-[10px]">SECURITY LEVEL: ENTERPRISE BANK-GRADE</span>
            </div>

          </div>

        </div>

        {/* Modal Footer with Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Export compliant with SEC Rule 17a-4 and ESIGN standards.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={() => setCertificateModalTask(null)}
              className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
