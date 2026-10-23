"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { FaThLarge, FaSearch, FaBriefcase, FaFolderOpen, FaChartLine, FaEnvelope, FaUser, FaPowerOff, FaRegBell, FaFileAlt } from "react-icons/fa";

export default function MarketplaceLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!isMounted || !userRole) return;
    
    const fetchNotifications = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName');
        const companyId = localStorage.getItem('companyId');
        if (!userId && !userName) return;

        let allNotifs = [];

        // 1. If seller, fetch project deal proposals
        if (userRole === 'seller' && companyId) {
          try {
            const vdrRoleItem = localStorage.getItem('vdrRole') || 'super_admin';
            const projRes = await fetch(`/api/dms/projects?companyId=${companyId}&userId=${userId}&role=${vdrRoleItem}`);
            if (projRes.ok) {
              const projData = await projRes.json();
              const projects = projData.projects || [];
              projects.forEach((proj) => {
                const lastViewed = parseInt(typeof window !== 'undefined' ? (localStorage.getItem(`viewed_deal_${proj.id}`) || '0') : '0', 10);
                const isViewed = lastViewed > 0 && (!proj.latestProposalTime || lastViewed >= proj.latestProposalTime);
                if ((proj.pendingProposalsCount || 0) > 0 && !isViewed) {
                  allNotifs.push({
                    id: `proposal-${proj.id}`,
                    type: 'proposal',
                    projectId: proj.id,
                    message: `${proj.pendingProposalsCount === 1 ? '1 new deal proposal' : `${proj.pendingProposalsCount} new deal proposals`} for "${proj.name}"`,
                    time: 'Proposal Awaiting Review',
                    link: `/dms/deal?projectId=${proj.id}&projectName=${encodeURIComponent(proj.name)}`
                  });
                }
              });
            }
          } catch (projErr) {
            console.error("Failed to fetch deal proposals for notifications", projErr);
          }
        }

        // 2. Fetch messages
        try {
          const res = await fetch(`/api/dms/messages?userId=${userId || 'seller-123'}`);
          if (res.ok) {
            const data = await res.json();
            // Filter unread messages sent TO me
            const unread = (data.messages || []).filter(msg => {
              const isFromMe = (msg.senderRole === userRole) || (msg.senderId === userId) || (msg.senderName === userName);
              return !msg.isRead && !isFromMe;
            });
            
            // Map to notification format
            const formattedNotifs = unread.map(msg => ({
              id: msg.id,
              type: 'message',
              message: `New message from ${msg.senderName}`,
              time: new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              link: '/dms/marketplace/inbox',
              senderId: msg.senderId
            }));

            allNotifs = [...allNotifs, ...formattedNotifs];
          }
        } catch (msgErr) {
          console.error("Failed to fetch messages for notifications", msgErr);
        }

        setNotifications(allNotifs);
      } catch (e) {
        console.error("Failed to fetch notifications");
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Poll every 5s
    const handleProposalUpdate = () => fetchNotifications();
    window.addEventListener('deal-proposal-submitted', handleProposalUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('deal-proposal-submitted', handleProposalUpdate);
    };
  }, [isMounted, userRole]);

  useEffect(() => {
    setIsMounted(true);

    const loginTime = localStorage.getItem('loginTimestamp');
    const role = localStorage.getItem('userRole');
    const vdrRole = localStorage.getItem('vdrRole');

    // Also check vdr_session role as fallback
    let actualRole = vdrRole;
    if (!actualRole) {
      const sessionRaw = localStorage.getItem('vdr_session');
      if (sessionRaw) {
        try {
          actualRole = JSON.parse(sessionRaw).role;
        } catch (e) {}
      }
    }

    if (!role || !loginTime) {
      router.push('/dms/login');
      return;
    }

    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
    if (Date.now() - parseInt(loginTime, 10) > TWELVE_HOURS) {
      localStorage.clear();
      router.push('/dms/login');
      return;
    }

    // Role Guard: ONLY super_admin (seller owner) and guest_admin (buyer owner) can access Marketplace!
    // All other invited roles (admin, sub_admin, internal_user, guest_lead, external_user) must stay in VDR!
    const isOwner = actualRole === 'super_admin' || actualRole === 'guest_admin';
    if (!isOwner) {
      router.replace('/workspace');
      return;
    }

    setUserRole(role.toLowerCase());
    setUserName(localStorage.getItem('userName') || 'User');
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('vdrRole');
    localStorage.removeItem('companyId');
    localStorage.removeItem('companyName');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('verificationStatus');
    localStorage.removeItem('loginTimestamp');
    localStorage.removeItem('vdr_session');
    router.push('/dms/login');
  };

  const getIsActive = (path) => pathname === path || pathname.startsWith(path + '/');

  if (!isMounted || !userRole) {
    return (
      <div className="flex min-h-screen bg-[#f8fafc]">
        <aside className="w-[72px] bg-[#111827] flex flex-col items-center py-6 shrink-0 h-screen sticky top-0 z-50">
          <div className="w-10 h-10 bg-[#008f70] rounded-md mb-8"></div>
        </aside>
        <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]"></div>
      </div>
    );
  }

  let title = "Overview";
  if (pathname.includes('/find_deal')) title = userRole === 'seller' ? "Find Buyers" : "Find Deal";
  else if (pathname.includes('/workspace')) title = "Workspace";
  else if (pathname.includes('/tracker')) title = "Tracker";
  else if (pathname.includes('/inbox')) title = "Inbox";
  else if (pathname.includes('/profile')) title = "Profile";
  else if (pathname.includes('/templates')) title = "Message Templates";
  else if (pathname.includes('/my_teaser')) title = "My Teaser";
  else if (pathname.includes('/teaser')) title = "Teasers";

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-gray-900 selection:bg-teal-600/20">
      {/* Sidebar */}
      <aside className="w-[72px] bg-[#111827] flex flex-col items-center py-6 shrink-0 h-screen sticky top-0 z-50">
        <Link href="/dms/marketplace/overview" className="w-10 h-10 bg-[#008f70] rounded-md flex items-center justify-center text-white font-bold text-xl mb-8 shadow-sm cursor-pointer hover:bg-[#007058] transition-colors">
          D
        </Link>
        <div className="flex flex-col gap-4 w-full items-center">
          <Link href="/dms/marketplace/overview" className="relative p-3 w-full flex justify-center text-white group" title="Overview">
            {getIsActive('/dms/marketplace/overview') && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#008f70] rounded-r-md"></div>}
            <div className={`\${getIsActive('/dms/marketplace/overview') ? 'bg-[#1f2937]' : ''} p-2.5 rounded-lg hover:bg-[#1f2937] transition-colors`}>
              <FaThLarge className={`\${getIsActive('/dms/marketplace/overview') ? 'text-gray-200' : 'text-gray-400 group-hover:text-white transition-colors'} w-[20px] h-[20px]`} />
            </div>
          </Link>
          <Link href="/dms/marketplace/find_deal" className="relative p-3 w-full flex justify-center text-white group" title={userRole === 'seller' ? "Find Buyers" : "Find Deal"}>
            {getIsActive('/dms/marketplace/find_deal') && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#008f70] rounded-r-md"></div>}
            <div className={`\${getIsActive('/dms/marketplace/find_deal') ? 'bg-[#1f2937]' : ''} p-2.5 rounded-lg hover:bg-[#1f2937] transition-colors`}>
              <FaSearch className={`\${getIsActive('/dms/marketplace/find_deal') ? 'text-gray-200' : 'text-gray-400 group-hover:text-white transition-colors'} w-[20px] h-[20px]`} />
            </div>
          </Link>
          <Link href="/dms/marketplace/workspace" className="relative p-3 w-full flex justify-center text-white group" title="Workspace">
            {getIsActive('/dms/marketplace/workspace') && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#008f70] rounded-r-md"></div>}
            <div className={`\${getIsActive('/dms/marketplace/workspace') ? 'bg-[#1f2937]' : ''} p-2.5 rounded-lg hover:bg-[#1f2937] transition-colors`}>
              <FaFolderOpen className={`\${getIsActive('/dms/marketplace/workspace') ? 'text-gray-200' : 'text-gray-400 group-hover:text-white transition-colors'} w-[20px] h-[20px]`} />
            </div>
          </Link>
          {userRole !== 'seller' && (
            <Link href="/dms/marketplace/tracker" className="relative p-3 w-full flex justify-center text-white group" title="Tracker">
              {getIsActive('/dms/marketplace/tracker') && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#008f70] rounded-r-md"></div>}
              <div className={`\${getIsActive('/dms/marketplace/tracker') ? 'bg-[#1f2937]' : ''} p-2.5 rounded-lg hover:bg-[#1f2937] transition-colors`}>
                <FaChartLine className={`\${getIsActive('/dms/marketplace/tracker') ? 'text-gray-200' : 'text-gray-400 group-hover:text-white transition-colors'} w-[20px] h-[20px]`} />
              </div>
            </Link>
          )}
          <Link href="/dms/marketplace/inbox" className="relative p-3 w-full flex justify-center text-white group mt-1" title="Inbox">
            {getIsActive('/dms/marketplace/inbox') && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#008f70] rounded-r-md"></div>}
            <div className={`\${getIsActive('/dms/marketplace/inbox') ? 'bg-[#1f2937]' : ''} p-2.5 rounded-lg hover:bg-[#1f2937] transition-colors`}>
              <FaEnvelope className={`\${getIsActive('/dms/marketplace/inbox') ? 'text-gray-200' : 'text-gray-400 group-hover:text-white transition-colors'} w-[20px] h-[20px]`} />
            </div>
          </Link>
          {userRole === 'seller' && (
            <Link href="/dms/marketplace/teaser" className="relative p-3 w-full flex justify-center text-white group mt-1" title="Teaser">
              {getIsActive('/dms/marketplace/teaser') && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#008f70] rounded-r-md"></div>}
              <div className={`\${getIsActive('/dms/marketplace/teaser') ? 'bg-[#1f2937]' : ''} p-2.5 rounded-lg hover:bg-[#1f2937] transition-colors`}>
                <FaBriefcase className={`\${getIsActive('/dms/marketplace/teaser') ? 'text-gray-200' : 'text-gray-400 group-hover:text-white transition-colors'} w-[20px] h-[20px]`} />
              </div>
            </Link>
          )}
          {userRole === 'seller' && (
            <Link href="/dms/marketplace/templates" className="relative p-3 w-full flex justify-center text-white group mt-1" title="Message Templates">
              {getIsActive('/dms/marketplace/templates') && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#008f70] rounded-r-md"></div>}
              <div className={`\${getIsActive('/dms/marketplace/templates') ? 'bg-[#1f2937]' : ''} p-2.5 rounded-lg hover:bg-[#1f2937] transition-colors`}>
                <FaFileAlt className={`\${getIsActive('/dms/marketplace/templates') ? 'text-gray-200' : 'text-gray-400 group-hover:text-white transition-colors'} w-[20px] h-[20px]`} />
              </div>
            </Link>
          )}
          {userRole === 'buyer' && (
            <Link href="/dms/marketplace/my_teaser" className="relative p-3 w-full flex justify-center text-white group mt-1" title="My Teaser">
              {getIsActive('/dms/marketplace/my_teaser') && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#008f70] rounded-r-md"></div>}
              <div className={`\${getIsActive('/dms/marketplace/my_teaser') ? 'bg-[#1f2937]' : ''} p-2.5 rounded-lg hover:bg-[#1f2937] transition-colors`}>
                <FaBriefcase className={`\${getIsActive('/dms/marketplace/my_teaser') ? 'text-gray-200' : 'text-gray-400 group-hover:text-white transition-colors'} w-[20px] h-[20px]`} />
              </div>
            </Link>
          )}
          <Link href="/dms/marketplace/profile" className="relative p-3 w-full flex justify-center text-white group mt-1" title="Profile">
            {getIsActive('/dms/marketplace/profile') && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#008f70] rounded-r-md"></div>}
            <div className={`\${getIsActive('/dms/marketplace/profile') ? 'bg-[#1f2937]' : ''} p-2.5 rounded-lg hover:bg-[#1f2937] transition-colors`}>
              <FaUser className={`\${getIsActive('/dms/marketplace/profile') ? 'text-gray-200' : 'text-gray-400 group-hover:text-white transition-colors'} w-[20px] h-[20px]`} />
            </div>
          </Link>
        </div>
        <div className="mt-auto flex flex-col gap-4 text-gray-400 w-full items-center">
          <button className="p-3 hover:text-red-400 transition-colors" title="Logout" onClick={handleLogout}>
            <FaPowerOff className="w-[22px] h-[22px]" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-[72px] border-b border-gray-200 flex items-center justify-between px-8 bg-white shrink-0 z-40 sticky top-0">
          <div className="flex items-center gap-6">
            <div className="text-[17px] font-bold text-gray-900 tracking-tight capitalize">{title}</div>
          </div>
          <div className="flex items-center gap-8">
            <div className="relative">
              <button
                className="relative text-gray-800 hover:text-black transition-colors"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <FaRegBell className="w-[20px] h-[20px]" />
                {notifications.length > 0 && (
                  <span className="absolute -top-[2px] -right-[2px] w-2.5 h-2.5 bg-[#008f70] rounded-full border-2 border-white shadow-xs"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                    {notifications.length > 0 && (
                      <span className="text-xs font-bold bg-[#e6fbf2] text-[#008f70] px-2 py-0.5 rounded-full">{notifications.length} new</span>
                    )}
                  </div>
                  <div className="max-h-[350px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                          <FaRegBell className="text-gray-400 text-xl" />
                        </div>
                        <p className="text-gray-900 font-bold text-sm mb-1">No notifications</p>
                        <p className="text-gray-500 text-xs">You're all caught up!</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((notif, idx) => (
                          <div 
                            key={idx} 
                            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex gap-3"
                            onClick={async () => {
                              if (notif.type === 'message') {
                                try {
                                  await fetch('/api/dms/messages', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ messageIds: [notif.id] })
                                  });
                                } catch (e) {
                                  console.error(e);
                                }
                                if (notif.senderId) {
                                  sessionStorage.setItem('openPartnerId', notif.senderId);
                                }
                              } else if (notif.type === 'proposal' && notif.projectId) {
                                try {
                                  localStorage.setItem(`viewed_deal_${notif.projectId}`, Date.now().toString());
                                  window.dispatchEvent(new Event('deal-proposal-submitted'));
                                } catch (e) {}
                              }
                              setNotifications(prev => prev.filter(n => n.id !== notif.id));
                              setShowNotifications(false);
                              router.push(notif.link || '/dms/marketplace/inbox');
                            }}
                          >
                            <div className="w-2 h-2 mt-1.5 bg-[#008f70] rounded-full shrink-0"></div>
                            <div>
                              <p className="text-sm text-gray-800 font-medium leading-tight mb-1">{notif.message}</p>
                              <p className="text-xs text-[#008f70] font-medium">{notif.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div 
                      className="p-3 border-t border-gray-100 text-center bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={async () => {
                        try {
                          const userId = localStorage.getItem('userId');
                          await fetch('/api/dms/messages', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: userId || 'seller-123' })
                          });
                          notifications.forEach(n => {
                            if (n.type === 'proposal' && n.projectId) {
                              localStorage.setItem(`viewed_deal_${n.projectId}`, Date.now().toString());
                            }
                          });
                          window.dispatchEvent(new Event('deal-proposal-submitted'));
                          setNotifications([]);
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                    >
                      <span className="text-xs font-bold text-[#008f70]">Mark all as read</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#003b5c] font-bold text-[15px] shrink-0">
                {userName ? userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'VP'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-gray-900 font-bold text-[15px] leading-tight truncate tracking-tight">{userName || 'Vairajothi P.'}</span>
                <span className="text-gray-500 font-medium text-[13px] leading-tight truncate">{userRole === 'admin' ? 'Super Admin' : (userRole || 'Buyer')}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full bg-[#f8fafc]">
          {children}
        </main>
      </div>
    </div>
  );
}
