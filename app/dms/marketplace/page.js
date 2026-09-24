"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaSearch, FaCheck, FaShieldAlt, FaLink, FaArrowRight, FaLock, FaBriefcase, FaPowerOff, FaEllipsisV, FaMapMarkerAlt, FaRegBookmark, FaFilter, FaChevronDown, FaRedoAlt } from "react-icons/fa";

export default function Marketplace() {
  const [userRole, setUserRole] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);

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

  if (!isMounted || !userRole) return null;

  return (
    <main className={`${userRole ? 'min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] text-gray-900 selection:bg-teal-600/20' : 'min-h-screen bg-[#0b1120] text-white'}`}>
      {/* Custom Header for Marketplace */}
      <nav className="fixed top-0 left-0 w-full bg-[#0b1120]/95 backdrop-blur-md z-50 py-5 px-4 md:px-12 flex justify-between items-center border-b border-white/10 text-white">
        <div className="flex items-center">
          {!userRole ? (
            <Link href="/dms" className="flex items-center text-gray-400 hover:text-white transition-colors group py-2">
              <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back</span>
            </Link>
          ) : (
            <div className="flex items-center">
              <span className="text-xl font-bold text-white tracking-wide mr-20">Marketplace</span>
              <div className="flex items-center gap-20">
                <Link href="#" className="text-lg text-gray-300 hover:text-white font-medium transition-colors">
                  Profile
                </Link>
                <Link href="/dms/tracker" className="text-lg text-gray-300 hover:text-white font-medium transition-colors">
                  Tracker
                </Link>
              </div>
            </div>
          )}
        </div>



        {/* Right side - Auth */}
        <div className="hidden md:flex items-center gap-4">
          {userRole ? (
            <button
              onClick={handleLogout}
              className="text-white hover:text-red-400 border border-white/30 hover:border-red-400 px-6 py-2 rounded-full font-medium transition-colors whitespace-nowrap flex items-center gap-2"
            >
              <FaPowerOff /> Logout
            </button>
          ) : (
            <>
              <Link href="/dms/login" className="text-white hover:text-teal-500 border border-white/30 hover:border-teal-500 px-6 py-2 rounded-full font-medium transition-colors whitespace-nowrap">
                Sign In
              </Link>
              <Link href="/dms/register" className="text-white hover:text-teal-500 border border-white/30 hover:border-teal-500 px-6 py-2 rounded-full font-medium transition-colors whitespace-nowrap">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

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

      {/* Logged-in Dashboard View */}
      {userRole && (
        <div className="pt-32 px-4 md:px-8 lg:px-12 max-w-[1600px] w-full mx-auto pb-20">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                Explore <span className="text-transparent bg-clip-text bg-teal-600">Opportunities</span>
              </h1>
              <p className="text-gray-500 max-w-xl text-sm md:text-base leading-relaxed">Discover premium, vetted acquisition targets. Filter by your exact mandate and request access to anonymous teasers.</p>
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 bg-white px-5 py-2.5 rounded-full shadow-sm border border-gray-200/60">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              {opportunities.length} active matching deals
            </div>
          </div>

          {/* Filters Area */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200 mb-6">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-end">
              <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Industry */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Industry</label>
                  <div className="relative group">
                    <select className="w-full appearance-none bg-gray-50 hover:bg-gray-100 border border-gray-200/60 rounded-2xl py-3.5 pl-5 pr-12 text-sm font-semibold focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 text-gray-800 transition-all cursor-pointer">
                      <option>All Industries</option>
                      <option>Technology / SaaS</option>
                      <option>Healthcare</option>
                      <option>Manufacturing</option>
                    </select>
                    <FaChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none group-hover:text-gray-600 transition-colors" />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Location</label>
                  <div className="relative group">
                    <select className="w-full appearance-none bg-gray-50 hover:bg-gray-100 border border-gray-200/60 rounded-2xl py-3.5 pl-5 pr-12 text-sm font-semibold focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 text-gray-800 transition-all cursor-pointer">
                      <option>All Locations</option>
                      <option>North America</option>
                      <option>Europe</option>
                      <option>Asia Pacific</option>
                    </select>
                    <FaChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none group-hover:text-gray-600 transition-colors" />
                  </div>
                </div>

                {/* Deal Type */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Deal Type</label>
                  <div className="relative group">
                    <select className="w-full appearance-none bg-gray-50 hover:bg-gray-100 border border-gray-200/60 rounded-2xl py-3.5 pl-5 pr-12 text-sm font-semibold focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 text-gray-800 transition-all cursor-pointer">
                      <option>All Deal Types</option>
                      <option>Majority Acquisition</option>
                      <option>Minority Investment</option>
                      <option>Asset Sale</option>
                    </select>
                    <FaChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none group-hover:text-gray-600 transition-colors" />
                  </div>
                </div>
              </div>

              <button className="flex-shrink-0 text-gray-600 hover:text-gray-900 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all bg-gray-50 hover:bg-gray-200/80 px-6 py-3.5 rounded-2xl border border-gray-200/60 w-full lg:w-auto h-[52px]">
                <FaRedoAlt /> Reset
              </button>
            </div>
          </div>

          {/* Search Area Box */}
          <div className="bg-white rounded-3xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-200 mb-10">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 group w-full">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-teal-600 transition-colors">
                  <FaSearch className="text-lg" />
                </div>
                <input
                  type="text"
                  placeholder="Search by industry, keyword, or business model..."
                  className="w-full pl-14 pr-5 py-4 bg-gray-50/50 border border-transparent rounded-2xl text-base focus:outline-none focus:bg-gray-50 focus:border-teal-600/30 focus:ring-4 focus:ring-teal-600/10 transition-all hover:bg-gray-50"
                />
              </div>

              <div className="h-10 w-px bg-gray-100 hidden md:block"></div>

              <div className="relative w-full md:w-72">
                <select className="w-full appearance-none bg-gray-50/50 border border-transparent rounded-2xl py-4 pl-5 pr-12 text-base font-semibold text-gray-700 focus:outline-none focus:bg-gray-50 focus:border-teal-600/30 focus:ring-4 focus:ring-teal-600/10 transition-all cursor-pointer hover:bg-gray-50">
                  <option>Sort by: Newest First</option>
                  <option>Sort by: Revenue (High to Low)</option>
                  <option>Sort by: EBITDA (High to Low)</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none text-gray-400">
                  <FaChevronDown className="text-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid (Full width) */}
          <div className="w-full">
            {/* Projects Area */}
            <div className="w-full">
              {opportunities.length === 0 ? (
                <div className="w-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 bg-white border border-gray-200 rounded-3xl shadow-sm p-8">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <FaSearch className="text-3xl text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No opportunities found</h3>
                  <p className="text-gray-500 text-sm max-w-md text-center">Try adjusting your filters or search terms to find more deals matching your criteria.</p>
                  <button className="mt-6 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-full transition-colors shadow-lg shadow-teal-600/20">
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {opportunities.map((opp, idx) => (
                    <div key={idx} className="bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col group relative overflow-hidden hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300">
                      {/* Clean white card without top border to match design */}

                      <div className="p-6 sm:p-8 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-6">
                          <span className={`px-3.5 py-1.5 text-[10px] font-extrabold tracking-widest rounded-full uppercase shadow-sm ${opp.status === 'Active' ? 'bg-teal-600/10 text-teal-600' : 'bg-green-50 text-green-700'}`}>
                            {opp.status || 'Active'}
                          </span>
                          <button className="text-gray-300 hover:text-teal-600 transition-colors p-2 hover:bg-teal-600/5 rounded-full -mr-2 -mt-2">
                            <FaRegBookmark className="text-lg" />
                          </button>
                        </div>

                        <div className="mb-6">
                          <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-2 flex items-center gap-2">
                            {opp.projectName}
                          </p>
                          <h3 className="text-xl font-bold text-gray-900 leading-tight mb-4 group-hover:text-teal-600 transition-colors line-clamp-2">
                            {opp.name}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md font-semibold border border-gray-100">
                              <FaMapMarkerAlt className="mr-1.5 text-gray-400" /> {opp.geography || 'Global'}
                            </span>
                            <span className="inline-flex items-center text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md font-semibold border border-gray-100">
                              <FaBriefcase className="mr-1.5 text-gray-400" /> {opp.sector || 'Sector'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-8 mt-auto">
                          <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 font-bold">Revenue</p>
                            <p className="font-extrabold text-gray-900 text-sm">{opp.revenue || 'TBD'}</p>
                          </div>
                          <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 font-bold">EBITDA</p>
                            <p className="font-extrabold text-gray-900 text-sm">{opp.ebitda || 'TBD'}</p>
                          </div>
                          <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 font-bold">Growth</p>
                            <p className="font-extrabold text-gray-700 text-sm">{opp.growth || '--'}</p>
                          </div>
                          <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 font-bold">Employees</p>
                            <p className="font-extrabold text-gray-700 text-sm">{opp.employees || '--'}</p>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-gray-200">
                          <Link href={`/dms/teaser?project=${encodeURIComponent(opp.projectName)}&projectId=${opp.projectId}`} className="block w-full">
                            <button className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 hover:shadow-teal-600/40">
                              View Teaser <FaArrowRight className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                            </button>
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
    </main>
  );
}
