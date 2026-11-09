"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gavel, Check, Clock, FileText, ArrowRight } from 'lucide-react';

export default function BiddingPipelineBanner({
  portal = 'buyer',
  highlightStep,
  dealName: overrideDealName,
  partyName: overridePartyName
}) {
  const [data, setData] = useState({
    dealName: overrideDealName || 'Project Alpha',
    partyName: overridePartyName || (portal === 'buyer' ? 'Naga Tech' : 'ABC Technologies'),
    askingPrice: '$10.0M',
    offerAmount: '$10.0M',
    step1Done: true,
    step2Done: true,
    step3Done: false,
    step4Done: false,
    step5Done: false,
  });

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      try {
        let buyerId = '8ec0af77-0630-444f-8e1c-d362f35a2e13';
        try {
          const raw = localStorage.getItem('vdr_session');
          if (raw) {
            const user = JSON.parse(raw);
            if (user.id) buyerId = user.id;
          }
        } catch (e) {}

        let asking = '$10.0M';
        try {
          const rawInv = localStorage.getItem('dms_negotiation_invitation');
          if (rawInv) {
            const inv = JSON.parse(rawInv);
            if (inv.askingPrice) {
              asking = `$${(Number(inv.askingPrice) / 1000000).toFixed(1)}M`;
            }
          }
        } catch (e) {}

        const roleParam = portal === 'buyer' ? 'guest_admin' : 'super_admin';
        const [bidsRes, tsRes] = await Promise.all([
          fetch(`/api/bidding/bids?role=${roleParam}&buyerId=${encodeURIComponent(buyerId)}`),
          fetch('/api/bidding/term-sheet'),
        ]);

        if (isCancelled) return;

        let bJson = null;
        let tsJson = null;

        if (bidsRes.ok) bJson = await bidsRes.json();
        if (tsRes.ok) tsJson = await tsRes.json();

        const round = bJson?.round;
        const myBid = bJson?.myBid;
        const bids = bJson?.bids || {};
        const termSheet = tsJson?.termSheet;

        let activeBid = myBid;
        if (!activeBid) {
          const all = Object.values(bids);
          activeBid = all.find(b => b.status === 'Accepted') || all.find(b => b.status === 'Shortlisted') || all[0];
        }

        if (round?.askingPrice) {
          asking = `$${(Number(round.askingPrice) / 1000000).toFixed(1)}M`;
        }

        const offer = activeBid?.offer || (activeBid?.offerAmount ? `$${(Number(activeBid.offerAmount) / 1000000).toFixed(1)}M` : asking);
        const resolvedDealName = overrideDealName || round?.dealName || termSheet?.dealName || 'Project Alpha';
        const resolvedPartyName = overridePartyName || (portal === 'buyer' ? (activeBid?.name || 'Naga Tech') : 'ABC Technologies');

        const isTermSheetTransmitted = Boolean(
          termSheet && (
            termSheet.status === 'sent_to_buyer' ||
            termSheet.status === 'signed' ||
            termSheet.status === 'signed_by_buyer' ||
            termSheet.status === 'executed' ||
            termSheet.signatures?.buyer
          )
        );

        const step1 = Boolean(asking);
        const step2 = Boolean(activeBid && (activeBid.offerAmount || activeBid.offer || activeBid.status !== 'Draft'));
        const step3 = portal === 'buyer'
          ? Boolean(step2 && isTermSheetTransmitted)
          : Boolean(step2 && (isTermSheetTransmitted || activeBid?.status === 'Accepted'));
        const step4 = Boolean(step3 && termSheet && (termSheet.status === 'signed' || termSheet.status === 'signed_by_buyer' || termSheet.status === 'executed' || termSheet.signatures?.buyer));

        let step5 = false;
        try {
          const rawSpa = localStorage.getItem('dms_spa_agreement_dispatched');
          if (rawSpa) {
            const spa = JSON.parse(rawSpa);
            if (spa.dispatched) step5 = true;
          }
        } catch (e) {}

        if (!isCancelled) {
          setData({
            dealName: resolvedDealName,
            partyName: resolvedPartyName,
            askingPrice: asking,
            offerAmount: offer,
            step1Done: step1,
            step2Done: step2,
            step3Done: step3,
            step4Done: step4,
            step5Done: step5,
          });
        }
      } catch (e) {
        console.error('BiddingPipelineBanner fetch error:', e);
      }
    };

    loadData();

    const handleStorage = () => loadData();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('bid_submitted', handleStorage);

    return () => {
      isCancelled = true;
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('bid_submitted', handleStorage);
    };
  }, [portal, overrideDealName, overridePartyName]);

  const steps = [
    {
      num: 1,
      label: 'Initial Bid Set',
      tag: `Benchmark ${data.askingPrice}`,
      done: data.step1Done,
    },
    {
      num: 2,
      label: portal === 'buyer' ? 'Your Proposal' : 'Counter Party Bid',
      tag: data.step2Done ? data.offerAmount : 'Drafting',
      done: data.step2Done,
    },
    {
      num: 3,
      label: 'Term Sheet Request',
      tag: data.step3Done ? 'Formulated' : (highlightStep === 3 ? 'In Progress' : 'Pending Board'),
      done: data.step3Done,
    },
    {
      num: 4,
      label: 'Term Sheet Signed',
      tag: data.step4Done ? 'Signed' : (highlightStep === 4 ? 'Awaiting Signatures' : 'Pending Signature'),
      done: data.step4Done,
    },
    {
      num: 5,
      label: 'SPA Agreement',
      tag: data.step5Done ? 'Dispatched' : 'Final Closing',
      done: data.step5Done,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-[#006666] border border-teal-200/80">
            <Gavel className="w-3.5 h-3.5" />
            Acquisition Bidding Round
          </span>
          <span className="text-xs font-semibold text-slate-500">
            · Deal: <strong className="text-slate-800">{data.dealName}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
            {portal === 'buyer' ? 'Buyer Portal' : 'Seller Board'} · {data.partyName}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-3.5">
        {steps.map((st) => {
          const isHighlighted = highlightStep === st.num && !st.done;
          return (
            <div
              key={st.num}
              className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                st.done
                  ? 'bg-emerald-50/60 border-emerald-300'
                  : isHighlighted
                  ? 'bg-teal-50/60 border-teal-400 ring-1 ring-teal-300 shadow-2xs'
                  : 'bg-slate-50/70 border-slate-200 opacity-60'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  st.done
                    ? 'bg-emerald-500 text-white shadow-2xs'
                    : isHighlighted
                    ? 'bg-[#006666] text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {st.done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : st.num}
              </div>
              <div className="min-w-0">
                <div className={`text-xs font-bold truncate ${st.done ? 'text-slate-900' : isHighlighted ? 'text-[#006666]' : 'text-slate-600'}`}>
                  {st.label}
                </div>
                <div className={`text-[10px] font-medium truncate ${st.done ? 'text-emerald-700' : isHighlighted ? 'text-teal-700 font-semibold' : 'text-slate-400'}`}>
                  {st.tag}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
