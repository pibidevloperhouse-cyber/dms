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
        if (!userId && !userName) return;

        // Fetch messages
        const res = await fetch(`/api/dms/messages?userId=${userId || 'seller-123'}`);
        if (res.ok) {
          const data = await res.json();
          // Filter unread messages sent TO me
          const unread = data.messages.filter(msg => {
            const isFromMe = (msg.senderRole === userRole) || (msg.senderId === userId) || (msg.senderName === userName);
            return !msg.isRead && !isFromMe;
          });
          
          // Map to notification format
          const formattedNotifs = unread.map(msg => ({
            id: msg.id,
            message: `New message from ${msg.senderName}`,
            time: new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            link: '/dms/marketplace/inbox',
            senderId: msg.senderId
          }));
          
          setNotifications(formattedNotifs);
        }
      } catch (e) {
        console.error("Failed to fetch notifications");
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [isMounted, userRole]);

  useEffect(() => {
    setIsMounted(true);

    const loginTime = localStorage.getItem('loginTimestamp');
    const role = localStorage.getItem('userRole');

    if (role && loginTime) {
      const TWELVE_HOURS = 12 * 60 * 60 * 1000;
      if (Date.now() - parseInt(loginTime, 10) > TWELVE_HOURS) {
        localStorage.clear();
        router.push('/dms/login');
        return;
      }
      setUserRole(role.toLowerCase());
      setUserName(localStorage.getItem('userName') || 'User');
    } else if (!role) {
      router.push('/dms/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('companyId');
    localStorage.removeItem('userName');
    localStorage.removeItem('loginTimestamp');
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
  if (pathname.includes('/find_deal')) title = "Find Deal";
  else if (pathname.includes('/workspace')) title = "Workspace";
  else if (pathname.includes('/tracker')) title = "Tracker";
  else if (pathname.includes('/inbox')) title = "Inbox";
  else if (pathname.includes('/profile')) title = "Profile";
  else if (pathname.includes('/templates')) title = "Message Templates";
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
          <Link href="/dms/marketplace/find_deal" className="relative p-3 w-full flex justify-center text-white group" title="Find Deal">
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
                  <span className="absolute -top-[2px] -right-[2px] w-2.5 h-2.5 bg-red-600 rounded-full border border-white"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                    {notifications.length > 0 && (
                      <span className="text-xs font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{notifications.length} new</span>
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
                              try {
                                await fetch('/api/dms/messages', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ messageIds: [notif.id] })
                                });
                                setNotifications(prev => prev.filter(n => n.id !== notif.id));
                              } catch (e) {
                                console.error(e);
                              }
                              setShowNotifications(false);
                              if (notif.senderId) {
                                sessionStorage.setItem('openPartnerId', notif.senderId);
                              }
                              router.push(notif.link || '/dms/marketplace/inbox');
                            }}
                          >
                            <div className="w-2 h-2 mt-1.5 bg-teal-500 rounded-full shrink-0"></div>
                            <div>
                              <p className="text-sm text-gray-800 font-medium leading-tight mb-1">{notif.message}</p>
                              <p className="text-xs text-gray-400">{notif.time}</p>
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
                          setNotifications([]);
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                    >
                      <span className="text-xs font-bold text-teal-600">Mark all as read</span>
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
