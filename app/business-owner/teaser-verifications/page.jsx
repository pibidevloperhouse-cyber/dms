"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FaChartPie, FaCheckCircle, FaTimesCircle, FaSearch, FaRegClock, FaCheck, FaTimes, FaUndo, FaEye, FaEllipsisV } from 'react-icons/fa';

export default function TeaserVerificationsPage() {
  const [teasers, setTeasers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [selectedTeaser, setSelectedTeaser] = useState(null);

  // Close dropdown when clicking outside
  const dropdownRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchTeasers();
  }, []);

  const fetchTeasers = async () => {
    try {
      const res = await fetch('/api/business-owner/teasers');
      if (res.ok) {
        const data = await res.json();
        setTeasers(data.teasers || []);
      }
    } catch (err) {
      console.error("Failed to fetch teasers", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (teaserId, projectId, newStatus) => {
    try {
      const res = await fetch('/api/business-owner/teasers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teaserId, projectId, status: newStatus })
      });
      if (res.ok) {
        // Update local state
        setTeasers(prev => prev.map(t => 
          t.id === teaserId ? { ...t, status: newStatus } : t
        ));
      } else {
        alert("Failed to update status");
      }
    } catch (e) {
      console.error("Error updating status", e);
    }
  };

  const filteredTeasers = teasers.filter(t => {
    const matchesSearch = t.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || 
                          (statusFilter === 'Pending' && t.status?.toLowerCase() === 'inactive') ||
                          (statusFilter === 'Active' && t.status?.toLowerCase() === 'active') ||
                          (statusFilter === 'Rejected' && t.status?.toLowerCase() === 'rejected');
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-100 p-8 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[var(--brand)]/10 to-transparent rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <FaChartPie className="text-[var(--brand)] text-2xl" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Teaser Verifications</h1>
          </div>
          <p className="text-slate-500 text-sm">Review and approve project teasers submitted by organizations before they appear in the marketplace.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by project or company name..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50 transition-shadow shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50 shadow-sm min-w-[140px] text-slate-700 cursor-pointer"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending (Inactive)</option>
          <option value="Active">Active</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-100 overflow-visible">
        <div className="w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Project Name</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Company</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Industry</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-6 h-6 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm">Loading teasers...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTeasers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <FaChartPie className="text-4xl mb-4 text-slate-200" />
                      <p className="text-base font-medium text-slate-600 mb-1">No teasers found</p>
                      <p className="text-sm">Try adjusting your filters or search term.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTeasers.map((teaser) => (
                  <tr key={teaser.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <p className="text-sm font-bold text-slate-900">{teaser.projectName || 'Untitled'}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm font-medium text-slate-700">{teaser.companyName || 'Unknown'}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-slate-600">{teaser.industry || 'N/A'}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${
                        teaser.status?.toLowerCase() === 'active' ? 'bg-[#e6fbf2] text-[#00c875]' :
                        teaser.status?.toLowerCase() === 'rejected' ? 'bg-red-50 text-red-600' :
                        'bg-orange-50 text-orange-600'
                      }`}>
                        {teaser.status?.toLowerCase() === 'active' && <FaCheckCircle className="text-[10px]" />}
                        {teaser.status?.toLowerCase() === 'inactive' && <FaRegClock className="text-[10px]" />}
                        {teaser.status?.toLowerCase() === 'rejected' && <FaTimesCircle className="text-[10px]" />}
                        {teaser.status?.toLowerCase() === 'inactive' ? 'Pending' : teaser.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="relative inline-block text-left" ref={openDropdownId === teaser.id ? dropdownRef : null}>
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === teaser.id ? null : teaser.id)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                          <FaEllipsisV />
                        </button>

                        {openDropdownId === teaser.id && (
                          <div className="absolute right-0 bottom-full mb-2 w-40 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-100 z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200">
                            <button 
                              onClick={() => {
                                setSelectedTeaser(teaser);
                                setOpenDropdownId(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                              <FaEye className="text-slate-400" /> Details
                            </button>
                            
                            <button 
                              onClick={() => {
                                handleUpdateStatus(teaser.id, teaser.projectId, 'active');
                                setOpenDropdownId(null);
                              }}
                              disabled={teaser.status?.toLowerCase() === 'active'}
                              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                                teaser.status?.toLowerCase() === 'active' 
                                ? 'text-slate-400 opacity-50 cursor-not-allowed' 
                                : 'text-green-600 hover:bg-green-50'
                              }`}
                            >
                              <FaCheck className={teaser.status?.toLowerCase() === 'active' ? 'text-slate-400' : 'text-green-500'} /> Approve
                            </button>
                            
                            <button 
                              onClick={() => {
                                handleUpdateStatus(teaser.id, teaser.projectId, 'rejected');
                                setOpenDropdownId(null);
                              }}
                              disabled={teaser.status?.toLowerCase() === 'rejected'}
                              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                                teaser.status?.toLowerCase() === 'rejected'
                                ? 'text-slate-400 opacity-50 cursor-not-allowed'
                                : 'text-red-600 hover:bg-red-50'
                              }`}
                            >
                              <FaTimes className={teaser.status?.toLowerCase() === 'rejected' ? 'text-slate-400' : 'text-red-500'} /> Reject
                            </button>
                            
                            <button 
                              onClick={() => {
                                handleUpdateStatus(teaser.id, teaser.projectId, 'inactive');
                                setOpenDropdownId(null);
                              }}
                              disabled={teaser.status?.toLowerCase() !== 'active'}
                              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                                teaser.status?.toLowerCase() !== 'active'
                                ? 'text-slate-400 opacity-50 cursor-not-allowed'
                                : 'text-orange-600 hover:bg-orange-50'
                              }`}
                            >
                              <FaUndo className={teaser.status?.toLowerCase() !== 'active' ? 'text-slate-400' : 'text-orange-500'} /> Revoke
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedTeaser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedTeaser(null)} />
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)]">
                  <FaChartPie className="text-xl" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedTeaser.projectName || 'Untitled Project'}</h2>
                  <p className="text-xs font-medium text-slate-500">ID: {selectedTeaser.projectId}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTeaser(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Section 1 */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider border-b border-slate-100 pb-2">Business Overview</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">Company</span><span className="col-span-2 text-sm font-semibold text-slate-800">{selectedTeaser.companyName}</span></div>
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">Project Type</span><span className="col-span-2 text-sm font-semibold text-slate-800">{selectedTeaser.projectType}</span></div>
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">Industry</span><span className="col-span-2 text-sm font-semibold text-slate-800">{selectedTeaser.industry}</span></div>
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">Sub-Industry</span><span className="col-span-2 text-sm font-semibold text-slate-800">{selectedTeaser.subIndustry}</span></div>
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">Business Model</span><span className="col-span-2 text-sm font-semibold text-slate-800">{selectedTeaser.businessModel}</span></div>
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">Year Founded</span><span className="col-span-2 text-sm font-semibold text-slate-800">{selectedTeaser.yearFounded}</span></div>
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">Employees</span><span className="col-span-2 text-sm font-semibold text-slate-800">{selectedTeaser.employees}</span></div>
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">Legal Structure</span><span className="col-span-2 text-sm font-semibold text-slate-800">{selectedTeaser.legalStructure}</span></div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider border-b border-slate-100 pb-2">Location & Metrics</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">Headquarters</span><span className="col-span-2 text-sm font-semibold text-slate-800">{selectedTeaser.headquarters}</span></div>
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">Locations</span><span className="col-span-2 text-sm font-semibold text-slate-800">{selectedTeaser.operationsLocation ? selectedTeaser.operationsLocation.join(', ') : 'N/A'}</span></div>
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">Customers</span><span className="col-span-2 text-sm font-semibold text-slate-800">{selectedTeaser.totalCustomerCount}</span></div>
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">Top Cust. %</span><span className="col-span-2 text-sm font-semibold text-slate-800">{selectedTeaser.topCustomerPercentRevenue}</span></div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider border-b border-slate-100 pb-2">Deal Expectations</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">Asking Price</span><span className="col-span-2 text-sm font-semibold text-[var(--brand)]">{selectedTeaser.askingPrice}</span></div>
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">Valuation Exp.</span><span className="col-span-2 text-sm font-semibold text-slate-800">{selectedTeaser.valuationExpectation}</span></div>
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">Buyer Types</span><span className="col-span-2 text-sm font-semibold text-slate-800">{selectedTeaser.preferredBuyerTypes ? selectedTeaser.preferredBuyerTypes.join(', ') : 'N/A'}</span></div>
                    </div>
                  </div>
                </div>

                {/* Section 2 */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider border-b border-slate-100 pb-2">Financial Overview</h3>
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">Revenue</span><span className="col-span-2 text-sm font-semibold text-slate-800">{selectedTeaser.revenue}</span></div>
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">Revenue Band</span><span className="col-span-2 text-sm font-semibold text-slate-800">{selectedTeaser.revenueBand}</span></div>
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">EBITDA %</span><span className="col-span-2 text-sm font-semibold text-slate-800">{selectedTeaser.profitabilityEbitdaPercent}</span></div>
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">EBITDA Band</span><span className="col-span-2 text-sm font-semibold text-slate-800">{selectedTeaser.ebitdaBand}</span></div>
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">Gross Margin %</span><span className="col-span-2 text-sm font-semibold text-slate-800">{selectedTeaser.grossMarginPercent}</span></div>
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">Net Profit</span><span className="col-span-2 text-sm font-semibold text-slate-800">{selectedTeaser.netProfit}</span></div>
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">Recurring %</span><span className="col-span-2 text-sm font-semibold text-slate-800">{selectedTeaser.recurringRevenuePercent}</span></div>
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">Growth Rate %</span><span className="col-span-2 text-sm font-semibold text-slate-800">{selectedTeaser.growthRatePercent}</span></div>
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">Debt</span><span className="col-span-2 text-sm font-semibold text-slate-800">{selectedTeaser.debtOnBusiness}</span></div>
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">Working Cap.</span><span className="col-span-2 text-sm font-semibold text-slate-800">{selectedTeaser.workingCapital}</span></div>
                      <div className="grid grid-cols-3 gap-2"><span className="text-xs text-slate-500 font-medium">Add-Backs</span><span className="col-span-2 text-sm font-semibold text-slate-800">{selectedTeaser.addBacks}</span></div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider border-b border-slate-100 pb-2">Narratives</h3>
                    <div className="space-y-4">
                      <div>
                        <span className="block text-xs text-slate-500 font-medium mb-1">Project Description</span>
                        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedTeaser.projectDescription || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500 font-medium mb-1">Business Summary</span>
                        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedTeaser.businessSummary || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500 font-medium mb-1">Investment Mandate</span>
                        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedTeaser.investmentMandate || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500 font-medium mb-1">Key Highlights</span>
                        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedTeaser.keyHighlights || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500 font-medium mb-1">Reason For Sale</span>
                        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedTeaser.reasonForSale || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider border-b border-slate-100 pb-2">Documents</h3>
                    <div className="flex gap-4">
                      {selectedTeaser.profitAndLossUrl ? (
                        <a href={selectedTeaser.profitAndLossUrl} target="_blank" rel="noreferrer" className="flex-1 p-3 bg-blue-50 border border-blue-100 rounded-xl text-center text-sm font-bold text-blue-600 hover:bg-blue-100 transition-colors">
                          View P&L
                        </a>
                      ) : (
                        <div className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-xl text-center text-sm font-medium text-slate-400">
                          No P&L File
                        </div>
                      )}
                      {selectedTeaser.balanceSheetUrl ? (
                        <a href={selectedTeaser.balanceSheetUrl} target="_blank" rel="noreferrer" className="flex-1 p-3 bg-blue-50 border border-blue-100 rounded-xl text-center text-sm font-bold text-blue-600 hover:bg-blue-100 transition-colors">
                          View Balance Sheet
                        </a>
                      ) : (
                        <div className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-xl text-center text-sm font-medium text-slate-400">
                          No Balance Sheet
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
