"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import GroupSidebar from '@/components/groups/GroupSidebar';

export default function GroupsLayoutWrapper({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkAccess = async () => {
            const rawSession = localStorage.getItem('vdr_session');
            if (!rawSession) { router.push('/login'); return; }
            const session = JSON.parse(rawSession);

            if (session.role === 'super_admin') {
                setIsAuthorized(true);
                return;
            }

            if (session.role === 'guest_admin') {
                const dealId = session.active_workspace_id;
                if (dealId) {
                    try {
                        const res = await fetch(`/api/dms/deals/${dealId}`);
                        if (res.ok) {
                            const { deal } = await res.json();
                            if (deal.featureGroups) {
                                setIsAuthorized(true);
                                return;
                            }
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
                router.push('/documents');
                return;
            }

            const { data: ugRows } = await supabase.from('user_groups').select('group_id').eq('user_id', session.id);
            const groupIds = ugRows?.map(r => r.group_id) || [];

            if (groupIds.length === 0) {
                router.push('/documents');
                return;
            }

            const { data: perms } = await supabase
                .from('permissions')
                .select('can_access_groups')
                .eq('scope', 'workspace')
                .in('group_id', groupIds);

            const hasAccess = perms?.some(p => p.can_access_groups);
            
            if (!hasAccess) router.push('/documents');
            else setIsAuthorized(true);
        };

        checkAccess();
    }, [router]);

    if (!isAuthorized) return <div className="w-full h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div></div>;

    return (
        <>
            <Suspense fallback={<div className="w-64 bg-white border-r border-gray-200 shrink-0 h-full"></div>}>
                <GroupSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
            </Suspense>

            {/* Main Content Area */}
            <main className="flex-1 bg-white relative flex flex-col min-w-0 transition-all duration-300 h-full">
                {/* Toggle button */}
                <div
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`absolute top-6 left-0 -ml-3.5 z-30 hidden md:flex items-center justify-center w-7 h-7 bg-white border border-gray-200 rounded-full shadow-[0_2px_8px_rgb(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgb(0,0,0,0.12)] cursor-pointer text-gray-500 hover:text-gray-900 hover:scale-105 hover:bg-gray-50 transition-all duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </div>

                <div className="flex-1 overflow-y-auto w-full h-full">
                    {children}
                </div>
            </main>
        </>
    );
}
//hard encoded code , url change doesnt work in this code













// "use client";

// import { useState, Suspense } from 'react';
// import GroupSidebar from '@/components/groups/GroupSidebar';

// export default function GroupsLayoutWrapper({ children }) {
//     const [isSidebarOpen, setIsSidebarOpen] = useState(true);

//     return (
//         <>
//             <Suspense fallback={<div className="w-64 bg-white border-r shrink-0 h-full"></div>}>
//                 <GroupSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
//             </Suspense>

//             {/* Main Content Area */}
//             <main className="flex-1 bg-white relative flex flex-col min-w-0 transition-all duration-300 h-full">
//                 {/* Toggle button */}
//                 <div
//                     onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//                     className={`absolute top-6 left-0 -ml-3.5 z-30 hidden md:flex items-center justify-center w-7 h-7 bg-white border border-gray-200 rounded-full shadow-[0_2px_8px_rgb(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgb(0,0,0,0.12)] cursor-pointer text-gray-500 hover:text-gray-900 hover:scale-105 hover:bg-gray-50 transition-all duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`}
//                 >
//                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
//                 </div>

//                 <div className="flex-1 overflow-y-auto w-full h-full">
//                     {children}
//                 </div>
//             </main>
//         </>
//     );
// }