"use client";

import React, { useState, useEffect } from 'react';
import {
  Gavel,
  X,
  Calendar,
  DollarSign,
  UserCheck,
  Send,
  Building,
  ShieldCheck
} from 'lucide-react';
import { useDealWorkflow } from './DealWorkflowContext';

export default function NegotiationInviteModal({ isOpen, onClose }) {
  const {
    dealInfo,
    sendNegotiationInvite,
  } = useDealWorkflow();

  const [askingPrice, setAskingPrice] = useState('12000000');
  // Date only (time removed as requested)
  const [deadlineDate, setDeadlineDate] = useState('2026-11-25');
  const [invitationMessage, setInvitationMessage] = useState(
    'The seller board has approved activating the Negotiation Stage. You are invited to review the asking price and submit your initial binding proposal.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load latest asking price & deadline from DB if available
  useEffect(() => {
    if (isOpen) {
      fetch('/api/bidding/bids?role=super_admin')
        .then(res => res.json())
        .then(data => {
          if (data.round?.askingPrice) {
            setAskingPrice(String(data.round.askingPrice));
          }
          if (data.round?.deadline) {
            try {
              const dt = new Date(data.round.deadline);
              const pad = (n) => String(n).padStart(2, '0');
              const formattedDate = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
              setDeadlineDate(formattedDate);
            } catch (e) {}
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Single static Buyer Guest Admin assigned to this deal
  const buyerGuestAdmin = {
    name: dealInfo?.buyerName || 'Test User',
    company: dealInfo?.buyerCompany || dealInfo?.dealName || 'Test User Deal',
    role: dealInfo?.buyerRole || 'Buyer Guest Admin',
    id: dealInfo?.buyerId || '5082a2ab-a4d7-4ca9-add7-7a2a85bfe9cc',
    email: dealInfo?.buyerEmail || 'admin@testvdr.com',
    ndaStatus: 'signed'
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!askingPrice || isNaN(Number(askingPrice)) || Number(askingPrice) <= 0) {
      alert('Please enter a valid asking price.');
      return;
    }
    if (!deadlineDate) {
      alert('Please select a bid deadline date.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Date-only representation with standard end-of-day deadline
      const deadlineISO = new Date(`${deadlineDate}T23:59:59.000Z`).toISOString();
      const parsedDate = new Date(`${deadlineDate}T00:00:00`);
      const deadlineDisplay = `${parsedDate.getDate()} ${parsedDate.toLocaleString('default', { month: 'short' })} ${parsedDate.getFullYear()}`;

      await sendNegotiationInvite({
        askingPrice: Number(askingPrice),
        deadline: deadlineISO,
        deadlineDisplay,
        invitedBuyerId: buyerGuestAdmin.id,
        invitedBuyerName: buyerGuestAdmin.name,
        message: invitationMessage.trim(),
        dealId: dealInfo?.dealId || '51013f2a-99dd-4405-95fb-f25502053455',
        dealName: dealInfo?.dealName || 'Test User Deal'
      });

      alert(`Negotiation Stage enabled! Formal invitation sent to ${buyerGuestAdmin.name} (${buyerGuestAdmin.company}).`);
      onClose();
    } catch (err) {
      console.error('Error sending negotiation invitation:', err);
      alert('Failed to send negotiation invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedAskingPrice = isNaN(Number(askingPrice))
    ? '$0'
    : `$${(Number(askingPrice) / 1000000).toFixed(1)}M (${Number(askingPrice).toLocaleString()})`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Simple Clean White Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#006666] border border-teal-200 flex items-center justify-center shrink-0">
              <Gavel className="w-4.5 h-4.5 text-[#006666]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Start Negotiation Stage
                </h2>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-teal-50 text-[#006666] px-2 py-0.5 rounded-full border border-teal-200">
                  Stage 3 of 3
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Set asking price, deadline, and invite Buyer Guest Admin to submit their initial bid.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clean Form Body */}
        <form onSubmit={handleSendInvite} className="p-6 overflow-y-auto space-y-4.5 text-slate-800 text-xs bg-white">
          
          {/* 1. Target Deal (Correct Deal Name) */}
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Building className="w-4 h-4 text-[#006666] shrink-0" />
              <div className="min-w-0">
                <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider block">Target Deal</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block">
                  {dealInfo?.dealName || 'Test User Deal'}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider block">Seller</span>
              <span className="text-xs font-bold text-slate-800">
                {dealInfo?.sellerCompany || 'Vishwa Tech'}
              </span>
            </div>
          </div>

          {/* 2. Seller Asking Price */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#006666]" />
                <span>Seller Asking Price (USD $)</span>
              </label>
              <span className="text-xs font-bold text-[#006666] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {formattedAskingPrice}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
              <input
                type="number"
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
                placeholder="12000000"
                step="500000"
                min="100000"
                required
                className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:border-[#006666] focus:ring-2 focus:ring-[#006666]/10 outline-none transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              This asking price will be shown in the buyer's bidding dashboard as the benchmark valuation.
            </p>
          </div>

          {/* 3. Bid Submission Deadline (Date only - no time) */}
          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#006666]" />
              <span>Bid Submission Deadline</span>
            </label>
            <input
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 text-xs focus:border-[#006666] focus:ring-2 focus:ring-[#006666]/10 outline-none transition-all cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Buyers must submit their initial binding proposal on or before this date.
            </p>
          </div>

          {/* 4. Buyer Guest Admin (Static Display - 1 person per deal, no selection) */}
          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#006666]" />
              <span>Buyer Guest Admin</span>
            </label>
            
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#006666] border border-teal-200 flex items-center justify-center font-bold text-xs shrink-0">
                  {(buyerGuestAdmin.name || 'TU').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <span>{buyerGuestAdmin.name}</span>
                    <span className="text-[11px] text-slate-500 font-normal">({buyerGuestAdmin.company})</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {buyerGuestAdmin.role} · {buyerGuestAdmin.email}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>NDA: Signed</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Formal negotiation invitation will be transmitted directly to this Buyer Guest Admin.
            </p>
          </div>

          {/* 5. Invitation Message */}
          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <span>Invitation Note to Buyer</span>
            </label>
            <textarea
              rows="3"
              value={invitationMessage}
              onChange={(e) => setInvitationMessage(e.target.value)}
              placeholder="Add context or notes for the buyer..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 text-xs focus:border-[#006666] focus:ring-2 focus:ring-[#006666]/10 outline-none transition-all resize-y"
            />
          </div>

          {/* Clean Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#006666] hover:bg-[#005252] text-white font-bold text-xs shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Sending...' : 'Send Invite & Enable Negotiation Stage'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
