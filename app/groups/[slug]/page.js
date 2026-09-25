"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaUserPlus, FaCog, FaEllipsisV, FaTrash } from "react-icons/fa";

export default function DynamicGroupPage() {
    const params = useParams();
    const router = useRouter();
    const groupSlug = params.slug;




    
    const [members, setMembers] = useState([]);
    const [guestLead, setGuestLead] = useState(null);
    const [groupData, setGroupData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [showToast, setShowToast] = useState(false);
    const [toastMsg, setToastMsg] = useState("");

    const [canAddMembers, setCanAddMembers] = useState(false);
    const [canRemoveMembers, setCanRemoveMembers] = useState(false);
    const [canEditPermissions, setCanEditPermissions] = useState(false);

    const [session, setSession] = useState(null);
    const [openDropdownId, setOpenDropdownId] = useState(null);

    useEffect(() => {
        const rawSession = localStorage.getItem("vdr_session");
        if (rawSession) setSession(JSON.parse(rawSession));
        else router.push('/login');
    }, [router]);

    // ── HITS THE NEW DETAILS API ──
    useEffect(() => {
        if (!groupSlug || !session) return;
        
        const fetchGroupDetails = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/groups/details', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session, groupSlug })
                });
                const data = await res.json();
                
                if (data.success) {
                    setGroupData(data.group);
                    const sortedMembers = [...(data.members || [])].sort((a, b) => {
                        if (a.id === session?.id) return -1;
                        if (b.id === session?.id) return 1;
                        return 0;
                    });
                    setMembers(sortedMembers);
                    setCanAddMembers(data.canAddMembers);
                    setCanRemoveMembers(data.canRemoveMembers);
                    setCanEditPermissions(data.canEditPermissions);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchGroupDetails();
    }, [groupSlug, session]);

    const handleRemoveMember = async (userId) => {
        if (!groupData) return;
        const confirm = window.confirm("Are you sure you want to remove this member?");
        if (!confirm) return;

        try {
            const res = await fetch('/api/groups/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session, groupId: groupData.id, userIdToRemove: userId })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            setMembers(prev => prev.filter(m => m.id !== userId));
            triggerToast("Member removed successfully");
        } catch (err) {
            alert("Failed to remove member: " + err.message);
        }
    };

    const triggerToast = (msg) => {
        setToastMsg(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden font-sans bg-[#F8FAFC] relative">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[var(--brand)]/10 to-transparent pointer-events-none transition-colors duration-500"></div>

            {/* TOAST */}
            {showToast && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[var(--brand-dark)] text-white px-6 py-3 rounded-full shadow-2xl z-[100] animate-in slide-in-from-bottom-8 fade-in duration-300 font-medium font-sans text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    {toastMsg}
                </div>
            )}

            {/* HEADER */}
            <div className="pt-10 px-10 pb-6 shrink-0 relative z-10">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-[var(--brand)] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                                {groupData?.name?.charAt(0).toUpperCase() || "G"}
                            </div>
                            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
                                {groupData ? `${groupData.name} Group` : "Loading..."}
                            </h1>
                        </div>
                        <p className="text-slate-500 text-sm font-medium ml-13 pl-13 max-w-2xl">
                            {groupData?.description || "Manage access and administration settings for members in this group."}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {groupData?.type !== 'individual' && (
                            <>
                                {canAddMembers && (
                                    <button onClick={() => router.push(`/groups/${groupSlug}/invite-member`)}
                                        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-500 shadow-sm active:scale-95 cursor-pointer">
                                        <FaUserPlus size={14} className="text-slate-500" />
                                        <span>Invite Member</span>
                                    </button>
                                )}
                                {canEditPermissions && (
                                    <button onClick={() => router.push(`/groups/${groupSlug}/permissions`)}
                                        className="flex items-center gap-2 bg-gradient-to-r from-[var(--brand)] to-[var(--brand-secondary)] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-500 shadow-[0_8px_30px_rgba(var(--brand-rgb),0.14)] active:scale-95 cursor-pointer">
                                        <FaCog size={14} className="text-white/80" />
                                        <span>Edit Permissions</span>
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-10 pb-12 mt-2 space-y-8">
                <div className="bg-white/80 backdrop-blur-xl border border-gray-200/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col min-h-[400px] hover:border-gray-300 transition-all duration-500">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-semibold text-sm text-slate-700">
                            {(session?.dms_role === 'buyer' || ['guest_admin', 'guest_lead', 'buyer'].includes(session?.role)) ? "Group Members" : "Seller Group Members"}
                        </h3>
                        <span className="bg-slate-200 text-slate-600 font-medium text-xs px-2.5 py-0.5 rounded-full">{members.length}</span>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider w-1/3">Name</th>
                                    <th className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider w-1/3">Email Address</th>
                                    <th className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">Phone</th>
                                    <th className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">Status</th>
                                    {(canRemoveMembers || canEditPermissions) && (
                                        <th className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">Action</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan={(canRemoveMembers || canEditPermissions) ? 5 : 4} className="py-20 text-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto" /></td></tr>
                                ) : members.length === 0 ? (
                                    <tr><td colSpan={(canRemoveMembers || canEditPermissions) ? 5 : 4} className="py-24 text-center font-medium text-slate-500 text-sm">No members assigned to this group yet.</td></tr>
                                ) : (
                                    members.map((member) => (
                                        <tr key={member.id} className="group hover:bg-slate-50/50 transition-colors duration-200">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-semibold shrink-0 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                        {member.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-slate-700 text-sm">{member.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-slate-500 text-sm">{member.email}</td>
                                            <td className="py-4 px-6 text-slate-500 text-sm">{member.phone_number || '—'}</td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${member.status === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
                                                    {member.status}
                                                </span>
                                            </td>
                                            {(canRemoveMembers || canEditPermissions) && (
                                                <td className="py-4 px-6 relative">
                                                    <div className="flex items-center justify-end">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenDropdownId(openDropdownId === member.id ? null : member.id);
                                                            }}
                                                            className="text-slate-400 hover:text-slate-600 p-2 opacity-60 hover:opacity-100 focus:outline-none"
                                                        >
                                                            <FaEllipsisV />
                                                        </button>

                                                        {openDropdownId === member.id && (
                                                            <div className="absolute right-8 top-10 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden py-1">
                                                                {canEditPermissions && (
                                                                    <button 
                                                                        onClick={() => {
                                                                            setOpenDropdownId(null);
                                                                            router.push(`/groups/${groupSlug}/user-permissions/${member.id}`);
                                                                        }}
                                                                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium"
                                                                    >
                                                                        <FaCog className="text-slate-400" />
                                                                        Edit Permissions
                                                                    </button>
                                                                )}
                                                                {canRemoveMembers && groupData?.type !== 'individual' && member.id !== session?.id && (
                                                                    <button 
                                                                        onClick={() => {
                                                                            setOpenDropdownId(null);
                                                                            handleRemoveMember(member.id);
                                                                        }}
                                                                        className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 font-medium"
                                                                    >
                                                                        <FaTrash className="text-rose-400" />
                                                                        Delete
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}



