"use client";

import { useEffect, useRef, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import Link from "next/link";
import DocumentWorkspaceHero from "@/components/landing/DocumentWorkspaceHero";
import ForestCard from "@/components/ForestCard";
import { FaBars, FaTimes, FaUserTie, FaBuilding, FaHandshake, FaChartLine, FaShieldAlt, FaFileContract, FaKey, FaSearch, FaChevronDown, FaServer, FaBriefcase } from "react-icons/fa";

export default function DMSLanding() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState({
    products: false,
    owners: false,
    acquirers: false,
    resources: false,
    company: false,
  });

  const toggleMobileSubmenu = (menu) => {
    setMobileExpanded(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const journeyRef = useRef(null);
  const [roadProgress, setRoadProgress] = useState(0);

  useEffect(() => {
    AOS.init({
      duration: 700,
      once: false,
      mirror: false,
      offset: 30,
      easing: 'ease-out-quad'
    });
  }, []);

  useEffect(() => {
    let rafId = null;

    const updateProgress = () => {
      if (!journeyRef.current) return;
      const rect = journeyRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const startY = vh * 0.85;
      const totalScrollable = rect.height + vh * 0.35;
      const raw = (startY - rect.top) / totalScrollable;
      const clamped = Math.max(0, Math.min(1, raw));
      setRoadProgress(clamped);
    };

    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <main className="overflow-x-hidden relative w-full bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 z-50 py-3.5 pl-3 sm:pl-4 lg:pl-6 pr-4 sm:pr-6 lg:pr-8 flex justify-between items-center">
        <div className="flex items-center gap-4 lg:gap-5 xl:gap-7 2xl:gap-9 min-w-0">
          <div className="text-xl md:text-2xl font-bold text-gray-800 flex-shrink-0">
            <Link href="/" className="flex items-center">
              <i className="fas fa-shield-alt text-[var(--brand)] mr-2.5"></i>
              <span>Secure DMS</span>
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-3.5 lg:gap-4 xl:gap-6 2xl:gap-8 text-[13.5px] lg:text-[14px] xl:text-[15px] 2xl:text-[15.5px]">
            {/* Products Dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1.5 font-semibold text-[#283244] hover:text-[#2563eb] transition-colors py-2 whitespace-nowrap cursor-pointer group-hover:text-[#2563eb]"
              >
                <span>Products</span>
                <FaChevronDown className="text-[11px] text-[#2563eb] transition-transform duration-300 group-hover:rotate-180" />
              </button>

              <div className="absolute top-full left-0 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 w-72">
                <div className="bg-white rounded-2xl shadow-[0_12px_45px_rgba(0,0,0,0.12)] border border-[#e2e8f0] py-2 w-full">
                  <Link href="/" className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors group/item">
                    <div className="w-10 h-10 rounded-full bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center mr-3 group-hover/item:scale-110 transition-transform">
                      <FaServer />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 group-hover/item:text-[var(--brand)]">Virtual Data Room</div>
                      <div className="text-xs text-gray-500">Secure document sharing</div>
                    </div>
                  </Link>
                  <Link href="/dms" className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors border-t border-gray-50 group/item">
                    <div className="w-10 h-10 rounded-full bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center mr-3 group-hover/item:scale-110 transition-transform">
                      <FaBriefcase />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 group-hover/item:text-[var(--brand)]">Deal Management System</div>
                      <div className="text-xs text-gray-500">End-to-end deal workflow</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* 1. Owners Dropdown (img 1) */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1.5 font-semibold text-[#283244] hover:text-[#2563eb] transition-colors py-2 whitespace-nowrap group-hover:text-[#2563eb] cursor-pointer"
              >
                <span>Business Owners</span>
                <FaChevronDown className="text-[11px] text-[#2563eb] transition-transform duration-300 group-hover:rotate-180" />
              </button>

              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 w-[590px]">
                <div className="relative bg-white rounded-2xl shadow-[0_12px_45px_rgba(0,0,0,0.12)] border border-[#e2e8f0] px-8 py-7 text-left">
                  <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white rotate-45 border-t border-l border-[#e2e8f0]"></div>

                  {/* Top Banner */}
                  <div className="text-center pb-4 mb-5 border-b border-[#eef1f6]">
                    <Link href="/dms/register?role=advisor" className="inline-block group/title">
                      <h4 className="text-[21px] font-bold text-[#1f2738] group-hover/title:text-[#2563eb] transition-colors tracking-[-0.01em]">
                        Hire an M&A Advisor
                      </h4>
                    </Link>
                    <p className="text-[14.5px] text-[#4b5568] font-normal mt-1 leading-normal">
                      Partner With an Exit Consultant to Hire a Great M&A Advisor.
                    </p>
                  </div>

                  {/* 2 Columns */}
                  <div className="grid grid-cols-2 gap-x-10 gap-y-4">
                    <Link href="/business-owner/login" className="block group/item">
                      <h5 className="text-[19px] font-bold text-[#1f2738] group-hover/item:text-[#2563eb] transition-colors tracking-[-0.015em] leading-snug">
                        Sell Your Business
                      </h5>
                      <p className="text-[13.5px] text-[#505b6f] font-normal mt-1.5 leading-[1.45]">
                        Sharpen Your Exit Plan. Assemble Your Deal Team. Avoid Costly Mistakes.
                      </p>
                    </Link>

                    <Link href="/dms/marketplace" className="block group/item">
                      <h5 className="text-[19px] font-bold text-[#1f2738] group-hover/item:text-[#2563eb] transition-colors tracking-[-0.015em] leading-snug">
                        Buyer Demand Report
                      </h5>
                      <p className="text-[13.5px] text-[#505b6f] font-normal mt-1.5 leading-[1.45]">
                        How Many Buyers Are Interested In Your Business?
                      </p>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. M&A Advisors */}
            <button
              type="button"
              className="font-semibold text-[#283244] hover:text-[#2563eb] transition-colors py-2 whitespace-nowrap cursor-pointer"
            >
              M&A Advisors
            </button>

            {/* 3. Acquirers Dropdown (img 2) */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1.5 font-semibold text-[#283244] hover:text-[#2563eb] transition-colors py-2 whitespace-nowrap group-hover:text-[#2563eb] cursor-pointer"
              >
                <span>Investors</span>
                <FaChevronDown className="text-[11px] text-[#2563eb] transition-transform duration-300 group-hover:rotate-180" />
              </button>

              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 w-[590px]">
                <div className="relative bg-white rounded-2xl shadow-[0_12px_45px_rgba(0,0,0,0.12)] border border-[#e2e8f0] px-8 py-8 text-left">
                  <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white rotate-45 border-t border-l border-[#e2e8f0]"></div>

                  {/* 2 Columns */}
                  <div className="grid grid-cols-2 gap-x-10">
                    <Link href="/dms/marketplace/find_deal" className="block group/item">
                      <h5 className="text-[19px] font-bold text-[#1f2738] group-hover/item:text-[#2563eb] transition-colors tracking-[-0.015em] leading-snug">
                        Source Actionable Deals
                      </h5>
                      <p className="text-[13.5px] text-[#505b6f] font-normal mt-1.5 leading-[1.45]">
                        Source Relevant Acquisition and Minority Equity Opportunities.
                      </p>
                    </Link>

                    <Link href="/dms/register" className="block group/item">
                      <h5 className="text-[19px] font-bold text-[#1f2738] group-hover/item:text-[#2563eb] transition-colors tracking-[-0.015em] leading-snug">
                        Sell a Portfolio Company
                      </h5>
                      <p className="text-[13.5px] text-[#505b6f] font-normal mt-1.5 leading-[1.45]">
                        Run a Competitive Advisor Search for Your Next Portfolio Company Exit.
                      </p>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Valuation Calculator */}
            <button
              type="button"
              className="font-semibold text-[#283244] hover:text-[#2563eb] transition-colors py-2 whitespace-nowrap cursor-pointer"
            >
              Valuation Calculator
            </button>

            {/* 5. Resources Dropdown (img 4) */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1.5 font-semibold text-[#283244] hover:text-[#2563eb] transition-colors py-2 whitespace-nowrap group-hover:text-[#2563eb] cursor-pointer"
              >
                <span>Resources</span>
                <FaChevronDown className="text-[11px] text-[#2563eb] transition-transform duration-300 group-hover:rotate-180" />
              </button>

              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 w-[590px]">
                <div className="relative bg-white rounded-2xl shadow-[0_12px_45px_rgba(0,0,0,0.12)] border border-[#e2e8f0] px-8 py-7 text-left">
                  <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white rotate-45 border-t border-l border-[#e2e8f0]"></div>

                  {/* Top Banner */}
                  <div className="text-center pb-4 mb-5 border-b border-[#eef1f6]">
                    <Link href="/dms" className="inline-block group/title">
                      <h4 className="text-[21px] font-bold text-[#1f2738] group-hover/title:text-[#2563eb] transition-colors tracking-[-0.01em]">
                        Middle Market Review
                      </h4>
                    </Link>
                    <p className="text-[14.5px] text-[#4b5568] font-normal mt-1 leading-normal">
                      Weekly Articles & Reports Covering Private Capital Markets.
                    </p>
                  </div>

                  {/* Resource Link */}
                  <div className="text-center">
                    <Link href="/dms" className="inline-block group/item">
                      <h5 className="text-[19px] font-bold text-[#1f2738] group-hover/item:text-[#2563eb] transition-colors tracking-[-0.015em] leading-snug">
                        Owner Resource Center
                      </h5>
                      <p className="text-[13.5px] text-[#505b6f] font-normal mt-1.5 leading-[1.45]">
                        Articles & Resources for Owners Preparing for an Exit.
                      </p>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Company Dropdown (img 3) */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1.5 font-semibold text-[#283244] hover:text-[#2563eb] transition-colors py-2 whitespace-nowrap group-hover:text-[#2563eb] cursor-pointer"
              >
                <span>Company</span>
                <FaChevronDown className="text-[11px] text-[#2563eb] transition-transform duration-300 group-hover:rotate-180" />
              </button>

              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 w-[640px]">
                <div className="relative bg-white rounded-2xl shadow-[0_12px_45px_rgba(0,0,0,0.12)] border border-[#e2e8f0] px-8 py-7 text-left">
                  <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white rotate-45 border-t border-l border-[#e2e8f0]"></div>

                  {/* Top Banner */}
                  <div className="text-center pb-4 mb-5 border-b border-[#eef1f6]">
                    <Link href="/dms" className="inline-block group/title">
                      <h4 className="text-[21px] font-bold text-[#1f2738] group-hover/title:text-[#2563eb] transition-colors tracking-[-0.01em]">
                        About Us
                      </h4>
                    </Link>
                    <p className="text-[14.5px] text-[#4b5568] font-normal mt-1 leading-normal">
                      The Story Behind Our Private Deal Platform & the Team Building It.
                    </p>
                  </div>

                  {/* 2x2 Grid */}
                  <div className="grid grid-cols-2 gap-x-10 gap-y-6">
                    <Link href="/dms/marketplace" className="block group/item">
                      <h5 className="text-[19px] font-bold text-[#1f2738] group-hover/item:text-[#2563eb] transition-colors tracking-[-0.015em] leading-snug">
                        Closed Deals
                      </h5>
                      <p className="text-[13.5px] text-[#505b6f] font-normal mt-1.5 leading-[1.45]">
                        A Selection of Closed Transactions, Sorted by Industry.
                      </p>
                    </Link>

                    <Link href="/dms" className="block group/item">
                      <h5 className="text-[19px] font-bold text-[#1f2738] group-hover/item:text-[#2563eb] transition-colors tracking-[-0.015em] leading-snug">
                        Member Reviews
                      </h5>
                      <p className="text-[13.5px] text-[#505b6f] font-normal mt-1.5 leading-[1.45]">
                        Video Testimonials and Written Reviews From Current Platform Members.
                      </p>
                    </Link>

                    <Link href="/dms" className="block group/item">
                      <h5 className="text-[19px] font-bold text-[#1f2738] group-hover/item:text-[#2563eb] transition-colors tracking-[-0.015em] leading-snug">
                        Network Overview
                      </h5>
                      <p className="text-[13.5px] text-[#505b6f] font-normal mt-1.5 leading-[1.45]">
                        Review Network Composition and Recent Deal Activity.
                      </p>
                    </Link>

                    <Link href="/dms/marketplace/tracker" className="block group/item">
                      <h5 className="text-[19px] font-bold text-[#1f2738] group-hover/item:text-[#2563eb] transition-colors tracking-[-0.015em] leading-snug">
                        Deal Flow Dashboard
                      </h5>
                      <p className="text-[13.5px] text-[#505b6f] font-normal mt-1.5 leading-[1.45]">
                        Analyze Live Deal Flow Activity and Market Trends.
                      </p>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex gap-2.5 xl:gap-3 items-center justify-end ml-3 xl:ml-5 flex-shrink-0">
          <Link href="/dms/login" className="btn-bo-hover px-4 py-2 xl:px-5 xl:py-2 text-xs xl:text-sm border-2 border-[var(--brand)] text-[var(--brand)] rounded-full font-semibold transition-all duration-700 whitespace-nowrap">Sign In</Link>
          <Link href="/dms/register" className="btn-bo-hover px-4 py-2 xl:px-5 xl:py-2 text-xs xl:text-sm border-2 border-[var(--brand)] text-[var(--brand)] rounded-full font-semibold transition-all duration-700 whitespace-nowrap bg-[var(--brand)]/5">Get Started</Link>
        </div>

        <button
          className="lg:hidden text-2xl text-[var(--brand)] focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed top-[68px] left-0 w-full bg-white shadow-md z-40 flex flex-col p-6 lg:hidden gap-4 border-t border-gray-100 animate-fade-in max-h-[calc(100vh-68px)] overflow-y-auto">
          <div className="flex flex-col gap-2">
            {/* Products Mobile Accordion */}
            <div>
              <button
                type="button"
                onClick={() => toggleMobileSubmenu('products')}
                className="flex justify-between items-center w-full px-5 py-3 font-semibold text-gray-700 bg-gray-50 rounded-lg hover:text-[var(--brand)] transition-colors text-left"
              >
                <span>Products</span>
                <FaChevronDown className={`text-xs text-blue-600 transition-transform duration-300 ${mobileExpanded.products ? 'rotate-180' : ''}`} />
              </button>
              {mobileExpanded.products && (
                <div className="flex flex-col gap-2 pl-4 py-2 animate-fade-in border-l-2 border-blue-100 ml-3">
                  <Link href="/" className="flex items-center px-4 py-2 text-gray-600 hover:text-[var(--brand)] font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                    <FaServer className="mr-3 text-[var(--brand)]" /> Virtual Data Room
                  </Link>
                  <Link href="/dms" className="flex items-center px-4 py-2 text-gray-600 hover:text-[var(--brand)] font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                    <FaBriefcase className="mr-3 text-[var(--brand)]" /> Deal Management System
                  </Link>
                </div>
              )}
            </div>

            {/* Owners Mobile Accordion */}
            <div>
              <button
                type="button"
                onClick={() => toggleMobileSubmenu('owners')}
                className="flex justify-between items-center w-full px-5 py-3 font-semibold text-gray-700 bg-gray-50 rounded-lg hover:text-[var(--brand)] transition-colors text-left"
              >
                <span>Business Owners</span>
                <FaChevronDown className={`text-xs text-blue-600 transition-transform duration-300 ${mobileExpanded.owners ? 'rotate-180' : ''}`} />
              </button>
              {mobileExpanded.owners && (
                <div className="flex flex-col gap-2 pl-4 py-2 animate-fade-in border-l-2 border-blue-100 ml-3">
                  <Link href="/dms/register?role=advisor" className="p-2 text-sm text-gray-700 hover:text-[var(--brand)] font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                    <div>Hire an M&A Advisor</div>
                    <div className="text-xs text-gray-500 font-normal">Partner With an Exit Consultant to Hire a Great M&A Advisor.</div>
                  </Link>
                  <Link href="/business-owner/login" className="p-2 text-sm text-gray-700 hover:text-[var(--brand)] font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                    <div>Sell Your Business</div>
                    <div className="text-xs text-gray-500 font-normal">Sharpen Your Exit Plan. Assemble Your Deal Team.</div>
                  </Link>
                  <Link href="/dms/marketplace" className="p-2 text-sm text-gray-700 hover:text-[var(--brand)] font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                    <div>Buyer Demand Report</div>
                    <div className="text-xs text-gray-500 font-normal">How Many Buyers Are Interested In Your Business?</div>
                  </Link>
                </div>
              )}
            </div>

            <button type="button" className="w-full px-5 py-3 font-semibold text-gray-700 bg-gray-50 rounded-lg hover:text-[var(--brand)] transition-colors text-left">
              M&A Advisors
            </button>

            {/* Acquirers Mobile Accordion */}
            <div>
              <button
                type="button"
                onClick={() => toggleMobileSubmenu('acquirers')}
                className="flex justify-between items-center w-full px-5 py-3 font-semibold text-gray-700 bg-gray-50 rounded-lg hover:text-[var(--brand)] transition-colors text-left"
              >
                <span>Investors</span>
                <FaChevronDown className={`text-xs text-blue-600 transition-transform duration-300 ${mobileExpanded.acquirers ? 'rotate-180' : ''}`} />
              </button>
              {mobileExpanded.acquirers && (
                <div className="flex flex-col gap-2 pl-4 py-2 animate-fade-in border-l-2 border-blue-100 ml-3">
                  <Link href="/dms/marketplace/find_deal" className="p-2 text-sm text-gray-700 hover:text-[var(--brand)] font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                    <div>Source Actionable Deals</div>
                    <div className="text-xs text-gray-500 font-normal">Source Relevant Acquisition and Minority Equity Opportunities.</div>
                  </Link>
                  <Link href="/dms/register" className="p-2 text-sm text-gray-700 hover:text-[var(--brand)] font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                    <div>Sell a Portfolio Company</div>
                    <div className="text-xs text-gray-500 font-normal">Run a Competitive Advisor Search for Your Next Portfolio Company Exit.</div>
                  </Link>
                </div>
              )}
            </div>

            <button type="button" className="w-full px-5 py-3 font-semibold text-gray-700 bg-gray-50 rounded-lg hover:text-[var(--brand)] transition-colors text-left">
              Valuation Calculator
            </button>

            {/* Resources Mobile Accordion */}
            <div>
              <button
                type="button"
                onClick={() => toggleMobileSubmenu('resources')}
                className="flex justify-between items-center w-full px-5 py-3 font-semibold text-gray-700 bg-gray-50 rounded-lg hover:text-[var(--brand)] transition-colors text-left"
              >
                <span>Resources</span>
                <FaChevronDown className={`text-xs text-blue-600 transition-transform duration-300 ${mobileExpanded.resources ? 'rotate-180' : ''}`} />
              </button>
              {mobileExpanded.resources && (
                <div className="flex flex-col gap-2 pl-4 py-2 animate-fade-in border-l-2 border-blue-100 ml-3">
                  <Link href="/dms" className="p-2 text-sm text-gray-700 hover:text-[var(--brand)] font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                    <div>Middle Market Review</div>
                    <div className="text-xs text-gray-500 font-normal">Weekly Articles & Reports Covering Private Capital Markets.</div>
                  </Link>
                  <Link href="/dms" className="p-2 text-sm text-gray-700 hover:text-[var(--brand)] font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                    <div>Owner Resource Center</div>
                    <div className="text-xs text-gray-500 font-normal">Articles & Resources for Owners Preparing for an Exit.</div>
                  </Link>
                </div>
              )}
            </div>

            {/* Company Mobile Accordion */}
            <div>
              <button
                type="button"
                onClick={() => toggleMobileSubmenu('company')}
                className="flex justify-between items-center w-full px-5 py-3 font-semibold text-gray-700 bg-gray-50 rounded-lg hover:text-[var(--brand)] transition-colors text-left"
              >
                <span>Company</span>
                <FaChevronDown className={`text-xs text-blue-600 transition-transform duration-300 ${mobileExpanded.company ? 'rotate-180' : ''}`} />
              </button>
              {mobileExpanded.company && (
                <div className="flex flex-col gap-2 pl-4 py-2 animate-fade-in border-l-2 border-blue-100 ml-3">
                  <Link href="/dms" className="p-2 text-sm text-gray-700 hover:text-[var(--brand)] font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                    <div>About Us</div>
                    <div className="text-xs text-gray-500 font-normal">The Story Behind Our Private Deal Platform.</div>
                  </Link>
                  <Link href="/dms/marketplace" className="p-2 text-sm text-gray-700 hover:text-[var(--brand)] font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                    <div>Closed Deals</div>
                    <div className="text-xs text-gray-500 font-normal">A Selection of Closed Transactions.</div>
                  </Link>
                  <Link href="/dms" className="p-2 text-sm text-gray-700 hover:text-[var(--brand)] font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                    <div>Member Reviews</div>
                    <div className="text-xs text-gray-500 font-normal">Video Testimonials and Written Reviews.</div>
                  </Link>
                  <Link href="/dms" className="p-2 text-sm text-gray-700 hover:text-[var(--brand)] font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                    <div>Network Overview</div>
                    <div className="text-xs text-gray-500 font-normal">Review Network Composition and Deal Activity.</div>
                  </Link>
                  <Link href="/dms/marketplace/tracker" className="p-2 text-sm text-gray-700 hover:text-[var(--brand)] font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                    <div>Deal Flow Dashboard</div>
                    <div className="text-xs text-gray-500 font-normal">Analyze Live Deal Flow Activity and Market Trends.</div>
                  </Link>
                </div>
              )}
            </div>
          </div>
          <Link href="/dms/login" className="btn-bo-hover w-full text-center px-5 py-3 border-2 border-[var(--brand)] text-[var(--brand)] rounded-full font-semibold transition-all duration-700" onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>
          <Link href="/dms/register" className="btn-bo-hover w-full text-center px-5 py-3 border-2 border-[var(--brand)] text-[var(--brand)] rounded-full font-semibold transition-all duration-700 bg-[var(--brand)]/5" onClick={() => setIsMobileMenuOpen(false)}>Get Started</Link>
        </div>
      )}

      {/* Document Workspace Hero Section */}
      <DocumentWorkspaceHero
        headlinePrimary="Move your deal forward."
        headlineAccent="From first interest to close."
        description="Discover opportunities, manage due diligence, and share deal documents with the right people at each stage."
        primaryActionText="Sell your business"
        primaryActionHref="/business-owner/login"
        secondaryActionText="Find a deal"
        secondaryActionHref="/dms/marketplace/find_deal"
        supportsPrivateByDefault={true}
        supportsAccessControls={true}
      />

      {/* Forest of the Future Card Banner */}
      <ForestCard />

      {/* The Seller's Journey */}
      <section className="pt-24 pb-24 lg:pb-0 px-4 md:px-16 bg-[#f1f5fb] relative overflow-hidden">
        {/* Decorative dot-matrix patterns in corners */}
        <div
          className="pointer-events-none absolute top-10 left-8 w-44 h-44 opacity-35"
          style={{
            backgroundImage: "radial-gradient(#94a3b8 2px, transparent 2px)",
            backgroundSize: "16px 16px",
          }}
        />
        <div
          className="pointer-events-none absolute bottom-10 right-8 w-44 h-44 opacity-35"
          style={{
            backgroundImage: "radial-gradient(#94a3b8 2px, transparent 2px)",
            backgroundSize: "16px 16px",
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12 lg:mb-0 lg:text-left lg:absolute lg:left-[3%] lg:top-[10px] lg:max-w-xl z-20" data-aos="fade-up">
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#0f172a] tracking-tight mb-3">The Seller's Journey</h2>
            <p className="text-lg md:text-xl text-[#4b5568]">A seamless pathway to list, market, and sell your company.</p>
          </div>

          {/* Desktop Winding Road Journey */}
          <div ref={journeyRef} className="hidden lg:block relative w-full h-[1080px]">
            <svg
              className="w-full h-full"
              viewBox="0 0 1000 1080"
              preserveAspectRatio="none"
              fill="none"
              aria-hidden="true"
            >
              <defs>
                <mask id="sellerRoadRevealMask">
                  <path
                    d="M 790 155 Q 790 200 745 200 L 250 200 A 165 165 0 0 0 250 530 L 750 530 A 165 165 0 0 1 750 860 L 220 860 A 100 100 0 0 0 120 960 L 120 1080"
                    stroke="white"
                    strokeWidth="64"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength="1"
                    strokeDasharray="1"
                    strokeDashoffset={1 - roadProgress}
                  />
                </mask>
              </defs>

              <g mask="url(#sellerRoadRevealMask)">
                {/* Dashed lead-in from Card 1 (top-right) to road start */}
                <path
                  d="M 790 155 Q 790 200 745 200 L 360 200"
                  stroke="#94a3b8"
                  strokeWidth="3"
                  strokeDasharray="10 10"
                  strokeLinecap="round"
                />
                {/* Wide soft road track */}
                <path
                  d="M 360 200 L 250 200 A 165 165 0 0 0 250 530 L 750 530 A 165 165 0 0 1 750 860 L 220 860 A 100 100 0 0 0 120 960 L 120 1080"
                  stroke="#e2e8f0"
                  strokeWidth="52"
                  strokeLinecap="butt"
                  strokeLinejoin="round"
                />
                {/* Dashed center line */}
                <path
                  d="M 360 200 L 250 200 A 165 165 0 0 0 250 530 L 750 530 A 165 165 0 0 1 750 860 L 220 860 A 100 100 0 0 0 120 960 L 120 1080"
                  stroke="#94a3b8"
                  strokeWidth="3"
                  strokeDasharray="10 10"
                  strokeLinecap="round"
                />
              </g>
            </svg>

            {/* Card 1 (Top-Right) with 01 badge */}
            <div className={`absolute right-[2%] top-[0px] w-[460px] overflow-visible bg-gradient-to-br from-white via-[#f5f8ff] to-[#eaf1ff] p-7 rounded-2xl shadow-[0_10px_30px_rgba(15,78,165,0.08)] border border-[#d6e4ff] hover:border-[var(--brand)]/50 hover:shadow-[0_16px_40px_rgba(15,78,165,0.14)] transition-all duration-500 group z-20 ${roadProgress >= 0.04 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl bg-gradient-to-r from-[var(--brand)] to-[#2563eb]" />
              <div className="absolute -left-5 -top-5 w-14 h-14 rounded-full bg-[var(--brand)] text-white ring-4 ring-white shadow-md flex items-center justify-center text-base font-extrabold">
                01
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--brand)] text-white flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
                  <FaBriefcase />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#1f2738] mb-2 group-hover:text-[var(--brand)] transition-colors">Onboarding & Project Creation</h3>
                  <p className="text-[#505b6f] text-[15px] leading-relaxed">Sign up and create a confidential project with industry and revenue metrics—hidden from the public.</p>
                </div>
              </div>
            </div>

            {/* Road Dot: Stage 1 (Start of wide road) */}
            <div className={`absolute left-[36%] top-[200px] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center transition-all duration-500 ${roadProgress >= 0.16 ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}`}>
              <div className="w-5 h-5 rounded-full bg-[#1e293b] ring-4 ring-white shadow-sm" />
              <div className="absolute top-12 w-60 text-center">
                <p className="text-[15px] font-bold text-[#1f2738] leading-snug">1. Register &amp; Setup Project</p>
                <p className="text-sm text-[#505b6f] mt-0.5">Confidential deal profile</p>
              </div>
            </div>

            {/* Milestone 02 on Track 2 */}
            <div className={`absolute left-[25%] top-[530px] -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-[#2563eb] text-white ring-4 ring-white shadow-md flex items-center justify-center text-base font-extrabold z-20 transition-all duration-500 ${roadProgress >= 0.34 ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}`}>
              02
            </div>
            {/* Road Dots: Stages 2, 3, 4 */}
            <div className={`absolute left-[42%] top-[530px] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center transition-all duration-500 ${roadProgress >= 0.43 ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}`}>
              <div className="absolute bottom-12 w-44 text-center">
                <p className="text-[15px] font-bold text-[#1f2738] leading-snug">2. Create Teaser &amp; Accept Requests</p>
              </div>
              <div className="w-5 h-5 rounded-full bg-[#1e293b] ring-4 ring-white shadow-sm" />
            </div>
            <div className={`absolute left-[59%] top-[530px] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center transition-all duration-500 ${roadProgress >= 0.50 ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}`}>
              <div className="absolute bottom-12 w-44 text-center">
                <p className="text-[15px] font-bold text-[#1f2738] leading-snug">3. Sign NDA &amp; Create Deal Room</p>
              </div>
              <div className="w-5 h-5 rounded-full bg-[#1e293b] ring-4 ring-white shadow-sm" />
            </div>
            <div className={`absolute left-[75%] top-[530px] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center transition-all duration-500 ${roadProgress >= 0.57 ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}`}>
              <div className="absolute bottom-12 w-44 text-center">
                <p className="text-[15px] font-bold text-[#1f2738] leading-snug">4. VDR (Virtual Data Room)</p>
              </div>
              <div className="w-5 h-5 rounded-full bg-[#1e293b] ring-4 ring-white shadow-sm" />
            </div>
            {/* Card 2 */}
            <div className={`absolute left-[4%] top-[576px] w-[390px] overflow-hidden bg-gradient-to-br from-white via-[#f3f8ff] to-[#e5f0ff] p-6 rounded-2xl shadow-[0_10px_30px_rgba(37,99,235,0.08)] border border-[#cfe0ff] hover:border-[#2563eb]/50 hover:shadow-[0_16px_40px_rgba(37,99,235,0.14)] transition-all duration-500 group z-10 ${roadProgress >= 0.36 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2563eb] to-[#38bdf8]" />
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#2563eb] text-white flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
                  <FaFileContract />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#1f2738] mb-1.5 group-hover:text-[#2563eb] transition-colors">VDR Setup & Teaser Publishing</h3>
                  <p className="text-[#505b6f] text-sm leading-relaxed">Publish an anonymous Teaser, approve buyer requests, enforce NDAs, and organize your Virtual Data Room.</p>
                </div>
              </div>
            </div>

            {/* Milestone 03 on Track 3 (Right side, entering from U-turn) */}
            <div className={`absolute left-[75%] top-[860px] -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-[var(--brand-secondary)] text-white ring-4 ring-white shadow-md flex items-center justify-center text-base font-extrabold z-20 transition-all duration-500 ${roadProgress >= 0.68 ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}`}>
              03
            </div>
            {/* Road Dots: Stages 5, 6, 7 (flowing right-to-left) */}
            <div className={`absolute left-[60%] top-[860px] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center transition-all duration-500 ${roadProgress >= 0.74 ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}`}>
              <div className="absolute bottom-12 w-44 text-center">
                <p className="text-[15px] font-bold text-[#1f2738] leading-snug">5. Due Diligence (Q&amp;A &amp; Review)</p>
              </div>
              <div className="w-5 h-5 rounded-full bg-[#1e293b] ring-4 ring-white shadow-sm" />
            </div>
            <div className={`absolute left-[43%] top-[860px] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center transition-all duration-500 ${roadProgress >= 0.80 ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}`}>
              <div className="absolute bottom-12 w-44 text-center">
                <p className="text-[15px] font-bold text-[#1f2738] leading-snug">6. Bidding (Offer Comparison)</p>
              </div>
              <div className="w-5 h-5 rounded-full bg-[#1e293b] ring-4 ring-white shadow-sm" />
            </div>
            <div className={`absolute left-[25%] top-[860px] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center transition-all duration-500 ${roadProgress >= 0.86 ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}`}>
              <div className="absolute bottom-12 w-44 text-center">
                <p className="text-[15px] font-bold text-[#1f2738] leading-snug">7. Closing (SPA &amp; Deal Done!)</p>
              </div>
              <div className="w-5 h-5 rounded-full bg-[#1e293b] ring-4 ring-white shadow-sm" />
            </div>
            {/* Card 3 */}
            <div className={`absolute right-[3%] top-[906px] w-[440px] overflow-hidden bg-gradient-to-br from-white via-[#f2fbfc] to-[#e3f5f7] p-6 rounded-2xl shadow-[0_10px_30px_rgba(28,127,159,0.08)] border border-[#cbeaf0] hover:border-[var(--brand-secondary)]/55 hover:shadow-[0_16px_40px_rgba(28,127,159,0.16)] transition-all duration-500 group z-10 ${roadProgress >= 0.70 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--brand-secondary)] to-[#0ea5e9]" />
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[var(--brand-secondary)] text-white flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
                  <FaHandshake />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#1f2738] mb-1.5 group-hover:text-[var(--brand-secondary)] transition-colors">Monitor, Q&A & Close</h3>
                  <p className="text-[#505b6f] text-sm leading-relaxed">Manage due diligence Q&amp;As, compare buyer offers, and close the deal with a digitally signed SPA.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile / Tablet Vertical Road */}
          <div className="lg:hidden relative pl-10 space-y-8">
            <div className="absolute left-5 top-4 bottom-4 w-2 -translate-x-1/2 bg-[#e2e8f0] rounded-full" />
            <div className="absolute left-5 top-4 bottom-4 w-0 -translate-x-1/2 border-l-2 border-dashed border-[#94a3b8]" />

            <div className="relative bg-gradient-to-br from-white via-[#f5f8ff] to-[#eaf1ff] p-6 rounded-2xl shadow-md border border-[#d6e4ff]">
              <div className="absolute -left-10 top-6 w-10 h-10 rounded-full bg-[var(--brand)] text-white ring-4 ring-white shadow flex items-center justify-center text-xs font-extrabold">01</div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-[var(--brand)] text-white flex items-center justify-center text-sm"><FaBriefcase /></div>
                <h3 className="text-lg font-bold text-[#1f2738]">Onboarding & Project Creation</h3>
              </div>
              <p className="text-[#505b6f] text-sm leading-relaxed mb-3">Sign up and create a confidential project with industry and revenue metrics—hidden from the public.</p>
              <ul className="space-y-1 text-xs font-semibold text-[#1f2738]">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]" />1. Register &amp; Setup Project</li>
              </ul>
            </div>

            <div className="relative bg-gradient-to-br from-white via-[#f3f8ff] to-[#e5f0ff] p-6 rounded-2xl shadow-md border border-[#cfe0ff]">
              <div className="absolute -left-10 top-6 w-10 h-10 rounded-full bg-[#2563eb] text-white ring-4 ring-white shadow flex items-center justify-center text-xs font-extrabold">02</div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-[#2563eb] text-white flex items-center justify-center text-sm"><FaFileContract /></div>
                <h3 className="text-lg font-bold text-[#1f2738]">VDR Setup & Teaser Publishing</h3>
              </div>
              <p className="text-[#505b6f] text-sm leading-relaxed mb-3">Publish an anonymous Teaser, approve buyer requests, enforce NDAs, and organize your Virtual Data Room.</p>
              <ul className="space-y-1 text-xs font-semibold text-[#1f2738]">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />2. Create Teaser &amp; Accept Buyer Requests</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />3. Sign NDA &amp; Create Deal Room</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />4. VDR (Virtual Data Room)</li>
              </ul>
            </div>

            <div className="relative bg-gradient-to-br from-white via-[#f2fbfc] to-[#e3f5f7] p-6 rounded-2xl shadow-md border border-[#cbeaf0]">
              <div className="absolute -left-10 top-6 w-10 h-10 rounded-full bg-[var(--brand-secondary)] text-white ring-4 ring-white shadow flex items-center justify-center text-xs font-extrabold">03</div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-[var(--brand-secondary)] text-white flex items-center justify-center text-sm"><FaHandshake /></div>
                <h3 className="text-lg font-bold text-[#1f2738]">Monitor, Q&A & Close</h3>
              </div>
              <p className="text-[#505b6f] text-sm leading-relaxed mb-3">Manage due diligence Q&amp;As, compare buyer offers, and close the deal with a digitally signed SPA.</p>
              <ul className="space-y-1 text-xs font-semibold text-[#1f2738]">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-secondary)]" />5. Due Diligence (Q&amp;A &amp; Review)</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-secondary)]" />6. Bidding (Offer Comparison)</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-secondary)]" />7. Closing (SPA &amp; Deal Done!)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* The Buyer's Journey */}
      <section className="py-24 px-4 md:px-16 bg-white relative">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
            <div className="flex-1" data-aos="fade-left">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-800 mb-6">The Buyer's Journey</h2>
              <p className="text-xl text-gray-500 mb-8">Discover, analyze, and acquire premium businesses with confidence.</p>

              <div className="space-y-6">
                <div className="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-xl flex-shrink-0"><FaSearch /></div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">Explore Marketplace</h4>
                    <p className="text-gray-600">Browse anonymous teasers on our Deal Marketplace to find the perfect acquisition target.</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl flex-shrink-0"><FaKey /></div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">Request Access & Sign NDA</h4>
                    <p className="text-gray-600">Express interest and instantly sign a digital e-Signature NDA upon Seller approval.</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xl flex-shrink-0"><FaShieldAlt /></div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">Due Diligence in Private Workspace</h4>
                    <p className="text-gray-600">Enter your secure VDR. Unveil the CIM, review classified documents, and ask direct questions via the Q&A module.</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl flex-shrink-0"><FaHandshake /></div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">Submit Bid & Sign SPA</h4>
                    <p className="text-gray-600">Confidently submit your Letter of Intent (LOI). If accepted, sign the final SPA digitally to close the deal.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full" data-aos="fade-right">
              <div className="bg-gray-50 rounded-3xl p-8 border border-gray-200 shadow-inner relative">
                {/* Mockup UI of Buyer Dashboard */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-gray-700">Deal Marketplace</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Live</span>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 border border-gray-100 rounded-lg hover:border-blue-300 transition-colors cursor-pointer">
                      <div className="text-sm text-gray-400 mb-1">Teaser ID: #9042</div>
                      <div className="font-bold text-lg mb-2">Profitable SaaS Startup</div>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">$10M Revenue</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Tech</span>
                      </div>
                      <button className="mt-4 w-full py-2 bg-indigo-600 text-white rounded font-medium text-sm hover:bg-indigo-700 transition-colors">Request NDA & Access</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Diagram Section */}
      <section className="py-24 px-4 md:px-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-800 mb-6" data-aos="fade-up">Where Journeys Intersect</h2>
          <p className="text-xl text-gray-500 mb-16 max-w-3xl mx-auto" data-aos="fade-up" data-aos-delay="100">Our platform orchestrates the complex dance between Sellers and Buyers securely in real-time.</p>

          <div className="relative" data-aos="zoom-in" data-aos-delay="200">
            {/* Custom Visual Timeline */}
            <div className="flex flex-col md:flex-row items-center justify-between relative bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
              {/* Connector line */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-blue-200 via-indigo-300 to-teal-200 hidden md:block -translate-y-1/2"></div>

              <div className="relative z-10 flex flex-col items-center bg-white p-4 rounded-xl w-48 mb-8 md:mb-0">
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl mb-4 border-4 border-white shadow-md"><FaBuilding /></div>
                <h4 className="font-bold text-gray-800">1. Publish Teaser</h4>
                <p className="text-xs text-gray-500 mt-2">Seller lists company</p>
              </div>

              <div className="relative z-10 flex flex-col items-center bg-white p-4 rounded-xl w-48 mb-8 md:mb-0">
                <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-2xl mb-4 border-4 border-white shadow-md"><FaKey /></div>
                <h4 className="font-bold text-gray-800">2. NDA & Access</h4>
                <p className="text-xs text-gray-500 mt-2">Buyer requests, Seller approves</p>
              </div>

              <div className="relative z-10 flex flex-col items-center bg-white p-4 rounded-xl w-48 mb-8 md:mb-0">
                <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl mb-4 border-4 border-white shadow-md"><FaShieldAlt /></div>
                <h4 className="font-bold text-gray-800">3. Isolated VDR</h4>
                <p className="text-xs text-gray-500 mt-2">Due Diligence & Q&A phase</p>
              </div>

              <div className="relative z-10 flex flex-col items-center bg-white p-4 rounded-xl w-48">
                <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-2xl mb-4 border-4 border-white shadow-md"><FaFileContract /></div>
                <h4 className="font-bold text-gray-800">4. SPA Closing</h4>
                <p className="text-xs text-gray-500 mt-2">Bid accepted, deal signed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-16 bg-indigo-900 text-center">
        <div className="max-w-3xl mx-auto" data-aos="zoom-in">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to Streamline Your Next M&A Deal?</h2>
          <p className="text-indigo-200 text-lg mb-10">Join thousands of sellers and investors who trust our secure Deal Management System.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register" className="px-8 py-4 bg-[var(--brand)] text-white font-bold rounded-full shadow-lg hover:scale-105 transition-transform duration-300">Create Your Account Today</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 md:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-xl font-bold"><i className="fas fa-shield-alt mr-2"></i> SecureVDR</h3>
              <p className="mt-3">Enterprise Data Rooms <br />with next-gen security.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Product</h4>
              <p className="hover:text-white cursor-pointer transition-colors">Features</p>
              <p className="hover:text-white cursor-pointer transition-colors mt-2">Security</p>
              <p className="hover:text-white cursor-pointer transition-colors mt-2">Pricing</p>
              <p className="hover:text-white cursor-pointer transition-colors mt-2">API</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Resources</h4>
              <p className="hover:text-white cursor-pointer transition-colors">Help Center</p>
              <p className="hover:text-white cursor-pointer transition-colors mt-2">Webinars</p>
              <p className="hover:text-white cursor-pointer transition-colors mt-2">Compliance</p>
              <p className="hover:text-white cursor-pointer transition-colors mt-2">Blog</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Contact</h4>
              <p><i className="fas fa-envelope mr-2"></i> hello@securevdr.com</p>
              <p className="mt-2"><i className="fas fa-phone-alt mr-2"></i> +1 (888) 452-8637</p>
              <div className="flex gap-4 mt-4 text-xl">
                <i className="fab fa-linkedin hover:text-white cursor-pointer transition-colors"></i>
                <i className="fab fa-twitter hover:text-white cursor-pointer transition-colors"></i>
                <i className="fab fa-github hover:text-white cursor-pointer transition-colors"></i>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm">
            &copy; 2026 SecureVDR — All rights reserved. Data protection at its core.
          </div>
        </div>
      </footer>

      {/* Custom styles */}
      <style jsx global>{`
        .deal-network-watermark {
          color: transparent !important;
          -webkit-text-fill-color: transparent !important;
          -webkit-text-stroke: 1.5px #cbd5e1 !important;
          user-select: none;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(10px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 4.5s ease-in-out infinite;
        }
        .btn-bo-hover {
          position: relative;
          z-index: 1;
        }
        .btn-bo-hover::before {
          content: "";
          position: absolute;
          top: -2px; bottom: -2px; left: -2px; right: -2px;
          border-radius: inherit;
          background: linear-gradient(to right, var(--brand), var(--brand-secondary, #3b82f6));
          z-index: -1;
          transition: clip-path 0.8s ease-out;
          clip-path: circle(0% at 50% 100%);
        }
        .btn-bo-hover:hover::before {
          clip-path: circle(150% at 50% 100%);
        }
        .btn-bo-hover:hover {
          color: white !important;
          border-color: transparent !important;
        }
        .btn-bo-hover:hover i {
          color: white !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </main>
  );
}
