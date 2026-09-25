
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';

const GROUP_ICON = (
    <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>
);

const TRASH_ICON = (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" /><path d="M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
);

export default function GroupsSidebar({ isOpen = true }) {
    const pathname = usePathname();
    const [navItems, setNavItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [newGroupRole, setNewGroupRole] = useState('');
    const [newGroupType, setNewGroupType] = useState('group');
    const [newGroupEmail, setNewGroupEmail] = useState('');
    const [currentUserRole, setCurrentUserRole] = useState('');
    const [isBuyerSide, setIsBuyerSide] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [guestLead, setGuestLead] = useState(null);
    const [sellerMembers, setSellerMembers] = useState([]);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [canCreateGroup, setCanCreateGroup] = useState(false);
    const [canDeleteGroup, setCanDeleteGroup] = useState(false);
    const [canViewBuyer, setCanViewBuyer] = useState(false);
    const [canViewSellerMembers, setCanViewSellerMembers] = useState(false);
    const [canViewSellerGroups, setCanViewSellerGroups] = useState(false);

    useEffect(() => {
        const fetchGroups = async () => {
            setIsLoading(true);
            const rawSession = localStorage.getItem('vdr_session');
            const session = rawSession ? JSON.parse(rawSession) : null;
            const userRole = session?.role;
            const userId = session?.id;
            const companyId = session?.company_id;
            const dmsRole = session?.dms_role || localStorage.getItem('userRole') || '';
            const isBuyer = dmsRole === 'buyer' || userRole === 'guest_admin' || userRole === 'guest_lead' || userRole === 'buyer';
            setIsBuyerSide(isBuyer);
            setCurrentUserRole(userRole || '');
            let individualGroups = [];
            
            let localCanViewBuyer = false;
            let localCanViewSellerMembers = false;
            let localCanViewSellerGroups = false;

            // Check create/delete group permissions and visibility permissions
            if (userRole === 'super_admin') {
                setCanCreateGroup(true);
                setCanDeleteGroup(true);
                localCanViewBuyer = true;
                localCanViewSellerMembers = true;
                localCanViewSellerGroups = true;
                setCanViewBuyer(true);
                setCanViewSellerMembers(true);
                setCanViewSellerGroups(true);
            } else {
                if (session?.active_workspace_id && (userRole === 'guest_admin' || userRole === 'buyer' || userRole === 'external_user')) {
                    const { data: deal } = await supabase
                        .from('dms_deals')
                        .select('guest_can_create_groups')
                        .eq('id', session.active_workspace_id)
                        .single();
                    if (deal) {
                        setCanCreateGroup(!!deal.guest_can_create_groups);
                        setCanDeleteGroup(!!deal.guest_can_create_groups);
                    }
                }

                const { data: ugRows } = await supabase
                    .from('user_groups')
                    .select('group_id')
                    .eq('user_id', userId);

                const groupIds = ugRows?.map(r => r.group_id) || [];

                if (groupIds.length > 0) {
                    const { data: perms } = await supabase
                        .from('permissions')
                        .select('can_create_group, can_delete_group, can_view_buyer, can_view_seller_members, can_view_seller_groups')
                        .eq('company_id', companyId)
                        .eq('scope', 'workspace')
                        .in('group_id', groupIds);

                    if (perms && perms.length > 0) {
                        if (perms.some(p => p.can_create_group)) setCanCreateGroup(true);
                        if (perms.some(p => p.can_delete_group)) setCanDeleteGroup(true);
                        
                        localCanViewBuyer = perms.some(p => p.can_view_buyer);
                        localCanViewSellerMembers = perms.some(p => p.can_view_seller_members);
                        localCanViewSellerGroups = perms.some(p => p.can_view_seller_groups);
                        
                        setCanViewBuyer(localCanViewBuyer);
                        setCanViewSellerMembers(localCanViewSellerMembers);
                        setCanViewSellerGroups(localCanViewSellerGroups);
                    }
                }
            }

            let query = supabase
                .from('groups')
                .select('*')
                .eq('company_id', companyId)
                .order('created_at', { ascending: false });

            if (session?.active_workspace_id) query = query.eq('workspace_id', session.active_workspace_id);
            else query = query.is('workspace_id', null);

            const { data } = await query;

            let allGroups = data || [];
            individualGroups = allGroups.filter(g => g.type === 'individual');
            let groups = allGroups.filter(g => g.type !== 'individual');

            // If user has localCanViewSellerGroups or is super_admin, they can view all workspace seller groups!
            if (userRole !== 'super_admin' && !localCanViewSellerGroups) {
                // User does not have permission to view all seller groups.
                // Restrict to groups the user belongs to:
                const { data: ugRows } = await supabase
                    .from('user_groups')
                    .select('group_id')
                    .eq('user_id', userId);

                const myGroupIds = new Set((ugRows || []).map(r => r.group_id));

                if (userRole === 'admin') {
                    groups = groups.filter(g => myGroupIds.has(g.id) || g.role === 'admin');
                } else if (isBuyer) {
                    groups = groups.filter(g => myGroupIds.has(g.id) || g.created_by === userId || ['guest_admin', 'guest_lead', 'external_user'].includes(g.role));
                } else {
                    groups = groups.filter(g => myGroupIds.has(g.id));
                }
            }

            if (userRole !== 'super_admin' && !localCanViewSellerMembers) {
                individualGroups = [];
            }

            const roleOrder = { 
                'super_admin': 1, 
                'admin': 2, 
                'sub_admin': 3, 
                'internal_user': 4,
                'guest_admin': 5, 
                'guest_lead': 6, 
                'external_user': 7 
            };
            groups.sort((a, b) => {
                const orderA = roleOrder[a.role] || 99;
                const orderB = roleOrder[b.role] || 99;
                if (orderA !== orderB) return orderA - orderB;
                return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            });

            setNavItems(groups.map(g => ({
                id: g.id, name: g.name, href: `/groups/${g.id}`, role: g.role || ''
            })));

            // Fetch Guest Lead if in a workspace
            if (session?.active_workspace_id) {
                const { data: deal } = await supabase
                    .from('dms_deals')
                    .select('buyer_id')
                    .eq('id', session.active_workspace_id)
                    .single();
                    
                if (deal?.buyer_id) {
                    const { data: lead } = await supabase
                        .from('users')
                        .select('id, name, email, role')
                        .eq('id', deal.buyer_id)
                        .single();
                    if (lead) setGuestLead(lead);
                }
            }

            // Fetch Seller Members (Internal users)
            if (companyId) {
                let sellersQuery = supabase
                    .from('users')
                    .select('id, name, email, role')
                    .eq('company_id', companyId)
                    .in('role', ['super_admin', 'admin', 'sub_admin', 'user', 'internal_user']);
                
                if (userRole !== 'super_admin' && !localCanViewSellerMembers) {
                    // Dummy condition to fetch nothing
                    sellersQuery = sellersQuery.eq('id', '00000000-0000-0000-0000-000000000000');
                }
                
                const { data: sellers } = await sellersQuery;

                const formattedIndividuals = individualGroups.map(g => ({
                    id: g.id,
                    name: g.name,
                    email: g.name,
                    role: g.role || '',
                    isIndividualGroup: true
                }));
                
                if (sellers) {
                    setSellerMembers([...formattedIndividuals, ...sellers]);
                } else {
                    setSellerMembers(formattedIndividuals);
                }
            }

            setIsLoading(false);
        };

        fetchGroups();
    }, []);

    const handleDeleteGroup = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);

        try {
            if (deleteTarget.isUser) {
                const { error } = await supabase.from('users').delete().eq('id', deleteTarget.id);
                if (error) throw error;
                setSellerMembers(prev => prev.filter(s => s.id !== deleteTarget.id));
            } else {
                await supabase.from('invitations').delete().eq('group_id', deleteTarget.id);
                
                const { error } = await supabase.from('groups').delete().eq('id', deleteTarget.id);
                if (error) throw error;
                
                if (deleteTarget.isIndividualGroup) {
                    setSellerMembers(prev => prev.filter(s => s.id !== deleteTarget.id));
                } else {
                    setNavItems(prev => prev.filter(g => g.id !== deleteTarget.id));
                }
            }
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Delete failed: " + err.message);
        }

        setIsDeleting(false);
        setDeleteTarget(null);
    };

    const handleCreateGroup = async () => {
        const isIndividual = newGroupType === 'individual';
        if (isSubmitting) return;
        if (isIndividual && !newGroupEmail.trim()) return;
        if (!isIndividual && !newGroupName.trim()) return;

        setIsSubmitting(true);
        try {
            const session = JSON.parse(localStorage.getItem('vdr_session'));
            const finalGroupName = isIndividual ? newGroupEmail.trim() : newGroupName.trim();
            const { data, error } = await supabase.from('groups').insert({
                name: finalGroupName,
                description: newGroupDescription.trim() || null,
                role: newGroupRole,
                type: newGroupType,
                company_id: session?.company_id,
                workspace_id: session?.active_workspace_id || null,
                created_by: session?.id
            }).select().single();

            if (!error && data) {
                // Insert Default Permissions based on Role
                let workspacePerms = {
                    company_id: session?.company_id,
                    group_id: data.id,
                    scope: 'workspace',
                };
                
                if (newGroupRole === 'admin') {
                    workspacePerms = { ...workspacePerms, can_access_documents: true, can_access_groups: true, can_access_tasks: true, can_access_communication: true, can_redaction: true, can_access_qa: true, can_access_settings: true };
                } else if (newGroupRole === 'sub_admin') {
                    workspacePerms = { ...workspacePerms, can_access_documents: true, can_access_groups: true, can_access_tasks: true, can_access_communication: true, can_access_qa: true, can_access_settings: true };
                } else if (newGroupRole === 'internal_user') {
                    workspacePerms = { ...workspacePerms, can_access_documents: true, can_access_communication: true, can_access_qa: true, can_access_settings: true };
                } else if (newGroupRole === 'guest_admin') {
                    workspacePerms = { ...workspacePerms, can_access_documents: true, can_access_groups: true, can_access_tasks: true, can_access_communication: true, can_access_qa: true };
                } else if (newGroupRole === 'guest_lead') {
                    workspacePerms = { ...workspacePerms, can_access_documents: true, can_access_groups: true, can_access_qa: true };
                } else if (newGroupRole === 'external_user') {
                    workspacePerms = { ...workspacePerms, can_access_documents: true, can_access_qa: true };
                }
                
                if (['admin', 'sub_admin', 'internal_user', 'guest_admin', 'guest_lead', 'external_user'].includes(newGroupRole)) {
                    await supabase.from('permissions').insert([workspacePerms]);
                }

                if (session?.id && data?.id) {
                    await supabase.from('user_groups').insert({
                        user_id: session.id,
                        group_id: data.id
                    });
                }
                if (newGroupType === 'individual' && newGroupEmail.trim()) {
                    try {
                        const inviteRes = await fetch('/api/invite', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                email: newGroupEmail.trim(),
                                description: newGroupDescription.trim(),
                                group_id: data.id,
                                invited_by: session?.id,
                                requires_nda: false
                            })
                        });
                        const inviteData = await inviteRes.json();
                        if (inviteData.error) {
                            alert(`Group created but invite failed: ${inviteData.error}`);
                        } else {
                            alert(`Individual created and invite generated successfully!\\n\\nInvite Link (also printed in terminal):\\n${inviteData.registrationUrl}`);
                        }
                    } catch (err) {
                        console.error("Failed to send invite:", err);
                        alert("Group created but failed to trigger invite: " + err.message);
                    }
                }

                if (isIndividual) {
                    setSellerMembers(prev => [{
                        id: data.id,
                        name: data.name,
                        email: data.name,
                        role: data.role || '',
                        isIndividualGroup: true
                    }, ...prev]);
                } else {
                    setNavItems(prev => [{
                        id: data.id,
                        name: data.name,
                        href: `/groups/${data.id}`,
                        role: data.role || ''
                    }, ...prev]);
                }
                
                setIsAddGroupModalOpen(false);
                setNewGroupName('');
                setNewGroupDescription('');
                setNewGroupRole('');
                setNewGroupType('group');
                setNewGroupEmail('');
            } else {
                alert(`Failed to create group: ${error?.message || 'Unknown error'}`);
                console.error("Group creation error:", error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <aside className={`${isOpen ? 'w-64 border-r border-gray-200' : 'w-0 border-r-0'} transition-all duration-300 bg-white flex flex-col h-screen sticky top-0 shrink-0 font-sans`}>
                <div className="flex-1 overflow-y-auto pb-6">
                    {guestLead && (currentUserRole === 'super_admin' || canViewBuyer) && (
                        <>
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-[14px] font-bold font-sans text-gray-800 tracking-tight uppercase">Buyer Member</h2>
                            </div>
                            <nav className="py-3 space-y-1 mb-2">
                                <Link
                                    href="/groups/buyer-member"
                                    className={`group flex items-center gap-3 mx-3 px-3.5 py-2.5 rounded-xl transition-all ${
                                        pathname === '/groups/buyer-member' 
                                        ? 'bg-[var(--brand-50)] text-[var(--brand)] font-bold'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all shadow-sm
                                        ${pathname === '/groups/buyer-member' ? "bg-[var(--brand)] text-white" : "bg-white text-[var(--brand)] border border-gray-200"}`}>
                                        <span className="font-bold font-sans text-[13px]">{guestLead.name?.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div className="flex flex-col flex-1 truncate">
                                        <span className="font-sans text-[14px] truncate">{guestLead.name}</span>
                                        <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400">Guest Admin</span>
                                    </div>
                                </Link>
                            </nav>
                        </>
                    )}

                    {(currentUserRole === 'super_admin' || sellerMembers.length > 0) && (
                        <>
                            <div className={`p-5 border-b border-gray-100 flex items-center justify-between ${guestLead ? 'border-t mt-2' : ''}`}>
                                <h2 className="text-[14px] font-bold font-sans text-gray-800 tracking-tight uppercase">Seller Members</h2>
                            </div>
                    
                    <nav className="py-3 space-y-1 mb-2">
                        {sellerMembers.map((seller) => (
                            <Link 
                                href={`/groups/${seller.id}`}
                                key={seller.id} 
                                className={`group flex items-center justify-between mx-3 px-3.5 py-2.5 rounded-xl transition-all ${
                                    pathname === `/groups/${seller.id}` 
                                    ? 'bg-[var(--brand-50)] text-[var(--brand)] font-bold'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center gap-3 truncate">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all shadow-sm ${
                                        pathname === `/groups/${seller.id}` ? "bg-[var(--brand)] text-white" : "bg-white text-[var(--brand)] border border-gray-200"
                                    }`}>
                                        <span className="font-bold font-sans text-[13px]">{seller.name?.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div className="flex flex-col flex-1 truncate">
                                        <span className="font-sans text-[14px] truncate">{seller.name}</span>
                                        <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400">
                                            {seller.role.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    {canDeleteGroup && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setDeleteTarget({ 
                                                    id: seller.id, 
                                                    name: seller.name, 
                                                    isUser: !seller.isIndividualGroup,
                                                    isIndividualGroup: seller.isIndividualGroup 
                                                });
                                            }}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                            title="Delete member"
                                        >
                                            {TRASH_ICON}
                                        </button>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </nav>
                        </>
                    )}

                    <div className={`p-5 border-b border-gray-100 flex items-center justify-between border-t mt-2`}>
                        <h2 className="text-[14px] font-bold font-sans text-gray-800 tracking-tight uppercase">
                            {isBuyerSide ? 'Group Members' : 'Seller Group Members'}
                        </h2>
                    </div>

                    <nav className="py-3 space-y-1">
                        {isLoading ? (
                            <div className="p-6 space-y-4 animate-pulse"><div className="h-4 bg-gray-100 rounded w-full"></div></div>
                        ) : navItems.length === 0 ? (
                            <div className="px-5 py-4 text-xs text-gray-400 italic">No groups available</div>
                        ) : (
                            navItems.map((item) => {
                                const active = pathname === item.href;
                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        className={`group flex items-center justify-between mx-3 px-3.5 py-2.5 rounded-xl transition-all ${active
                                            ? 'bg-[var(--brand-50)] text-[var(--brand)] font-bold'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={active ? 'text-[var(--brand)]' : 'text-gray-400'}>
                                                {GROUP_ICON}
                                            </svg>
                                            <span className="text-[14px] font-sans truncate max-w-[120px]">{item.name}</span>
                                        </div>

                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            {canDeleteGroup && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setDeleteTarget({ id: item.id, name: item.name });
                                                    }}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                    title="Delete group"
                                                >
                                                    {TRASH_ICON}
                                                </button>
                                            )}
                                            {item.role && (() => {
                                                const roleLabels = {
                                                    super_admin:   'Super Admin',
                                                    admin:         'Admin',
                                                    sub_admin:     'Sub Admin',
                                                    internal_user: 'Internal User',
                                                    user:          'User',
                                                    guest_admin:   'Guest Admin',
                                                    guest_lead:    'Guest Lead',
                                                    external_user: 'External User',
                                                    buyer:         'Buyer',
                                                };
                                                return (
                                                    <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                                                        {roleLabels[item.role] || item.role.replace('_', ' ')}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </nav>
                </div>

                {canCreateGroup && (
                    <div className="p-5 border-t border-gray-100 bg-gray-50/30">
                        <button onClick={() => setIsAddGroupModalOpen(true)} className="w-full py-2.5 bg-[var(--brand)] text-white rounded-lg font-bold font-sans text-[13px] hover:bg-[var(--brand-dark)] transition-all flex items-center justify-center gap-2 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            Add Groups
                        </button>
                    </div>
                )}
            </aside>

            {/* ── Delete Confirmation Modal ─────────────────────────────── */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl font-sans">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                                {TRASH_ICON}
                            </div>
                            <h3 className="text-[16px] font-bold font-sans text-gray-800">Delete Group</h3>
                        </div>
                        <p className="text-[14px] font-sans text-gray-600 mb-1">
                            Are you sure you want to delete
                        </p>
                        <p className="text-[14px] font-bold font-sans text-gray-900 mb-5">
                            "{deleteTarget.name}"?
                        </p>
                        <p className="text-[12px] font-sans text-red-500 mb-6">
                            ⚠ This action cannot be undone. All members in this group will be unlinked.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold font-sans text-[13px] hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteGroup}
                                disabled={isDeleting}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-bold font-sans text-[13px] hover:bg-red-700 transition disabled:opacity-50"
                            >
                                {isDeleting ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add Group Modal ───────────────────────────────────────── */}
            {isAddGroupModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 font-sans">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold font-sans text-gray-800 uppercase ">Create New Group</h3>
                            <button onClick={() => setIsAddGroupModalOpen(false)} className="text-gray-400 hover:text-black font-sans">✕</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold font-sans text-black uppercase tracking-widest mb-2">Type</label>
                                <select
                                    value={newGroupType}
                                    onChange={e => setNewGroupType(e.target.value)}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--brand)] text-black font-sans"
                                >
                                    <option value="group">Group</option>
                                    <option value="individual">Individual</option>
                                </select>
                            </div>
                            {newGroupType !== 'individual' && (
                                <div>
                                    <label className="block text-xs font-bold font-sans text-black uppercase tracking-widest mb-2">Group Name</label>
                                    <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Enter group name..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--brand)] text-black font-sans" />
                                </div>
                            )}
                            {newGroupType === 'individual' && (
                                <div>
                                    <label className="block text-xs font-bold font-sans text-black uppercase tracking-widest mb-2">Email Address</label>
                                    <input type="email" value={newGroupEmail} onChange={e => setNewGroupEmail(e.target.value)} placeholder="Enter email address..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--brand)] text-black font-sans" />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold font-sans text-black uppercase tracking-widest mb-2">Role</label>
                                <select
                                    value={newGroupRole}
                                    onChange={e => setNewGroupRole(e.target.value)}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--brand)] text-black font-sans"
                                >
                                    <option value="" disabled>Select Role</option>
                                    {isBuyerSide ? (
                                        <>
                                            {newGroupType === 'individual' && (
                                                <option value="guest_admin">Guest Admin</option>
                                            )}
                                            <option value="guest_lead">Guest Lead</option>
                                            <option value="external_user">External User</option>
                                        </>
                                    ) : (
                                        <>
                                            {newGroupType === 'individual' && (
                                                <option value="super_admin">Super Admin</option>
                                            )}
                                            <option value="admin">Admin</option>
                                            <option value="sub_admin">Sub Admin</option>
                                            <option value="internal_user">Internal User</option>
                                            <option value="external_user">External User</option>
                                        </>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold font-sans text-black uppercase tracking-widest mb-2">Description</label>
                                <textarea value={newGroupDescription} onChange={e => setNewGroupDescription(e.target.value)} placeholder="Description (Optional)" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[var(--brand)] resize-none text-black font-sans" rows="3" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setIsAddGroupModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold font-sans">Cancel</button>
                                <button onClick={handleCreateGroup} disabled={(newGroupType === 'individual' ? !newGroupEmail.trim() : !newGroupName.trim()) || !newGroupRole || isSubmitting} className="flex-1 py-3 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white rounded-lg font-bold font-sans disabled:opacity-50">
                                    {isSubmitting ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
