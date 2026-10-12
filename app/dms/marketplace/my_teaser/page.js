"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FaBriefcase, FaRegBookmark } from "react-icons/fa";

export default function MyTeaserPage() {
  const [myTeasers, setMyTeasers] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    const buyerId = localStorage.getItem('userId');

    const fetchMyTeasers = async () => {
      if (buyerId) {
        try {
          const res = await fetch(`/api/dms/tracker?buyerId=${buyerId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.requests && data.requests.length > 0) {
              const dbTeasers = data.requests.map(r => ({
                id: r.id,
                projectId: r.projectId,
                projectName: r.projectName || 'Project',
                industry: r.industry || 'Technology / SaaS',
                geography: r.geography || 'Tamil Nadu',
                overview: r.overview || 'A comprehensive M&A and investment platform designed to connect business owners, buyers, investors, private equity firms, and...',
                dealType: r.dealType || 'Majority Acquisition',
                revenue: r.revenue || '₹5 Crore annually',
                ebitda: r.ebitda || '₹1.5 Crore',
                status: r.status ? (r.status.charAt(0).toUpperCase() + r.status.slice(1)) : 'Pending',
                requestedAt: r.dateSubmitted || 'Just now',
                ndaStatus: r.ndaStatus
              }));
              setMyTeasers(dbTeasers);
              localStorage.setItem('my_requested_teasers', JSON.stringify(dbTeasers));
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.error("Failed to load my teasers from database:", err);
        }
      }

      // Fallback to local storage if API didn't return requests
      const storedTeasers = JSON.parse(localStorage.getItem('my_requested_teasers') || '[]');
      setMyTeasers(storedTeasers);
      setLoading(false);
    };

    fetchMyTeasers();
  }, []);

  if (!isMounted) return null;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'accepted':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-orange-600';
    }
  };

  return (
    <div className="pt-8 px-4 md:px-8 lg:px-12 max-w-[1500px] w-full mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">My Teasers</h1>
        <p className="text-gray-500">Opportunities you have requested access to.</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400">Loading your requested teasers...</div>
      ) : myTeasers.length === 0 ? (
        <div className="p-8 w-full flex flex-col items-center justify-center min-h-[400px]">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center w-full max-w-2xl">
            <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No Teasers Found</h2>
            <p className="text-gray-500 mb-8">
              You haven't requested access to any teasers yet. Go to the marketplace to find deals.
            </p>
            <Link href="/dms/marketplace/find_deal" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#008f70] hover:bg-[#007058]">
              Explore Deals
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {myTeasers.map((opp, idx) => (
            <div key={idx} className="bg-white border border-gray-200 flex flex-col group relative overflow-hidden transition-all duration-300 h-full rounded-xl hover:shadow-[0_4px_25px_rgb(0,0,0,0.04)] hover:-translate-y-1">
              <div className="p-5 flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3 items-center">
                    <div className={`w-10 h-10 rounded flex items-center justify-center text-white font-bold text-sm ${idx % 3 === 0 ? 'bg-[#00527c]' : idx % 3 === 1 ? 'bg-[#007f3f]' : 'bg-[#b27200]'}`}>
                      {opp.projectName ? opp.projectName.substring(0, 2).toUpperCase() : 'JA'}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Access Requested</p>
                      <h3 className="text-base font-bold text-gray-900 leading-tight">
                        {opp.projectName || 'Project Name'}
                      </h3>
                    </div>
                  </div>
                  <button className="text-[#008f70] hover:text-[#007058] transition-colors">
                    <FaRegBookmark className="text-lg" />
                  </button>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center text-[11px] text-gray-600 bg-white px-2.5 py-1 rounded-full font-medium border border-gray-200">
                    {opp.industry || opp.sector || 'Technology / SaaS'}
                  </span>
                  <span className="inline-flex items-center text-[11px] text-gray-600 bg-white px-2.5 py-1 rounded-full font-medium border border-gray-200">
                    {opp.geography || 'Tamil Nadu'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-[13px] text-gray-500 mb-6 line-clamp-2">
                  {opp.overview || opp.businessSummary || 'A comprehensive M&A and investment platform designed to connect business owners, buyers, investors, private equity firms, and...'}
                </p>

                {/* Divider */}
                <div className="h-px bg-gray-100 w-full mb-4 mt-auto"></div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 mb-4">
                  <div>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mb-1 font-medium">
                      <FaBriefcase className="text-gray-300" /> Deal Type
                    </p>
                    <p className="font-semibold text-gray-900 text-[13px]">{opp.dealType || 'Majority Acquisition'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mb-1 font-medium">
                      <span className="w-3 h-3 border border-gray-300 rounded-sm inline-block"></span> Indicative value
                    </p>
                    <p className="font-semibold text-gray-900 text-[13px]">{opp.revenue || '₹5 Crore annually'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mb-1 font-medium">
                      <span className="w-3 h-3 border border-gray-300 rounded-full inline-block"></span> EBITDA
                    </p>
                    <p className="font-semibold text-gray-900 text-[13px]">{opp.ebitda || '₹1.5 Crore'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mb-1 font-medium">
                      <span className="w-3 h-3 border border-gray-300 rounded-sm inline-block"></span> Status
                    </p>
                    <p className={`font-semibold ${getStatusColor(opp.status)} text-[13px]`}>{opp.status || 'Pending'}</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-100 w-full mb-4"></div>

                {/* Footer */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-[11px] text-gray-500 gap-1.5 font-medium">
                    Requested on {opp.requestedAt ? opp.requestedAt : 'Recently'}
                  </div>
                  {opp.status?.toLowerCase() === 'approved' ? (
                    <Link href="/dms/marketplace/workspace" className="text-[13px] font-bold text-[#008f70] hover:text-[#007058]">
                      View Deal
                    </Link>
                  ) : (
                    <Link href={`/dms/teaser?project=${encodeURIComponent(opp.projectName || 'Teaser')}&projectId=${opp.projectId || '1'}`} className="text-[13px] font-bold text-[#008f70] hover:text-[#007058]">
                      View Teaser
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
