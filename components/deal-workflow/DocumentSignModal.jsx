"use client";

import React, { useState, useRef } from 'react';
import { useDealWorkflow } from './DealWorkflowContext';
import { 
  X, 
  FileCheck2, 
  ShieldCheck, 
  Lock, 
  Building2, 
  Check, 
  RotateCcw, 
  FileText,
  AlertCircle
} from 'lucide-react';

export default function DocumentSignModal() {
  const {
    currentUser,
    signingModalTask,
    setSigningModalTask,
    signDocumentAndComplete,
  } = useDealWorkflow();

  const [signerName, setSignerName] = useState(currentUser.name);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [signatureMode, setSignatureMode] = useState('type'); // 'type' or 'draw'
  const [typedSignature, setTypedSignature] = useState(currentUser.name);
  const [isDrawn, setIsDrawn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  if (!signingModalTask) return null;

  const docName = signingModalTask.linked_document || 'NDA_Draft.pdf';
  const isBuyer = currentUser.side === 'buyer';

  // Canvas drawing handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
    setIsDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsDrawn(false);
  };

  const handleSign = () => {
    if (!agreementChecked) return;
    setIsSubmitting(true);

    let dataUrl = null;
    if (signatureMode === 'draw' && canvasRef.current) {
      dataUrl = canvasRef.current.toDataURL();
    }

    // Generate simulated SHA-256 hash
    const hex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const simulatedHash = `SHA256:${hex}`;

    setTimeout(() => {
      signDocumentAndComplete(signingModalTask.task_id, {
        signer: signerName,
        role: currentUser.role,
        hash: simulatedHash,
        dataUrl,
      });
      setIsSubmitting(false);
      setSigningModalTask(null);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Digital Execution Suite
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {signingModalTask.task_id}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                Review & Digitally Sign: {docName}
              </h2>
            </div>
          </div>
          <button
            onClick={() => setSigningModalTask(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700">
          
          {/* Document Preview Container (Simulated M&A Agreement) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 font-sans text-xs max-h-56 overflow-y-auto shadow-inner leading-relaxed">
            <div className="text-center pb-2 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                MUTUAL NON-DISCLOSURE AGREEMENT
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                PROJECT TITAN • TRANSACTION ROOM PROTOCOL
              </p>
            </div>

            <p>
              This Mutual Non-Disclosure Agreement (&quot;Agreement&quot;) is entered into on this <strong>24th day of September, 2026</strong>, by and between:
            </p>

            <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-lg border border-slate-200 text-[11px]">
              <div>
                <strong className="block text-slate-900">DISCLOSING PARTY:</strong>
                <span>ABC Textiles Ltd. (&quot;Seller&quot;)</span>
                <div className="text-slate-400">Represented by Ravi, Seller Admin</div>
              </div>
              <div>
                <strong className="block text-slate-900">RECEIVING PARTY:</strong>
                <span>XYZ Capital Partners LLC (&quot;Buyer&quot;)</span>
                <div className="text-slate-400">Represented by Priya Sharma, Buyer Legal Counsel</div>
              </div>
            </div>

            <p>
              <strong>1. Purpose:</strong> The parties intend to engage in confidential discussions concerning a potential M&A acquisition of ABC Textiles by XYZ Capital (&quot;Transaction&quot;). In connection therewith, each party may disclose proprietary financial statements, tax records, customer contracts, and IP data room items.
            </p>

            <p>
              <strong>2. Non-Disclosure & Non-Use:</strong> The Receiving Party shall hold all Proprietary Information in strict confidence, exercising at least the same degree of care as it uses for its own confidential property, and in no event less than reasonable care.
            </p>

            <p>
              <strong>3. Term:</strong> Confidentiality obligations shall endure for a period of twenty-four (24) months from the date of final signature verification.
            </p>
          </div>

          {/* Signer Identification & Credentials */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                Authorized Signatory
              </span>
              <p className="font-bold text-slate-900 text-sm">{currentUser.name}</p>
              <p className="text-[11px] text-slate-600">{currentUser.role} • {currentUser.company}</p>
            </div>

            <div className="text-right text-[11px] text-slate-600">
              <span className="text-slate-500 block">Captured Forensic IP:</span>
              <span className="font-mono font-bold text-blue-900">
                {currentUser.side === 'buyer' ? '198.51.100.42' : '192.168.1.55'}
              </span>
              <div className="text-[10px] text-slate-400">Browser Fingerprint: SEC-SSL-TLS1.3</div>
            </div>
          </div>

          {/* Signature Capture Mode */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800">
                Provide Digital Signature *
              </label>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setSignatureMode('type')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    signatureMode === 'type' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Type Signature
                </button>
                <button
                  type="button"
                  onClick={() => setSignatureMode('draw')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    signatureMode === 'draw' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Draw Signature
                </button>
              </div>
            </div>

            {signatureMode === 'type' ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder="Type your full legal name..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                />
                <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 flex flex-col items-center justify-center">
                  <span className="text-2xl font-serif italic text-blue-900 tracking-wide select-none">
                    {typedSignature || 'Signature Preview'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 font-mono">
                    Digitally Sealed Certificate • Project Titan
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="border border-slate-300 rounded-xl overflow-hidden bg-white relative">
                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={130}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full h-[130px] cursor-crosshair"
                  />
                  {!isDrawn && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs italic">
                      Draw your signature here with your mouse or stylus...
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Clear signature
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Legal Acknowledgement Checkbox */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreementChecked}
                onChange={(e) => setAgreementChecked(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-700 leading-snug">
                I hereby declare that I am authorized to bind <strong className="text-slate-900">{currentUser.company}</strong> to this Mutual Non-Disclosure Agreement. I agree that my digital execution has the same legal validity and enforceability as a physical signature under the ESIGN and UETA Acts.
              </span>
            </label>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Automatic transition to <strong className="text-slate-800">DONE</strong> upon signing</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSigningModalTask(null)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSign}
              disabled={!agreementChecked || isSubmitting}
              className={`px-5 py-2 rounded-lg text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 ${
                agreementChecked && !isSubmitting
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Verifying & Sealing...' : 'Digitally Sign & Complete'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
