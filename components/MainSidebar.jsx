"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { NAV_ITEMS } from '@/lib/nav-items';
import WorkspaceStatusBadge from '@/components/workspaces/WorkspaceStatusBadge';
import WorkspacePendingOverlay from '@/components/workspaces/WorkspacePendingOverlay';

export default function MainSidebar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [hasGroupsAccess, setHasGroupsAccess] = useState(false);
  const [hasSettingsAccess, setHasSettingsAccess] = useState(false);
  const [hasQaAccess, setHasQaAccess] = useState(false);
  const [hasDealsAccess, setHasDealsAccess] = useState(false);
  const [hasTasksAccess, setHasTasksAccess] = useState(false);
  const [hasBiddingAccess, setHasBiddingAccess] = useState(false);
  const [hasCommunicationAccess, setHasCommunicationAccess] = useState(false);
  const [hasControlAuditsAccess, setHasControlAuditsAccess] = useState(false);
  const [session, setSession] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [openSubmenuKey, setOpenSubmenuKey] = useState(null);
  const isGroupsActive = pathname?.startsWith('/groups');

  useEffect(() => {
    const rawSession = localStorage.getItem('vdr_session');
    if (!rawSession) return;
    const sessionObj = JSON.parse(rawSession);
    setSession(sessionObj);
    setIsAdmin(sessionObj.role === 'admin');
    setIsSuperAdmin(sessionObj.role === 'super_admin');

    const checkModulePermissions = async () => {
      // 1. Fetch deal features first if in a workspace
      let dealFeatures = null;
      if (sessionObj.active_workspace_id) {
        try {
          const res = await fetch(`/api/dms/deals/${sessionObj.active_workspace_id}`);
          if (res.ok) {
            const { deal } = await res.json();
            if (deal) dealFeatures = deal;
          }
        } catch (e) {
          console.error("Not a deal or failed to fetch deal features", e);
        }
      }

      // 2. Super Admin gets automatic access to all modules (but respects deal feature toggles)
      if (sessionObj.role === 'super_admin') {
        setHasGroupsAccess(!dealFeatures || dealFeatures.featureGroups !== false);
        setHasSettingsAccess(true);
        setHasQaAccess(!dealFeatures || dealFeatures.featureQa !== false);
        setHasDealsAccess(true);
        setHasTasksAccess(!dealFeatures || dealFeatures.featureTasks !== false);
        setHasBiddingAccess(!dealFeatures || dealFeatures.featureBidding !== false);
        setHasCommunicationAccess(!dealFeatures || dealFeatures.featureCommunication !== false);
        setHasControlAuditsAccess(true);
        return;
      }

      // 3. Guest Admin (Buyer Lead) gets features purely from Deal API
      if (['guest_admin', 'buyer', 'external_user'].includes(sessionObj.role)) {
        if (dealFeatures) {
          setHasGroupsAccess(dealFeatures.featureGroups || false);
          setHasSettingsAccess(false);
          setHasDealsAccess(false);
          setHasQaAccess(dealFeatures.featureQa || false);
          setHasTasksAccess(dealFeatures.featureTasks || false);
          setHasBiddingAccess(dealFeatures.featureBidding || false);
          setHasCommunicationAccess(dealFeatures.featureCommunication || false);
          setHasControlAuditsAccess(false);
        }
        return;
      }

      // 4. Everyone else checks group permissions in DB
      const { data: ugRows } = await supabase
        .from('user_groups')
        .select('group_id')
        .eq('user_id', sessionObj.id);

      const groupIds = ugRows?.map(r => r.group_id) || [];
      if (!groupIds.length) return;

      // 5. Check workspace scope permissions
      const { data: perms } = await supabase
        .from('permissions')
        .select('can_access_groups, can_access_settings, can_access_qa, can_access_deals, can_access_tasks, can_access_communication, can_access_control_audits')
        .eq('scope', 'workspace')
        .in('group_id', groupIds);

      // 6. Set module access flags (AND with deal features if present)
      const canAccessGroups = perms?.some(p => p.can_access_groups) && (!dealFeatures || dealFeatures.featureGroups);
      const canAccessSettings = perms?.some(p => p.can_access_settings); // Settings usually not part of deal features
      const canAccessQa = perms?.some(p => p.can_access_qa) && (!dealFeatures || dealFeatures.featureQa);
      const canAccessDeals = perms?.some(p => p.can_access_deals) && (!dealFeatures || dealFeatures.featureBidding);
      const canAccessTasks = perms?.some(p => p.can_access_tasks) && (!dealFeatures || dealFeatures.featureTasks);
      const canAccessCommunication = perms?.some(p => p.can_access_communication) && (!dealFeatures || dealFeatures.featureCommunication);
      const canAccessControlAudits = perms?.some((p) => p.can_access_control_audits);

      setHasGroupsAccess(!!canAccessGroups);
      setHasSettingsAccess(!!canAccessSettings);
      setHasQaAccess(!!canAccessQa);
      setHasDealsAccess(!!canAccessDeals);
      setHasTasksAccess(!!canAccessTasks);
      setHasCommunicationAccess(!!canAccessCommunication);
      setHasControlAuditsAccess(!!canAccessControlAudits);
    };

    checkModulePermissions();
  }, []);

  return (
    <>
      <aside className="w-16 md:w-20 h-screen bg-white/90 backdrop-blur-xl border-r border-gray-200/80 flex flex-col items-center py-6 shrink-0 z-50 shadow-[4px_0_24px_rgba(28,127,159,0.06)]">

        {/* Top Logo — PiBi gradient icon */}
        <Link href="/dashboard" className="w-10 h-10 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-secondary)] rounded-xl flex items-center justify-center mb-8 hover:shadow-lg hover:scale-105 transition-all duration-300 shadow-[var(--brand)]/30 shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </Link>

        {/* Nav Items */}
        <div className="flex flex-col flex-1">
          {NAV_ITEMS.map((item) => {
            if (item.key === 'deals' || item.key === 'teams') return null;
            if (item.key === 'groups' && !hasGroupsAccess) return null;
            if (item.key === 'settings' && !hasSettingsAccess) return null;
            if (item.key === 'analytics' && !isAdmin && !isSuperAdmin) return null;
            if (item.key === 'qa' && !hasQaAccess) return null;
            if (item.key === 'tasks' && !hasTasksAccess) return null;
            if (item.key === 'bidding' && !hasBiddingAccess) return null;
            if (item.key === 'communication' && !hasCommunicationAccess) return null;
            if (item.key === 'control_audits' && !hasControlAuditsAccess) return null;
            // Hide redaction for guest admin (only Documents, Q&A, Bidding, Tasks should be visible)
            if (item.key === 'redaction' && ['guest_admin', 'buyer', 'external_user'].includes(session?.role)) return null;

            const isActive = pathname?.startsWith(item.href);
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isSubmenuOpen = openSubmenuKey === item.key;

            return (
              <div key={item.key} className="relative flex flex-col items-center">
                {hasSubItems ? (
                  <button
                    onClick={() => setOpenSubmenuKey(isSubmenuOpen ? null : item.key)}
                    title={item.label}
                    className="group relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300"
                  >
                    {/* Active left accent bar */}
                    {isActive && (
                      <div className="absolute left-0 w-1 h-7 bg-gradient-to-b from-[var(--brand)] to-[var(--brand-secondary)] rounded-r-full shadow-sm" />
                    )}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive || isSubmenuOpen
                      ? 'bg-[var(--brand)]/12 text-[var(--brand)]'
                      : 'text-gray-400 hover:bg-[var(--brand)]/8 hover:text-[var(--brand)]'
                      }`}>
                      {item.icon}
                    </div>
                    {/* Tooltip */}
                    <span className="absolute left-16 bg-gradient-to-r from-[var(--brand)] to-[var(--brand-secondary)] text-white text-xs font-semibold px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 whitespace-nowrap shadow-xl z-50">
                      {item.label}
                    </span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    title={item.label}
                    className="group relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300"
                  >
                    {/* Active left accent bar */}
                    {isActive && (
                      <div className="absolute left-0 w-1 h-7 bg-gradient-to-b from-[var(--brand)] to-[var(--brand-secondary)] rounded-r-full shadow-sm" />
                    )}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive
                      ? 'bg-[var(--brand)]/12 text-[var(--brand)]'
                      : 'text-gray-400 hover:bg-[var(--brand)]/8 hover:text-[var(--brand)]'
                      }`}>
                      {item.icon}
                    </div>
                    {/* Tooltip */}
                    <span className="absolute left-16 bg-gradient-to-r from-[var(--brand)] to-[var(--brand-secondary)] text-white text-xs font-semibold px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 whitespace-nowrap shadow-xl z-50">
                      {item.label}
                    </span>
                  </Link>
                )}

                {/* Submenu Flyout */}
                {hasSubItems && isSubmenuOpen && (
                  <div className="absolute left-16 top-0 ml-2 w-48 bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.1)] border border-slate-100 p-2 z-[60] flex flex-col gap-1">
                    <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</div>
                    {item.subItems.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setOpenSubmenuKey(null)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isSubActive
                            ? 'bg-[var(--brand)]/10 text-[var(--brand)]'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-[var(--brand)]'
                            }`}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>



        {/* Profile / Sign Out Menu */}
        <div className="flex flex-col items-center mt-auto relative mb-4">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-gray-400 hover:bg-slate-100 hover:text-slate-700 transition-all duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>

          {showProfileMenu && session && (
            <div className="absolute bottom-4 left-full ml-4 w-56 bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.1)] border border-slate-100 p-2 z-50">
              <div className="px-3 py-3 border-b border-slate-100 mb-1 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand)]/10 flex items-center justify-center text-[13px] font-black text-[var(--brand)] shrink-0">
                  {session.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-slate-800 truncate">{session.name}</p>
                  <p className="text-[11px] font-semibold text-slate-400 truncate capitalize">{session.role.replace('_', ' ')}</p>
                </div>
              </div>
              {session.request_status && (
                <div className="px-3 py-2 border-b border-slate-100 mb-1 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Status:</span>
                  <WorkspaceStatusBadge status={session.request_status} />
                </div>
              )}
              <button
                onClick={() => {
                  localStorage.removeItem('vdr_session');
                  window.location.href = '/dms/login';
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] text-rose-500 hover:bg-rose-50 rounded-lg transition-colors font-bold group"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center group-hover:scale-105 transition-transform text-rose-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </div>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}












// "use client";

// import { useEffect, useState } from 'react';
// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import {
//   FaCog,
//   FaShieldAlt,
//   FaHome,
//   FaUsers
// } from "react-icons/fa";

// import {
//   FiShield,
//   FiFolder,
//   FiSettings,
//   FiHome
// } from "react-icons/fi";

// export default function MainSidebar() {
//   const pathname = usePathname();
//   const [user, setUser] = useState(null);
//   const [isMounted, setIsMounted] = useState(false);

//   useEffect(() => {
//     const loadUser = async () => {
//       try {
//         if (typeof window !== 'undefined') {
//           const storedUser = localStorage.getItem('user');
//           if (storedUser) {
//             const parsedUser = JSON.parse(storedUser);
//             // Validate that parsedUser has required fields
//             if (parsedUser && typeof parsedUser === 'object' && parsedUser.name && parsedUser.role) {
//               setUser(parsedUser);
//             } else {
//               // Clear invalid user data
//               localStorage.removeItem('users');
//               setUser(null);
//             }
//           }
//         }
//       } catch (error) {
//         console.error('Error loading user from localStorage:', error);
//         // Clear corrupted data
//         if (typeof window !== 'undefined') {
//           localStorage.removeItem('user');
//         }
//         setUser(null);
//       } finally {
//         setIsMounted(true);
//       }
//     };

//     loadUser();
//   }, []);

//   // Get initials from user name
//   const getInitials = (name) => {
//     if (!name || typeof name !== 'string') return 'U';
//     return name
//       .split(' ')
//       .map(word => word.charAt(0))
//       .join('')
//       .toUpperCase()
//       .slice(0, 2);
//   };

//   const isDocumentsActive = pathname?.startsWith('/documents');
//   const isSettingsActive = pathname?.startsWith('/settings');
//   const isGroupsActive = pathname?.startsWith('/groups');

//   return (
//     <aside className="w-16 md:w-20 bg-white border-r border-gray-200 flex flex-col justify-between items-center py-6 h-full shrink-0 select-none z-50 shadow-sm">
//       <div className="flex flex-col items-center gap-8 w-full">
//         <Link href="/" className="group relative flex items-center justify-center">
//           <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gray-900 to-slate-800 flex items-center justify-center shadow-md shadow-gray-950/10 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
//             <FiShield className="text-white text-lg" strokeWidth={2.8} />
//           </div>
//           <span className="absolute left-16 bg-gray-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300 whitespace-nowrap shadow-xl z-50">
//             SecureVDR Home
//           </span>
//         </Link>
//         <div className="w-8 h-[1px] bg-gray-200" />
//         <nav className="flex flex-col items-center gap-4 w-full px-2">
//           <Link
//             href="/documents"
//             className="group relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300"
//           >
//             {isDocumentsActive && (
//               <div className="absolute left-0 w-1 h-8 bg-gray-900 rounded-r-md" />
//             )}
//             <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isDocumentsActive
//               ? 'bg-gray-100 text-gray-900 shadow-inner font-semibold'
//               : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
//               }`}>
//               <FiFolder className="text-lg md:text-xl transition-transform duration-300 group-hover:scale-110" strokeWidth={2.8} />
//             </div>
//             <span className="absolute left-16 bg-gray-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300 whitespace-nowrap shadow-xl z-50">
//               Documents Vault
//             </span>
//           </Link>
//           <Link
//             href="/groups"
//             className="group relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300"
//           >
//             {isGroupsActive && (
//               <div className="absolute left-0 w-1 h-8 bg-gray-900 rounded-r-md" />
//             )}

//             <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isGroupsActive
//                 ? 'bg-gray-100 text-gray-900 shadow-inner font-semibold'
//                 : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
//               }`}>
//               <FaUsers className="text-lg md:text-xl transition-transform duration-300 group-hover:scale-110" />
//             </div>
//             <span className="absolute left-16 bg-gray-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300 whitespace-nowrap shadow-xl z-50">
//               VDR Groups
//             </span>
//           </Link>
//           <Link
//             href="/settings"
//             className="group relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300"
//           >
//             {isSettingsActive && (
//               <div className="absolute left-0 w-1 h-8 bg-gray-900 rounded-r-md" />
//             )}

//             <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isSettingsActive
//               ? 'bg-gray-100 text-gray-900 shadow-inner font-semibold'
//               : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
//               }`}>
//               <FiSettings className="text-lg md:text-xl transition-transform duration-300 group-hover:scale-110" strokeWidth={2.8} />
//             </div>
//             <span className="absolute left-16 bg-gray-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300 whitespace-nowrap shadow-xl z-50">
//               VDR Settings
//             </span>
//           </Link>
//         </nav>
//       </div>

//       <div className="flex flex-col items-center gap-4 w-full">
//         <Link
//           href="/"
//           className="group relative w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all duration-300"
//         >
//           <FiHome className="text-lg" strokeWidth={2.8} />
//           <span className="absolute left-16 bg-gray-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300 whitespace-nowrap shadow-xl z-50">
//             Exit to Landing
//           </span>
//         </Link>

//         {/* Dynamic User Profile */}
//         {isMounted && (
//           <div className="group relative w-10 h-10 flex items-center justify-center cursor-pointer">
//             <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-800 to-slate-900 flex items-center justify-center text-white text-xs font-bold border-2 border-gray-200 shadow-sm hover:border-gray-400 transition-all duration-300">
//               {user ? getInitials(user.name) : 'U'}
//             </div>
//             <span className="absolute left-16 bg-gray-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300 whitespace-nowrap shadow-xl z-50">
//               {user ? `${user.name} (${user.role})` : 'User'}
//             </span>
//           </div>
//         )}
//       </div>
//     </aside>
//   );
// }