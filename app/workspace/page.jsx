"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaCog, FaPlus, FaTimes, FaShieldAlt, FaCheck, FaDatabase, FaUsers, FaPowerOff, FaEllipsisV, FaExclamationTriangle } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import WorkspaceModal from "@/components/workspaces/WorkspaceModal";

export default function WorkspacePage() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("Active");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState("Loading...");
  const [companyStatus, setCompanyStatus] = useState("active");
  const [toastMessage, setToastMessage] = useState("");
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" });
  const [userRole, setUserRole] = useState("User");
  const [workspaces, setWorkspaces] = useState([]);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [workspaceToDelete, setWorkspaceToDelete] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCompanyData = async () => {
      const sessionData = localStorage.getItem('vdr_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        setUserRole(session.role || "User");

        if (session.company_id) {
          try {
            const res = await fetch(`/api/companies/${session.company_id}`);
            const data = await res.json();
            if (data.company) {
              setCompanyName(data.company.name);
              setCompanyStatus(data.company.status || "active");
              setCompanyDetails(data.company);
            } else {
              setCompanyName("My Workspace");
            }

            // Fetch workspaces
            const wsRes = await fetch(`/api/workspaces?company_id=${session.company_id}&user_id=${session.id}&role=${session.role}`);
            const wsData = await wsRes.json();
            if (wsData.success) {
              setWorkspaces(wsData.workspaces || []);
            }
          } catch (err) {
            console.error("Failed to fetch company or workspaces", err);
            setCompanyName("My Workspace");
          }
        }
      }
    };
    fetchCompanyData();
  }, []);

  const handleCreateWorkspace = async (data) => {
    try {
      const sessionData = localStorage.getItem('vdr_session');
      if (!sessionData) return;
      const session = JSON.parse(sessionData);

      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.dealType ? `${data.type} - ${data.dealType}` : data.type,
          company_id: session.company_id,
          user_id: session.id,
          role: session.role
        })
      });

      const result = await res.json();
      if (result.success) {
        setWorkspaces((prev) => [result.workspace, ...prev]);
        setIsModalOpen(false);
        setNotification({ show: true, message: "Workspace created successfully", type: "success" });
        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
      } else {
        setNotification({ show: true, message: result.error, type: "error" });
        setTimeout(() => setNotification({ show: false, message: "", type: "error" }), 3000);
      }
    } catch (err) {
      console.error("Failed to create workspace", err);
      setNotification({ show: true, message: "Failed to create workspace", type: "error" });
      setTimeout(() => setNotification({ show: false, message: "", type: "error" }), 3000);
    }
  };

  const handleWorkspaceClick = (workspaceId) => {
    const sessionData = localStorage.getItem('vdr_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      const targetWs = workspaces.find(w => w.id === workspaceId);

      const dmsRole = localStorage.getItem('userRole') || session.dms_role;
      const role = session.role || userRole;
      const isBuyerRole = dmsRole === 'buyer' || ['guest_admin', 'guest_lead', 'external_user', 'buyer'].includes(role);

      if (isBuyerRole && targetWs) {
        const stage = (targetWs.current_stage || targetWs.currentStage || 'Preparation').toString().trim().toLowerCase();
        if (stage === 'preparation') {
          setToastMessage("Your deal is now in preparation stage. Once the preparation stage is completed, it is moved to the due diligence stage, then only you will be able to enter the deal.");
          return;
        }
      }

      session.active_workspace_id = workspaceId;
      localStorage.setItem('vdr_session', JSON.stringify(session));
      router.push('/documents');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vdr_session');
    router.push('/login');
  };

  const handleConfirmDelete = async () => {
    if (!workspaceToDelete) return;
    const wsId = workspaceToDelete.id;
    setWorkspaces(workspaces.filter(w => w.id !== wsId));
    setWorkspaceToDelete(null);
    setOpenMenuId(null);

    try {
      await fetch(`/api/workspaces/${wsId}`, { method: 'DELETE' });
    } catch (e) {
      console.error("Failed to delete workspace:", e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 flex flex-col items-center">

      {/* Warning Modal */}
      {toastMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-300">
          <style>{`
            @keyframes popIn {
              0% { transform: scale(0.9); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full flex flex-col items-center text-center animate-[popIn_0.3s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4 shadow-inner">
              <span className="text-amber-500 text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Deal in Preparation</h3>
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 mb-6 text-left">
              <p className="text-slate-700 font-medium text-[14px] leading-relaxed">{toastMessage}</p>
            </div>
            <button
              onClick={() => setToastMessage("")}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors duration-200 cursor-pointer shadow-sm"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Floating Notification */}
      {notification.show && (
        <div className={`fixed top-6 right-6 z-[200] px-6 py-4 rounded-xl shadow-lg border flex items-center gap-3 transition-all animate-[popIn_0.3s_cubic-bezier(0.16,1,0.3,1)] ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            notification.type === 'success' ? 'bg-emerald-200 text-emerald-700' : 'bg-rose-200 text-rose-700'
          }`}>
            {notification.type === 'success' ? <FaCheck size={14} /> : <FaTimes size={14} />}
          </div>
          <p className="font-bold text-sm tracking-wide">{notification.message}</p>
        </div>
      )}

      {/* Top Actions */}
      <div className="w-full max-w-6xl flex justify-end mb-4 md:mb-6">
        <button
          onClick={handleLogout}
          title="Logout"
          className="flex items-center justify-center w-10 h-10 border border-rose-300 text-rose-500 bg-transparent rounded-full hover:bg-rose-50 hover:border-rose-400 transition-colors shadow-sm"
        >
          <FaPowerOff size={16} />
        </button>
      </div>

      {/* Main App Container */}
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 md:p-8 bg-white border-b border-gray-100">

          {/* Left: Deals Title & Role Badge */}
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
              Deals
            </h1>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider">
              {userRole}
            </span>
          </div>

          {/* Right: Controls & Storage */}
          <div className="flex flex-wrap items-center gap-6 md:gap-8 w-full md:w-auto justify-between md:justify-end">

            {/* Status Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors shadow-sm min-w-[110px] justify-between"
              >
                <span>{selectedStatus}</span>
                <FiChevronDown className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                  <button
                    onClick={() => { setSelectedStatus("Active"); setIsDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                  >
                    Active
                    {selectedStatus === "Active" && <FaCheck className="text-emerald-500 text-xs" />}
                  </button>
                  <button
                    onClick={() => { setSelectedStatus("Inactive"); setIsDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                  >
                    Inactive
                    {selectedStatus === "Inactive" && <FaCheck className="text-emerald-500 text-xs" />}
                  </button>
                </div>
              )}
            </div>

            {/* Storage Info Area */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 shadow-sm border border-blue-100/50">
                <FaDatabase size={18} />
              </div>
              <div className="flex flex-col w-48">
                <div className="flex justify-between items-center text-xs font-medium mb-1.5 text-gray-600">
                  <span>0 KB / 50 GB</span>
                  <span className="text-gray-400">(0%)</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
            </div>

            {/* Settings Icon */}
            <button 
              onClick={() => router.push('/workspace_setting')}
              className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-100"
            >
              <FaCog size={20} />
            </button>

          </div>
        </div>

        {/* Content Section: Workspaces Grid */}
        <div className="p-6 md:p-8 bg-slate-50/50 min-h-[400px]">

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

            {/* 1. Add New Workspace Card */}
            {userRole === 'super_admin' && selectedStatus === 'Active' && (
              <button
                onClick={() => {
                  if (companyStatus === 'pending') {
                    setToastMessage("Your package is not assign in business owner pls wait....");
                  } else {
                    setIsModalOpen(true);
                  }
                }}
                className="group w-full h-full text-left focus:outline-none"
              >
                <div className="h-48 border-2 border-dashed border-gray-300 rounded-xl bg-transparent hover:bg-white hover:border-[var(--brand)] hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center cursor-pointer">
                  <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center mb-4 group-hover:bg-[var(--brand)] group-hover:scale-110 transition-all duration-300 shadow-md">
                    <FaPlus size={24} />
                  </div>
                  <span className="text-gray-500 font-medium group-hover:text-slate-800 transition-colors">
                    Add new workspace
                  </span>
                </div>
              </button>
            )}

            {/* Render Filtered Workspaces */}
            {workspaces.filter(ws => {
              const wsStatus = ws.status || 'Active';
              return selectedStatus === 'Active' ? wsStatus === 'Active' : wsStatus === 'Inactive';
            }).map((ws) => (
              <div
                key={ws.id}
                onClick={() => {
                  if ((ws.status || 'Active') === 'Active') {
                    handleWorkspaceClick(ws.id);
                  }
                }}
                className={`group ${(ws.status || 'Active') === 'Active' ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="h-48 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col relative">
                  {/* Top Row: Badge & Menu */}
                  <div className="flex justify-between items-start mb-4 relative">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${(ws.status || 'Active') === 'Active'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-gray-100 text-gray-600'
                      }`}>
                      {ws.status || 'Active'}
                    </span>

                    {userRole !== 'external_user' && (
                      <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === ws.id ? null : ws.id);
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-100"
                      >
                        <FaEllipsisV size={14} />
                      </button>

                      {openMenuId === ws.id && (
                        <div
                          className="absolute right-0 top-full w-32 bg-white rounded-lg shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-gray-100 z-10 py-1 overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={async (e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              const newStatus = (ws.status || 'Active') === 'Active' ? 'Inactive' : 'Active';
                              setWorkspaces(workspaces.map(w => w.id === ws.id ? { ...w, status: newStatus } : w));

                              try {
                                await fetch(`/api/workspaces/${ws.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: newStatus })
                                });
                              } catch (e) { }
                            }}
                          >
                            {(ws.status || 'Active') === 'Active' ? 'Make Inactive' : 'Make Active'}
                          </button>
                          <button
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            onClick={async (e) => {
                              e.stopPropagation();
                              setWorkspaceToDelete(ws);
                              setOpenMenuId(null);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    )}
                  </div>

                  {/* Center Icon & Title */}
                  <div className="flex-1 flex flex-col items-center justify-center -mt-2">
                    <div className="text-slate-800 mb-2 opacity-90 group-hover:opacity-100 transition-opacity">
                      <FaShieldAlt size={32} className="text-[var(--brand)]/80" />
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm text-center line-clamp-2 mb-2">
                      {ws.name}
                    </h3>
                  </div>
                </div>
              </div>
            ))}

            {workspaces.filter(ws => {
              const wsStatus = ws.status || 'Active';
              return selectedStatus === 'Active' ? wsStatus === 'Active' : wsStatus === 'Inactive';
            }).length === 0 && userRole !== 'super_admin' && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
                  <FaShieldAlt size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-700 mb-1">No Deals Assigned</h3>
                <p className="text-sm text-slate-400 max-w-sm">
                  You currently do not have access to any active deals. Please contact your administrator.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>

      <WorkspaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateWorkspace}
        workspaces={workspaces}
      />

      {/* Delete Confirmation Modal */}
      {workspaceToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-sm w-full flex flex-col items-center text-center animate-[popIn_0.3s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-4 shadow-inner">
              <FaExclamationTriangle className="text-rose-500 text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Workspace</h3>
            <p className="text-slate-600 font-medium text-[14px] mb-6">
              Are you sure you want to delete this workspace? This action will move it to the trash.
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setWorkspaceToDelete(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors duration-200 shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Details Modal */}
      {isSubscriptionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-sm w-full flex flex-col animate-[popIn_0.3s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FaCalendarAlt className="text-[var(--brand)]" /> Subscription
              </h2>
              <button onClick={() => setIsSubscriptionModalOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-600 font-medium">Plan</span>
                <span className="text-slate-800 font-bold uppercase text-sm tracking-wide">
                  {companyDetails?.subscription?.plan_name || 'Custom Plan'}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-600 font-medium">Start Date</span>
                <span className="text-slate-800 font-semibold">
                  {companyDetails?.subscription?.start_date ? new Date(companyDetails.subscription.start_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-600 font-medium">Expiry Date</span>
                <span className="text-slate-800 font-semibold">
                  {companyDetails?.subscription?.expiry_date ? new Date(companyDetails.subscription.expiry_date).toLocaleDateString() : 'Lifetime'}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-600 font-medium">Storage Limit</span>
                <span className="text-slate-800 font-semibold">
                  {companyDetails?.subscription?.storage_limit_mb ? `${companyDetails.subscription.storage_limit_mb} MB` : 'Unlimited'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Users Limit</span>
                <span className="text-slate-800 font-semibold">
                  {companyDetails?.subscription?.max_users || 'Unlimited'}
                </span>
              </div>
            </div>
            
            <button 
              onClick={() => setIsSubscriptionModalOpen(false)} 
              className="mt-8 w-full py-3 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-bold rounded-xl transition-colors duration-200 shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
