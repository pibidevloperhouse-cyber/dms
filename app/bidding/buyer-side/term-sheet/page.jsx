"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TermSheetPage() {
  const [loading, setLoading] = useState(true);
  const [termSheet, setTermSheet] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signerName, setSignerName] = useState('Arjun Mehta');

  const fetchTermSheet = async () => {
    try {
      const res = await fetch('/api/bidding/term-sheet');
      if (res.ok) {
        const data = await res.json();
        if (data.termSheet) {
          setTermSheet(data.termSheet);
          if (data.termSheet.counselComments) setComments(data.termSheet.counselComments);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTermSheet();
  }, []);

  const handleAddComment = async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!newComment.trim()) return;
      try {
        const res = await fetch('/api/bidding/term-sheet/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: `${signerName} (Buyer Counsel)`,
            role: 'guest_admin',
            avatar: 'RO',
            message: newComment
          })
        });
        if (res.ok) {
          setNewComment('');
          fetchTermSheet();
        }
      } catch (e) {
        console.error(e);
      }
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
          signerName: signerName || 'Arjun Mehta'
        })
      });
      if (res.ok) {
        alert('Term Sheet executed & digitally signed successfully!');
        setShowSignModal(false);
        fetchTermSheet();
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
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const keyTerms = termSheet.keyTerms || {};
  const changed = termSheet.changedFields || {};
  const isBuyerSigned = Boolean(termSheet.signatures?.buyer);

  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans text-[14px] leading-relaxed min-h-screen antialiased">
      <div className="flex gap-[2px] px-7 border-b border-slate-200 bg-white">

        <Link href="/bidding/buyer-side/my-bid" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">My bid</Link>
        <Link href="/bidding/buyer-side/bid-history" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Bid history</Link>
        <Link href="/bidding/buyer-side/messages" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Messages</Link>
        <Link href="/bidding/buyer-side/term-sheet" className="px-4 py-[13px] text-[13px] text-slate-900 border-b-2 border-blue-600 font-medium">Term sheet</Link>
      </div>

      <div className="max-w-[1280px] mx-auto pb-8">
        <div className="mt-5 mx-7 px-4.5 py-3 bg-green-50 border border-green-200/60 rounded-xl text-[12.5px] text-green-700 flex justify-between items-center shadow-xs">
          <span>Your bid of {keyTerms.purchasePrice} was accepted — this term sheet reflects the agreed terms.</span>
          <span className="font-semibold">{termSheet.stage || 'Stage 5 of 6'}</span>
        </div>

        <div className="pt-5.5 px-7 flex justify-between items-start flex-wrap gap-3.5">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 m-0 tracking-tight">Term sheet — {termSheet.dealName || 'Project Alpha'}</h1>
            <div className="text-[13px] text-slate-500 font-medium mt-1.5">
              {termSheet.version || 'Draft v2'} · {termSheet.status === 'signed' ? 'Fully Executed' : `last updated ${termSheet.lastUpdated || '7 Sep 2026'}`}
            </div>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={handleDownloadPDF}
              className="text-[13px] font-semibold px-4 py-2 rounded-lg cursor-pointer border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
            >
              Download PDF
            </button>
            {!isBuyerSigned ? (
              <button
                onClick={() => setShowSignModal(true)}
                className="text-[13px] font-semibold px-4 py-2 rounded-lg cursor-pointer border border-slate-900 bg-slate-900 text-white hover:opacity-90 transition-opacity shadow-xs"
              >
                Sign term sheet
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-green-100 text-green-800 border border-green-300">
                ✓ Signed by Buyer
              </span>
            )}
          </div>
        </div>

        <div className="w-full mt-5.5 px-7 pb-10">
          {/* Key Terms Table with Redlines Highlighted */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden w-full">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-[#FAFAFA]">
              <h2 className="text-[15px] font-bold text-slate-900 m-0">Key terms</h2>
              <span className="text-[12px] text-slate-400 font-medium">Redlines highlighted</span>
            </div>
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-500 w-[200px]">Purchase price</td>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-900 font-medium">
                    {keyTerms.purchasePrice}
                    {changed.purchasePrice && (
                      <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded ml-2 text-[11px] font-semibold border border-amber-200/50">
                        changed
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-500 w-[200px]">Structure</td>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-900">
                    {keyTerms.structure}
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-500 w-[200px]">Expected close</td>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-900">
                    {keyTerms.expectedClose}
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-500 w-[200px]">Exclusivity period</td>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-900">
                    {keyTerms.exclusivityPeriod}
                    {changed.exclusivityPeriod && (
                      <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded ml-2 text-[11px] font-semibold border border-amber-200/50">
                        changed
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-500 w-[200px]">Key employee retention</td>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-900">
                    {keyTerms.keyEmployeeRetention}
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-500 w-[200px]">Escrow</td>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-900">
                    {keyTerms.escrow}
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-500 w-[200px]">Regulatory conditions</td>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-900">
                    {keyTerms.regulatoryConditions}
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 text-[13px] align-top text-slate-500 w-[200px]">Governing law</td>
                  <td className="py-3.5 px-5 text-[13px] align-top text-slate-900">
                    {keyTerms.governingLaw}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          
        </div>
      </div>

      {/* Digital Sign Modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-[#0f172a]/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Execute Term Sheet</h3>
            <p className="text-xs text-slate-500 mb-4">
              By digitally signing, you confirm acceptance of the agreed key terms for <b>{termSheet.dealName || 'Project Alpha'}</b>.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Signatory Full Name</label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="p-3 bg-[#FAFAFA] border border-slate-200 rounded-xl">
                <div className="text-[11px] text-slate-400 font-semibold uppercase mb-1">Digital Signature Preview</div>
                <div className="font-serif italic text-xl text-slate-800 py-2 border-b border-slate-200">
                  {signerName || 'Arjun Mehta'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Role: Buyer Guest Admin · Timestamp: {new Date().toLocaleDateString()}</div>
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
                disabled={isSigning}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                {isSigning ? 'Signing...' : 'Confirm & Sign Term Sheet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
