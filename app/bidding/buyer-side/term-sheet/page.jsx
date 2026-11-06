"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  FileText,
  Check,
  Download,
  PenTool,
  ShieldCheck,
  Clock,
  MessageSquare
} from 'lucide-react';
import BiddingHeaderNav from '@/components/bidding/BiddingHeaderNav';

export default function BuyerTermSheetPage() {
  const [loading, setLoading] = useState(true);
  const [termSheet, setTermSheet] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signerName, setSignerName] = useState('Naga raj');

  const commentsEndRef = useRef(null);
  const prevCommentCountRef = useRef(0);
  const isFirstCommentsLoadRef = useRef(true);

  const fetchTermSheet = async () => {
    try {
      try {
        const raw = localStorage.getItem('vdr_session');
        if (raw) {
          const user = JSON.parse(raw);
          if (user.name) setSignerName(user.name);
        }
      } catch (e) {}

      const res = await fetch('/api/bidding/term-sheet');
      if (res.ok) {
        const data = await res.json();
        if (data.termSheet) {
          setTermSheet(data.termSheet);
          if (data.termSheet.counselComments) {
            setComments((prev) => {
              if (JSON.stringify(prev) === JSON.stringify(data.termSheet.counselComments)) {
                return prev;
              }
              return data.termSheet.counselComments;
            });
          }
        }
      }
    } catch (e) {
      console.error('Error fetching term sheet:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch('/api/bidding/term-sheet/comments');
      if (res.ok) {
        const data = await res.json();
        if (data.comments && Array.isArray(data.comments)) {
          setComments((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(data.comments)) {
              return prev;
            }
            return data.comments;
          });
        }
      }
    } catch (e) {
      console.error('Error fetching comments:', e);
    }
  };

  useEffect(() => {
    fetchTermSheet();
  }, []);

  useEffect(() => {
    fetchComments();
    const interval = setInterval(fetchComments, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (comments.length === 0) return;
    if (isFirstCommentsLoadRef.current) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'auto' });
      isFirstCommentsLoadRef.current = false;
      prevCommentCountRef.current = comments.length;
    } else if (comments.length > prevCommentCountRef.current) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      prevCommentCountRef.current = comments.length;
    }
  }, [comments.length]);

  const handleAddComment = async (e) => {
    if (e && e.key && (e.key !== 'Enter' || e.shiftKey)) return;
    if (e && e.preventDefault) e.preventDefault();
    if (!newComment.trim() || isSendingComment) return;

    const textToSend = newComment.trim();
    setNewComment('');
    setIsSendingComment(true);

    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString('en-US', { month: 'short' });
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const formattedTimestamp = `${day} ${month}, ${time}`;

    const optimisticComment = {
      id: `c-opt-${Date.now()}`,
      sender: `${signerName} (Buyer)`,
      role: 'guest_admin',
      avatar: 'BA',
      message: textToSend,
      timestamp: formattedTimestamp
    };

    setComments((prev) => [...prev, optimisticComment]);

    try {
      const res = await fetch('/api/bidding/term-sheet/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: `${signerName} (Buyer)`,
          role: 'guest_admin',
          avatar: 'BA',
          message: textToSend
        })
      });
      if (res.ok) {
        fetchComments();
      }
    } catch (e) {
      console.error('Error posting comment:', e);
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleExecuteSign = async () => {
    setIsSigning(true);
    try {
      const res = await fetch('/api/bidding/term-sheet/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerRole: 'guest_admin',
          signerName: signerName || 'Naga raj'
        })
      });
      if (res.ok) {
        alert('Term Sheet executed & digitally signed successfully! Seller Board has been notified.');
        setShowSignModal(false);
        await fetchTermSheet();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('bid_submitted'));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSigning(false);
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  if (loading || !termSheet) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#F8F9FB]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#006666] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading Binding Term Sheet...</p>
        </div>
      </div>
    );
  }

  const keyTerms = termSheet.keyTerms || {};
  const changed = termSheet.changedFields || {};
  const isBuyerSigned = Boolean(
    termSheet.signatures?.buyer ||
    termSheet.status === 'signed' ||
    termSheet.status === 'signed_by_buyer' ||
    termSheet.status === 'executed'
  );

  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans min-h-screen antialiased pb-16">
      {/* Top Bidding Navigation Tabs */}
      <BiddingHeaderNav portal="buyer" activeTab="term-sheet" />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col gap-6">

        {/* 1. CLEAN HEADER & ACTION BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 m-0">
                Term Sheet — {termSheet.dealName || 'Project Alpha'}
              </h1>
              {isBuyerSigned ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  Signed by Buyer
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  <Clock className="w-3.5 h-3.5" />
                  Pending Buyer Signature
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-normal">
              {termSheet.version || 'Draft v1 · Formulated'} · Last updated {termSheet.lastUpdated || 'Today'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download PDF</span>
            </button>

            {!isBuyerSigned ? (
              <button
                onClick={() => setShowSignModal(true)}
                className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-bold text-white bg-[#006666] hover:bg-[#005252] border border-teal-700/50 transition-colors shadow-xs"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Execute & Sign Term Sheet</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Fully Executed</span>
              </span>
            )}
          </div>
        </div>

        {/* 2. DETAILED KEY TERMS DOSSIER & COUNSEL REDLINES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Key Terms Table (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-700" />
                <h2 className="text-sm font-bold text-slate-900 m-0">Negotiated Legal & Commercial Clauses</h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">Redlines Highlighted</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              
              {/* Purchase Price */}
              <div className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/40 transition-colors">
                <div className="w-44 shrink-0 font-bold text-slate-600">Purchase Price</div>
                <div className="flex-1 font-semibold text-slate-900 flex items-center gap-2">
                  <span>{keyTerms.purchasePrice || '$10,000,000'}</span>
                  {changed.purchasePrice && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                      Agreed Revision
                    </span>
                  )}
                </div>
              </div>

              {/* Consideration Structure */}
              <div className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/40 transition-colors">
                <div className="w-44 shrink-0 font-bold text-slate-600">Consideration Structure</div>
                <div className="flex-1 font-semibold text-slate-900">
                  {keyTerms.structure || '70% Cash at Closing, 30% Common Stock'}
                </div>
              </div>

              {/* Expected Closing Date */}
              <div className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/40 transition-colors">
                <div className="w-44 shrink-0 font-bold text-slate-600">Expected Closing Date</div>
                <div className="flex-1 font-semibold text-slate-900">
                  {keyTerms.expectedClose || '15 December 2026'}
                </div>
              </div>

              {/* Exclusivity Period */}
              <div className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/40 transition-colors">
                <div className="w-44 shrink-0 font-bold text-slate-600">Exclusivity Period</div>
                <div className="flex-1 font-semibold text-slate-900 flex items-center gap-2">
                  <span>{keyTerms.exclusivityPeriod || '45 days from execution'}</span>
                  {changed.exclusivityPeriod && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                      Modified
                    </span>
                  )}
                </div>
              </div>

              {/* Key Employee Retention */}
              <div className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/40 transition-colors">
                <div className="w-44 shrink-0 font-bold text-slate-600">Key Employee Retention</div>
                <div className="flex-1 font-semibold text-slate-900">
                  {keyTerms.keyEmployeeRetention || 'Minimum 2-year service agreement for C-suite and technical leads'}
                </div>
              </div>

              {/* Escrow Holdback */}
              <div className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/40 transition-colors">
                <div className="w-44 shrink-0 font-bold text-slate-600">Indemnity Escrow</div>
                <div className="flex-1 font-semibold text-slate-900">
                  {keyTerms.escrow || '10% of total purchase price deposited in escrow agent account for 18 months'}
                </div>
              </div>

              {/* Regulatory Conditions */}
              <div className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/40 transition-colors">
                <div className="w-44 shrink-0 font-bold text-slate-600">Regulatory & Approvals</div>
                <div className="flex-1 font-semibold text-slate-900">
                  {keyTerms.regulatoryConditions || 'Standard antitrust & merger approval clearances without material divestiture'}
                </div>
              </div>

              {/* Governing Law */}
              <div className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/40 transition-colors">
                <div className="w-44 shrink-0 font-bold text-slate-600">Governing Law</div>
                <div className="flex-1 font-semibold text-slate-900">
                  {keyTerms.governingLaw || 'State of Delaware, United States'}
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Counsel Notes & Comments (1 col) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900 m-0">Legal Counsel Redlines</h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                {comments.length} notes
              </span>
            </div>

            {/* Comment Thread */}
            <div className="p-4 flex-1 flex flex-col gap-3 min-h-[260px] max-h-[380px] overflow-y-auto bg-[#FAFBFD]">
              {comments.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No redline comments yet. Legal counsel can annotate clauses here.
                </div>
              ) : (
                comments.map((c, i) => (
                  <div key={c.id || `bc-${i}-${c.timestamp || ''}`} className="p-3 bg-white border border-slate-200/90 rounded-xl shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-800">{c.sender}</span>
                      <span className="text-[10px] text-slate-400">{c.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed m-0">{c.message}</p>
                  </div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Comment Input */}
            <div className="p-3.5 bg-white border-t border-slate-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={handleAddComment}
                  placeholder="Annotate for buyer counsel..."
                  className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#006666] outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={isSendingComment || !newComment.trim()}
                  className="text-xs font-bold px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
                >
                  {isSendingComment ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* DIGITAL SIGNATURE EXECUTION MODAL */}
      {showSignModal && (
        <div className="fixed inset-0 bg-[#0f172a]/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#006666]">
                <PenTool className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 m-0">Execute Binding Term Sheet</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Deal: <strong>{termSheet.dealName || 'Project Alpha'}</strong> · Target Value: <strong>{keyTerms.purchasePrice || '$10,000,000'}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
              By digitally signing below, the Buyer acknowledges acceptance of all core clauses outlined in this Term Sheet. This document creates a binding exclusivity and due diligence obligation.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Signatory Full Legal Name
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#006666] focus:ring-1 focus:ring-[#006666]/30"
                />
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Cryptographic Digital Signature Preview</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">SHA-256 Validated</span>
                </div>
                <div className="font-serif italic text-2xl text-slate-900 py-3 border-b border-slate-200">
                  {signerName || 'Naga raj'}
                </div>
                <div className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
                  <span>Role: Buyer Lead Principal</span>
                  <span>Date: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowSignModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSign}
                disabled={isSigning || !signerName.trim()}
                className="px-5 py-2 bg-[#006666] hover:bg-[#005252] text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSigning ? 'Executing...' : 'Confirm & Legally Sign'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
