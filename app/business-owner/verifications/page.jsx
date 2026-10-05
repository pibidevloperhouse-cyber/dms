"use client";

import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle, FaClock, FaUserShield, FaSearch, FaUserTag, FaBuilding, FaEye, FaTimes, FaUserTie, FaPhone, FaLinkedin, FaBriefcase, FaMoneyBillWave } from 'react-icons/fa';

export default function IdentityVerificationsPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('buyer'); // 'buyer' or 'seller'
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  
  // Modal state
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/business-owner/verifications');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (userId) => {
    try {
      setActionLoading(userId);
      const response = await fetch(`/api/business-owner/verifications/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'verified' }),
      });
      const data = await response.json();
      
      if (data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, verificationStatus: 'verified', verifiedAt: new Date().toISOString() } : u));
        if (selectedUser?.id === userId) {
          setSelectedUser({ ...selectedUser, verificationStatus: 'verified' });
        }
      } else {
        alert('Failed to verify user');
      }
    } catch (error) {
      console.error('Error verifying user:', error);
      alert('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId) => {
    try {
      setActionLoading(userId);
      const response = await fetch(`/api/business-owner/verifications/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'failed' }),
      });
      const data = await response.json();
      
      if (data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, verificationStatus: 'failed' } : u));
        if (selectedUser?.id === userId) {
          setSelectedUser({ ...selectedUser, verificationStatus: 'failed' });
        }
      } else {
        alert('Failed to reject user');
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = user.dmsRole === activeTab;
    const matchesStatus = filterStatus === 'all' || user.verificationStatus === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700"><FaCheckCircle /> Verified</span>;
      case 'failed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700"><FaTimesCircle /> Rejected</span>;
      case 'pending':
      case 'processing':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700"><FaClock /> Pending</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">Unverified</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FaUserShield className="text-[var(--brand)]" />
            Identity Verifications
          </h1>
          <p className="text-slate-500 text-sm mt-1">Review and approve KYC requests segregated by Buyers and Sellers.</p>
        </div>
      </div>

      {/* Tabs for Segregation */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('buyer')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'buyer' 
              ? 'border-[var(--brand)] text-[var(--brand)]' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Buyers ({users.filter(u => u.dmsRole === 'buyer').length})
        </button>
        <button
          onClick={() => setActiveTab('seller')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'seller' 
              ? 'border-[var(--brand)] text-[var(--brand)]' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Sellers ({users.filter(u => u.dmsRole === 'seller').length})
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}s by name or email...`}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="unverified">Unverified</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="failed">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    Loading verifications...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <FaUserShield className="mx-auto text-4xl text-slate-300 mb-3" />
                    <p className="text-slate-600 font-medium text-lg">No {activeTab}s found</p>
                    <p className="text-slate-400 text-sm">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                          {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {user.companyName ? (
                          <span className="inline-flex items-center gap-1 text-sm text-slate-700 font-medium">
                            <FaBuilding className="text-slate-400 text-xs" /> {user.companyName}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400 italic">Not provided</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user.verificationStatus)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 flex justify-end items-center h-full">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
                      >
                        <FaEye /> Details
                      </button>
                      
                      {user.verificationStatus !== 'verified' && (
                        <button
                          onClick={() => handleVerify(user.id)}
                          disabled={actionLoading === user.id}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-semibold text-xs rounded-lg transition-colors disabled:opacity-50"
                        >
                          Verify
                        </button>
                      )}
                      {user.verificationStatus !== 'failed' && user.verificationStatus !== 'verified' && (
                        <button
                          onClick={() => handleReject(user.id)}
                          disabled={actionLoading === user.id}
                          className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold text-xs rounded-lg transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FaUserTie className="text-[var(--brand)]" />
                {selectedUser.dmsRole === 'buyer' ? 'Buyer Profile Details' : 'Seller Profile Details'}
              </h2>
              <button 
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <FaTimes />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              {/* Header Profile */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-[var(--brand)] text-white flex items-center justify-center text-2xl font-bold shadow-sm">
                  {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedUser.name}</h3>
                  <p className="text-slate-500 text-sm flex items-center gap-2">
                    {selectedUser.email} &bull; {getStatusBadge(selectedUser.verificationStatus)}
                  </p>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                
                {/* Common Details */}
                <div className="col-span-1 md:col-span-2 bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Contact & Identity</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><FaBuilding className="text-slate-400"/> Company Name</p>
                      <p className="font-semibold text-slate-800 text-sm">{selectedUser.companyName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><FaBriefcase className="text-slate-400"/> Job Title</p>
                      <p className="font-semibold text-slate-800 text-sm">{selectedUser.jobTitle || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><FaPhone className="text-slate-400"/> Phone Number</p>
                      <p className="font-semibold text-slate-800 text-sm">{selectedUser.phoneNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5"><FaLinkedin className="text-slate-400"/> LinkedIn Profile</p>
                      {selectedUser.linkedinUrl ? (
                        <a href={selectedUser.linkedinUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline text-sm break-all">
                          {selectedUser.linkedinUrl}
                        </a>
                      ) : (
                        <p className="font-semibold text-slate-800 text-sm">N/A</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Role Specific Details */}
                {selectedUser.dmsRole === 'buyer' && (
                  <div className="col-span-1 md:col-span-2 bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-4">Buyer Mandate</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-blue-600/70 mb-1">Company Type</p>
                        <p className="font-semibold text-slate-800 text-sm">{selectedUser.companyType || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-600/70 mb-1">Investor Type</p>
                        <p className="font-semibold text-slate-800 text-sm">{selectedUser.investorType || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-600/70 mb-1 flex items-center gap-1.5"><FaMoneyBillWave /> Investment Range</p>
                        <p className="font-semibold text-slate-800 text-sm">{selectedUser.investmentRange || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedUser.dmsRole === 'seller' && (
                  <div className="col-span-1 md:col-span-2 bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                    <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-4">Seller Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-emerald-700/70 mb-1">Seller Entity Type</p>
                        <p className="font-semibold text-slate-800 text-sm capitalize">{selectedUser.sellerType || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-700/70 mb-1">Is Broker/Advisor?</p>
                        <p className="font-semibold text-slate-800 text-sm">{selectedUser.isBroker ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
              <button 
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 font-semibold text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
              
              {selectedUser.verificationStatus !== 'verified' && (
                <button
                  onClick={() => handleVerify(selectedUser.id)}
                  disabled={actionLoading === selectedUser.id}
                  className="px-6 py-2 bg-[var(--brand)] text-white hover:bg-teal-700 font-semibold text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  <FaCheckCircle /> Verify {selectedUser.dmsRole}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
