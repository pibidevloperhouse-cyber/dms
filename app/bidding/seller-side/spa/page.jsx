"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  FileText,
  Send,
  Save,
  ShieldCheck,
  Clock,
  MessageSquare,
  Download,
  Building,
  CheckCircle2,
  DollarSign,
  Calendar,
  Lock,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import BiddingHeaderNav from '@/components/bidding/BiddingHeaderNav';

export default function SellerSpaPage() {
  const [loading, setLoading] = useState(true);
  const [spa, setSpa] = useState(null);
  const [dealMeta, setDealMeta] = useState(null);
  const [articles, setArticles] = useState({
    purchasePrice: '',
    cashComponent: '',
    stockComponent: '',
    closingDate: '',
    escrowHoldback: '',
    exclusivityPeriod: '',
    keyEmployeeRetention: '',
    governingLaw: '',
    representations: '',
    covenants: '',
    conditionsPrecedent: ''
  });
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');

  const commentsEndRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('vdr_session');
      if (raw) {
        const user = JSON.parse(raw);
        if (user?.name) setCurrentUserName(user.name);
      }
    } catch (_) {}
  }, []);

  const fetchSpa = async () => {
    try {
      const res = await fetch('/api/bidding/spa');
      if (res.ok) {
        const data = await res.json();
        if (data.dealMeta) {
          setDealMeta(data.dealMeta);
          if (data.dealMeta.sellerName) setCurrentUserName((prev) => prev || data.dealMeta.sellerName);
        }
        if (data.spa) {
          setSpa(data.spa);
          if (data.spa.articles) setArticles(data.spa.articles);
          if (data.spa.counselComments) setComments(data.spa.counselComments);
        }
      }
    } catch (e) {
      console.error('Error fetching SPA:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch('/api/bidding/spa/comments');
      if (res.ok) {
        const data = await res.json();
        if (data.comments) setComments(data.comments);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSpa();
    const interval = setInterval(fetchSpa, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleArticleChange = (field, val) => {
    setArticles(prev => ({ ...prev, [field]: val }));
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/bidding/spa', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_DRAFT',
          articles,
          requesterRole: 'super_admin'
        })
      });
      if (res.ok) {
        alert('SPA Definitive Draft saved successfully.');
        fetchSpa();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDispatchToBuyer = async () => {
    if (!confirm(`Dispatch definitive Share Purchase Agreement (SPA) to ${spa?.buyerName || 'Buyer'} for binding execution?`)) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/bidding/spa', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DISPATCH_TO_BUYER',
          articles,
          requesterRole: 'super_admin'
        })
      });
      if (res.ok) {
        try {
          const now = new Date();
          localStorage.setItem('dms_spa_agreement_dispatched', JSON.stringify({
            dispatched: true,
            date: `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`,
            dispatchedBy: currentUserName,
            recipient: spa?.buyerName || 'Buyer',
            documentName: 'Share_Purchase_Agreement_v1.0_Final.pdf'
          }));
        } catch (_) {}

        alert('Share Purchase Agreement (SPA) dispatched to Buyer for final digital signature!');
        await fetchSpa();
        if (typeof window !== 'undefined') {
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

    try {
      const res = await fetch('/api/bidding/spa/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: `${currentUserName} (Seller Counsel)`,
          role: 'seller_counsel',
          avatar: 'SC',
          message: textToSend
        })
      });
      if (res.ok) {
        fetchComments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPostingComment(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#F8F9FB]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#006666] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading Share Purchase Agreement (SPA)...</p>
        </div>
      </div>
    );
  }

  const isExecuted = spa?.status === 'executed' || Boolean(spa?.signatures?.buyer);
  const isDispatched = spa?.status === 'dispatched' || isExecuted;
  const buyerName = spa?.buyerName || dealMeta?.buyerName || dealMeta?.buyerCompany || 'Buyer';
  const buyerCompany = spa?.buyerCompany || dealMeta?.buyerCompany || '';
  const sellerName = spa?.sellerName || dealMeta?.sellerName || currentUserName || 'Seller Admin';
  const sellerCompany = spa?.companyName || spa?.sellerCompany || dealMeta?.sellerCompany || '';
  const dealName = spa?.dealName || dealMeta?.dealName || 'Deal';

  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans min-h-screen antialiased pb-20">
      {/* Top Bidding Navigation Tabs */}
      <BiddingHeaderNav portal="seller" activeTab="spa" />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col gap-6">

        {/* 1. TOP HEADER & WORKFLOW ACTION BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 m-0">
                Definitive Share Purchase Agreement (SPA)
              </h1>
              {isExecuted ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Deal Closed &amp; Fully Executed
                </span>
              ) : isDispatched ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-[#006666] border border-teal-200">
                  <Send className="w-3.5 h-3.5" />
                  Dispatched to Buyer for Signature
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  <Clock className="w-3.5 h-3.5" />
                  Drafting in Progress
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-normal">
              Acquisition Target: <strong>{dealName}</strong> · Purchaser: <strong>{buyerName}</strong> · {spa?.version || 'v1.0 Draft'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export PDF</span>
            </button>

            {!isExecuted && (
              <>
                <button
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
                </button>

                <button
                  onClick={handleDispatchToBuyer}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#006666] hover:bg-[#005252] border border-teal-700/50 transition-colors shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isDispatched ? 'Update & Re-dispatch' : 'Dispatch SPA to Buyer'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 2. MAIN 2-COL LAYOUT: AUTHENTIC REAL-TIME SPA DOCUMENT (LEFT) + REDLINES (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* LEFT: THE REAL-TIME AUTHENTIC LEGAL DOCUMENT */}
          <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-gray-300 shadow-md shadow-gray-300/80 p-6 sm:p-12 font-serif text-slate-800 leading-relaxed text-[13px] relative print:border-none print:shadow-none print:p-0">

            {/* Official Legal Header / Seal */}
            <div className="text-center pb-8 border-b-2 border-slate-900 mb-8 font-sans">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1 rounded-full mb-3 border border-slate-200">
                <Lock className="w-3 h-3 text-slate-600" />
                <span>Confidential Definitive Acquisition Agreement</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight uppercase font-serif mt-1">
                Share Purchase Agreement
              </h1>
              <p className="text-xs text-slate-500 font-sans mt-2 max-w-xl mx-auto">
                Dated as of <strong className="text-slate-800">{articles.closingDate || '—'}</strong>, by and between{' '}
                <strong className="text-slate-900">{sellerCompany || sellerName}</strong> (&ldquo;Seller&rdquo;) and{' '}
                <strong className="text-slate-900">{buyerCompany ? `${buyerName} / ${buyerCompany}` : buyerName}</strong> (&ldquo;Purchaser&rdquo;).
              </p>
            </div>

            {/* PREAMBLE & RECITALS */}
            <div className="space-y-4 mb-8">
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                Preamble &amp; Recitals
              </h3>
              <p className="indent-6">
                <strong>WHEREAS</strong>, Seller is the record and beneficial owner of one hundred percent (100%) of the issued and outstanding capital equity securities of <strong className="font-sans font-bold">{dealName}</strong> (the &ldquo;Company&rdquo;);
              </p>
              <p className="indent-6">
                <strong>WHEREAS</strong>, Purchaser desires to acquire and purchase from Seller, and Seller desires to sell, transfer, assign, and convey to Purchaser, all right, title, and interest in and to all of the Purchased Shares, free and clear of all encumbrances, upon the terms and subject to the conditions set forth herein;
              </p>
              <p className="indent-6">
                <strong>NOW, THEREFORE</strong>, in consideration of the mutual covenants, representations, warranties, and agreements set forth in this Share Purchase Agreement, the parties hereto agree as follows:
              </p>
            </div>

            {/* ARTICLE I: PURCHASE PRICE & CONSIDERATION */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1 font-sans">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  Article I: Purchase Price &amp; Consideration
                </h3>
                <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Negotiated Terms
                </span>
              </div>

              <p>
                <strong>Section 1.1: Purchase Price.</strong> The aggregate consideration for the sale, transfer, and conveyance of the Purchased Shares shall be an enterprise valuation of{' '}
                <strong className="font-sans text-slate-950 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-sm">
                  {articles.purchasePrice}
                </strong>{' '}
                (the &ldquo;Purchase Consideration&rdquo;).
              </p>

              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 font-sans space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="font-semibold text-slate-600">(a) Cash Consideration at Close:</span>
                  <input
                    type="text"
                    value={articles.cashComponent || ''}
                    onChange={(e) => handleArticleChange('cashComponent', e.target.value)}
                    className="font-bold text-slate-900 text-right bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs w-72 focus:outline-none focus:border-[#006666]"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-600">(b) Acquirer Common Stock Component:</span>
                  <input
                    type="text"
                    value={articles.stockComponent || ''}
                    onChange={(e) => handleArticleChange('stockComponent', e.target.value)}
                    className="font-bold text-slate-900 text-right bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs w-72 focus:outline-none focus:border-[#006666]"
                  />
                </div>
              </div>
            </div>

            {/* ARTICLE II: CLOSING & ESCROW HOLDBACK */}
            <div className="space-y-4 mb-8">
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                Article II: Closing &amp; Indemnity Escrow
              </h3>

              <div className="space-y-3 font-sans text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Section 2.1: Closing Date &amp; Exclusivity Window
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={articles.closingDate}
                      onChange={(e) => handleArticleChange('closingDate', e.target.value)}
                      placeholder="Expected Closing Date"
                      className="p-2 border border-slate-200 rounded-lg bg-white font-semibold text-slate-800 focus:outline-none focus:border-[#006666]"
                    />
                    <input
                      type="text"
                      value={articles.exclusivityPeriod}
                      onChange={(e) => handleArticleChange('exclusivityPeriod', e.target.value)}
                      placeholder="Exclusivity Period"
                      className="p-2 border border-slate-200 rounded-lg bg-white font-semibold text-slate-800 focus:outline-none focus:border-[#006666]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Section 2.2: Indemnity Escrow Holdback
                  </label>
                  <input
                    type="text"
                    value={articles.escrowHoldback}
                    onChange={(e) => handleArticleChange('escrowHoldback', e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white font-semibold text-slate-800 focus:outline-none focus:border-[#006666]"
                  />
                </div>
              </div>
            </div>

            {/* ARTICLE III & IV: COVENANTS & GOVERNING LAW */}
            <div className="space-y-4 mb-8">
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                Article III: Key Retention &amp; Governing Jurisdiction
              </h3>

              <div className="space-y-3 font-sans text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Section 3.1: Key Employee Retention Covenants
                  </label>
                  <textarea
                    rows={2}
                    value={articles.keyEmployeeRetention}
                    onChange={(e) => handleArticleChange('keyEmployeeRetention', e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white font-medium text-slate-800 focus:outline-none focus:border-[#006666] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Section 3.2: Governing Law &amp; Dispute Resolution
                  </label>
                  <input
                    type="text"
                    value={articles.governingLaw}
                    onChange={(e) => handleArticleChange('governingLaw', e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white font-semibold text-slate-800 focus:outline-none focus:border-[#006666]"
                  />
                </div>
              </div>
            </div>

            {/* EXECUTION SIGNATURE BLOCKS */}
            <div className="pt-8 border-t-2 border-slate-900 mt-10">
              <p className="text-center italic mb-6 font-serif text-slate-600 text-xs">
                IN WITNESS WHEREOF, the parties hereto have caused this Share Purchase Agreement to be duly executed by their respective authorized officers as of the date first written above.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans">
                {/* SELLER SIGNATURE BOX */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Seller Signatory
                  </span>
                  <div className="font-bold text-slate-900 text-sm">
                    {sellerName}
                  </div>
                  <div className="text-[11px] text-slate-500 mb-3">
                    Seller Super Admin{sellerCompany ? ` · ${sellerCompany}` : ''}
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[10px]">
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Endorsed by Board
                    </span>
                    <span className="text-slate-400">{spa?.signatures?.seller?.signedAt || spa?.lastUpdated || 'Pending'}</span>
                  </div>
                </div>

                {/* BUYER SIGNATURE BOX */}
                <div className={`p-4 rounded-xl border ${isExecuted ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Purchaser Signatory
                  </span>
                  <div className="font-bold text-slate-900 text-sm">
                    {buyerName}
                  </div>
                  <div className="text-[11px] text-slate-500 mb-3">
                    Buyer Lead Principal{buyerCompany ? ` · ${buyerCompany}` : ''}
                  </div>

                  {isExecuted ? (
                    <div>
                      {spa?.signatures?.buyer?.signatureDataUrl ? (
                        <div className="bg-white p-2 rounded-lg border border-emerald-200 flex flex-col items-center mb-2">
                          <img
                            src={spa.signatures.buyer.signatureDataUrl}
                            alt="Buyer Signature"
                            className="h-10 max-w-[180px] object-contain"
                          />
                        </div>
                      ) : (
                        <div className="font-serif italic text-xl text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 mb-2">
                          {buyerName}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-emerald-800 font-bold border-t border-emerald-200 pt-1">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> SHA-256 Verified
                        </span>
                        <span>{spa?.signatures?.buyer?.signedAt || 'Recently'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-dashed border-slate-300 pt-3 text-center">
                      <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 inline-block">
                        Awaiting Buyer Digital Signature
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT: COUNSEL REDLINES & ANNOTATION THREAD */}
          <div className="bg-white rounded-2xl border-2 border-gray-300 shadow-md shadow-gray-300/80 overflow-hidden flex flex-col h-[440px] lg:h-[calc(100vh-200px)] lg:sticky lg:top-[88px]">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900 m-0">Counsel SPA Redlines</h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                {comments.length} notes
              </span>
            </div>

            {/* Comment Thread */}
            <div className="p-4 flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto bg-[#FAFBFD]">
              {comments.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No redlines yet. Post legal annotations here.
                </div>
              ) : (
                comments.map((c, i) => (
                  <div key={c.id || `sc-${i}`} className="p-3 bg-white border border-slate-200/90 rounded-xl shadow-2xs">
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
            <div className="p-3.5 bg-white border-t border-slate-100 shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={handleAddComment}
                  placeholder="Annotate SPA clauses..."
                  className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#006666] outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={isPostingComment || !newComment.trim()}
                  className="text-xs font-bold px-3 py-2 bg-[#006666] hover:bg-[#005252] text-white rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
                >
                  {isPostingComment ? '...' : 'Post'}
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

