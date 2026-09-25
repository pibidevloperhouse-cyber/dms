"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaSearch, FaCheck, FaShieldAlt, FaLink, FaArrowRight, FaLock, FaBriefcase, FaPowerOff, FaEllipsisV, FaMapMarkerAlt, FaRegBookmark, FaFilter, FaChevronDown, FaRedoAlt, FaThLarge, FaUser, FaUserCircle, FaSignOutAlt, FaRegBell, FaEnvelope, FaBuilding, FaPhone, FaGlobe, FaEdit, FaCheckCircle, FaTimes, FaChartLine, FaFolderOpen, FaRegClock } from "react-icons/fa";

export default function Marketplace() {
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('marketplace');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    companyName: 'PiBi Tech Solutions',
    industry: 'Technology / SaaS',
    website: 'www.pibi.tech',
    size: '50-200 Employees',
    mandate: 'We are actively seeking strategic acquisitions in the B2B SaaS space, particularly focusing on workflow automation, AI-driven analytics, and secure document management. We prefer majority buyouts but are open to significant minority stakes for the right technology.'
  });
  const [opportunities, setOpportunities] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);

    // Check for incoming tab navigation
    const savedTab = sessionStorage.getItem('marketplaceTab');
    if (savedTab) {
      setActiveTab(savedTab);
      sessionStorage.removeItem('marketplaceTab');
    }

    // Check 12 hours timeout
    const loginTime = localStorage.getItem('loginTimestamp');
    const role = localStorage.getItem('userRole');

    if (role && loginTime) {
      const TWELVE_HOURS = 12 * 60 * 60 * 1000;
      if (Date.now() - parseInt(loginTime, 10) > TWELVE_HOURS) {
        // Session expired
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        localStorage.removeItem('companyId');
        localStorage.removeItem('userName');
        localStorage.removeItem('loginTimestamp');
        router.push('/dms/login');
        return;
      }
    } else if (!role) {
      // Not logged in
      router.push('/dms/login');
      return;
    }

    setUserRole(role);
    setUserName(localStorage.getItem('userName') || 'bala kumar');

    // Fetch active teasers from the database
    const fetchTeasers = async () => {
      try {
        const res = await fetch('/api/dms/marketplace');
        if (res.ok) {
          const data = await res.json();
          setOpportunities(data.teasers || []);
        }
      } catch (err) {
        console.error("Failed to fetch marketplace deals:", err);
      }
    };

    fetchTeasers();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('companyId');
    localStorage.removeItem('userName');
    localStorage.removeItem('loginTimestamp');
    router.push('/dms/login');
  };

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

  return (
    <div className={`${userRole ? 'flex min-h-screen bg-[#f8fafc] font-sans text-gray-900 selection:bg-teal-600/20' : 'min-h-screen bg-[#0b1120] text-white'}`}>

      {/* Left Sidebar (Only for logged in) */}
      {userRole && (
        <aside className="w-[72px] bg-[#111827] flex flex-col items-center py-6 shrink-0 h-screen sticky top-0 z-50">
          {/* Logo */}
          <div className="w-10 h-10 bg-[#008f70] rounded-md flex items-center justify-center text-white font-bold text-xl mb-8 shadow-sm cursor-pointer hover:bg-[#007058] transition-colors">
            D
          </div>

          {/* Nav Icons */}
          <div className="flex flex-col gap-4 w-full items-center">
            {/* Overview */}
            <button
              onClick={() => setActiveTab('overview')}
              className="relative p-3 w-full flex justify-center text-white group"
              title="Overview"
            >
              {activeTab === 'overview' && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#008f70] rounded-r-md"></div>}
              <div className={`${activeTab === 'overview' ? 'bg-[#1f2937]' : ''} p-2.5 rounded-lg`}>
                <FaThLarge className={`w-[20px] h-[20px] ${activeTab === 'overview' ? 'text-gray-200' : 'text-gray-400 group-hover:text-white transition-colors'}`} />
              </div>
            </button>

            {/* Marketplace */}
            <button
              onClick={() => setActiveTab('marketplace')}
              className="relative p-3 w-full flex justify-center text-white group"
              title="Marketplace"
            >
              {activeTab === 'marketplace' && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#008f70] rounded-r-md"></div>}
              <div className={`${activeTab === 'marketplace' ? 'bg-[#1f2937]' : ''} p-2.5 rounded-lg`}>
                <FaBriefcase className={`w-[20px] h-[20px] ${activeTab === 'marketplace' ? 'text-gray-200' : 'text-gray-400 group-hover:text-white transition-colors'}`} />
              </div>
            </button>

            {/* Tracker */}
            <button
              onClick={() => router.push('/dms/tracker')}
              className="relative p-3 w-full flex justify-center text-white group"
              title="Tracker"
            >
              <div className="p-2.5 rounded-lg group-hover:bg-[#1f2937] transition-colors">
                <FaChartLine className="w-[20px] h-[20px] text-gray-400 group-hover:text-white transition-colors" />
              </div>
            </button>

            {/* Profile */}
            <button
              onClick={() => setActiveTab('profile')}
              className="relative p-3 w-full flex justify-center text-white group mt-1"
              title="Profile"
            >
              {activeTab === 'profile' && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#008f70] rounded-r-md"></div>}
              <div className={`${activeTab === 'profile' ? 'bg-[#1f2937]' : ''} p-2.5 rounded-lg`}>
                <FaUser className={`w-[20px] h-[20px] ${activeTab === 'profile' ? 'text-gray-200' : 'text-gray-400 group-hover:text-white transition-colors'}`} />
              </div>
            </button>
          </div>

          {/* Bottom Icons */}
          <div className="mt-auto flex flex-col gap-4 text-gray-400 w-full items-center">
            <button
              className="p-3 hover:text-red-400 transition-colors"
              title="Logout"
              onClick={handleLogout}
            >
              <FaPowerOff className="w-[22px] h-[22px]" />
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className={`${userRole ? 'flex-1 flex flex-col min-w-0' : 'w-full'}`}>

        {/* Custom Header for Logged-Out View */}
        {!userRole && (
          <nav className="fixed top-0 left-0 w-full bg-[#0b1120]/95 backdrop-blur-md z-50 py-5 px-4 md:px-12 flex justify-between items-center border-b border-white/10 text-white">
            <div className="flex items-center">
              <Link href="/dms" className="flex items-center text-gray-400 hover:text-white transition-colors group py-2">
                <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back</span>
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/dms/login" className="text-white hover:text-teal-500 border border-white/30 hover:border-teal-500 px-6 py-2 rounded-full font-medium transition-colors whitespace-nowrap">
                Sign In
              </Link>
              <Link href="/dms/register" className="text-white hover:text-teal-500 border border-white/30 hover:border-teal-500 px-6 py-2 rounded-full font-medium transition-colors whitespace-nowrap">
                Sign Up
              </Link>
            </div>
          </nav>
        )}

        {/* Top Header for Logged-In View */}
        {userRole && (
          <header className="h-[72px] border-b border-gray-200 flex items-center justify-between px-8 bg-white shrink-0 z-40 sticky top-0">
            <div className="flex items-center gap-6">
              <div className="text-[17px] font-bold text-gray-900 tracking-tight capitalize">
                {activeTab === 'marketplace' ? 'Marketplace' : activeTab === 'profile' ? 'Profile' : activeTab}
              </div>
            </div>
            <div className="flex items-center gap-8">
              {/* Notification Bell */}
              <button className="relative text-gray-800 hover:text-black transition-colors">
                <FaRegBell className="w-[20px] h-[20px]" />
                <span className="absolute -top-[2px] -right-[2px] w-2.5 h-2.5 bg-red-600 rounded-full border border-white"></span>
              </button>

              {/* User Info */}
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
        )}

        {/* Hero Section */}
        {!userRole && (
          <section className="pt-40 pb-20 px-8 md:px-24">
            <div className="max-w-4xl">
              <p className="text-teal-500 text-xs font-bold tracking-[0.2em] uppercase mb-6">
                Private Markets &middot; Live
              </p>
              <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight text-white">
                Deal Marketplace
              </h1>
              <p className="text-[#9ca3af] text-lg md:text-xl leading-relaxed max-w-2xl">
                A focused view of anonymous acquisition opportunities for qualified buyers, corporate development teams, and investment professionals.
              </p>
            </div>
          </section>
        )}

        {/* Logged-in Overview View */}
        {userRole && activeTab === 'overview' && (
          <div className="pt-8 px-4 md:px-8 lg:px-12 max-w-[1500px] w-full mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                  Welcome back, {userName ? userName.split(' ')[0] : 'Vairajothi'}
                </h1>
                <p className="text-gray-500 text-sm md:text-base">Here is a snapshot of your deal pipeline and new opportunities.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setActiveTab('marketplace')} className="flex items-center gap-2 bg-[#008f70] hover:bg-[#007058] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm">
                  <FaSearch /> Find New Deals
                </button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-[0_2px_15px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-lg">
                    <FaBriefcase />
                  </div>
                  <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">+2 this week</span>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-gray-900 mb-1">{opportunities.length}</h3>
                  <p className="text-sm font-bold text-gray-500">Matching Opportunities</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-[0_2px_15px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                    <FaFolderOpen />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-gray-900 mb-1">3</h3>
                  <p className="text-sm font-bold text-gray-500">Active Pipelines</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-[0_2px_15px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center text-lg">
                    <FaRegClock />
                  </div>
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">Action Needed</span>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-gray-900 mb-1">1</h3>
                  <p className="text-sm font-bold text-gray-500">Pending NDA</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-[0_2px_15px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-lg">
                    <FaCheckCircle />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-gray-900 mb-1">5</h3>
                  <p className="text-sm font-bold text-gray-500">Completed NDAs</p>
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Recent Activity */}
              <div className="lg:col-span-2 h-full">
                <div className="bg-white rounded-xl shadow-[0_2px_15px_rgb(0,0,0,0.02)] border border-gray-200 p-6 md:p-8 h-full flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Your Active Pipeline</h2>
                    <button onClick={() => router.push('/dms/tracker')} className="text-sm font-bold text-teal-600 hover:text-teal-700">View Tracker</button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-300 bg-gray-100/50 hover:bg-gray-100 transition-all cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-lg bg-[#00527c] text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                          PR
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 mb-0.5">Project Phoenix</p>
                          <p className="text-xs font-semibold text-gray-500">Technology &bull; North America</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 uppercase tracking-wider">
                          Due Diligence
                        </span>
                        <span className="text-[11px] font-medium text-gray-400">Updated 2h ago</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-300 bg-gray-100/50 hover:bg-gray-100 transition-all cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-lg bg-[#b27200] text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                          AL
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 mb-0.5">Project Alpha</p>
                          <p className="text-xs font-semibold text-gray-500">Healthcare &bull; Europe</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 uppercase tracking-wider">
                          NDA Pending
                        </span>
                        <span className="text-[11px] font-bold text-orange-500">Action Required</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Recommendations */}
              <div className="h-full">
                <div className="bg-white rounded-xl shadow-[0_2px_15px_rgb(0,0,0,0.02)] border border-gray-200 p-6 md:p-8 text-gray-900 relative overflow-hidden group h-full flex flex-col">
                  <div className="relative z-10 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <FaBriefcase className="text-[#008f70]" />
                      <h2 className="text-lg font-bold text-gray-900">Recommended for You</h2>
                    </div>
                    <p className="text-xs font-medium text-gray-500 mb-6 leading-relaxed">Based on your investment mandate, we found a highly relevant new teaser.</p>

                    <div className="bg-gray-100/50 rounded-xl p-5 border border-gray-300 hover:border-[#008f70] hover:shadow-md transition-all cursor-pointer flex-1 flex flex-col" onClick={() => setActiveTab('marketplace')}>
                      <div className="flex justify-between items-start mb-3">
                        <span className="px-2.5 py-1 bg-teal-50 text-teal-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-teal-200">98% Match</span>
                      </div>
                      <h3 className="font-bold text-base mb-1.5 text-gray-900">Project Horizon</h3>
                      <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed">SaaS workflow automation platform with $12M ARR. High retention and proven enterprise scalability.</p>

                      <div className="mt-auto pt-4">
                        <button className="w-full py-2.5 bg-gray-800 border border-transparent text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors shadow-sm">
                          View Teaser
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logged-in Marketplace View */}
        {userRole && activeTab === 'marketplace' && (
          <div className="pt-8 px-4 md:px-8 lg:px-12 max-w-[1500px] w-full mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                  Explore <span className="text-transparent bg-clip-text bg-teal-600">Opportunities</span>
                </h1>
                <p className="text-gray-500 text-sm md:text-base">Discover premium, vetted acquisition targets. Filter by your exact mandate and request access to anonymous teasers.</p>
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 bg-white px-5 py-2.5 rounded-full shadow-sm border border-gray-200/60">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                {opportunities.length} active matching deals
              </div>
            </div>

            {/* Filters Area Box 1 */}
            <div className="bg-white rounded-xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-200 mb-4 flex flex-col md:flex-row gap-4 w-full items-end">
              <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Industry */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Industry</label>
                  <div className="relative">
                    <select className="w-full appearance-none bg-[#f8fafc] hover:bg-gray-50 border border-gray-200 rounded-lg py-3.5 pl-5 pr-10 text-[13px] font-bold text-gray-800 focus:outline-none transition-colors cursor-pointer">
                      <option>All Industries</option>
                      <option>Technology</option>
                      <option>Healthcare</option>
                      <option>Industrials</option>
                    </select>
                    <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none" />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Location</label>
                  <div className="relative">
                    <select className="w-full appearance-none bg-[#f8fafc] hover:bg-gray-50 border border-gray-200 rounded-lg py-3.5 pl-5 pr-10 text-[13px] font-bold text-gray-800 focus:outline-none transition-colors cursor-pointer">
                      <option>All Locations</option>
                      <option>North America</option>
                      <option>Europe</option>
                      <option>Asia</option>
                    </select>
                    <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none" />
                  </div>
                </div>

                {/* Deal Type */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Deal Type</label>
                  <div className="relative">
                    <select className="w-full appearance-none bg-[#f8fafc] hover:bg-gray-50 border border-gray-200 rounded-lg py-3.5 pl-5 pr-10 text-[13px] font-bold text-gray-800 focus:outline-none transition-colors cursor-pointer">
                      <option>All Deal Types</option>
                      <option>Majority Acquisition</option>
                      <option>Minority Investment</option>
                    </select>
                    <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none" />
                  </div>
                </div>
              </div>

              <button className="flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3.5 bg-[#f8fafc] hover:bg-gray-50 border border-gray-200 rounded-lg text-[11px] font-bold text-gray-500 uppercase tracking-widest transition-colors h-[48px]">
                <FaRedoAlt className="w-[10px] h-[10px]" /> Reset
              </button>
            </div>

            {/* Search Area Box 2 */}
            <div className="bg-white rounded-xl p-2.5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-200 mb-10 flex flex-col md:flex-row items-center gap-2">
              <div className="relative flex-1 w-full pl-2">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by industry, keyword, or business model..."
                  className="w-full pl-10 pr-4 py-3 bg-transparent border-none text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
                />
              </div>

              <div className="hidden md:block w-[1px] h-8 bg-gray-200 mx-1"></div>

              <div className="relative w-full md:w-[240px] shrink-0">
                <select className="w-full appearance-none bg-[#f8fafc] hover:bg-gray-50 border border-gray-200 rounded-lg py-3 pl-5 pr-10 text-[13px] font-bold text-gray-800 focus:outline-none transition-colors cursor-pointer">
                  <option>Sort by: Newest First</option>
                  <option>Sort by: Revenue (High to Low)</option>
                  <option>Sort by: EBITDA (High to Low)</option>
                </select>
                <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none" />
              </div>
            </div>

            {/* Main Content Grid (Full width) */}
            <div className="w-full">
              {/* Projects Area */}
              <div className="w-full">
                {opportunities.length === 0 ? (
                  <div className="w-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 bg-white border border-gray-100 rounded-3xl shadow-sm p-8">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                      <FaSearch className="text-3xl text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No opportunities found</h3>
                    <p className="text-gray-500 text-sm max-w-md text-center">Try adjusting your filters or search terms to find more deals matching your criteria.</p>
                    <button className="mt-6 px-6 py-2.5 bg-[#008f70] hover:bg-[#00755d] text-white text-sm font-bold rounded-full transition-colors shadow-sm">
                      Clear all filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {opportunities.map((opp, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 flex flex-col group relative overflow-hidden transition-all duration-300 h-full rounded-xl hover:shadow-[0_4px_25px_rgb(0,0,0,0.04)] hover:-translate-y-1">
                        <div className="p-5 flex flex-col h-full">
                          {/* Header */}
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-3 items-center">
                              {/* Color Box */}
                              <div className={`w-10 h-10 rounded flex items-center justify-center text-white font-bold text-sm ${idx % 3 === 0 ? 'bg-[#00527c]' : idx % 3 === 1 ? 'bg-[#007f3f]' : 'bg-[#b27200]'}`}>
                                {opp.projectName ? opp.projectName.substring(0, 2).toUpperCase() : 'NS'}
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Confidential Opportunity</p>
                                <h3 className="text-base font-bold text-gray-900 leading-tight">
                                  {opp.projectName || 'Project Name'}
                                </h3>
                              </div>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600 transition-colors">
                              <FaRegBookmark className="text-lg" />
                            </button>
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            <span className="inline-flex items-center text-[11px] text-gray-600 bg-white px-2.5 py-1 rounded-full font-medium border border-gray-200">
                              {opp.sector || 'Technology'}
                            </span>
                            <span className="inline-flex items-center text-[11px] text-gray-600 bg-white px-2.5 py-1 rounded-full font-medium border border-gray-200">
                              {opp.geography || 'North America'}
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-[13px] text-gray-500 mb-6 line-clamp-2">
                            {opp.name || 'Enterprise cloud infrastructure provider with recurring revenue across regulated industries.'}
                          </p>

                          {/* Divider */}
                          <div className="h-px bg-gray-100 w-full mb-4 mt-auto"></div>

                          {/* Metrics Grid */}
                          <div className="grid grid-cols-2 gap-y-4 gap-x-2 mb-4">
                            <div>
                              <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mb-1 font-medium">
                                <FaBriefcase className="text-gray-300" /> Stage
                              </p>
                              <p className="font-semibold text-gray-900 text-[13px]">{opp.stage || 'Due diligence'}</p>
                            </div>
                            <div>
                              <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mb-1 font-medium">
                                <span className="w-3 h-3 border border-gray-300 rounded-sm inline-block"></span> Indicative value
                              </p>
                              <p className="font-semibold text-gray-900 text-[13px]">{opp.revenue || '$420M'}</p>
                            </div>
                            <div>
                              <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mb-1 font-medium">
                                <span className="w-3 h-3 border border-gray-300 rounded-full inline-block"></span> Deadline
                              </p>
                              <p className="font-semibold text-gray-900 text-[13px]">{opp.deadline || 'Oct 08, 2026'}</p>
                            </div>
                            <div>
                              <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mb-1 font-medium">
                                <span className="w-3 h-3 border border-gray-300 rounded-sm inline-block"></span> Participants
                              </p>
                              <p className="font-semibold text-gray-900 text-[13px]">{opp.participants || '18 Invited'}</p>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="h-px bg-gray-100 w-full mb-4"></div>

                          {/* Footer */}
                          <div className="flex justify-between items-center">
                            <div className="flex items-center text-[11px] text-gray-500 gap-1.5 font-medium">
                              <span className="w-3 h-3 border border-gray-400 rounded-full inline-block"></span> 12 new documents
                            </div>
                            <Link href={`/dms/teaser?project=${encodeURIComponent(opp.projectName || 'Teaser')}&projectId=${opp.projectId || '1'}`} className="text-[13px] font-bold text-[#008f70] hover:text-[#007058]">
                              View deal
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Logged-in Profile View */}
        {userRole && activeTab === 'profile' && (
          <div className="pt-8 px-4 md:px-8 lg:px-12 max-w-[1500px] w-full mx-auto pb-20">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                  Your Profile
                </h1>
                <p className="text-gray-500 text-sm md:text-base">Manage your personal information, company details, and preferences.</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-2 bg-[#008f70] hover:bg-[#007058] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm">
                  <FaEdit /> Edit Profile
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Column: User Summary Card */}
              <div className="lg:w-1/3">
                <div className="bg-white rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-200 overflow-hidden sticky top-[96px]">
                  {/* Cover Photo Area */}
                  <div className="h-24 bg-gradient-to-r from-teal-500 to-teal-700 w-full relative"></div>

                  {/* Profile Info */}
                  <div className="px-6 pb-6 pt-0 relative flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-white rounded-full p-1 -mt-10 mb-3 shadow-md relative z-10 flex items-center justify-center">
                      <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-2xl">
                        {userName ? userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'VP'}
                      </div>
                      <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900">{userName || 'Vairajothi P.'}</h2>
                    <p className="text-sm font-medium text-teal-600 mb-4">{userRole === 'admin' ? 'Super Admin' : (userRole || 'Buyer')} at PiBi Tech</p>

                    <div className="w-full flex flex-col gap-3 text-sm text-gray-600 text-left mt-2 border-t border-gray-100 pt-5">
                      <div className="flex items-center gap-3">
                        <FaEnvelope className="text-gray-400 w-4 h-4" />
                        <span className="truncate">vairajothi@pibi.tech</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaPhone className="text-gray-400 w-4 h-4" />
                        <span>+1 (555) 123-4567</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaMapMarkerAlt className="text-gray-400 w-4 h-4" />
                        <span>San Francisco, CA</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500 font-medium">
                    <span>Member since</span>
                    <span>Sep 2026</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Detailed Sections */}
              <div className="lg:w-2/3 flex flex-col gap-6">

                {/* Company Details */}
                <div className="bg-white rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-200 p-6 md:p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <FaBuilding className="text-teal-600" /> Company Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Company Name</p>
                      <p className="font-semibold text-gray-800 text-sm">{profileData.companyName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Industry</p>
                      <p className="font-semibold text-gray-800 text-sm">{profileData.industry}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Website</p>
                      <a href="#" className="font-medium text-teal-600 hover:text-teal-700 text-sm flex items-center gap-1.5">
                        <FaGlobe /> {profileData.website}
                      </a>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Company Size</p>
                      <p className="font-semibold text-gray-800 text-sm">{profileData.size}</p>
                    </div>
                  </div>
                </div>

                {/* Investment / Acquisition Mandate */}
                <div className="bg-white rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-200 p-6 md:p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <FaBriefcase className="text-teal-600" /> Investment Mandate
                    </h3>
                    <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Active</span>
                  </div>

                  <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    {profileData.mandate}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Target Sectors</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-white border border-gray-200 text-gray-700 text-xs px-2.5 py-1 rounded-md font-medium">SaaS</span>
                        <span className="bg-white border border-gray-200 text-gray-700 text-xs px-2.5 py-1 rounded-md font-medium">FinTech</span>
                        <span className="bg-white border border-gray-200 text-gray-700 text-xs px-2.5 py-1 rounded-md font-medium">AI/ML</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Revenue Range</p>
                      <p className="font-semibold text-gray-800 text-sm">$5M - $50M ARR</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Geographies</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-white border border-gray-200 text-gray-700 text-xs px-2.5 py-1 rounded-md font-medium">North America</span>
                        <span className="bg-white border border-gray-200 text-gray-700 text-xs px-2.5 py-1 rounded-md font-medium">Europe (UK/DACH)</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Deal Types</p>
                      <p className="font-semibold text-gray-800 text-sm">Majority Buyout, Growth Equity</p>
                    </div>
                  </div>
                </div>

                {/* Security & Verification */}
                <div className="bg-white rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-200 p-6 md:p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <FaShieldAlt className="text-teal-600" /> Trust & Verification
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-lg border border-green-100 bg-green-50/50">
                      <FaCheckCircle className="text-green-500 w-5 h-5 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Identity Verified</p>
                        <p className="text-xs text-gray-500 mt-1">Your corporate identity and email address have been successfully verified by our team.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 bg-gray-50">
                      <FaCheckCircle className="text-green-500 w-5 h-5 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">NDA Signed</p>
                        <p className="text-xs text-gray-500 mt-1">Standard Platform NDA is active and valid until Dec 2026.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditingProfile && (
              <div className="fixed inset-0 bg-[#0b1120]/40 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-[600px] rounded-2xl shadow-[0_4px_30px_rgb(0,0,0,0.15)] relative flex flex-col max-h-[90vh]">
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 transition-colors p-1"
                  >
                    <FaTimes className="text-lg" />
                  </button>

                  <div className="p-6 md:p-8 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center text-lg">
                        <FaEdit />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Edit Profile Details</h2>
                        <p className="text-sm text-gray-500">Update your company information and mandate.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Company Name</label>
                        <input type="text" value={profileData.companyName} onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })} className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-4 focus:ring-teal-600/10 focus:border-teal-600 bg-gray-50/50 transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Industry</label>
                        <input type="text" value={profileData.industry} onChange={(e) => setProfileData({ ...profileData, industry: e.target.value })} className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-4 focus:ring-teal-600/10 focus:border-teal-600 bg-gray-50/50 transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Website</label>
                        <input type="text" value={profileData.website} onChange={(e) => setProfileData({ ...profileData, website: e.target.value })} className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-4 focus:ring-teal-600/10 focus:border-teal-600 bg-gray-50/50 transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Company Size</label>
                        <select value={profileData.size} onChange={(e) => setProfileData({ ...profileData, size: e.target.value })} className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-4 focus:ring-teal-600/10 focus:border-teal-600 bg-gray-50/50 transition-all">
                          <option>1-10 Employees</option>
                          <option>11-50 Employees</option>
                          <option>50-200 Employees</option>
                          <option>201-500 Employees</option>
                          <option>500+ Employees</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Investment Mandate</label>
                      <textarea rows="4" value={profileData.mandate} onChange={(e) => setProfileData({ ...profileData, mandate: e.target.value })} className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-4 focus:ring-teal-600/10 focus:border-teal-600 bg-gray-50/50 transition-all resize-none"></textarea>
                    </div>
                  </div>

                  <div className="p-6 flex justify-end gap-3 bg-gray-50 rounded-b-2xl border-t border-gray-100">
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="py-2.5 px-6 bg-white hover:bg-gray-100 text-gray-700 text-sm font-bold rounded-xl border border-gray-200 transition-colors shadow-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="py-2.5 px-6 bg-[#008f70] hover:bg-[#007058] text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-teal-600/20"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!userRole && (
          <>
            {/* How It Works Section */}
            <section id="how-it-works" className="py-24 px-4 md:px-12 lg:px-24 bg-gray-50 text-gray-900 scroll-mt-24">
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  {/* Card 1 */}
                  <div className="bg-white p-8 border border-gray-200 flex flex-col justify-between group hover:shadow-lg transition-shadow">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <span className="text-4xl font-bold text-teal-600">01</span>
                        <FaSearch className="text-gray-600 text-xl" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4">Discover</h3>
                      <p className="text-gray-500 leading-relaxed mb-8 text-sm md:text-base">
                        Browse confidential acquisition opportunities across a focused set of industries, geographies, and deal types.
                      </p>
                    </div>
                    <FaArrowRight className="text-teal-600" />
                  </div>

                  {/* Card 2 */}
                  <div className="bg-white p-8 border border-gray-200 flex flex-col justify-between group hover:shadow-lg transition-shadow">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <span className="text-4xl font-bold text-teal-600">02</span>
                        <FaCheck className="text-gray-600 text-xl" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4">Review</h3>
                      <p className="text-gray-500 leading-relaxed mb-8 text-sm md:text-base">
                        Explore anonymous company teasers, financial highlights, and the opportunity's stated transaction context.
                      </p>
                    </div>
                    <FaArrowRight className="text-teal-600" />
                  </div>

                  {/* Card 3 */}
                  <div className="bg-white p-8 border border-gray-200 flex flex-col justify-between group hover:shadow-lg transition-shadow">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <span className="text-4xl font-bold text-teal-600">03</span>
                        <FaShieldAlt className="text-gray-600 text-xl" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4">Request Access</h3>
                      <p className="text-gray-500 leading-relaxed mb-8 text-sm md:text-base">
                        Share your credentials and investment mandate so the seller can evaluate a thoughtful access request.
                      </p>
                    </div>
                    <FaArrowRight className="text-teal-600" />
                  </div>

                  {/* Card 4 */}
                  <div className="bg-white p-8 border border-gray-200 flex flex-col justify-between group hover:shadow-lg transition-shadow">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <span className="text-4xl font-bold text-teal-600">04</span>
                        <FaLink className="text-gray-600 text-xl" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4">Connect</h3>
                      <p className="text-gray-500 leading-relaxed mb-8 text-sm md:text-base">
                        Once approved, continue into a secure transaction process with the right information at the right time.
                      </p>
                    </div>
                    <FaArrowRight className="text-teal-600" />
                  </div>
                </div>

                {/* Callout */}
                <div className="bg-white p-6 border-l-4 border-l-teal-600 shadow-sm">
                  <p className="text-gray-800 font-medium text-sm md:text-base">
                    More advanced transaction workflows will be introduced in future versions, including secure VDR, NDA, Q&A, and transaction workflows.
                  </p>
                </div>
              </div>
            </section>

            {/* For Buyers Section */}
            <section id="for-buyers" className="py-24 px-4 md:px-12 lg:px-24 bg-[#f8fafc] text-gray-900 scroll-mt-24 border-t border-gray-200">
              <div className="max-w-6xl mx-auto">
                {/* 2x2 Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 bg-white border border-gray-200 shadow-sm mb-20">
                  {/* Card 1 */}
                  <div className="p-10 border-b md:border-r border-gray-200">
                    <div className="w-12 h-12 bg-[#0b1120] rounded mb-6 flex items-center justify-center border border-gray-700 shadow-sm">
                      <FaSearch className="text-teal-500 text-xl" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Browse efficiently</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Use clear financial, industry, geography, and transaction filters to focus your search.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="p-10 border-b border-gray-200">
                    <div className="w-12 h-12 bg-[#0b1120] rounded mb-6 flex items-center justify-center border border-gray-700 shadow-sm">
                      <FaLock className="text-teal-500 text-xl" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Stay confidential</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Company identities remain protected while you assess fit and submit your credentials.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="p-10 border-b md:border-b-0 md:border-r border-gray-200">
                    <div className="w-12 h-12 bg-[#0b1120] rounded mb-6 flex items-center justify-center border border-gray-700 shadow-sm">
                      <FaShieldAlt className="text-teal-500 text-xl" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Request thoughtfully</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Give sellers the context they need to make an informed access decision.
                    </p>
                  </div>

                  {/* Card 4 */}
                  <div className="p-10">
                    <div className="w-12 h-12 bg-[#0b1120] rounded mb-6 flex items-center justify-center border border-gray-700 shadow-sm">
                      <FaBriefcase className="text-teal-500 text-xl" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Move with intent</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Keep your early-stage deal sourcing focused on opportunities aligned with your mandate.
                    </p>
                  </div>
                </div>

                {/* Your buyer journey */}
                <div>
                  <h2 className="text-3xl font-bold mb-10 text-gray-900">Your buyer journey</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="border-t-[3px] border-teal-500 pt-4">
                      <p className="text-teal-600 font-bold text-sm mb-2">01</p>
                      <p className="font-bold text-sm">Browse deals</p>
                    </div>
                    <div className="border-t-[3px] border-teal-500 pt-4">
                      <p className="text-teal-600 font-bold text-sm mb-2">02</p>
                      <p className="font-bold text-sm">Open a teaser</p>
                    </div>
                    <div className="border-t-[3px] border-teal-500 pt-4">
                      <p className="text-teal-600 font-bold text-sm mb-2">03</p>
                      <p className="font-bold text-sm">Request access</p>
                    </div>
                    <div className="border-t-[3px] border-teal-500 pt-4">
                      <p className="text-teal-600 font-bold text-sm mb-2">04</p>
                      <p className="font-bold text-sm">Access pending</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
