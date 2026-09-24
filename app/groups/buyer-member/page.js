"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaCog, FaShieldAlt } from 'react-icons/fa';
import { supabase } from '@/utils/supabase/client';

export default function BuyerMemberPage() {
    const router = useRouter();
    const [guestLead, setGuestLead] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [canEditPermissions, setCanEditPermissions] = useState(false);

    useEffect(() => {
        const fetchBuyerMember = async () => {
            const session = JSON.parse(localStorage.getItem('vdr_session'));
            if (!session) return;
            
            if (session.role === 'super_admin') {
                setCanEditPermissions(true);
            }

            if (session.active_workspace_id) {
                const { data: deal } = await supabase
                    .from('dms_deals')
                    .select('buyer_id')
                    .eq('id', session.active_workspace_id)
                    .single();
                
                if (deal && deal.buyer_id) {
                    const { data: lead } = await supabase
                        .from('users')
                        .select('id, name, email, phone_number, status, role')
                        .eq('id', deal.buyer_id)
                        .single();
                    if (lead) setGuestLead(lead);
                }
            }
            setIsLoading(false);
        };
        fetchBuyerMember();
    }, []);

    if (isLoading) {
        return (
            <div className="flex-1 flex h-screen bg-slate-50">
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand)]"></div>
                </div>
            </div>
        );
    }

    if (!guestLead) {
        return (
            <div className="flex-1 flex h-screen bg-slate-50">
                <div className="flex-1 flex items-center justify-center flex-col text-slate-500">
                    <FaShieldAlt size={32} className="mb-4 text-slate-300" />
                    <h2 className="text-lg font-medium">No Buyer Member Found</h2>
                    <p className="text-sm">There is no buyer associated with this workspace.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex h-screen bg-slate-50 overflow-hidden font-sans">
            
            <div className="flex-1 flex flex-col h-full relative">
                {/* Header */}
                <div className="flex items-center justify-between px-10 py-8 bg-transparent z-10 shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-secondary)] text-white flex items-center justify-center shadow-sm">
                                <span className="font-black text-sm">B</span>
                            </span>
                            Buyer Member
                        </h1>
                        <p className="text-sm text-slate-500 mt-1 font-medium">
                            Manage permissions and settings for the Guest Lead (Buyer).
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-10 pb-12 mt-2">
                    <div className="bg-white/80 backdrop-blur-xl border border-gray-200/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col hover:border-gray-300 transition-all duration-500">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-semibold text-sm text-slate-700">Buyer Member Details</h3>
                            <span className="bg-slate-200 text-slate-600 font-medium text-xs px-2.5 py-0.5 rounded-full">1</span>
                        </div>
                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider w-1/3">Name</th>
                                        <th className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider w-1/3">Email Address</th>
                                        <th className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">Phone</th>
                                        <th className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">Status</th>
                                        {canEditPermissions && (
                                            <th className="py-4 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">Action</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 bg-white">
                                    <tr className="group hover:bg-slate-50/50 transition-colors duration-200">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-semibold shrink-0 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                    {guestLead.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-slate-700 text-sm">{guestLead.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-slate-500 text-sm">{guestLead.email}</td>
                                        <td className="py-4 px-6 text-slate-500 text-sm">{guestLead.phone_number || '—'}</td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${guestLead.status === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
                                                {guestLead.status || 'invited'}
                                            </span>
                                        </td>
                                        {canEditPermissions && (
                                            <td className="py-4 px-6 text-right">
                                                <button onClick={() => router.push(`/groups/buyer-member/user-permissions/${guestLead.id}`)}
                                                    className="flex items-center gap-2 bg-gradient-to-r from-[var(--brand)] to-[var(--brand-secondary)] text-white px-3 py-1.5 rounded-lg font-semibold text-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 shadow-[0_4px_15px_rgba(var(--brand-rgb),0.14)] active:scale-95 cursor-pointer ml-auto">
                                                    <FaCog size={12} className="text-white/90" />
                                                    <span>Edit Permissions</span>
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
