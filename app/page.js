"use client";

import { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import Link from "next/link";
import DocumentWorkspaceHero from "@/components/landing/DocumentWorkspaceHero";
import { FaFolderOpen, FaBars, FaTimes, FaChevronDown, FaServer, FaBriefcase } from "react-icons/fa";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);

  useEffect(() => {
    AOS.init({
      duration: 700,
      once: false,
      mirror: false,
      offset: 30,
      easing: 'ease-out-quad'
    });

    const dashboard = document.querySelector('.dashboard-mock');
    if (dashboard) {
      const handleMouseEnter = () => {
        dashboard.style.transform = 'scale(1.01)';
      };
      const handleMouseLeave = () => {
        dashboard.style.transform = 'scale(1)';
      };
      
      dashboard.addEventListener('mouseenter', handleMouseEnter);
      dashboard.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        dashboard.removeEventListener('mouseenter', handleMouseEnter);
        dashboard.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, []);

  useEffect(() => {
    const scrollBtn = document.getElementById('scrollTopBtn');

    const handleScroll = () => {
      if (window.scrollY > 500 && scrollBtn) {
        scrollBtn.classList.add('show');
      } else if (scrollBtn) {
        scrollBtn.classList.remove('show');
      }
    };

    const handleClick = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (scrollBtn) {
      window.addEventListener('scroll', handleScroll);
      scrollBtn.addEventListener('click', handleClick);

      return () => {
        window.removeEventListener('scroll', handleScroll);
        scrollBtn.removeEventListener('click', handleClick);
      };
    }
  }, []);

  return (
    <main className="overflow-x-hidden relative w-full">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md shadow-md z-50 py-4 px-4 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-16 lg:gap-24 flex-1">
          <div className="text-xl md:text-2xl font-bold text-gray-800 flex-shrink-0">
            <i className="fas fa-shield-alt text-[var(--brand)] mr-2"></i> SecureVDR
          </div>
          
          <div className="hidden md:flex relative group">
            <button className="flex items-center gap-2 font-semibold text-gray-700 hover:text-[var(--brand)] transition-colors text-lg py-2">
              Products
              <FaChevronDown className="text-sm transition-transform duration-300 group-hover:rotate-180" />
            </button>
            
            <div className="absolute top-10 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 w-72">
              <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-full">
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
        </div>
        
        <div className="hidden md:flex gap-4 items-center justify-end">
          <Link href="/business-owner/login" className="btn-bo-hover px-5 py-2 border-2 border-[var(--brand)] text-[var(--brand)] rounded-full font-semibold flex items-center gap-2 transition-all duration-700 whitespace-nowrap">
            <i className="fas fa-chart-line"></i> Business Owner
          </Link>
          <a href="/login" className="btn-bo-hover px-5 py-2 border-2 border-[var(--brand)] text-[var(--brand)] rounded-full font-semibold transition-all duration-700 whitespace-nowrap">Login</a>
          <Link href="/register" className="btn-bo-hover px-5 py-2 border-2 border-[var(--brand)] text-[var(--brand)] rounded-full font-semibold transition-all duration-700 whitespace-nowrap">Register</Link>
        </div>
        
        <button 
          className="md:hidden text-2xl text-[var(--brand)] focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed top-[68px] left-0 w-full bg-white shadow-md z-40 flex flex-col p-6 md:hidden gap-4 border-t border-gray-100 animate-fade-in">
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setIsProductsOpen(!isProductsOpen)} 
              className="flex justify-between items-center w-full px-5 py-3 font-semibold text-gray-700 bg-gray-50 rounded-lg"
            >
              Products
              <FaChevronDown className={`transition-transform duration-300 ${isProductsOpen ? 'rotate-180' : ''}`} />
            </button>
            {isProductsOpen && (
              <div className="flex flex-col gap-2 pl-4 animate-fade-in">
                <Link href="/" className="flex items-center px-5 py-2 text-gray-600 hover:text-[var(--brand)] font-medium">
                  <FaServer className="mr-3 text-[var(--brand)]" /> Virtual Data Room
                </Link>
                <Link href="/dms" className="flex items-center px-5 py-2 text-gray-600 hover:text-[var(--brand)] font-medium">
                  <FaBriefcase className="mr-3 text-[var(--brand)]" /> Deal Management System
                </Link>
              </div>
            )}
          </div>
          <a href="/login" className="btn-bo-hover w-full text-center px-5 py-3 border-2 border-[var(--brand)] text-[var(--brand)] rounded-full font-semibold transition-all duration-700" onClick={() => setIsMobileMenuOpen(false)}>Login</a>
          <Link href="/register" className="btn-bo-hover w-full text-center px-5 py-3 border-2 border-[var(--brand)] text-[var(--brand)] rounded-full font-semibold transition-all duration-700" onClick={() => setIsMobileMenuOpen(false)}>Register</Link>
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

      {/* Features Section */}
      <section className="py-20 px-4 md:px-16 bg-white" data-aos="fade-up">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-gray-800 mb-12">Powerful Features for Modern Data Rooms</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-gray-50 p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 text-center" data-aos="zoom-in" data-aos-delay="50">
            <i className="fas fa-fingerprint text-5xl text-brand mb-4"></i>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">🔐 Secure Authentication</h3>
            <p className="text-gray-600">SSO, MFA & granular access.</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 text-center" data-aos="zoom-in" data-aos-delay="100">
            <i className="fas fa-folder-tree text-5xl text-brand mb-4"></i>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">📁 Data Rooms</h3>
            <p className="text-gray-600">Organize files with drag & drop.</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 text-center" data-aos="zoom-in" data-aos-delay="150">
            <i className="fas fa-users-cog text-5xl text-brand mb-4"></i>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">👥 User Permissions</h3>
            <p className="text-gray-600">Role-based, fine-grained controls.</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 text-center" data-aos="zoom-in" data-aos-delay="200">
            <i className="fas fa-chart-pie text-5xl text-brand mb-4"></i>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">📊 Analytics Dashboard</h3>
            <p className="text-gray-600">Track views, downloads & heatmaps.</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 text-center" data-aos="zoom-in" data-aos-delay="250">
            <i className="fas fa-history text-5xl text-brand mb-4"></i>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">🧾 Audit Logs</h3>
            <p className="text-gray-600">Complete traceability & compliance.</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 text-center" data-aos="zoom-in" data-aos-delay="300">
            <i className="fas fa-comments text-5xl text-brand mb-4"></i>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">💬 Q&A Collaboration</h3>
            <p className="text-gray-600">Secure internal Q&A module.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 md:px-16 bg-gray-50">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-gray-800 mb-12">How It Works — Simple 5 Steps</h2>
        <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-md w-48 text-center" data-aos="flip-up" data-aos-delay="0">
            <div className="w-12 h-12 bg-[var(--brand)] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
            <h4 className="font-semibold text-lg text-gray-800">Register Company</h4>
            <p className="text-gray-500 text-sm">Sign up & verify business</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md w-48 text-center" data-aos="flip-up" data-aos-delay="100">
            <div className="w-12 h-12 bg-[var(--brand)] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
            <h4 className="font-semibold text-lg text-gray-800">Get Approval</h4>
            <p className="text-gray-500 text-sm">Fast KYC & onboarding</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md w-48 text-center" data-aos="flip-up" data-aos-delay="200">
            <div className="w-12 h-12 bg-[var(--brand)] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
            <h4 className="font-semibold text-lg text-gray-800">Create Data Room</h4>
            <p className="text-gray-500 text-sm">Upload & organize</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md w-48 text-center" data-aos="flip-up" data-aos-delay="300">
            <div className="w-12 h-12 bg-[var(--brand)] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">4</div>
            <h4 className="font-semibold text-lg text-gray-800">Invite Users</h4>
            <p className="text-gray-500 text-sm">Add investors, admins</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md w-48 text-center" data-aos="flip-up" data-aos-delay="400">
            <div className="w-12 h-12 bg-[var(--brand)] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">5</div>
            <h4 className="font-semibold text-lg text-gray-800">Securely Share</h4>
            <p className="text-gray-500 text-sm">Watermarked & expirable</p>
          </div>
        </div>
      </section>

      {/* Dashboard Mock */}
      <section className="py-20 px-4 md:px-16 bg-white" data-aos="fade-up" data-aos-offset="100">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-gray-800 mb-12">Real-Time Analytics Dashboard</h2>
        <div className="dashboard-mock max-w-4xl mx-auto bg-brand rounded-2xl p-6 shadow-xl transition-transform duration-300">
          <div className="flex flex-col sm:flex-row justify-between text-white mb-6 gap-2 text-sm sm:text-base">
            <span><i className="fas fa-chart-simple mr-2"></i> Data Room Insights</span>
            <span className="opacity-80"><i className="fas fa-download mr-2"></i> Export logs</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700 p-4 rounded-xl text-white" data-aos="fade-right" data-aos-delay="80">
              <i className="fas fa-eye mr-2"></i> <strong>1,284</strong> <span className="text-sm">views</span>
              <div className="h-2 bg-gray-600 rounded-full mt-2"><div className="h-2 bg-[var(--brand)]/70 rounded-full w-[70%]"></div></div>
            </div>
            <div className="bg-gray-700 p-4 rounded-xl text-white" data-aos="fade-up" data-aos-delay="150">
              <i className="fas fa-user-check mr-2"></i> <strong>42</strong> active users
            </div>
            <div className="bg-gray-700 p-4 rounded-xl text-white" data-aos="fade-left" data-aos-delay="220">
              <i className="fas fa-file-alt mr-2"></i> <strong>2.3k</strong> documents
            </div>
          </div>
          <div className="mt-5 bg-indigo-900/50 rounded-xl p-3 text-center text-gray-300" data-aos="zoom-in">
            <i className="fas fa-chart-line mr-2"></i> Document activity heatmap | Watermarked previews active
          </div>
          <div className="mt-4 text-xs text-center text-gray-400" data-aos="fade-up">
            Live audit trail & permission matrix
          </div>
        </div>
      </section>

      {/* Roles Cards */}
      <section className="py-20 px-4 md:px-16 bg-gray-50">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-gray-800 mb-12">Granular Roles & Access Control</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-center" data-aos="flip-left" data-aos-delay="0">
            <i className="fas fa-building text-5xl text-[var(--brand)] mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-800">Company Owner</h3>
            <p className="text-gray-500">Full governance & master keys</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-center" data-aos="flip-left" data-aos-delay="100">
            <i className="fas fa-crown text-5xl text-[var(--brand)] mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-800">Super Admin</h3>
            <p className="text-gray-500">Platform-wide settings, audit</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-center" data-aos="flip-left" data-aos-delay="200">
            <i className="fas fa-user-tie text-5xl text-[var(--brand)] mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-800">Admin</h3>
            <p className="text-gray-500">Manage rooms & users</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-center" data-aos="flip-left" data-aos-delay="300">
            <i className="fas fa-user-friends text-5xl text-[var(--brand)] mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-800">External User</h3>
            <p className="text-gray-500">View-only + watermark</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 md:px-16 bg-white">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-gray-800 mb-12">What Our Clients Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-gray-50 p-6 rounded-xl shadow-md" data-aos="fade-right" data-aos-duration="600">
            <div className="flex gap-1 text-yellow-400 mb-4">
              <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
            </div>
            <p className="text-gray-700 italic">SecureVDR reduced our M&A document prep time by 50%. The watermarking and audit logs are unmatched.</p>
            <h4 className="font-semibold mt-4 text-gray-800">— Jessica Wu, VP at Meridian</h4>
          </div>
          <div className="bg-gray-50 p-6 rounded-xl shadow-md" data-aos="fade-up" data-aos-duration="600" data-aos-delay="100">
            <div className="flex gap-1 text-yellow-400 mb-4">
              <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
            </div>
            <p className="text-gray-700 italic">Finally a VDR that combines enterprise security with a modern UI. Our legal team loves the Q&A module.</p>
            <h4 className="font-semibold mt-4 text-gray-800">— David O&#39;Brian, General Counsel
</h4>
          </div>
          <div className="bg-gray-50 p-6 rounded-xl shadow-md" data-aos="fade-left" data-aos-duration="600" data-aos-delay="200">
            <div className="flex gap-1 text-yellow-400 mb-4">
              <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
            </div>
            <p className="text-gray-700 italic">Best decision for our Series B fundraising. Real-time analytics helped us track investor interest.</p>
            <h4 className="font-semibold mt-4 text-gray-800">— Priya Mehta, CFO at StellarTech</h4>
          </div>
        </div>
      </section>

      {/* Security Stack */}
      <section className="py-20 px-4 md:px-16 bg-gray-50">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-gray-800 mb-12">Military‑Grade Security Stack</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-center" data-aos="zoom-in-right">
            <i className="fas fa-fingerprint text-5xl text-brand mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-800">🔒 Dynamic Watermarking</h3>
            <p className="text-gray-500">Prevent leaks with user-specific watermarks</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-center" data-aos="zoom-in">
            <i className="fas fa-list-ul text-5xl text-brand mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-800">📋 Activity Tracking</h3>
            <p className="text-gray-500">Every view, print, download logged</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-center" data-aos="zoom-in-left">
            <i className="fas fa-shield-virus text-5xl text-brand mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-800">🔐 End‑to‑End Encryption</h3>
            <p className="text-gray-500">AES-256 + TLS 1.3, secure vaults</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-center" data-aos="zoom-in-left">
            <i className="fas fa-file-signature text-5xl text-brand mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-800">📄 NDA enforcement</h3>
            <p className="text-gray-500">Customizable legal agreements</p>
          </div>
        </div>
      </section>



      {/* Pricing */}
      <section className="py-20 px-4 md:px-16 bg-gray-50">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-gray-800 mb-12">Flexible Plans for Every Business</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 text-center" data-aos="fade-up" data-aos-delay="0">
            <h3 className="text-2xl font-bold text-gray-800">Basic</h3>
            <div className="text-5xl font-bold text-gray-800 mt-4">$249</div>
            <p className="text-gray-500">/month</p>
            <ul className="mt-6 space-y-2 text-left text-gray-600">
              <li><i className="fas fa-check-circle text-green-500 mr-2"></i> Up to 5 users</li>
              <li><i className="fas fa-check-circle text-green-500 mr-2"></i> 50 GB storage</li>
              <li><i className="fas fa-check-circle text-green-500 mr-2"></i> Basic analytics</li>
            </ul>
            <button className="mt-6 w-full py-2 border-2 border-[var(--brand)] text-[var(--brand)] rounded-full font-semibold hover:bg-[var(--brand)]/10 transition-all duration-300">Get Basic</button>
          </div>
          <div className="bg-[var(--brand)] text-white p-6 rounded-2xl shadow-xl scale-105 relative" data-aos="fade-up" data-aos-delay="150">
            <span className="absolute top-0 right-0 bg-yellow-400 text-gray-800 text-xs px-3 py-1 rounded-bl-xl rounded-tr-xl font-bold">Popular</span>
            <h3 className="text-2xl font-bold">Pro</h3>
            <div className="text-5xl font-bold mt-4">$599</div>
            <p className="text-[var(--brand)]/20">/month</p>
            <ul className="mt-6 space-y-2 text-left">
              <li><i className="fas fa-check-circle mr-2"></i> Unlimited users</li>
              <li><i className="fas fa-check-circle mr-2"></i> 500 GB + advanced logs</li>
              <li><i className="fas fa-check-circle mr-2"></i> Audit & watermarks</li>
            </ul>
            <button className="mt-6 w-full py-2 bg-white text-[var(--brand)] rounded-full font-semibold hover:bg-gray-100 transition-all duration-300">Start Pro</button>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 text-center" data-aos="fade-up" data-aos-delay="300">
            <h3 className="text-2xl font-bold text-gray-800">Enterprise</h3>
            <div className="text-5xl font-bold text-gray-800 mt-4">Custom</div>
            <p className="text-gray-500">Tailored solutions</p>
            <ul className="mt-6 space-y-2 text-left text-gray-600">
              <li><i className="fas fa-check-circle text-green-500 mr-2"></i> SSO + API access</li>
              <li><i className="fas fa-check-circle text-green-500 mr-2"></i> Dedicated support</li>
              <li><i className="fas fa-check-circle text-green-500 mr-2"></i> Compliance (GDPR/SOC2)</li>
            </ul>
            <button className="mt-6 w-full py-2 border-2 border-[var(--brand)] text-[var(--brand)] rounded-full font-semibold hover:bg-[var(--brand)]/10 transition-all duration-300">Contact Sales</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 md:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-xl font-bold"><i className="fas fa-shield-alt mr-2"></i> SecureVDR</h3>
              <p className="mt-3">Enterprise Data Rooms <br/>with next-gen security.</p>
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

      {/* Scroll to Top Button */}
      <div id="scrollTopBtn" className="fixed bottom-6 right-6 bg-[var(--brand)] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg cursor-pointer opacity-0 invisible transition-all duration-300 hover:bg-[var(--brand-dark)] z-50 show:opacity-100 show:visible">
        <i className="fas fa-arrow-up"></i>
      </div>

      {/* Custom animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 4.5s ease-in-out infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        #scrollTopBtn.show {
          opacity: 1 !important;
          visibility: visible !important;
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
          background: linear-gradient(to right, var(--brand), var(--brand-secondary));
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
        .btn-bo-hover i {
          transition: color 0.8s ease-out;
        }
        .btn-bo-hover:hover i {
          color: white !important;
        }
      `}</style>
    </main>
  );
}