"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaArrowLeft, FaSearch, FaEllipsisV, FaDownload, FaTimes, FaRegClock, FaFolder, FaFolderOpen, FaPowerOff, FaLock, FaCheckCircle, FaRegCircle, FaThLarge, FaBriefcase, FaUser, FaChartLine, FaRegBell } from "react-icons/fa";
import { useRouter } from "next/navigation";
import NDAModal from "../../../components/NDAModal";

export default function TrackerPage() {
  const [requests, setRequests] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const router = useRouter();

  // NDA Modal State
  const [showNDAModal, setShowNDAModal] = useState(false);
  const [ndaTarget, setNdaTarget] = useState(null);

  useEffect(() => {
    setIsMounted(true);
    const role = localStorage.getItem('userRole');
    if (!role) {
      router.push('/dms/login');
      return;
    }
    const fetchRequests = async () => {
      const buyerId = localStorage.getItem('userId');
      if (!buyerId) return;
      try {
        const res = await fetch(`/api/dms/tracker?buyerId=${buyerId}`);
        if (res.ok) {
          const data = await res.json();
          // Load requests, sort by newest (descending ID)
          setRequests((data.requests || []).sort((a, b) => b.id - a.id));
        }
      } catch (err) {
        console.error("Failed to fetch tracker requests:", err);
      }
    };
    fetchRequests();
  }, []);



  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const getStatusDot = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const filteredRequests = requests.filter(r =>
    r.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = requests.filter(r => r.status?.toLowerCase() === 'pending').length;

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('companyId');
    localStorage.removeItem('userName');
    router.push('/dms/login');
  };

  if (!isMounted) {
    return (
      <div className="flex min-h-screen bg-[#f8fafc]">
        <aside className="w-[72px] bg-[#111827] flex flex-col items-center py-6 shrink-0 h-screen sticky top-0 z-50">
          <div className="w-10 h-10 bg-[#008f70] rounded-md mb-8"></div>
        </aside>
        <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-gray-900 selection:bg-teal-600/20">
      {/* Left Sidebar */}
      <aside className="w-[72px] bg-[#111827] flex flex-col items-center py-6 shrink-0 h-screen sticky top-0 z-50">
        {/* Logo */}
        <div className="w-10 h-10 bg-[#008f70] rounded-md flex items-center justify-center text-white font-bold text-xl mb-8 shadow-sm cursor-pointer hover:bg-[#007058] transition-colors">
          D
        </div>
        
        {/* Nav Icons */}
        <div className="flex flex-col gap-4 w-full items-center">
          {/* Overview */}
          <button 
            onClick={() => { sessionStorage.setItem('marketplaceTab', 'overview'); router.push('/dms/marketplace'); }}
            className="relative p-3 w-full flex justify-center text-white group" 
            title="Overview"
          >
            <div className="p-2.5 rounded-lg hover:bg-[#1f2937] transition-colors">
              <FaThLarge className="w-[20px] h-[20px] text-gray-400 group-hover:text-white transition-colors" />
            </div>
          </button>
          
          {/* Marketplace */}
          <button 
            onClick={() => { sessionStorage.setItem('marketplaceTab', 'marketplace'); router.push('/dms/marketplace'); }}
            className="relative p-3 w-full flex justify-center text-white group" 
            title="Marketplace"
          >
            <div className="p-2.5 rounded-lg hover:bg-[#1f2937] transition-colors">
              <FaBriefcase className="w-[20px] h-[20px] text-gray-400 group-hover:text-white transition-colors" />
            </div>
          </button>
          
          {/* Tracker (Active) */}
          <button 
            className="relative p-3 w-full flex justify-center text-white group" 
            title="Tracker"
          >
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#008f70] rounded-r-md"></div>
            <div className="bg-[#1f2937] p-2.5 rounded-lg">
              <FaChartLine className="w-[20px] h-[20px] text-gray-200" />
            </div>
          </button>
          
          {/* Profile */}
          <button 
            onClick={() => { sessionStorage.setItem('marketplaceTab', 'profile'); router.push('/dms/marketplace'); }}
            className="relative p-3 w-full flex justify-center text-white group mt-1" 
            title="Profile"
          >
            <div className="p-2.5 rounded-lg hover:bg-[#1f2937] transition-colors">
              <FaUser className="w-[20px] h-[20px] text-gray-400 group-hover:text-white transition-colors" />
            </div>
          </button>
        </div>
        
        {/* Bottom Icons */}
        <div className="mt-auto flex flex-col gap-4 text-gray-400 w-full items-center">
          <button 
            className="p-3 hover:text-red-400 transition-colors" 
            title="Logout"
            onClick={handleLogout}
          >
            <FaPowerOff className="w-[22px] h-[22px]" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-[72px] border-b border-gray-200 flex items-center justify-between px-8 bg-white shrink-0 z-40 sticky top-0">
          <div className="flex items-center gap-6">
            <div className="text-[17px] font-bold text-gray-900 tracking-tight capitalize">
              Tracker
            </div>
          </div>
          <div className="flex items-center gap-8">
            <button className="relative text-gray-800 hover:text-black transition-colors">
              <FaRegBell className="w-[20px] h-[20px]" />
              <span className="absolute -top-[2px] -right-[2px] w-2.5 h-2.5 bg-red-600 rounded-full border border-white"></span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#003b5c] font-bold text-[15px] shrink-0">
                TR
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-gray-900 font-bold text-[15px] leading-tight truncate tracking-tight">Tracker View</span>
                <span className="text-gray-500 font-medium text-[13px] leading-tight truncate">Seller</span>
              </div>
            </div>
          </div>
        </header>

        <div className="pt-8 px-4 md:px-8 pb-12 max-w-[1400px] w-full mx-auto">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Deal Access Requests</h1>
            <p className="text-gray-500 text-sm">Review investor profiles and control access to the data room.</p>
          </div>

          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search investors or companies..."
                className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-[#b48629] focus:ring-1 focus:ring-[#b48629] w-64"
              />
            </div>
            <select className="bg-white border border-gray-200 rounded py-2 px-3 text-sm focus:outline-none focus:border-[#b48629]">
              <option>All statuses</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
            <button className="flex items-center gap-2 bg-white border border-gray-200 rounded py-2 px-4 text-sm font-medium hover:bg-gray-50 transition-colors">
              <FaDownload className="text-gray-500" /> Export
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">

          {/* Table Toolbar */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm text-gray-900">All requests</span>
              <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">{requests.length}</span>
            </div>
            {pendingCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                <FaRegClock /> {pendingCount} awaiting review
              </div>
            )}
          </div>

          {/* Table */}
          <div className="">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200 text-[10px] uppercase tracking-widest text-gray-500">
                  <th className="py-4 px-6 font-bold">Date Submitted</th>
                  <th className="py-4 px-6 font-bold">Deal / Project</th>
                  <th className="py-4 px-6 font-bold">Full Name & Email</th>
                  <th className="py-4 px-6 font-bold">Company & Title</th>
                  <th className="py-4 px-6 font-bold">Investor Type</th>
                  <th className="py-4 px-6 font-bold">Status</th>
                  <th className="py-4 px-6 font-bold text-center">NDA</th>
                  <th className="py-4 px-6 font-bold text-center">Deal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-gray-500 text-sm">
                      No access requests found.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6 text-sm text-gray-600 whitespace-nowrap">
                        {req.dateSubmitted || 'Just now'}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">{req.projectName || 'Unknown'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {req.fullName?.split(' ').map(n => n[0]).join('') || '??'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{req.fullName}</p>
                            <p className="text-xs text-gray-500">{req.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-bold text-gray-900">{req.company}</p>
                        <p className="text-xs text-gray-500">{req.jobTitle}</p>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        {req.investorType}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(req.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(req.status)}`}></span>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {req.ndaStatus === 'signed' ? (
                          <div className="flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity" title="NDA Signed">
                            <Image src="/images/verifyed_nda.jpeg" alt="NDA Signed" width={32} height={32} className="rounded-md" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity" title="NDA Pending">
                            <Image src="/images/lock nda.png" alt="NDA Pending" width={32} height={32} className="rounded-md" />
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {req.status?.toLowerCase() === 'approved' || req.status?.toLowerCase() === 'accepted' ? (
                          <button
                            onClick={() => {
                              if (req.ndaStatus === 'signed') {
                                router.push(`/dms/workspace?filterProject=${encodeURIComponent(req.projectName)}&filterDeal=${encodeURIComponent(req.company)}`);
                              } else {
                                setNdaTarget({
                                  proposalId: req.id,
                                  projectName: req.projectName,
                                  dealName: req.company
                                });
                                setShowNDAModal(true);
                              }
                            }}
                            title="Open Deal"
                            className="p-2 text-[#00c875] hover:bg-[#00c875]/10 rounded-full transition-colors flex items-center justify-center mx-auto"
                          >
                            <FaFolderOpen className="text-lg" />
                          </button>
                        ) : (
                          <div className="p-2 text-gray-300 flex items-center justify-center mx-auto" title="Locked until approved">
                            <FaLock className="text-lg" />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* NDA Modal */}
      <NDAModal
        isOpen={showNDAModal}
        onClose={() => setShowNDAModal(false)}
        projectName={ndaTarget?.projectName}
        companyName={ndaTarget?.dealName}
        onAccept={async (signatureData) => {
          if (ndaTarget && ndaTarget.proposalId) {
            try {
              const res = await fetch('/api/dms/tracker/sign-nda', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  proposalId: ndaTarget.proposalId,
                  signatureData
                })
              });

              if (res.ok) {
                // Update local state to show signed status
                setRequests(prev => prev.map(r => r.id === ndaTarget.proposalId ? { ...r, ndaStatus: 'signed' } : r));
                setShowNDAModal(false);
                router.push(`/dms/workspace?filterProject=${encodeURIComponent(ndaTarget.projectName)}&filterDeal=${encodeURIComponent(ndaTarget.dealName)}`);
              } else {
                console.error("Failed to sign NDA");
                alert("Failed to save signature. Please try again.");
              }
            } catch (err) {
              console.error("Error signing NDA:", err);
            }
          }
        }}
      />
      </div>
    </div>
  );
}
