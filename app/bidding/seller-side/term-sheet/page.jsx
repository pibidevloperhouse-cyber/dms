"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SellerTermSheetPage() {
  const [loading, setLoading] = useState(true);
  const [termSheet, setTermSheet] = useState(null);
  const [keyTerms, setKeyTerms] = useState({
    purchasePrice: "$100,000,000",
    structure: "60% cash at close / 40% acquirer stock, 12-month vest",
    expectedClose: "15 December 2026",
    exclusivityPeriod: "45 days from execution",
    keyEmployeeRetention: "90% of leadership team, 24-month terms",
    escrow: "10% of purchase price, 18-month holdback",
    regulatoryConditions: "Subject to standard antitrust clearance",
    governingLaw: "Delaware, USA"
  });
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchTermSheet = async () => {
    try {
      const res = await fetch('/api/bidding/term-sheet');
      if (res.ok) {
        const data = await res.json();
        if (data.termSheet) {
          setTermSheet(data.termSheet);
          if (data.termSheet.keyTerms) setKeyTerms(data.termSheet.keyTerms);
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
        fetchTermSheet();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComment = async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!newComment.trim()) return;
      try {
        const res = await fetch('/api/bidding/term-sheet/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: 'Linklane LLP (your counsel)',
            role: 'super_admin',
            avatar: 'LC',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#F8F9FB]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const buyerName = termSheet?.buyerName || 'Halcyon Growth';
  const isSent = termSheet?.status === 'sent_to_buyer';

  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans text-[14px] leading-relaxed min-h-screen">
      <div className="flex gap-[2px] px-7 border-b border-slate-200 bg-white">
        <Link href="/bidding/seller-side" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Bidding</Link>

        <Link href="/bidding/seller-side/term-sheet" className="px-4 py-[13px] text-[13px] text-slate-900 border-b-2 border-blue-600 font-medium">Term sheet</Link>
        <Link href="/bidding/seller-side/messages" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Messages</Link>
      </div>

      <div className="mx-7 mt-5 px-4 py-3 bg-green-50 border border-[#C7DFCB] rounded-xl text-[12.5px] text-green-700 flex justify-between items-center shadow-xs">
        <span>Bid from {buyerName} ({keyTerms.purchasePrice}) accepted — {isSent ? 'Sent to buyer for signature.' : 'draft this term sheet and send for buyer signature.'}</span>
        <span className="font-semibold">Stage 5 of 6</span>
      </div>

      <div className="pt-5 px-7 flex justify-between items-start flex-wrap gap-3.5">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 m-0 tracking-tight">Term sheet — {buyerName}</h1>
          <div className="text-[13px] text-slate-500 font-medium mt-1">
            {termSheet?.version || 'Draft v2'} · {isSent ? 'Sent to buyer' : 'editable until sent for signature'}
          </div>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="text-[13px] font-semibold px-4 py-2 rounded-lg cursor-pointer border border-slate-200 text-slate-700 bg-white hover:text-slate-900 hover:border-slate-900 transition-colors shadow-2xs"
          >
            {isSaving ? 'Saving...' : 'Save draft'}
          </button>
          <button
            onClick={handleSendToBuyer}
            disabled={isSaving}
            className="text-[13px] font-semibold px-4 py-2 rounded-lg cursor-pointer border border-slate-900 bg-slate-900 text-white hover:opacity-90 transition-opacity shadow-xs"
          >
            {isSent ? 'Update & Re-send' : 'Send to buyer'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-[22px] mx-7 mt-[22px] mb-10 items-start">
        {/* Key Terms Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden row-span-2">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-[15px] font-bold text-slate-900 m-0">Key terms</h2>
            <span className="text-[12px] text-slate-400 font-medium">Editable draft</span>
          </div>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="w-[190px] text-slate-500 px-5 py-3 border-b border-slate-100 align-top text-[13px]">Purchase price</td>
                <td className="px-5 py-3 border-b border-slate-100 align-top">
                  <input
                    type="text"
                    value={keyTerms.purchasePrice}
                    onChange={(e) => handleTermChange('purchasePrice', e.target.value)}
                    className="w-full font-medium text-[13px] text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-[#F8F9FB] outline-none focus:border-slate-900 focus:bg-white transition-colors"
                  />
                </td>
              </tr>
              <tr>
                <td className="w-[190px] text-slate-500 px-5 py-3 border-b border-slate-100 align-top text-[13px]">Structure</td>
                <td className="px-5 py-3 border-b border-slate-100 align-top">
                  <input
                    type="text"
                    value={keyTerms.structure}
                    onChange={(e) => handleTermChange('structure', e.target.value)}
                    className="w-full font-medium text-[13px] text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-[#F8F9FB] outline-none focus:border-slate-900 focus:bg-white transition-colors"
                  />
                </td>
              </tr>
              <tr>
                <td className="w-[190px] text-slate-500 px-5 py-3 border-b border-slate-100 align-top text-[13px]">Expected close</td>
                <td className="px-5 py-3 border-b border-slate-100 align-top">
                  <input
                    type="text"
                    value={keyTerms.expectedClose}
                    onChange={(e) => handleTermChange('expectedClose', e.target.value)}
                    className="w-full font-medium text-[13px] text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-[#F8F9FB] outline-none focus:border-slate-900 focus:bg-white transition-colors"
                  />
                </td>
              </tr>
              <tr>
                <td className="w-[190px] text-slate-500 px-5 py-3 border-b border-slate-100 align-top text-[13px]">Exclusivity period</td>
                <td className="px-5 py-3 border-b border-slate-100 align-top">
                  <input
                    type="text"
                    value={keyTerms.exclusivityPeriod}
                    onChange={(e) => handleTermChange('exclusivityPeriod', e.target.value)}
                    className="w-full font-medium text-[13px] text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-[#F8F9FB] outline-none focus:border-slate-900 focus:bg-white transition-colors"
                  />
                </td>
              </tr>
              <tr>
                <td className="w-[190px] text-slate-500 px-5 py-3 border-b border-slate-100 align-top text-[13px]">Key employee retention</td>
                <td className="px-5 py-3 border-b border-slate-100 align-top">
                  <input
                    type="text"
                    value={keyTerms.keyEmployeeRetention}
                    onChange={(e) => handleTermChange('keyEmployeeRetention', e.target.value)}
                    className="w-full font-medium text-[13px] text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-[#F8F9FB] outline-none focus:border-slate-900 focus:bg-white transition-colors"
                  />
                </td>
              </tr>
              <tr>
                <td className="w-[190px] text-slate-500 px-5 py-3 border-b border-slate-100 align-top text-[13px]">Escrow</td>
                <td className="px-5 py-3 border-b border-slate-100 align-top">
                  <input
                    type="text"
                    value={keyTerms.escrow}
                    onChange={(e) => handleTermChange('escrow', e.target.value)}
                    className="w-full font-medium text-[13px] text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-[#F8F9FB] outline-none focus:border-slate-900 focus:bg-white transition-colors"
                  />
                </td>
              </tr>
              <tr>
                <td className="w-[190px] text-slate-500 px-5 py-3 border-b border-slate-100 align-top text-[13px]">Regulatory conditions</td>
                <td className="px-5 py-3 border-b border-slate-100 align-top">
                  <input
                    type="text"
                    value={keyTerms.regulatoryConditions}
                    onChange={(e) => handleTermChange('regulatoryConditions', e.target.value)}
                    className="w-full font-medium text-[13px] text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-[#F8F9FB] outline-none focus:border-slate-900 focus:bg-white transition-colors"
                  />
                </td>
              </tr>
              <tr>
                <td className="w-[190px] text-slate-500 px-5 py-3 align-top text-[13px]">Governing law</td>
                <td className="px-5 py-3 align-top">
                  <input
                    type="text"
                    value={keyTerms.governingLaw}
                    onChange={(e) => handleTermChange('governingLaw', e.target.value)}
                    className="w-full font-medium text-[13px] text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-[#F8F9FB] outline-none focus:border-slate-900 focus:bg-white transition-colors"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

              </div>
    </div>
  );
}
