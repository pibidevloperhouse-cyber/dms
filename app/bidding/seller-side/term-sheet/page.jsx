"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  FileText,
  Send,
  Save,
  ShieldCheck,
  Clock,
  MessageSquare
} from 'lucide-react';
import BiddingHeaderNav from '@/components/bidding/BiddingHeaderNav';

export default function SellerTermSheetPage() {
  const [loading, setLoading] = useState(true);
  const [termSheet, setTermSheet] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('Vishwa Raj');
  const [keyTerms, setKeyTerms] = useState({
    purchasePrice: '$10.0M',
    structure: '70% Cash, 30% Common Stock',
    expectedClose: '15 Dec 2026',
    exclusivityPeriod: '45 days',
    keyEmployeeRetention: '2-year lock-in for critical engineers',
    escrow: '10% holdback for 12 months',
    regulatoryConditions: 'Antitrust clearance in primary operating markets',
    governingLaw: 'Delaware, USA'
  });
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const commentsEndRef = useRef(null);
  const prevCommentCountRef = useRef(0);
  const isFirstCommentsLoadRef = useRef(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('vdr_session');
      if (raw) {
        const user = JSON.parse(raw);
        if (user?.name) setCurrentUserName(user.name);
      }
    } catch (_) {}
  }, []);

  const fetchTermSheet = async () => {
    try {
      const res = await fetch('/api/bidding/term-sheet');
      if (res.ok) {
        const data = await res.json();
        if (data.termSheet) {
          setTermSheet(data.termSheet);
          if (data.termSheet.keyTerms) setKeyTerms(data.termSheet.keyTerms);
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
      console.error('Error fetching counsel comments:', e);
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

  const handleTermChange = (field, value) => {
    setKeyTerms(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/bidding/term-sheet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_DRAFT',
          keyTerms,
          requesterRole: 'super_admin'
        })
      });
      if (res.ok) {
        alert('Term sheet draft saved successfully.');
        fetchTermSheet();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendToBuyer = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/bidding/term-sheet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SEND_TO_BUYER',
          keyTerms,
          requesterRole: 'super_admin'
        })
      });
      if (res.ok) {
        alert('Term sheet transmitted to buyer for review & signature!');
        await fetchTermSheet();
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('dms_termsheet_updated', Date.now().toString());
          } catch (_) {}
          window.dispatchEvent(new Event('bid_submitted'));
          window.dispatchEvent(new Event('storage'));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComment = async (e) => {
    if (e && e.key && (e.key !== 'Enter' || e.shiftKey)) return;
    if (e && e.preventDefault) e.preventDefault();
    if (!newComment.trim() || isPostingComment) return;

    const textToSend = newComment.trim();
    setNewComment('');
    setIsPostingComment(true);

    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString('en-US', { month: 'short' });
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const formattedTimestamp = `${day} ${month}, ${time}`;

    const optimisticComment = {
      id: `c-opt-${Date.now()}`,
      sender: `${currentUserName} (Seller Admin)`,
      role: 'super_admin',
      avatar: 'SA',
      message: textToSend,
      timestamp: formattedTimestamp
    };

    setComments((prev) => [...prev, optimisticComment]);

    try {
      const res = await fetch('/api/bidding/term-sheet/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: `${currentUserName} (Seller Admin)`,
          role: 'super_admin',
          avatar: 'SA',
          message: textToSend
        })
      });
      if (res.ok) {
        fetchComments();
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setIsPostingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#F8F9FB]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#006666] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading Term Sheet Editor...</p>
        </div>
      </div>
    );
  }

  const buyerName = termSheet?.buyerName || 'Naga Tech';
  const isSent = termSheet?.status === 'sent_to_buyer';
  const isSigned = Boolean(
    termSheet?.signatures?.buyer ||
    termSheet?.status === 'signed' ||
    termSheet?.status === 'signed_by_buyer' ||
    termSheet?.status === 'executed'
  );

  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans min-h-screen antialiased pb-16">
      {/* Top Bidding Navigation Tabs */}
      <BiddingHeaderNav portal="seller" activeTab="term-sheet" />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col gap-6">

        {/* 1. CLEAN HEADER & ACTION BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 m-0">
                Formulate Term Sheet — {buyerName}
              </h1>
              {isSigned ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Signed by Buyer ({termSheet?.signatures?.buyer?.signer || 'Buyer'})
                </span>
              ) : isSent ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-[#006666] border border-teal-200">
                  <Send className="w-3.5 h-3.5" />
                  Sent to Buyer for Signature
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  <Clock className="w-3.5 h-3.5" />
                  Drafting in Progress
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-normal">
              {termSheet?.version || 'Draft v2'} · {isSigned ? 'Buyer executed binding term sheet' : 'Draft and transmit to buyer for signature'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </button>
            <button
              onClick={handleSendToBuyer}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#006666] hover:bg-[#005252] border border-teal-700/50 transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSent ? 'Update & Re-send' : 'Transmit to Buyer'}</span>
            </button>
          </div>
        </div>

        {/* 2. KEY TERMS EDITOR & COUNSEL THREAD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: Editable Terms Table (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-700" />
                <h2 className="text-sm font-bold text-slate-900 m-0">Commercial & Legal Clauses</h2>
              </div>
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Editable Fields
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              
              {/* Purchase Price */}
              <div className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/40 transition-colors">
                <div className="w-44 shrink-0 font-bold text-slate-600">Purchase Price</div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={keyTerms.purchasePrice || ''}
                    onChange={(e) => handleTermChange('purchasePrice', e.target.value)}
                    placeholder="e.g. $10.0M"
                    className="w-full font-bold text-xs text-slate-900 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:border-[#006666] focus:ring-1 focus:ring-[#006666]/30 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Consideration Structure */}
              <div className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/40 transition-colors">
                <div className="w-44 shrink-0 font-bold text-slate-600">Consideration Structure</div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={keyTerms.structure || ''}
                    onChange={(e) => handleTermChange('structure', e.target.value)}
                    placeholder="e.g. 70% Cash, 30% Common Stock"
                    className="w-full font-medium text-xs text-slate-900 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:border-[#006666] focus:ring-1 focus:ring-[#006666]/30 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Expected Closing Date */}
              <div className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/40 transition-colors">
                <div className="w-44 shrink-0 font-bold text-slate-600">Expected Closing Date</div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={keyTerms.expectedClose || ''}
                    onChange={(e) => handleTermChange('expectedClose', e.target.value)}
                    placeholder="e.g. 15 Dec 2026"
                    className="w-full font-medium text-xs text-slate-900 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:border-[#006666] focus:ring-1 focus:ring-[#006666]/30 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Exclusivity Period */}
              <div className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/40 transition-colors">
                <div className="w-44 shrink-0 font-bold text-slate-600">Exclusivity Period</div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={keyTerms.exclusivityPeriod || ''}
                    onChange={(e) => handleTermChange('exclusivityPeriod', e.target.value)}
                    placeholder="e.g. 45 days from execution"
                    className="w-full font-medium text-xs text-slate-900 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:border-[#006666] focus:ring-1 focus:ring-[#006666]/30 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Key Employee Retention */}
              <div className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/40 transition-colors">
                <div className="w-44 shrink-0 font-bold text-slate-600">Key Employee Retention</div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={keyTerms.keyEmployeeRetention || ''}
                    onChange={(e) => handleTermChange('keyEmployeeRetention', e.target.value)}
                    placeholder="e.g. 2-year lock-in for critical engineers"
                    className="w-full font-medium text-xs text-slate-900 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:border-[#006666] focus:ring-1 focus:ring-[#006666]/30 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Escrow Holdback */}
              <div className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/40 transition-colors">
                <div className="w-44 shrink-0 font-bold text-slate-600">Indemnity Escrow</div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={keyTerms.escrow || ''}
                    onChange={(e) => handleTermChange('escrow', e.target.value)}
                    placeholder="e.g. 10% holdback for 12 months"
                    className="w-full font-medium text-xs text-slate-900 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:border-[#006666] focus:ring-1 focus:ring-[#006666]/30 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Regulatory Conditions */}
              <div className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/40 transition-colors">
                <div className="w-44 shrink-0 font-bold text-slate-600">Regulatory Conditions</div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={keyTerms.regulatoryConditions || ''}
                    onChange={(e) => handleTermChange('regulatoryConditions', e.target.value)}
                    placeholder="e.g. Antitrust clearance in primary operating markets"
                    className="w-full font-medium text-xs text-slate-900 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:border-[#006666] focus:ring-1 focus:ring-[#006666]/30 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Governing Law */}
              <div className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/40 transition-colors">
                <div className="w-44 shrink-0 font-bold text-slate-600">Governing Law</div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={keyTerms.governingLaw || ''}
                    onChange={(e) => handleTermChange('governingLaw', e.target.value)}
                    placeholder="e.g. Delaware, USA"
                    className="w-full font-medium text-xs text-slate-900 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:border-[#006666] focus:ring-1 focus:ring-[#006666]/30 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Digitally Executed Signature Block */}
              {isSigned && (
                <div className="p-5 bg-emerald-50/60 border-t border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                        Executed Binding Signature
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        SHA-256 Validated
                      </span>
                    </div>
                    <div className="text-xs text-emerald-800">
                      Signed by: <strong className="text-slate-900">{termSheet?.signatures?.buyer?.signer || buyerName}</strong> ({termSheet?.signatures?.buyer?.role || 'Buyer Lead Principal'})
                    </div>
                    <div className="text-[11px] text-emerald-700/80 mt-0.5">
                      Executed on: {termSheet?.signatures?.buyer?.signedAt || 'Recently'}
                    </div>
                  </div>

                  {termSheet?.signatures?.buyer?.signatureDataUrl ? (
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200 shadow-2xs shrink-0 flex flex-col items-center">
                      <img
                        src={termSheet.signatures.buyer.signatureDataUrl}
                        alt="Buyer Drawn Signature"
                        className="h-12 max-w-[200px] object-contain"
                      />
                      <span className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider">Buyer hand-drawn signature</span>
                    </div>
                  ) : (
                    <div className="font-serif italic text-2xl text-slate-900 bg-white px-4 py-2 rounded-xl border border-emerald-200 shadow-2xs shrink-0">
                      {termSheet?.signatures?.buyer?.signer || buyerName}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Right Column: Counsel Collaboration Thread (1 col) */}
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
                  <div key={c.id || `sc-${i}-${c.timestamp || ''}`} className="p-3 bg-white border border-slate-200/90 rounded-xl shadow-2xs">
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
                  disabled={!newComment.trim() || isPostingComment}
                  className="text-xs font-bold px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
                >
                  {isPostingComment ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
