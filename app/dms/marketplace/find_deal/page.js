"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaSearch, FaCheck, FaShieldAlt, FaLink, FaArrowRight, FaLock, FaBriefcase, FaPowerOff, FaEllipsisV, FaMapMarkerAlt, FaRegBookmark, FaFilter, FaChevronDown, FaChevronRight, FaRedoAlt, FaThLarge, FaUser, FaUserCircle, FaSignOutAlt, FaRegBell, FaEnvelope, FaBuilding, FaPhone, FaGlobe, FaEdit, FaCheckCircle, FaTimes, FaChartLine, FaFolderOpen, FaRegClock, FaPlus, FaDatabase, FaCog } from "react-icons/fa";

export default function MarketplacePage() {
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
  const [buyerProfiles, setBuyerProfiles] = useState([]);
  const [sentInterests, setSentInterests] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [vdrRole, setVdrRole] = useState('external_user');
  const [verificationStatus, setVerificationStatus] = useState('unverified');
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [isViewMoreModalOpen, setIsViewMoreModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyTypeFilter, setCompanyTypeFilter] = useState('All Company Types');
  const [locationFilter, setLocationFilter] = useState('All Locations');
  const [dealTypeFilter, setDealTypeFilter] = useState('All Deal Types');
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);

    // Ignore sessionStorage for find_deal to force it to render the marketplace view
    // const savedTab = sessionStorage.getItem('marketplaceTab');
    // if (savedTab) {
    //   setActiveTab(savedTab);
    //   sessionStorage.removeItem('marketplaceTab');
    // }

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

    const lowerRole = role.toLowerCase();
    setUserRole(lowerRole);
    setUserName(localStorage.getItem('userName') || 'bala kumar');
    setVerificationStatus(localStorage.getItem('verificationStatus') || 'unverified');

    // Fetch active data from the database
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/dms/marketplace', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setTimeout(() => {
            setOpportunities(data.teasers || []);
            setBuyerProfiles(data.buyers || []);
            setIsLoading(false);
          }, 3000);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch marketplace deals:", err);
        setIsLoading(false);
      }
    };

    const fetchWorkspaces = async () => {
      if (lowerRole === 'buyer') {
        const userId = localStorage.getItem('userId');
        if (!userId) return;
        try {
          const res = await fetch(`/api/dms/buyer-deals?buyerId=${userId}`);
          if (res.ok) {
            const data = await res.json();
            setWorkspaces(data.deals || []);
          }
        } catch (error) {
          console.error("Failed to fetch buyer deals", error);
        }
      } else {
        const companyId = localStorage.getItem('companyId');
        const userId = localStorage.getItem('userId');
        const vdrRoleItem = localStorage.getItem('vdrRole') || 'external_user';
        setVdrRole(vdrRoleItem);

        if (!companyId) return;

        try {
          const res = await fetch(`/api/dms/projects?companyId=${companyId}&userId=${userId}&role=${vdrRoleItem}`);
          if (res.ok) {
            const data = await res.json();
            setWorkspaces(data.projects || []);
          }
        } catch (error) {
          console.error("Failed to fetch projects", error);
        }
      }
    };

    fetchData();
    fetchWorkspaces();
  }, [router]);

  const [openDropdownId, setOpenDropdownId] = useState(null);

  const handleDeleteProject = async (id, name) => {
    try {
      const res = await fetch(`/api/dms/projects?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        const updatedWorkspaces = workspaces.filter(ws => ws.id !== id);
        setWorkspaces(updatedWorkspaces);
      } else {
        alert("Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project", error);
      alert("Error deleting project");
    }
    setOpenDropdownId(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('companyId');
    localStorage.removeItem('userName');
    localStorage.removeItem('loginTimestamp');
    router.push('/dms/login');
  };


  const uniqueCountries = Array.from(new Set(buyerProfiles.map(b => b.country).filter(Boolean))).sort();

  const filteredBuyers = buyerProfiles.filter(buyer => {
    const matchesSearch = buyer.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompanyType = companyTypeFilter === 'All Company Types' || buyer.companyType === companyTypeFilter;
    const matchesLocation = locationFilter === 'All Locations' || buyer.country === locationFilter;
    const matchesDealType = dealTypeFilter === 'All Deal Types' || buyer.investorType === dealTypeFilter;

    return matchesSearch && matchesCompanyType && matchesLocation && matchesDealType;
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setCompanyTypeFilter('All Company Types');
    setLocationFilter('All Locations');
    setDealTypeFilter('All Deal Types');
  };

  return (
    <div className="w-full">



      {/* Main Content Area */}
      <div className="w-full">
        {userRole && verificationStatus !== 'verified' && (
          <div className="bg-amber-50 border-b border-amber-200 px-8 py-3 flex items-center justify-center gap-3">
            <FaShieldAlt className="text-amber-500 text-lg" />
            <p className="text-amber-800 text-sm font-medium">
              Your account is currently <strong>{verificationStatus}</strong>. You must be verified by a Business Owner to submit proposals or list deals.
            </p>
          </div>
        )}        {/* Hero Section */}
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

        {/* Logged-in Overview View (Now in its own route, hidden here) */}
        {false && userRole && activeTab === 'overview' && (
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
                <button onClick={() => router.push('/dms/marketplace/find_deal')} className="flex items-center gap-2 bg-[#008f70] hover:bg-[#007058] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm">
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

                    <div className="bg-gray-100/50 rounded-xl p-5 border border-gray-300 hover:border-[#008f70] hover:shadow-md transition-all cursor-pointer flex-1 flex flex-col" onClick={() => router.push('/dms/marketplace/find_deal')}>
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
        {userRole && (
          <div className="pt-8 px-4 md:px-8 lg:px-12 max-w-[1500px] w-full mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                  {userRole === 'seller' ? (
                    <>Find <span className="text-transparent bg-clip-text bg-teal-600">Buyers</span></>
                  ) : (
                    <>Explore <span className="text-transparent bg-clip-text bg-teal-600">Opportunities</span></>
                  )}
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
                {/* Dynamic Filter 1: Company Type (for sellers) or Industry (for buyers) */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                    {userRole === 'seller' ? 'Company Type' : 'Industry'}
                  </label>
                  <div className="relative">
                    {userRole === 'seller' ? (
                      <select
                        className="w-full appearance-none bg-[#f8fafc] hover:bg-gray-50 border border-gray-200 rounded-lg py-3.5 pl-5 pr-10 text-[13px] font-bold text-gray-800 focus:outline-none transition-colors cursor-pointer"
                        value={companyTypeFilter}
                        onChange={(e) => setCompanyTypeFilter(e.target.value)}
                      >
                        <option>All Company Types</option>
                        <option>Technology</option>
                        <option>IT Services</option>
                        <option>Software Product</option>
                        <option>SaaS (Software as a Service)</option>
                        <option>AI / Machine Learning</option>
                        <option>Cloud Computing</option>
                        <option>Cybersecurity</option>
                        <option>FinTech</option>
                        <option>Banking & Financial Services</option>
                        <option>Insurance</option>
                        <option>Healthcare</option>
                        <option>Pharmaceuticals</option>
                        <option>Biotechnology</option>
                        <option>Manufacturing</option>
                        <option>Automotive</option>
                        <option>E-commerce</option>
                        <option>Retail</option>
                        <option>Telecommunications</option>
                        <option>Media & Entertainment</option>
                        <option>Education / EdTech</option>
                        <option>Real Estate</option>
                        <option>Construction</option>
                        <option>Energy & Utilities</option>
                        <option>Logistics & Transportation</option>
                        <option>Agriculture / AgriTech</option>
                        <option>Food & Beverage</option>
                        <option>Consulting</option>
                        <option>Aerospace & Defense</option>
                        <option>Travel & Hospitality</option>
                        <option>Other</option>
                      </select>
                    ) : (
                      <select className="w-full appearance-none bg-[#f8fafc] hover:bg-gray-50 border border-gray-200 rounded-lg py-3.5 pl-5 pr-10 text-[13px] font-bold text-gray-800 focus:outline-none transition-colors cursor-pointer">
                        <option>All Industries</option>
                        <option>Technology</option>
                        <option>Healthcare</option>
                        <option>Industrials</option>
                      </select>
                    )}
                    <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none" />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Location</label>
                  <div className="relative">
                    {userRole === 'seller' ? (
                      <select
                        className="w-full appearance-none bg-[#f8fafc] hover:bg-gray-50 border border-gray-200 rounded-lg py-3.5 pl-5 pr-10 text-[13px] font-bold text-gray-800 focus:outline-none transition-colors cursor-pointer"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                      >
                        <option>All Locations</option>
                        {uniqueCountries.map((country, idx) => (
                          <option key={idx} value={country}>{country}</option>
                        ))}
                      </select>
                    ) : (
                      <select className="w-full appearance-none bg-[#f8fafc] hover:bg-gray-50 border border-gray-200 rounded-lg py-3.5 pl-5 pr-10 text-[13px] font-bold text-gray-800 focus:outline-none transition-colors cursor-pointer">
                        <option>All Locations</option>
                        <option>North America</option>
                        <option>Europe</option>
                        <option>Asia</option>
                      </select>
                    )}
                    <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none" />
                  </div>
                </div>

                {/* Deal Type */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Deal Type</label>
                  <div className="relative">
                    {userRole === 'seller' ? (
                      <select
                        className="w-full appearance-none bg-[#f8fafc] hover:bg-gray-50 border border-gray-200 rounded-lg py-3.5 pl-5 pr-10 text-[13px] font-bold text-gray-800 focus:outline-none transition-colors cursor-pointer"
                        value={dealTypeFilter}
                        onChange={(e) => setDealTypeFilter(e.target.value)}
                      >
                        <option>All Deal Types</option>
                        <option>M&A</option>
                      </select>
                    ) : (
                      <select className="w-full appearance-none bg-[#f8fafc] hover:bg-gray-50 border border-gray-200 rounded-lg py-3.5 pl-5 pr-10 text-[13px] font-bold text-gray-800 focus:outline-none transition-colors cursor-pointer">
                        <option>All Deal Types</option>
                        <option>Majority Acquisition</option>
                        <option>Minority Investment</option>
                      </select>
                    )}
                    <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none" />
                  </div>
                </div>
              </div>

              <button
                className="flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3.5 bg-[#f8fafc] hover:bg-gray-50 border border-gray-200 rounded-lg text-[11px] font-bold text-gray-500 uppercase tracking-widest transition-colors h-[48px]"
                onClick={handleResetFilters}
              >
                <FaRedoAlt className="w-[10px] h-[10px]" /> Reset
              </button>
            </div>

            {/* Search Area Box 2 */}
            <div className="bg-white rounded-xl p-2.5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-200 mb-10 flex flex-col md:flex-row items-center gap-2">
              <div className="relative flex-1 w-full pl-2">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
              {userRole === 'seller' ? (
                /* Buyer Profiles Area */
                <div className="w-full">
                  {isLoading ? (
                    <div className="w-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 bg-white border border-gray-100 rounded-3xl shadow-sm p-8">
                      <div className="w-12 h-12 border-4 border-gray-200 border-t-[#008f70] rounded-full animate-spin mb-4"></div>
                      <h3 className="text-xl font-bold text-gray-900">Loading buyers...</h3>
                    </div>
                  ) : filteredBuyers.length === 0 ? (
                    <div className="w-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 bg-white border border-gray-100 rounded-3xl shadow-sm p-8">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <FaUser className="text-3xl text-gray-300" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No buyers found</h3>
                      <p className="text-gray-500 text-sm max-w-md text-center">Try adjusting your filters or search terms to find more buyers matching your criteria.</p>
                      <button
                        className="mt-6 px-6 py-2.5 bg-[#008f70] hover:bg-[#00755d] text-white text-sm font-bold rounded-full transition-colors shadow-sm"
                        onClick={() => setSearchQuery('')}
                      >
                        Clear search
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                      {[...filteredBuyers].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map((buyer, idx) => (
                        <div key={buyer.id || idx} className="bg-white rounded-2xl shadow-[0_2px_15px_rgb(0,0,0,0.04)] border border-gray-100 p-6 flex flex-col hover:shadow-lg transition-shadow h-full">
                          {/* Header Section */}
                          <div className="flex justify-between items-start mb-5">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-gradient-to-br from-[#1f6fb2] to-[#2ec4b6] rounded-xl flex items-center justify-center text-white font-bold text-2xl shrink-0">
                                {buyer.name ? buyer.name.substring(0, 2).toUpperCase() : 'GO'}
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                                  {buyer.investorType || 'M&A OPPORTUNITY'}
                                </p>
                                <h3 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">
                                  {buyer.name || 'Google tech'}
                                </h3>
                              </div>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600 transition-colors">
                              <FaRegBookmark className="text-xl" />
                            </button>
                          </div>

                          {/* Tags below title */}
                          <div className="flex gap-2 mb-6">
                            <span className="inline-flex items-center text-[12px] text-[#1f6fb2] bg-gradient-to-r from-[#1f6fb2]/10 to-[#2ec4b6]/10 px-3 py-1.5 rounded-lg font-medium border border-[#2ec4b6]/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[#1f6fb2] to-[#2ec4b6] mr-2"></span>
                              Growth opportunity
                            </span>
                            <span className="inline-flex items-center text-[12px] text-gray-600 bg-white px-3 py-1.5 rounded-lg font-medium border border-gray-200">
                              {buyer.companyType || 'Corporate Development'}
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-gray-500 text-[15px] leading-relaxed mb-6 font-medium pr-2">
                            {buyer.description || buyer.jobTitle ? `${buyer.jobTitle} at ${buyer.companyName || 'a leading firm'}. Seeking strategic acquisitions and growth opportunities.` : 'A fast-growing platform helping modern teams simplify their most important workflows.'}
                          </p>

                          {/* Signal Score Box */}
                          <div className="bg-gradient-to-r from-[#1f6fb2]/5 to-[#2ec4b6]/5 rounded-xl p-5 flex items-center gap-6 mb-8 relative overflow-hidden border border-[#2ec4b6]/20">
                            <div className="flex flex-col border-r border-gray-300/60 pr-6 relative z-10">
                              <div className="flex items-center gap-1.5 text-[#1f6fb2] text-[10px] font-bold uppercase tracking-[0.15em] mb-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                                SIGNAL SCORE
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#1f6fb2] to-[#2ec4b6] text-[40px] leading-none font-bold">{((99 - ((idx * 7) % 40)) / 10).toFixed(1)}</span>
                                <span className="text-[#2ec4b6]/70 text-base font-bold">/10</span>
                              </div>
                            </div>
                            <div className="flex flex-col relative z-10">
                              <div className="flex items-center gap-2 mb-1.5">
                                <FaChartLine className="text-[#1f6fb2] text-sm" />
                                <span className="text-gray-900 text-[14px] font-bold">Strong fit for your thesis</span>
                              </div>
                              <p className="text-gray-500 text-[13px] font-medium pl-6">Worth a closer look.</p>
                            </div>
                          </div>

                          {/* Spacer */}
                          <div className="flex-grow"></div>

                          {/* Stats Grid Box */}
                          <div className="grid grid-cols-3 gap-4 mb-6 pt-6 border-t border-gray-100">
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">SECTOR</p>
                              <p className="text-[13px] font-bold text-gray-900">{buyer.companyType || 'Corporate Development'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">HEADQUARTERS</p>
                              <p className="text-[13px] font-bold text-gray-900">{buyer.country || 'India'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">STAGE</p>
                              <p className="text-[13px] font-bold text-gray-900">{buyer.investmentRange || 'Series C'}</p>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="border-t border-gray-100 pt-6 mt-2 flex justify-end items-center bg-white">
                            {sentInterests.includes(buyer.id || idx) ? (
                              <button
                                onClick={() => {
                                  setSelectedBuyer(buyer);
                                  setIsViewMoreModalOpen(true);
                                }}
                                className="text-[14px] font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 px-6 py-3 rounded-[8px] flex items-center gap-2 transition-colors duration-200 shadow-sm"
                              >
                                <FaCheckCircle className="text-green-500" /> Interest Sent
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedBuyer(buyer);
                                  setIsViewMoreModalOpen(true);
                                }}
                                className="text-[14px] font-bold text-white bg-gradient-to-br from-[#1f6fb2] to-[#2ec4b6] hover:opacity-90 shadow-sm px-6 py-3 rounded-[8px] transition-opacity duration-200 flex items-center gap-2"
                              >
                                Explore company ↗
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Projects Area (For Buyers) */
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
              )}
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

        {/* Logged-in Workspace View */}
        {userRole && activeTab === 'workspace' && (
          <div className="pt-8 px-4 md:px-8 lg:px-12 max-w-[1500px] w-full mx-auto pb-20">
            {/* Header Row */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                  {userRole.toLowerCase() === 'buyer' ? 'Buyer Workspace' : profileData.companyName || 'My Workspace'}
                </h1>
                <span className="px-3 py-1 bg-[#e6fbf2] text-[#00c875] text-xs font-bold rounded-full tracking-wide capitalize">{userRole}</span>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

              {userRole !== 'buyer' && !userRole.includes('guest') && vdrRole === 'super_admin' && (
                <button
                  onClick={() => router.push('/onboarding')}
                  className="h-44 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center gap-3 hover:border-gray-400 hover:bg-gray-50 transition-all group bg-white"
                >
                  <div className="w-12 h-12 bg-[#0b1120] text-white rounded-xl flex items-center justify-center text-xl shadow-md group-hover:scale-105 transition-transform">
                    <FaPlus />
                  </div>
                  <span className="text-[13px] text-gray-500 font-medium">Add New Project</span>
                </button>
              )}

              {/* Existing Workspaces */}
              {workspaces.map((workspace, index) => (
                <div
                  onClick={() => {
                    const pid = workspace.projectId || workspace.id;
                    sessionStorage.removeItem(`deal_activeTab_${pid}`);
                    router.push(`/dms/deal?projectId=${pid}&projectName=${encodeURIComponent(workspace.name)}`);
                  }}
                  key={index}
                  className="block cursor-pointer h-44 bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] p-4 relative flex flex-col hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.06)] transition-all group"
                >
                  <div className="flex justify-between items-start mb-auto">
                    <div className="flex gap-2 items-center">
                      <span className="px-2 py-0.5 bg-[#e6fbf2] text-[#00c875] text-[9px] font-bold rounded">
                        {workspace.status || 'ACTIVE'}
                      </span>
                      {workspace.dealType && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded">
                          {workspace.dealType}
                        </span>
                      )}
                    </div>

                    {userRole !== 'buyer' && !userRole.includes('guest') && vdrRole === 'super_admin' && (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === workspace.id ? null : workspace.id);
                          }}
                          className="text-gray-400 hover:text-gray-600 p-1 opacity-60 hover:opacity-100"
                        >
                          <FaEllipsisV className="text-[11px]" />
                        </button>

                        {openDropdownId === workspace.id && (
                          <div className="absolute right-0 mt-1 w-24 bg-white rounded-md shadow-lg border border-gray-100 z-10 overflow-hidden">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(workspace.id, workspace.name);
                              }}
                              className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center justify-center flex-1 gap-2 pb-2">
                    <FaShieldAlt className="text-4xl text-teal-600 group-hover:scale-105 transition-transform" />
                    <span className="font-bold text-gray-800 text-sm mt-1">{workspace.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logged-in Inbox View */}
        {userRole && activeTab === 'inbox' && (
          <div className="pt-8 px-4 md:px-8 lg:px-12 max-w-[1500px] w-full mx-auto pb-20 flex-1 flex flex-col h-full min-h-[80vh]">
            {/* Header Row */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                  Inbox
                </h1>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col md:flex-row overflow-hidden min-h-[600px]">
              {/* Left Panel - Messages */}
              <div className="w-full md:w-1/4 border-r border-gray-200 bg-gray-50 flex flex-col">
                <div className="p-4 border-b border-gray-200 flex gap-4">
                  <button className="text-sm font-bold text-gray-900 border-b-2 border-teal-600 pb-2">Messages</button>
                  <button className="text-sm font-bold text-gray-400 pb-2 hover:text-gray-600 transition-colors">Notifications</button>
                </div>
                <div className="flex-1 flex items-center justify-center p-6 text-center text-sm text-gray-500">
                  Your conversations will appear here
                </div>
              </div>

              {/* Middle Panel - Empty State */}
              <div className="w-full md:w-2/4 border-r border-gray-200 bg-white flex flex-col items-center justify-center p-8 text-center">
                <div className="w-48 h-48 mb-6 relative">
                  {/* Abstract mailbox illustration placeholder */}
                  <div className="w-full h-full bg-blue-50/50 rounded-full flex items-center justify-center border border-blue-100">
                    <FaEnvelope className="text-6xl text-blue-200" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Your inbox is empty</h2>
                <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
                  {userRole === 'seller' ? "Buyers have to make the first move - and once they do, you'll chat with them here." : "Start a conversation with sellers from the marketplace to see your messages here."}
                </p>
              </div>

              {/* Right Panel - Details */}
              <div className="w-full md:w-1/4 bg-gray-50 flex items-center justify-center p-6 text-center text-sm text-gray-500">
                Chat details will appear here
              </div>
            </div>
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
        {/* View More Buyer Modal */}
        {isViewMoreModalOpen && selectedBuyer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">Buyer Details</h3>
                <button onClick={() => setIsViewMoreModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100">
                  <FaTimes className="text-xl" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl bg-gradient-to-br from-[#008f70] to-[#00604b] shadow-md">
                    {selectedBuyer.name ? selectedBuyer.name.substring(0, 2).toUpperCase() : 'B'}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 leading-tight mb-1">{selectedBuyer.name || 'Anonymous Buyer'}</h4>
                    <p className="text-sm font-semibold text-teal-600 bg-teal-50 inline-block px-2.5 py-0.5 rounded-full">{selectedBuyer.investorType || 'Investor'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedBuyer.companyName && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><FaBuilding /> Company</p>
                      <p className="font-semibold text-gray-800 text-sm">{selectedBuyer.companyName}</p>
                    </div>
                  )}
                  {selectedBuyer.jobTitle && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><FaBriefcase /> Job Title</p>
                      <p className="font-semibold text-gray-800 text-sm">{selectedBuyer.jobTitle}</p>
                    </div>
                  )}
                  {selectedBuyer.companyType && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Company Type</p>
                      <p className="font-semibold text-gray-800 text-sm">{selectedBuyer.companyType}</p>
                    </div>
                  )}
                  {selectedBuyer.email && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><FaEnvelope /> Email</p>
                      <p className="font-semibold text-gray-800 text-sm break-all">{selectedBuyer.email}</p>
                    </div>
                  )}
                  {selectedBuyer.phone && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><FaPhone /> Phone</p>
                      <p className="font-semibold text-gray-800 text-sm">{selectedBuyer.phone}</p>
                    </div>
                  )}
                  {selectedBuyer.location && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><FaMapMarkerAlt /> Location</p>
                      <p className="font-semibold text-gray-800 text-sm">{selectedBuyer.location}</p>
                    </div>
                  )}
                  {selectedBuyer.websiteUrl && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><FaGlobe /> Website</p>
                      <a href={selectedBuyer.websiteUrl} target="_blank" rel="noreferrer" className="font-semibold text-teal-600 hover:underline text-sm break-all">{selectedBuyer.websiteUrl}</a>
                    </div>
                  )}
                  {selectedBuyer.linkedinUrl && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><FaLink /> LinkedIn</p>
                      <a href={selectedBuyer.linkedinUrl} target="_blank" rel="noreferrer" className="font-semibold text-teal-600 hover:underline text-sm break-all">{selectedBuyer.linkedinUrl}</a>
                    </div>
                  )}
                  {selectedBuyer.licenseNumber && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><FaShieldAlt /> License Number</p>
                      <p className="font-semibold text-gray-800 text-sm">{selectedBuyer.licenseNumber}</p>
                    </div>
                  )}
                  {selectedBuyer.proofOfAuthorityUrl && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><FaLink /> Proof of Authority</p>
                      <a href={selectedBuyer.proofOfAuthorityUrl} target="_blank" rel="noreferrer" className="font-semibold text-teal-600 hover:underline text-sm break-all">View Document</a>
                    </div>
                  )}
                  {selectedBuyer.additionalDocumentUrl && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><FaLink /> Additional Document</p>
                      <a href={selectedBuyer.additionalDocumentUrl} target="_blank" rel="noreferrer" className="font-semibold text-teal-600 hover:underline text-sm break-all">View Document</a>
                    </div>
                  )}


                </div>
              </div>
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                {sentInterests.includes(selectedBuyer.id || buyerProfiles.findIndex(b => b === selectedBuyer)) ? (
                  <button disabled className="text-sm font-bold text-gray-400 cursor-not-allowed flex items-center gap-2 px-6 py-2.5 bg-gray-100 rounded-full border border-gray-200">
                    <FaCheckCircle className="text-green-500 text-lg" /> Interest Sent
                  </button>
                ) : (
                  <button
                    disabled={verificationStatus !== 'verified'}
                    onClick={() => {
                      const buyerId = selectedBuyer.id || buyerProfiles.findIndex(b => b === selectedBuyer);
                      setSentInterests([...sentInterests, buyerId]);

                      const sellerId = localStorage.getItem('userId') || '11111111-1111-1111-1111-111111111111';
                      const sellerName = localStorage.getItem('userName') || 'bala kumar';

                      const messagePayload = {
                        type: 'teaser_shared',
                        text: `${sellerName} has shared a Teaser with you. Are you interested in exploring this opportunity?`,
                        teaserDetails: {
                          industry: "Technology / SaaS",
                          revenue: "$1M - $5M ARR",
                          ebitda: "15% Margin",
                          description: "A fast-growing B2B SaaS platform specializing in workflow automation. Seeking strategic investment or buyout."
                        }
                      };

                      fetch('/api/dms/messages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          senderId: sellerId,
                          senderName: sellerName,
                          senderRole: 'seller',
                          recipientId: buyerId,
                          recipientName: selectedBuyer.name || 'Anonymous Buyer',
                          text: JSON.stringify(messagePayload)
                        })
                      }).catch(err => console.error('Failed to send message:', err));

                      setIsViewMoreModalOpen(false);
                    }}
                    className={`text-sm font-bold text-white px-6 py-2.5 rounded-full transition-colors flex items-center gap-2 shadow-sm ${verificationStatus !== 'verified'
                      ? 'bg-gray-400 cursor-not-allowed opacity-50'
                      : 'bg-[#008f70] hover:bg-[#007058]'
                      }`}
                  >
                    {verificationStatus !== 'verified' ? 'Verification Required' : 'Send Interest'} <FaArrowRight className="text-xs" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
