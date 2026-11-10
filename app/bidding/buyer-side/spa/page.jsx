"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  FileText,
  Download,
  PenTool,
  ShieldCheck,
  Clock,
  MessageSquare,
  CheckCircle2,
  Lock,
  RotateCcw,
  Check,
  DollarSign,
  Calendar,
  Sparkles
} from 'lucide-react';
import BiddingHeaderNav from '@/components/bidding/BiddingHeaderNav';

export default function BuyerSpaPage() {
  const [loading, setLoading] = useState(true);
  const [spa, setSpa] = useState(null);
  const [dealMeta, setDealMeta] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signerName, setSignerName] = useState('');

  // Mouse & Touch Canvas Drawing States
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);

  const commentsEndRef = useRef(null);

  const fetchSpa = async () => {
    try {
      let sessionName = '';
      try {
        const raw = localStorage.getItem('vdr_session');
        if (raw) {
          const user = JSON.parse(raw);
          if (user.name) {
            sessionName = user.name;
            setSignerName(user.name);
          }
        }
      } catch (e) { }

      const res = await fetch('/api/bidding/spa');
      if (res.ok) {
        const data = await res.json();
        if (data.dealMeta) setDealMeta(data.dealMeta);
        if (data.spa) {
          setSpa(data.spa);
          if (!sessionName && (data.spa.buyerName || data.dealMeta?.buyerName)) {
            setSignerName(data.spa.buyerName || data.dealMeta?.buyerName || '');
          }
          if (data.spa.counselComments) {
            setComments(data.spa.counselComments);
          }
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
    const interval = setInterval(fetchSpa, 3000);
    const handleEvents = () => fetchSpa();
    window.addEventListener('storage', handleEvents);
    window.addEventListener('bid_submitted', handleEvents);
    window.addEventListener('focus', handleEvents);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleEvents);
      window.removeEventListener('bid_submitted', handleEvents);
      window.removeEventListener('focus', handleEvents);
    };
  }, []);

  // Canvas Drawing Handlers
  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0f172a';
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSignature(false);
  };

  useEffect(() => {
    if (showSignModal) {
      const timer = setTimeout(() => {
        setupCanvas();
      }, 70);
      return () => clearTimeout(timer);
    } else {
      setHasDrawnSignature(false);
    }
  }, [showSignModal]);

  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    const pos = getCanvasPos(e);
    isDrawingRef.current = true;
    lastPosRef.current = pos;
  };

  const drawStroke = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getCanvasPos(e);

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPosRef.current = pos;
    setHasDrawnSignature(true);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const handleExecuteSign = async () => {
    setIsSigning(true);
    try {
      let signatureDataUrl = null;
      if (canvasRef.current && hasDrawnSignature) {
        signatureDataUrl = canvasRef.current.toDataURL('image/png');
      }

      const res = await fetch('/api/bidding/spa/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerRole: 'buyer',
          signerName: signerName || spa?.buyerName || dealMeta?.buyerName || 'Buyer',
          signatureDataUrl
        })
      });
      if (res.ok) {
        try {
          localStorage.setItem('dms_spa_agreement_dispatched', JSON.stringify({
            dispatched: true,
            signed: true,
            date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
          }));
        } catch (_) { }

        alert('🎉 Share Purchase Agreement (SPA) executed successfully! The acquisition deal is now bindingly closed.');
        setShowSignModal(false);
        await fetchSpa();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('bid_submitted'));
          window.dispatchEvent(new Event('storage'));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSigning(false);
    }
  };

  const handleAddComment = async (e) => {
    if (e && e.key && (e.key !== 'Enter' || e.shiftKey)) return;
    if (e && e.preventDefault) e.preventDefault();
    if (!newComment.trim() || isSendingComment) return;

    const textToSend = newComment.trim();
    setNewComment('');
    setIsSendingComment(true);

    try {
      const res = await fetch('/api/bidding/spa/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: `${signerName} (Buyer Counsel)`,
          role: 'buyer_counsel',
          avatar: 'BC',
          message: textToSend
        })
      });
      if (res.ok) {
        fetchComments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingComment(false);
    }
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
  const articles = spa?.articles || {};

  // If not yet dispatched by seller counsel, show locked awaiting state
  if (!isDispatched) {
    return (
      <div className="bg-[#F8F9FB] text-slate-900 font-sans min-h-screen antialiased pb-16">
        <BiddingHeaderNav portal="buyer" activeTab="term-sheet" />

        <div className="max-w-[760px] mx-auto px-4 sm:px-6 pt-12">
          <div className="bg-white rounded-3xl border-2 border-gray-300 p-8 sm:p-12 shadow-md shadow-gray-300/80 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 text-[#006666] flex items-center justify-center mb-5 border border-teal-200 shadow-2xs">
              <Clock className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-teal-100 text-teal-900 border border-teal-200 uppercase tracking-wider mb-3">
              <span>Definitive Legal Drafting Underway</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
              Share Purchase Agreement (SPA) In Preparation
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mb-8 leading-relaxed">
              The seller counsel is formulating the definitive Share Purchase Agreement (SPA) reflecting the signed commercial term sheet.
              As soon as the seller counsel dispatches the formal agreement, this section will unlock for your final execution.
            </p>

            <Link
              href="/bidding/buyer-side/term-sheet"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
            >
              <span>← Return to Signed Term Sheet</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans min-h-screen antialiased pb-20">
      {/* Top Bidding Navigation Tabs */}
      <BiddingHeaderNav portal="buyer" activeTab="spa" />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col gap-6">

        {/* 1. TOP HEADER & CLOSING ACTION BAR */}
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
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  <Clock className="w-3.5 h-3.5" />
                  Pending Buyer Execution
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-normal">
              Target Company: <strong>{spa?.dealName || dealMeta?.dealName || 'Deal'}</strong> · Enterprise Value: <strong>{articles.purchasePrice || '—'}</strong> · {spa?.version || 'v1.0 Definitive Execution Copy'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download PDF</span>
            </button>

            {!isExecuted ? (
              <button
                onClick={() => setShowSignModal(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#006666] hover:bg-[#005252] border border-teal-700/50 transition-colors shadow-xs cursor-pointer animate-pulse"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Execute &amp; Sign SPA with Mouse</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                <span>Binding Deal Executed</span>
              </span>
            )}
          </div>
        </div>

        {/* Celebratory Banner if Deal is Closed */}
        {isExecuted && (
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4 flex-wrap animate-in fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0 flex items-center gap-2">
                  <span>M&amp;A Acquisition Deal Successfully Closed!</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 uppercase">
                    Stage 5 Complete
                  </span>
                </h3>
                <p className="text-xs text-slate-700 mt-1 font-medium">
                  The Share Purchase Agreement has been fully endorsed and signed by both parties. Escrow funds and share certificates are now scheduled for closing dispatch.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. MAIN 2-COL LAYOUT: AUTHENTIC REAL-TIME SPA DOCUMENT (LEFT) + REDLINES (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* LEFT: THE REAL-TIME AUTHENTIC LEGAL DOCUMENT */}
          <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-gray-300 shadow-md shadow-gray-300/80 p-6 sm:p-12 font-serif text-slate-800 leading-relaxed text-[13px] relative print:border-none print:shadow-none print:p-0">

            {/* Official Legal Header */}
            <div className="text-center pb-8 border-b-2 border-slate-900 mb-8 font-sans">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1 rounded-full mb-3 border border-slate-200">
                <Lock className="w-3 h-3 text-slate-600" />
                <span>Attorneys Execution Draft · Privileged &amp; Confidential</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight uppercase font-serif mt-1">
                Share Purchase Agreement
              </h1>
              <p className="text-xs text-slate-500 font-sans mt-2 max-w-xl mx-auto">
                Dated as of <strong className="text-slate-800">{articles.closingDate || '—'}</strong>, by and between{' '}
                <strong className="text-slate-900">{spa?.companyName || dealMeta?.sellerCompany || 'Seller'}</strong> (&ldquo;Seller&rdquo;) and{' '}
                <strong className="text-slate-900">{(spa?.buyerCompany || dealMeta?.buyerCompany) ? `${signerName || spa?.buyerName || 'Buyer'} / ${spa?.buyerCompany || dealMeta?.buyerCompany}` : (signerName || spa?.buyerName || 'Purchaser')}</strong> (&ldquo;Purchaser&rdquo;).
              </p>
            </div>

            {/* PREAMBLE & RECITALS */}
            <div className="space-y-4 mb-8">
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                Preamble &amp; Recitals
              </h3>
              <p className="indent-6">
                <strong>WHEREAS</strong>, Seller is the record and beneficial owner of one hundred percent (100%) of the issued and outstanding capital equity securities of <strong className="font-sans font-bold">{spa?.dealName || dealMeta?.dealName || 'Company'}</strong> (the &ldquo;Company&rdquo;);
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
                  Agreed Binding Terms
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
                  <span className="font-extrabold text-slate-900 text-right">{articles.cashComponent}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-600">(b) Acquirer Common Stock Component:</span>
                  <span className="font-extrabold text-slate-900 text-right">{articles.stockComponent}</span>
                </div>
              </div>
            </div>

            {/* ARTICLE II: CLOSING & ESCROW HOLDBACK */}
            <div className="space-y-4 mb-8">
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                Article II: Closing &amp; Indemnity Escrow
              </h3>

              <div className="space-y-2.5 font-sans text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-0.5">Section 2.1: Closing Schedule &amp; Exclusivity</span>
                  <div className="text-slate-800">
                    Target Closing Date: <strong>{articles.closingDate}</strong> · Bilateral Exclusivity Period: <strong>{articles.exclusivityPeriod}</strong>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-0.5">Section 2.2: Indemnity Escrow Account</span>
                  <div className="text-slate-800">
                    {articles.escrowHoldback}
                  </div>
                </div>
              </div>
            </div>

            {/* ARTICLE III: KEY PERSONNEL RETENTION & GOVERNING LAW */}
            <div className="space-y-4 mb-8">
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                Article III: Key Retention &amp; Governing Law
              </h3>

              <div className="space-y-2.5 font-sans text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-0.5">Section 3.1: Key Personnel Retention</span>
                  <div className="text-slate-800">
                    {articles.keyEmployeeRetention}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-0.5">Section 3.2: Governing Jurisdiction</span>
                  <div className="text-slate-800">
                    {articles.governingLaw}
                  </div>
                </div>
              </div>
            </div>

            {/* EXECUTION SIGNATURE BLOCKS */}
            <div className="pt-8 border-t-2 border-slate-900 mt-10">
              <p className="text-center italic mb-6 font-serif text-slate-600 text-xs">
                IN WITNESS WHEREOF, the parties hereto have caused this Share Purchase Agreement to be duly executed by their respective authorized signatories.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans">
                {/* SELLER SIGNATURE BOX */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Seller Signatory
                  </span>
                  <div className="font-bold text-slate-900 text-sm">
                    {spa?.sellerName || dealMeta?.sellerName || 'Seller Admin'}
                  </div>
                  <div className="text-[11px] text-slate-500 mb-3">
                    Seller Super Admin{(spa?.sellerCompany || dealMeta?.sellerCompany) ? ` · ${spa?.sellerCompany || dealMeta?.sellerCompany}` : ''}
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
                    {signerName || spa?.buyerName || 'Buyer'}
                  </div>
                  <div className="text-[11px] text-slate-500 mb-3">
                    Buyer Lead Principal{(spa?.buyerCompany || dealMeta?.buyerCompany) ? ` · ${spa?.buyerCompany || dealMeta?.buyerCompany}` : ''}
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
                          {signerName}
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
                      <button
                        type="button"
                        onClick={() => setShowSignModal(true)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#006666] hover:bg-[#005252] text-white text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <PenTool className="w-3 h-3" />
                        <span>Sign with Mouse Now</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT: COUNSEL REDLINES & NOTES */}
          <div className="bg-white rounded-2xl border-2 border-gray-300 shadow-md shadow-gray-300/80 overflow-hidden flex flex-col h-[440px] lg:h-[calc(100vh-200px)] lg:sticky lg:top-[88px]">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900 m-0">Counsel Redlines</h3>
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
                  <div key={c.id || `bc-${i}`} className="p-3 bg-white border border-slate-200/90 rounded-xl shadow-2xs">
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
                  placeholder="Annotate for buyer counsel..."
                  className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#006666] outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={isSendingComment || !newComment.trim()}
                  className="text-xs font-bold px-3 py-2 bg-[#006666] hover:bg-[#005252] text-white rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
                >
                  {isSendingComment ? '...' : 'Post'}
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* DIGITAL SIGNATURE EXECUTION MODAL WITH SPA SUMMARY & MOUSE CANVAS */}
      {showSignModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 sm:p-7 relative max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#006666] shrink-0">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 m-0">Execute Definitive Share Purchase Agreement</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Target: <strong className="text-slate-800">{spa.dealName || dealMeta?.dealName || 'Deal'}</strong> · Total Value: <strong className="text-slate-900">{articles.purchasePrice || '—'}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSignModal(false)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Legal Notice */}
            <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200/90 leading-relaxed">
              By endorsing and executing below, the Purchaser irrevocably enters into this binding Share Purchase Agreement (SPA). This creates a definitive obligation for completion and wire transfer of purchase consideration on the Closing Date.
            </p>

            <div className="space-y-4 mb-6">
              {/* 1. DOCUMENT PREVIEW BOX */}
              <div className="bg-[#FAFBFD] rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#006666]" />
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                      Definitive SPA Terms Summary
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#006666] border border-teal-200">
                    Final Closing Stage
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Enterprise Value</span>
                      <span className="text-sm font-black text-slate-900">{articles.purchasePrice}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Consideration Breakdown</span>
                      <span className="text-xs font-bold text-slate-800">{articles.cashComponent}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Definitive Closing Date</span>
                      <span className="text-xs font-semibold text-slate-800">{articles.closingDate}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Indemnity Escrow</span>
                      <span className="text-xs font-semibold text-slate-800">{articles.escrowHoldback}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. SIGNATORY LEGAL NAME */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Signatory Full Legal Name
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Enter authorized signatory name"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#006666] focus:ring-1 focus:ring-[#006666]/30 bg-white"
                />
              </div>

              {/* 3. MOUSE-DRAWN SIGNATURE CANVAS */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-teal-700" />
                    <span>Draw Signature (Use Mouse / Trackpad)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {hasDrawnSignature ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" />
                        Recorded
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400">
                        Use mouse cursor to draw inside box
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleClearSignature}
                      className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Clear and redraw signature"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>

                {/* Canvas Drawing Area */}
                <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-white overflow-hidden shadow-2xs hover:border-[#006666]/60 transition-colors">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={drawStroke}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={drawStroke}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[125px] cursor-crosshair block touch-none"
                  />

                  {/* Guide placeholder watermark when empty */}
                  {!hasDrawnSignature && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-4">
                      <div className="border-b border-slate-200 w-full flex items-center justify-between pb-1">
                        <span className="text-[11px] font-serif italic text-slate-400">✕ Sign above this line using mouse</span>
                        <span className="text-[10px] text-slate-300 uppercase tracking-wider">Canvas Signature Pad</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-500 mt-2 flex items-center justify-between flex-wrap gap-2">
                  <span>Role: Buyer Lead Principal &amp; Authorized Signatory</span>
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    SHA-256 Validated
                  </span>
                  <span>Date: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSignModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSign}
                disabled={isSigning || !signerName.trim() || !hasDrawnSignature}
                className="px-5 py-2 bg-[#006666] hover:bg-[#005252] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSigning ? 'Closing Deal...' : 'Confirm & Legally Execute Deal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

