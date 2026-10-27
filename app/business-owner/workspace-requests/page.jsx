"use client";

import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaBuilding, FaUser, FaEnvelope, FaPhone, FaBox, FaClock, FaExclamationCircle, FaSearch, FaSpinner } from 'react-icons/fa';

export default function BusinessOwnerWorkspaceRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states for approval & rejection
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedApproveRequest, setSelectedApproveRequest] = useState(null);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const url = filter === 'all' 
        ? '/api/request-workspace'
        : `/api/request-workspace?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch requests');
      }
      setRequests(data.requests || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const openApproveModal = (reqItem) => {
    setSelectedApproveRequest(reqItem);
    setApproveModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedApproveRequest) return;
    setActionLoading(selectedApproveRequest.id);
    try {
      const rawSession = localStorage.getItem('vdr_session');
      const adminUser = rawSession ? JSON.parse(rawSession) : { role: 'business_owner' };

      const res = await fetch('/api/approve-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedApproveRequest.id,
          adminUser
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve request');

      // Update state locally
      setRequests(prev => {
        if (filter === 'pending') {
          return prev.filter(r => r.id !== selectedApproveRequest.id);
        }
        return prev.map(r => r.id === selectedApproveRequest.id ? { ...r, status: 'approved' } : r);
      });
      setApproveModalOpen(false);
    } catch (err) {
      console.error("Approval error:", err);
      setError(`Approval error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (reqItem) => {
    setSelectedRequest(reqItem);
    setRejectionReason('');
    setRejectionModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedRequest) return;
    setActionLoading(selectedRequest.id);
    try {
      const rawSession = localStorage.getItem('vdr_session');
      const adminUser = rawSession ? JSON.parse(rawSession) : { role: 'business_owner' };

      const res = await fetch('/api/reject-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          reason: rejectionReason || 'Not approved by executive team',
          adminUser
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject request');

      setRequests(prev => {
        if (filter === 'pending') {
          return prev.filter(r => r.id !== selectedRequest.id);
        }
        return prev.map(r => 
          r.id === selectedRequest.id 
            ? { ...r, status: 'rejected', rejection_reason: rejectionReason } 
            : r
        );
      });
      setRejectionModalOpen(false);
    } catch (err) {
      console.error("Rejection error:", err);
      setError(`Rejection error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.company_name?.toLowerCase().includes(q) ||
      r.admin_name?.toLowerCase().includes(q) ||
      r.admin_email?.toLowerCase().includes(q) ||
      r.plan_id?.toLowerCase().includes(q) ||
      r.plan_name?.toLowerCase().includes(q) ||
      r.deal_name?.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Workspace & Deal Vault Requests</h2>
          <p className="text-sm text-slate-500 mt-1">
            Review and authorize incoming organization registrations and deal data room storage requests
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          {[
            { id: 'pending', label: 'Pending' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'all', label: 'All Requests' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                filter === tab.id
                  ? 'bg-[var(--brand)] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
        <input
          type="text"
          placeholder="Search by company, deal name, applicant, or plan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/40 transition-all shadow-2xs"
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <FaExclamationCircle className="text-rose-500 text-lg shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content Grid / Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <FaSpinner className="text-[var(--brand)] text-3xl animate-spin" />
          <p className="text-slate-500 text-sm">Loading requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <FaBuilding className="text-2xl" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">No requests found</h3>
          <p className="text-sm text-slate-500 mt-1">
            There are currently no requests matching your filter or search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.map(reqItem => (
            <div
              key={reqItem.id}
              className="bg-white hover:bg-slate-50/50 border border-slate-200 rounded-2xl p-6 transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-2xs"
            >
              {/* Left Column: Organization & Admin Info */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FaBuilding className="text-[var(--brand)]" />
                    {reqItem.company_name}
                  </h3>
                  {getStatusBadge(reqItem.status)}
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[var(--brand)]/10 text-[var(--brand)] border border-[var(--brand)]/20">
                    Plan: {reqItem.plan_name || reqItem.plan_id}
                  </span>
                  {reqItem.request_type === 'deal_vault' && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center gap-1.5 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Deal VDR Vault Request
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <FaUser className="text-slate-400 text-xs shrink-0" />
                    <span>{reqItem.super_admin_name || reqItem.admin_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <FaEnvelope className="text-slate-400 text-xs shrink-0" />
                    <a href={`mailto:${reqItem.super_admin_email || reqItem.admin_email}`} className="hover:text-[var(--brand)] transition-colors font-medium">
                      {reqItem.super_admin_email || reqItem.admin_email}
                    </a>
                  </div>
                  {reqItem.applicant_name && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <span className="text-xs text-slate-400 font-semibold shrink-0">Buyer:</span>
                      <span className="font-medium text-slate-800">{reqItem.applicant_name}</span>
                    </div>
                  )}
                  {reqItem.phone && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <FaPhone className="text-slate-400 text-xs shrink-0" />
                      <span>{reqItem.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <FaClock className="text-slate-400" />
                    Requested on {new Date(reqItem.created_at).toLocaleString()}
                  </span>
                  {reqItem.rejection_reason && (
                    <span className="text-rose-600 font-medium">
                      Reason: {reqItem.rejection_reason}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column: Actions */}
              {reqItem.status === 'pending' && (
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => openApproveModal(reqItem)}
                    disabled={actionLoading === reqItem.id}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white shadow-2xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === reqItem.id ? (
                      <FaSpinner className="animate-spin text-sm" />
                    ) : (
                      <FaCheck className="text-xs" />
                    )}
                    <span>Accept</span>
                  </button>

                  <button
                    onClick={() => openRejectModal(reqItem)}
                    disabled={actionLoading === reqItem.id}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaTimes className="text-xs" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Approval Confirmation Modal */}
      {approveModalOpen && selectedApproveRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Approve Request</h3>
              <button
                onClick={() => setApproveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            <p className="text-sm text-slate-600">
              {selectedApproveRequest.request_type === 'deal_vault' ? (
                <>
                  Are you sure you want to approve the VDR vault initialization for <strong className="text-slate-900">{selectedApproveRequest.company_name}</strong> and allocate <strong className="text-[var(--brand)]">{selectedApproveRequest.plan_name}</strong> storage?
                </>
              ) : (
                <>
                  Are you sure you want to approve the workspace request for <strong className="text-slate-900">{selectedApproveRequest.company_name}</strong> and activate their organization?
                </>
              )}
            </p>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs text-slate-600 space-y-1">
              <div><strong className="text-slate-700">Admin Name:</strong> {selectedApproveRequest.super_admin_name || selectedApproveRequest.admin_name}</div>
              <div><strong className="text-slate-700">Admin Email:</strong> {selectedApproveRequest.super_admin_email || selectedApproveRequest.admin_email}</div>
              <div><strong className="text-slate-700">Plan:</strong> {selectedApproveRequest.plan_name}</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setApproveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApprove}
                disabled={actionLoading === selectedApproveRequest.id}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white shadow-2xs transition-all disabled:opacity-50"
              >
                {actionLoading === selectedApproveRequest.id ? <FaSpinner className="animate-spin text-xs" /> : <FaCheck className="text-xs" />}
                <span>Approve & Activate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectionModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Reject Request</h3>
              <button
                onClick={() => setRejectionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            <p className="text-sm text-slate-600">
              You are about to reject the workspace request for <strong className="text-slate-900">{selectedRequest.company_name}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Rejection (Optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide feedback on why this request was not approved..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[var(--brand)]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectionModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoading === selectedRequest.id}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-all disabled:opacity-50"
              >
                {actionLoading === selectedRequest.id && <FaSpinner className="animate-spin text-xs" />}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
