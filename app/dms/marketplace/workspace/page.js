"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaSearch, FaCheck, FaShieldAlt, FaLink, FaArrowRight, FaLock, FaBriefcase, FaPowerOff, FaEllipsisV, FaMapMarkerAlt, FaRegBookmark, FaFilter, FaChevronDown, FaRedoAlt, FaThLarge, FaUser, FaUserCircle, FaSignOutAlt, FaRegBell, FaEnvelope, FaBuilding, FaPhone, FaGlobe, FaEdit, FaCheckCircle, FaTimes, FaChartLine, FaFolderOpen, FaRegClock, FaPlus, FaDatabase, FaCog } from "react-icons/fa";

const industrySubcategories = {
  "Technology / SaaS": ["Software Development", "Cloud Computing", "AI & Machine Learning", "Cybersecurity", "FinTech", "HealthTech", "EdTech"],
  "Healthcare / Life Sciences": ["Pharmaceuticals", "Biotechnology", "Medical Devices", "Healthcare IT", "Hospitals & Clinics"],
  "Manufacturing": ["Automotive", "Aerospace & Defense", "Electronics", "Industrial Machinery", "Chemicals"],
  "Industrials": ["Construction", "Logistics & Supply Chain", "Waste Management", "Packaging"],
  "Financial Services": ["Banking", "Investment Banking", "Insurance", "Wealth Management", "Venture Capital / Private Equity"],
  "Real Estate": ["Commercial Real Estate", "Residential Real Estate", "Property Management", "Real Estate Tech"],
  "Consumer Goods & Retail": ["E-commerce", "Apparel & Fashion", "Food & Beverage", "Home & Garden", "Personal Care"],
  "Energy & Utilities": ["Renewable Energy", "Oil & Gas", "Water Utilities", "Electric Utilities"],
  "Telecommunications": ["Wireless Services", "Broadband & Cable", "Networking Equipment"],
  "Other": ["Other"]
};

const standardBusinessModels = [
  "B2B (Business to Business)",
  "B2C (Business to Consumer)",
  "B2B2C",
  "D2C (Direct to Consumer)",
  "SaaS (Software as a Service)",
  "Marketplace",
  "E-commerce",
  "Subscription",
  "Freemium",
  "Enterprise",
  "Franchise",
  "Other"
];

const standardEmployees = [
  "1-10 Employees",
  "11-20 Employees",
  "21-30 Employees",
  "31-40 Employees",
  "41-50 Employees",
  "51-60 Employees",
  "61-70 Employees",
  "71-80 Employees",
  "81-90 Employees",
  "91-100 Employees"
];

const standardLegalStructures = [
  "LLC (Limited Liability Company)",
  "C-Corporation",
  "S-Corporation",
  "Sole Proprietorship",
  "Partnership",
  "Limited Partnership (LP)",
  "Limited Liability Partnership (LLP)",
  "Private Limited (Pvt Ltd)",
  "Public Limited",
  "One Person Company (OPC)",
  "Section 8 Company",
  "Cooperative Society",
  "Non-Profit Organization",
  "Other"
];

const standardStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Other"
];

const stateDistricts = {
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode", "Vellore", "Thoothukudi", "Dindigul", "Thanjavur", "Ranipet", "Chengalpattu", "Kancheepuram"],
  "Karnataka": ["Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Hubballi-Dharwad", "Mangaluru", "Belagavi", "Kalaburagi", "Udupi"],
  "Maharashtra": ["Mumbai City", "Mumbai Suburban", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Kolhapur"],
  "Delhi": ["New Delhi", "Central Delhi", "South Delhi", "North Delhi", "East Delhi", "West Delhi", "Shahdara"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Alappuzha", "Ernakulam"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ranga Reddy"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar"]
};

const standardRevenueBands = [
  "Below ₹1 Crore",
  "₹1–5 Crore",
  "₹5–10 Crore",
  "₹10–50 Crore",
  "₹50–100 Crore",
  "₹100+ Crore"
];

const standardBuyerTypes = [
  "Strategic Buyer",
  "Financial Investor",
  "Private Equity",
  "Individual Buyer",
  "Competitor",
  "Industry Buyer",
  "Family Office",
  "Holding Company",
  "Management/Employee Buyer",
  "Any Qualified Buyer"
];

const standardCurrencies = [
  { code: "USD", symbol: "$" },
  { code: "INR", symbol: "₹" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "JPY", symbol: "¥" },
  { code: "AUD", symbol: "A$" },
  { code: "CAD", symbol: "C$" },
  { code: "CHF", symbol: "CHF" },
  { code: "CNY", symbol: "¥" },
  { code: "SEK", symbol: "kr" },
  { code: "NZD", symbol: "NZ$" },
  { code: "MXN", symbol: "$" },
  { code: "SGD", symbol: "S$" },
  { code: "HKD", symbol: "HK$" },
  { code: "NOK", symbol: "kr" },
  { code: "KRW", symbol: "₩" },
  { code: "TRY", symbol: "₺" },
  { code: "RUB", symbol: "₽" },
  { code: "BRL", symbol: "R$" },
  { code: "ZAR", symbol: "R" },
  { code: "AED", symbol: "د.إ" }
];

export default function WorkspacePage() {
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('workspace');
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
  const [isMounted, setIsMounted] = useState(false);
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);
  const [isBuyerDropdownOpen, setIsBuyerDropdownOpen] = useState(false);
  const router = useRouter();

  // Create Project Modal State
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [newProject, setNewProject] = useState({
    name: '',
    dealType: 'Merge',
    projectType: 'Industrial',
    description: '',
    businessModel: '',
    industry: '',
    subIndustry: '',
    yearFounded: '',
    employeeDropdown: '',
    employeeCustom: '',
    legalStructure: '',
    headquarters: '',
    operationsLocations: [],
    customerCount: '',
    topCustomerCurrency: 'USD',
    topCustomerRevenue: '',
    revenue: '',
    ebitda: '',
    grossMargin: '',
    netProfit: '',
    recurringRevenue: '',
    growthRate: '',
    debt: '',
    workingCapital: '',
    addBacks: '',
    keyHighlights: '',
    reasonForSale: '',
    askingPrice: '',
    valuationExpectation: '',
    preferredBuyerTypes: [],
    transitionPeriod: '',
    profitAndLossFile: null,
    balanceSheetFile: null,
    ebitdaBandDropdown: '',
    mandate: ''
  });

  const handleCreateProject = async () => {
    try {
      const companyId = localStorage.getItem('companyId') || 'test-company-123';
      const formData = new FormData();
      formData.append('name', newProject.name || 'Untitled Project');
      formData.append('companyId', companyId);
      formData.append('dealType', newProject.dealType);
      formData.append('projectType', newProject.projectType);
      formData.append('description', newProject.description);
      formData.append('businessModel', newProject.businessModel);
      formData.append('industry', newProject.industry);
      formData.append('subIndustry', newProject.subIndustry);
      formData.append('yearFounded', newProject.yearFounded);
      formData.append('numberOfEmployees', newProject.employeeDropdown === 'Other' ? newProject.employeeCustom : newProject.employeeDropdown);
      formData.append('legalStructure', newProject.legalStructure);
      formData.append('headquarters', newProject.headquarters);
      formData.append('operationsLocations', JSON.stringify(newProject.operationsLocations));
      formData.append('customerCount', newProject.customerCount);
      formData.append('topCustomerRevenue', `${newProject.topCustomerCurrency} ${newProject.topCustomerRevenue}`);
      formData.append('revenue', newProject.revenue);
      formData.append('ebitda', newProject.ebitda);
      formData.append('grossMargin', newProject.grossMargin);
      formData.append('netProfit', newProject.netProfit);
      formData.append('recurringRevenue', newProject.recurringRevenue);
      formData.append('growthRate', newProject.growthRate);
      formData.append('debt', newProject.debt);
      formData.append('workingCapital', newProject.workingCapital);
      formData.append('addBacks', newProject.addBacks);
      formData.append('revenueBandDropdown', newProject.revenueBandDropdown);
      formData.append('keyHighlights', newProject.keyHighlights);
      formData.append('reasonForSale', newProject.reasonForSale);
      formData.append('askingPrice', newProject.askingPrice);
      formData.append('valuationExpectation', newProject.valuationExpectation);
      formData.append('preferredBuyerTypes', JSON.stringify(newProject.preferredBuyerTypes));
      formData.append('transitionPeriod', newProject.transitionPeriod);
      formData.append('ebitdaBandDropdown', newProject.ebitdaBandDropdown);
      formData.append('mandate', newProject.mandate);

      if (newProject.profitAndLossFile) {
        formData.append('profitAndLossFile', newProject.profitAndLossFile);
      }
      if (newProject.balanceSheetFile) {
        formData.append('balanceSheetFile', newProject.balanceSheetFile);
      }

      const res = await fetch('/api/dms/projects', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspaces([data.project, ...workspaces]);
        setIsCreateProjectOpen(false);
        setCreateStep(1);
        setNewProject({ name: '', dealType: 'Merge', projectType: 'Industrial', description: '', businessModel: '', industry: '', subIndustry: '', yearFounded: '', employeeDropdown: '', employeeCustom: '', legalStructure: '', headquarters: '', operationsLocations: [], customerCount: '', topCustomerCurrency: 'USD', topCustomerRevenue: '', revenue: '', ebitda: '', grossMargin: '', netProfit: '', recurringRevenue: '', growthRate: '', debt: '', workingCapital: '', addBacks: '', revenueBandDropdown: '', revenueBandCustom: '', businessSummary: '', keyHighlights: '', reasonForSale: '', askingPrice: '', valuationExpectation: '', preferredBuyerTypes: [], transitionPeriod: '', profitAndLossFile: null, balanceSheetFile: null, ebitdaBandDropdown: '', mandate: '' });
      }
    } catch (e) {
      console.error("Failed to create project", e);
    }
  };

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

    const lowerRole = role.toLowerCase();
    setUserRole(lowerRole);
    setUserName(localStorage.getItem('userName') || 'bala kumar');

    // Fetch active data from the database
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dms/marketplace');
        if (res.ok) {
          const data = await res.json();
          setOpportunities(data.teasers || []);
          setBuyerProfiles(data.buyers || []);
        }
      } catch (err) {
        console.error("Failed to fetch marketplace deals:", err);
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
  const [projectFilter, setProjectFilter] = useState('All');

  const filteredWorkspaces = workspaces.filter(ws => {
    if (projectFilter === 'All') return true;
    if (projectFilter === 'Approved') return ws.status?.toLowerCase() === 'active';
    if (projectFilter === 'Pending') return ws.status?.toLowerCase() === 'inactive';
    if (projectFilter === 'Rejected') return ws.status?.toLowerCase() === 'rejected';
    return true;
  });

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



  return (
    <div className="w-full">



      {/* Main Content Area */}
      <div className="w-full">





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
              {userRole === 'seller' ? (
                /* Buyer Profiles Area */
                <div className="w-full">
                  {buyerProfiles.length === 0 ? (
                    <div className="w-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 bg-white border border-gray-100 rounded-3xl shadow-sm p-8">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <FaUser className="text-3xl text-gray-300" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No buyers found</h3>
                      <p className="text-gray-500 text-sm max-w-md text-center">Try adjusting your filters or search terms to find more buyers matching your criteria.</p>
                      <button className="mt-6 px-6 py-2.5 bg-[#008f70] hover:bg-[#00755d] text-white text-sm font-bold rounded-full transition-colors shadow-sm">
                        Clear all filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {buyerProfiles.map((buyer, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 flex flex-col group relative overflow-hidden transition-all duration-300 h-full rounded-xl hover:shadow-[0_4px_25px_rgb(0,0,0,0.04)] hover:-translate-y-1">
                          <div className="p-5 flex flex-col h-full">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex gap-3 items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-[#008f70]`}>
                                  {buyer.name ? buyer.name.substring(0, 2).toUpperCase() : 'B'}
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{buyer.investorType || 'Investor'}</p>
                                  <h3 className="text-base font-bold text-gray-900 leading-tight">
                                    {buyer.name || 'Anonymous Buyer'}
                                  </h3>
                                </div>
                              </div>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              <span className="inline-flex items-center text-[11px] text-gray-600 bg-white px-2.5 py-1 rounded-full font-medium border border-gray-200">
                                {buyer.companyType || 'Corporate'}
                              </span>
                            </div>

                            {/* Description */}
                            <p className="text-[13px] text-gray-500 mb-6 line-clamp-2">
                              {buyer.jobTitle ? `${buyer.jobTitle} at ${buyer.companyName || 'a leading firm'}.` : 'Seeking strategic acquisitions.'}
                            </p>

                            {/* Divider */}
                            <div className="h-px bg-gray-100 w-full mb-4 mt-auto"></div>

                            {/* Footer */}
                            <div className="flex justify-between items-center">
                              <div className="flex items-center text-[11px] text-gray-500 gap-1.5 font-medium">
                                <span className="w-3 h-3 border border-gray-400 rounded-full inline-block"></span> Active Mandate
                              </div>
                              {sentInterests.includes(buyer.id || idx) ? (
                                <button disabled className="text-[13px] font-bold text-gray-400 cursor-not-allowed flex items-center gap-1.5">
                                  <FaCheckCircle className="text-green-500" /> Interest Sent
                                </button>
                              ) : (
                                <button
                                  onClick={() => setSentInterests([...sentInterests, buyer.id || idx])}
                                  className="text-[13px] font-bold text-white bg-[#008f70] hover:bg-[#007058] px-4 py-2 rounded-full transition-colors flex items-center gap-1.5 shadow-sm shadow-teal-900/10"
                                >
                                  Send Interest
                                </button>
                              )}
                            </div>
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
              {userRole !== 'buyer' && !userRole.includes('guest') && vdrRole === 'super_admin' && (
                <button
                  onClick={() => setIsCreateProjectOpen(true)}
                  className="flex items-center gap-2 bg-[#008f70] hover:bg-[#007058] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
                >
                  <FaPlus className="text-xs" /> Create Project
                </button>
              )}
            </div>

            {/* Project Filter Tabs */}
            <div className="flex items-center gap-2 mb-8 border-b border-gray-200 pb-px">
              {['All', 'Approved', 'Pending', 'Rejected'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setProjectFilter(tab)}
                  className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${projectFilter === tab
                    ? 'border-[#008f70] text-[#008f70]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

              {/* Existing Workspaces */}
              {filteredWorkspaces.map((workspace, index) => {
                const isActive = workspace.status?.toLowerCase() === 'active';
                const isRejected = workspace.status?.toLowerCase() === 'rejected';

                return (
                  <div
                    onClick={() => {
                      if (!isActive) return; // Prevent clicking if not active
                      const pid = workspace.projectId || workspace.id;
                      sessionStorage.removeItem(`deal_activeTab_${pid}`);
                      router.push(`/dms/deal?projectId=${pid}&projectName=${encodeURIComponent(workspace.name)}`);
                    }}
                    key={index}
                    className={`block h-48 bg-white rounded-2xl border shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] p-5 relative flex flex-col transition-all duration-300 group ${isActive ? 'border-gray-200 cursor-pointer hover:border-teal-300 hover:shadow-[0_8px_24px_-4px_rgba(0,143,112,0.12)] hover:-translate-y-1' : isRejected ? 'border-red-100 cursor-not-allowed bg-red-50/20' : 'border-gray-200 cursor-not-allowed bg-gray-50/40'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-auto">
                      <div className="flex gap-2 items-center">
                        <span className={`px-2.5 py-1 text-[9px] font-black rounded-md uppercase tracking-widest shadow-sm border ${isActive ? 'bg-[#e6fbf2] text-[#00c875] border-[#00c875]/20' : isRejected ? 'bg-red-50 text-red-600 border-red-200/50' : 'bg-orange-50 text-orange-600 border-orange-200/50'
                          }`}>
                          {isActive ? 'ACTIVE' : isRejected ? 'REJECTED' : 'PENDING'}
                        </span>
                        {workspace.dealType && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded uppercase tracking-wider">
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

                    <div className="flex flex-col items-center justify-center flex-1 gap-4 pb-2 relative z-10 mt-3">
                      {isActive ? (
                        <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center border border-teal-100/60 group-hover:bg-teal-100/50 group-hover:scale-110 transition-all duration-300 shadow-sm">
                          <FaShieldAlt className="text-[26px] text-teal-600 drop-shadow-sm" />
                        </div>
                      ) : isRejected ? (
                        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100/60 shadow-sm">
                          <FaTimes className="text-[26px] text-red-500" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100/60 shadow-sm">
                          <FaLock className="text-[26px] text-orange-500" />
                        </div>
                      )}

                      <div className="text-center w-full">
                        <span className={`font-extrabold text-[15px] tracking-tight block px-2 truncate ${isActive ? 'text-gray-900 group-hover:text-teal-800 transition-colors' : 'text-gray-500'
                          }`}>
                          {workspace.name}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
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
      </div>

      {/* Multi-step Create Project Modal */}
      {isCreateProjectOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">

            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/80">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{createStep === 1 ? 'Create New Project' : 'Project Teaser'}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`h-1.5 w-12 rounded-full ${createStep >= 1 ? 'bg-teal-500' : 'bg-gray-200'}`}></div>
                  <div className={`h-1.5 w-12 rounded-full ${createStep >= 2 ? 'bg-teal-500' : 'bg-gray-200'}`}></div>
                  <div className={`h-1.5 w-12 rounded-full ${createStep >= 3 ? 'bg-teal-500' : 'bg-gray-200'}`}></div>
                  <div className={`h-1.5 w-12 rounded-full ${createStep >= 4 ? 'bg-teal-500' : 'bg-gray-200'}`}></div>
                  <div className={`h-1.5 w-12 rounded-full ${createStep >= 5 ? 'bg-teal-500' : 'bg-gray-200'}`}></div>
                  <div className={`h-1.5 w-12 rounded-full ${createStep >= 6 ? 'bg-teal-500' : 'bg-gray-200'}`}></div>
                  <div className={`h-1.5 w-12 rounded-full ${createStep >= 7 ? 'bg-teal-500' : 'bg-gray-200'}`}></div>
                  <span className="text-xs text-gray-500 font-medium ml-2">Step {createStep} of 7</span>
                </div>
              </div>
              <button onClick={() => { setIsCreateProjectOpen(false); setCreateStep(1); }} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors">
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto">
              {createStep === 1 && (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Project Name <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="Enter project name..." className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-shadow" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Project Type</label>
                      <div className="relative">
                        <select className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 appearance-none bg-white transition-shadow" value={newProject.dealType} onChange={e => setNewProject({ ...newProject, dealType: e.target.value })}>
                          <option value="Merge">Merge</option>
                          <option value="Acquisition">Acquisition</option>
                          <option value="Investment">Investment</option>
                          <option value="Fundraising">Fundraising</option>
                        </select>
                        <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Project Description</label>
                    <textarea placeholder="Enter a brief project description..." rows={4} className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none transition-shadow" value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} />
                  </div>
                </div>
              )}

              {createStep === 2 && (
                <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100 flex items-start gap-3">
                    <FaBriefcase className="text-teal-600 text-lg mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-teal-900">Project Teaser Details</p>
                      <p className="text-xs text-teal-700 mt-1">Add these details to make your project stand out to buyers. This information will be used to generate the project teaser.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Business Model</label>
                      <div className="relative">
                        <select className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 appearance-none bg-white transition-shadow" value={newProject.businessModel} onChange={e => setNewProject({ ...newProject, businessModel: e.target.value })}>
                          <option value="" disabled>Select a business model</option>
                          {standardBusinessModels.map(model => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                        <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Industry</label>
                      <div className="relative">
                        <select className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 appearance-none bg-white transition-shadow" value={newProject.industry} onChange={e => setNewProject({ ...newProject, industry: e.target.value, subIndustry: '' })}>
                          <option value="" disabled>Select an industry</option>
                          {Object.keys(industrySubcategories).map(ind => (
                            <option key={ind} value={ind}>{ind}</option>
                          ))}
                        </select>
                        <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Sub Industry</label>
                      <div className="relative">
                        <select className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 appearance-none bg-white transition-shadow disabled:bg-gray-50 disabled:text-gray-400" value={newProject.subIndustry} onChange={e => setNewProject({ ...newProject, subIndustry: e.target.value })} disabled={!newProject.industry}>
                          <option value="" disabled>Select a sub industry</option>
                          {newProject.industry && industrySubcategories[newProject.industry]?.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                        <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Year Founded</label>
                      <input type="date" className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-shadow text-gray-800" value={newProject.yearFounded} onChange={e => setNewProject({ ...newProject, yearFounded: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">No. of Employees</label>
                      <div className="flex flex-col gap-2">
                        <div className="relative">
                          <select className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 appearance-none bg-white transition-shadow" value={newProject.employeeDropdown} onChange={e => setNewProject({ ...newProject, employeeDropdown: e.target.value })}>
                            <option value="" disabled>Select employees</option>
                            {standardEmployees.map(emp => (
                              <option key={emp} value={emp}>{emp}</option>
                            ))}
                            {newProject.employeeDropdown && newProject.employeeDropdown !== 'Other' && !standardEmployees.includes(newProject.employeeDropdown) && (
                              <option value={newProject.employeeDropdown}>{newProject.employeeDropdown}</option>
                            )}
                            <option value="Other">Other</option>
                          </select>
                          <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
                        </div>
                        {newProject.employeeDropdown === 'Other' && (
                          <input
                            type="text"
                            placeholder="Enter custom no. of employees and press Enter..."
                            className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-shadow animate-in fade-in slide-in-from-top-2 duration-200"
                            value={newProject.employeeCustom}
                            onChange={e => setNewProject({ ...newProject, employeeCustom: e.target.value })}
                            onBlur={() => {
                              if (newProject.employeeCustom.trim() !== '') {
                                setNewProject({ ...newProject, employeeDropdown: newProject.employeeCustom, employeeCustom: '' });
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (newProject.employeeCustom.trim() !== '') {
                                  setNewProject({ ...newProject, employeeDropdown: newProject.employeeCustom, employeeCustom: '' });
                                }
                              }
                            }}
                            autoFocus
                          />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Legal Structure</label>
                      <div className="relative">
                        <select className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 appearance-none bg-white transition-shadow" value={newProject.legalStructure} onChange={e => setNewProject({ ...newProject, legalStructure: e.target.value })}>
                          <option value="" disabled>Select legal structure</option>
                          {standardLegalStructures.map(structure => (
                            <option key={structure} value={structure}>{structure}</option>
                          ))}
                        </select>
                        <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {createStep === 3 && (
                <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Headquarters</label>
                      <div className="relative">
                        <select className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 appearance-none bg-white transition-shadow" value={newProject.headquarters} onChange={e => setNewProject({ ...newProject, headquarters: e.target.value })}>
                          <option value="" disabled>Select state/location</option>
                          {standardStates.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                        <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Operations Location</label>
                      <div
                        className="relative"
                        tabIndex={-1}
                        onBlur={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget)) {
                            setIsDistrictDropdownOpen(false);
                          }
                        }}
                      >
                        <div
                          className="w-full min-h-[46px] p-2 text-sm border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-500/50 bg-white transition-shadow flex flex-wrap gap-2 cursor-pointer items-center"
                          onClick={() => setIsDistrictDropdownOpen(!isDistrictDropdownOpen)}
                        >
                          {newProject.operationsLocations.map(loc => (
                            <span key={loc} className="bg-teal-50 text-teal-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                              {loc}
                              <FaTimes
                                className="cursor-pointer hover:text-teal-900"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNewProject({ ...newProject, operationsLocations: newProject.operationsLocations.filter(l => l !== loc) });
                                }}
                              />
                            </span>
                          ))}
                          {newProject.operationsLocations.length === 0 && (
                            <span className="text-gray-400 pl-1">Select operations locations</span>
                          )}
                          <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
                        </div>

                        {isDistrictDropdownOpen && newProject.headquarters && stateDistricts[newProject.headquarters] && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {stateDistricts[newProject.headquarters].map(district => (
                              <div
                                key={district}
                                className={`p-3 text-sm cursor-pointer hover:bg-teal-50 flex items-center justify-between ${newProject.operationsLocations.includes(district) ? 'bg-teal-50/50 text-teal-700 font-medium' : 'text-gray-700'}`}
                                onClick={() => {
                                  if (newProject.operationsLocations.includes(district)) {
                                    setNewProject({ ...newProject, operationsLocations: newProject.operationsLocations.filter(l => l !== district) });
                                  } else {
                                    setNewProject({ ...newProject, operationsLocations: [...newProject.operationsLocations, district] });
                                  }
                                }}
                              >
                                {district}
                                {newProject.operationsLocations.includes(district) && <FaCheck className="text-teal-500 text-xs" />}
                              </div>
                            ))}
                          </div>
                        )}
                        {isDistrictDropdownOpen && (!newProject.headquarters || !stateDistricts[newProject.headquarters]) && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm text-gray-500 text-center">
                            {!newProject.headquarters ? "Please select a Headquarters first" : "No districts available for this state."}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Total Customer Count</label>
                      <input type="number" placeholder="e.g. 5000" className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-shadow" value={newProject.customerCount} onChange={e => setNewProject({ ...newProject, customerCount: e.target.value })} min="0" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Top Customer % Revenue</label>
                      <div className="flex gap-2">
                        <div className="relative w-28 shrink-0">
                          <select className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 appearance-none bg-white transition-shadow" value={newProject.topCustomerCurrency} onChange={e => setNewProject({ ...newProject, topCustomerCurrency: e.target.value })}>
                            {standardCurrencies.map(c => (
                              <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                            ))}
                          </select>
                          <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
                        </div>
                        <div className="flex-1 flex flex-col">
                          <input type="number" placeholder="e.g. 45" className={`w-full p-3 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-shadow ${newProject.topCustomerRevenue !== '' && Number(newProject.topCustomerRevenue) > 100 ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-200 focus:ring-teal-500/50'}`} value={newProject.topCustomerRevenue} onChange={e => setNewProject({ ...newProject, topCustomerRevenue: e.target.value })} min="0" max="100" />
                          {newProject.topCustomerRevenue !== '' && Number(newProject.topCustomerRevenue) > 100 && (
                            <p className="text-red-500 text-xs mt-1">Value cannot exceed 100</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Revenue</label>
                      <input type="text" placeholder="e.g. $1M - $5M ARR" className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-shadow" value={newProject.revenue} onChange={e => setNewProject({ ...newProject, revenue: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Profitability (EBITDA) %</label>
                      <input type="number" placeholder="e.g. 15" className={`w-full p-3 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-shadow ${newProject.ebitda !== '' && (Number(newProject.ebitda) < 1 || Number(newProject.ebitda) > 100) ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-200 focus:ring-teal-500/50'}`} value={newProject.ebitda} onChange={e => setNewProject({ ...newProject, ebitda: e.target.value })} min="1" max="100" />
                      {newProject.ebitda !== '' && (Number(newProject.ebitda) < 1 || Number(newProject.ebitda) > 100) && (
                        <p className="text-red-500 text-xs mt-1">Invalid input</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">EBITDA Band <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 appearance-none bg-white transition-shadow" value={newProject.ebitdaBandDropdown} onChange={e => setNewProject({ ...newProject, ebitdaBandDropdown: e.target.value })}>
                          <option value="" disabled>Select EBITDA Range</option>
                          <option value="Below ₹25 Lakhs">Below ₹25 Lakhs</option>
                          <option value="₹25 Lakhs – ₹50 Lakhs">₹25 Lakhs – ₹50 Lakhs</option>
                          <option value="₹50 Lakhs – ₹1 Crore">₹50 Lakhs – ₹1 Crore</option>
                          <option value="₹1 Crore – ₹5 Crore">₹1 Crore – ₹5 Crore</option>
                          <option value="₹5 Crore – ₹10 Crore">₹5 Crore – ₹10 Crore</option>
                          <option value="₹10 Crore – ₹25 Crore">₹10 Crore – ₹25 Crore</option>
                          <option value="₹25 Crore+">₹25 Crore+</option>
                          <option value="Negative EBITDA">Negative EBITDA</option>
                          <option value="Not Disclosed">Not Disclosed</option>
                        </select>
                        <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {createStep === 4 && (
                <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Gross Margin %</label>
                      <input type="number" placeholder="e.g. 40" className={`w-full p-3 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-shadow ${newProject.grossMargin !== '' && (Number(newProject.grossMargin) < 1 || Number(newProject.grossMargin) > 100) ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-200 focus:ring-teal-500/50'}`} value={newProject.grossMargin} onChange={e => setNewProject({ ...newProject, grossMargin: e.target.value })} min="1" max="100" />
                      {newProject.grossMargin !== '' && (Number(newProject.grossMargin) < 1 || Number(newProject.grossMargin) > 100) && (
                        <p className="text-red-500 text-xs mt-1">Invalid input</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Net Profit</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium pointer-events-none">
                          {standardCurrencies.find(c => c.code === newProject.topCustomerCurrency)?.symbol || '$'}
                        </span>
                        <input type="text" placeholder="e.g. 1,000,000" className="w-full p-3 pl-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-shadow" value={newProject.netProfit} onChange={e => setNewProject({ ...newProject, netProfit: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Recurring Revenue %</label>
                      <input type="number" placeholder="e.g. 75" className={`w-full p-3 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-shadow ${newProject.recurringRevenue !== '' && (Number(newProject.recurringRevenue) < 1 || Number(newProject.recurringRevenue) > 100) ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-200 focus:ring-teal-500/50'}`} value={newProject.recurringRevenue} onChange={e => setNewProject({ ...newProject, recurringRevenue: e.target.value })} min="1" max="100" />
                      {newProject.recurringRevenue !== '' && (Number(newProject.recurringRevenue) < 1 || Number(newProject.recurringRevenue) > 100) && (
                        <p className="text-red-500 text-xs mt-1">Invalid input</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Growth Rate %</label>
                      <input type="number" placeholder="e.g. 20" className={`w-full p-3 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-shadow ${newProject.growthRate !== '' && (Number(newProject.growthRate) < 1 || Number(newProject.growthRate) > 100) ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-200 focus:ring-teal-500/50'}`} value={newProject.growthRate} onChange={e => setNewProject({ ...newProject, growthRate: e.target.value })} min="1" max="100" />
                      {newProject.growthRate !== '' && (Number(newProject.growthRate) < 1 || Number(newProject.growthRate) > 100) && (
                        <p className="text-red-500 text-xs mt-1">Invalid input</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Debt on the Business</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium pointer-events-none">
                          {standardCurrencies.find(c => c.code === newProject.topCustomerCurrency)?.symbol || '$'}
                        </span>
                        <input type="text" placeholder="e.g. 500,000" className="w-full p-3 pl-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-shadow" value={newProject.debt} onChange={e => setNewProject({ ...newProject, debt: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Working Capital</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium pointer-events-none">
                          {standardCurrencies.find(c => c.code === newProject.topCustomerCurrency)?.symbol || '$'}
                        </span>
                        <input type="text" placeholder="e.g. 250,000" className="w-full p-3 pl-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-shadow" value={newProject.workingCapital} onChange={e => setNewProject({ ...newProject, workingCapital: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Add-backs (Description & Amount)</label>
                      <input type="text" placeholder="e.g. Owner Salary - $50,000" className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-shadow" value={newProject.addBacks} onChange={e => setNewProject({ ...newProject, addBacks: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Revenue Band</label>
                      <div className="flex flex-col gap-2">
                        <div className="relative">
                          <select className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 appearance-none bg-white transition-shadow" value={newProject.revenueBandDropdown} onChange={e => setNewProject({ ...newProject, revenueBandDropdown: e.target.value })}>
                            <option value="" disabled>Select revenue band</option>
                            {standardRevenueBands.map(band => (
                              <option key={band} value={band}>{band}</option>
                            ))}
                            {newProject.revenueBandDropdown && newProject.revenueBandDropdown !== 'Other' && !standardRevenueBands.includes(newProject.revenueBandDropdown) && (
                              <option value={newProject.revenueBandDropdown}>{newProject.revenueBandDropdown}</option>
                            )}
                            <option value="Other">Other</option>
                          </select>
                          <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
                        </div>
                        {newProject.revenueBandDropdown === 'Other' && (
                          <input
                            type="text"
                            placeholder="Enter custom revenue band and press Enter..."
                            className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-shadow animate-in fade-in slide-in-from-top-1"
                            value={newProject.revenueBandCustom}
                            onChange={e => setNewProject({ ...newProject, revenueBandCustom: e.target.value })}
                            onBlur={() => {
                              if (newProject.revenueBandCustom.trim() !== '') {
                                setNewProject({ ...newProject, revenueBandDropdown: newProject.revenueBandCustom, revenueBandCustom: '' });
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (newProject.revenueBandCustom.trim() !== '') {
                                  setNewProject({ ...newProject, revenueBandDropdown: newProject.revenueBandCustom, revenueBandCustom: '' });
                                }
                              }
                            }}
                            autoFocus
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {createStep === 5 && (
                <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Investment Mandate</label>
                      <textarea placeholder="Describe the goal of the transaction..." rows={3} className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none transition-shadow" value={newProject.mandate} onChange={e => setNewProject({ ...newProject, mandate: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Business Summary</label>
                      <textarea placeholder="Write a brief summary of the business..." rows={5} className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none transition-shadow" value={newProject.businessSummary} onChange={e => setNewProject({ ...newProject, businessSummary: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Key Highlights</label>
                      <textarea placeholder="Enter key highlights (e.g. strong market position, proprietary technology)..." rows={4} className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none transition-shadow" value={newProject.keyHighlights} onChange={e => setNewProject({ ...newProject, keyHighlights: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Reason for Sale</label>
                      <textarea placeholder="Explain the primary reason for selling or seeking investment..." rows={3} className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none transition-shadow" value={newProject.reasonForSale} onChange={e => setNewProject({ ...newProject, reasonForSale: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}

              {createStep === 6 && (
                <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Asking Price</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium pointer-events-none">
                          {standardCurrencies.find(c => c.code === newProject.topCustomerCurrency)?.symbol || '$'}
                        </span>
                        <input type="text" placeholder="e.g. 10,000,000" className="w-full p-3 pl-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-shadow" value={newProject.askingPrice} onChange={e => setNewProject({ ...newProject, askingPrice: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Valuation Expectation</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium pointer-events-none">
                          {standardCurrencies.find(c => c.code === newProject.topCustomerCurrency)?.symbol || '$'}
                        </span>
                        <input type="text" placeholder="e.g. 15,000,000" className="w-full p-3 pl-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-shadow" value={newProject.valuationExpectation} onChange={e => setNewProject({ ...newProject, valuationExpectation: e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 relative">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Buyer Types <span className="text-red-500">*</span></label>
                    <div
                      onClick={() => setIsBuyerDropdownOpen(true)}
                      className="w-full p-2 text-sm text-left border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-500/50 bg-white flex flex-wrap gap-2 items-center transition-shadow cursor-text min-h-[46px]"
                    >
                      {newProject.preferredBuyerTypes.map(type => (
                        <span key={type} className="bg-teal-50 text-teal-700 px-2.5 py-1 rounded-md flex items-center gap-1 font-medium border border-teal-100">
                          {type}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewProject({ ...newProject, preferredBuyerTypes: newProject.preferredBuyerTypes.filter(t => t !== type) });
                            }}
                            className="hover:text-teal-900 focus:outline-none"
                          >
                            <FaTimes className="text-[10px]" />
                          </button>
                        </span>
                      ))}
                      <div className="flex-1 min-w-[150px] flex items-center">
                        <input
                          type="text"
                          placeholder={newProject.preferredBuyerTypes.length === 0 ? "Select or type buyer types..." : ""}
                          className="w-full outline-none bg-transparent py-1 text-gray-800"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim() !== '') {
                              e.preventDefault();
                              const newType = e.target.value.trim();
                              if (!newProject.preferredBuyerTypes.includes(newType)) {
                                setNewProject({ ...newProject, preferredBuyerTypes: [...newProject.preferredBuyerTypes, newType] });
                              }
                              e.target.value = '';
                            }
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsBuyerDropdownOpen(!isBuyerDropdownOpen);
                        }}
                        className="p-1 ml-auto text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        <FaChevronDown className={`text-xs transition-transform ${isBuyerDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {isBuyerDropdownOpen && (
                      <div className="w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-sm max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                        <div className="p-2 space-y-1">
                          <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 rounded">Buyer Categories</div>
                          {standardBuyerTypes.map(type => (
                            <label key={type} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                                checked={newProject.preferredBuyerTypes.includes(type)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewProject({ ...newProject, preferredBuyerTypes: [...newProject.preferredBuyerTypes, type] });
                                  } else {
                                    setNewProject({ ...newProject, preferredBuyerTypes: newProject.preferredBuyerTypes.filter(t => t !== type) });
                                  }
                                }}
                              />
                              <span className="text-sm text-gray-700">{type}</span>
                            </label>
                          ))}
                          <div className="px-2 py-1 mt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 rounded">{newProject.industry ? `${newProject.industry} Buyers` : 'Industries'}</div>
                          {(newProject.industry && industrySubcategories[newProject.industry] ? industrySubcategories[newProject.industry] : Object.keys(industrySubcategories)).map(industry => (
                            <label key={industry} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                                checked={newProject.preferredBuyerTypes.includes(industry)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewProject({ ...newProject, preferredBuyerTypes: [...newProject.preferredBuyerTypes, industry] });
                                  } else {
                                    setNewProject({ ...newProject, preferredBuyerTypes: newProject.preferredBuyerTypes.filter(t => t !== industry) });
                                  }
                                }}
                              />
                              <span className="text-sm text-gray-700">{industry}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Owner Transition Period <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 3"
                        className="w-full p-3 pr-20 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-shadow"
                        value={newProject.transitionPeriod}
                        onChange={e => setNewProject({ ...newProject, transitionPeriod: e.target.value })}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium pointer-events-none">
                        months
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {createStep === 7 && (
                <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Upload Profit and Loss Statement</label>
                      <p className="text-xs text-gray-500 mb-4">You can securely upload your P&L document. We support PDF, DOC, DOCX, XLS, and CSV formats.</p>

                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                        <input
                          type="file"
                          id="pnl-upload"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setNewProject({ ...newProject, profitAndLossFile: e.target.files[0] });
                            }
                          }}
                        />
                        <label htmlFor="pnl-upload" className="flex flex-col items-center cursor-pointer w-full">
                          <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <FaFolderOpen className="text-xl" />
                          </div>
                          <span className="text-sm font-bold text-teal-600 hover:text-teal-700">Click to upload</span>
                          <span className="text-xs text-gray-500 mt-1">or drag and drop</span>

                          {newProject.profitAndLossFile && (
                            <div className="mt-4 p-3 bg-white border border-teal-200 rounded-lg shadow-sm flex items-center gap-3 w-full max-w-xs" onClick={(e) => e.preventDefault()}>
                              <FaCheckCircle className="text-teal-500 text-lg flex-shrink-0" />
                              <div className="overflow-hidden flex-1">
                                <p className="text-sm font-semibold text-gray-800 truncate">{newProject.profitAndLossFile.name}</p>
                                <p className="text-xs text-gray-500">{(newProject.profitAndLossFile.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                              <button
                                type="button"
                                className="text-gray-400 hover:text-red-500 focus:outline-none"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setNewProject({ ...newProject, profitAndLossFile: null });
                                }}
                              >
                                <FaTimes />
                              </button>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Upload Balance Sheet</label>
                      <p className="text-xs text-gray-500 mb-4">You can securely upload your Balance Sheet document. We support PDF, DOC, DOCX, XLS, and CSV formats.</p>

                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                        <input
                          type="file"
                          id="bs-upload"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setNewProject({ ...newProject, balanceSheetFile: e.target.files[0] });
                            }
                          }}
                        />
                        <label htmlFor="bs-upload" className="flex flex-col items-center cursor-pointer w-full">
                          <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <FaFolderOpen className="text-xl" />
                          </div>
                          <span className="text-sm font-bold text-teal-600 hover:text-teal-700">Click to upload</span>
                          <span className="text-xs text-gray-500 mt-1">or drag and drop</span>

                          {newProject.balanceSheetFile && (
                            <div className="mt-4 p-3 bg-white border border-teal-200 rounded-lg shadow-sm flex items-center gap-3 w-full max-w-xs" onClick={(e) => e.preventDefault()}>
                              <FaCheckCircle className="text-teal-500 text-lg flex-shrink-0" />
                              <div className="overflow-hidden flex-1">
                                <p className="text-sm font-semibold text-gray-800 truncate">{newProject.balanceSheetFile.name}</p>
                                <p className="text-xs text-gray-500">{(newProject.balanceSheetFile.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                              <button
                                type="button"
                                className="text-gray-400 hover:text-red-500 focus:outline-none"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setNewProject({ ...newProject, balanceSheetFile: null });
                                }}
                              >
                                <FaTimes />
                              </button>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              {createStep > 1 ? (
                <button onClick={() => setCreateStep(createStep - 1)} className="text-sm font-bold text-gray-600 bg-white hover:bg-gray-100 px-6 py-2.5 rounded-lg transition-colors border border-gray-200 shadow-sm">
                  Back
                </button>
              ) : (
                <button onClick={() => { setIsCreateProjectOpen(false); setCreateStep(1); }} className="text-sm font-bold text-gray-600 bg-white hover:bg-gray-100 px-6 py-2.5 rounded-lg transition-colors border border-gray-200 shadow-sm">
                  Cancel
                </button>
              )}

              {createStep < 7 ? (
                <button
                  onClick={() => {
                    if (createStep === 1 && !newProject.name) return; // Basic validation
                    if (createStep === 3 && (newProject.ebitdaBandDropdown === '' || (newProject.ebitda !== '' && (Number(newProject.ebitda) < 1 || Number(newProject.ebitda) > 100)) || (newProject.topCustomerRevenue !== '' && Number(newProject.topCustomerRevenue) > 100))) return;
                    if (createStep === 4 && ((newProject.recurringRevenue !== '' && (Number(newProject.recurringRevenue) < 1 || Number(newProject.recurringRevenue) > 100)) || (newProject.grossMargin !== '' && (Number(newProject.grossMargin) < 1 || Number(newProject.grossMargin) > 100)) || (newProject.growthRate !== '' && (Number(newProject.growthRate) < 1 || Number(newProject.growthRate) > 100)))) return;
                    if (createStep === 6 && (newProject.preferredBuyerTypes.length === 0 || !newProject.transitionPeriod)) return;
                    setCreateStep(createStep + 1);
                  }}
                  className={`text-sm font-bold text-white px-8 py-2.5 rounded-lg transition-colors shadow-sm flex items-center gap-2 ${(createStep === 1 && !newProject.name) || (createStep === 3 && (newProject.ebitdaBandDropdown === '' || (newProject.ebitda !== '' && (Number(newProject.ebitda) < 1 || Number(newProject.ebitda) > 100)) || (newProject.topCustomerRevenue !== '' && Number(newProject.topCustomerRevenue) > 100))) || (createStep === 4 && ((newProject.recurringRevenue !== '' && (Number(newProject.recurringRevenue) < 1 || Number(newProject.recurringRevenue) > 100)) || (newProject.grossMargin !== '' && (Number(newProject.grossMargin) < 1 || Number(newProject.grossMargin) > 100)) || (newProject.growthRate !== '' && (Number(newProject.growthRate) < 1 || Number(newProject.growthRate) > 100)))) || (createStep === 6 && (newProject.preferredBuyerTypes.length === 0 || !newProject.transitionPeriod)) ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#008f70] hover:bg-[#007058]'}`}
                  disabled={(createStep === 1 && !newProject.name) || (createStep === 3 && (newProject.ebitdaBandDropdown === '' || (newProject.ebitda !== '' && (Number(newProject.ebitda) < 1 || Number(newProject.ebitda) > 100)) || (newProject.topCustomerRevenue !== '' && Number(newProject.topCustomerRevenue) > 100))) || (createStep === 4 && ((newProject.recurringRevenue !== '' && (Number(newProject.recurringRevenue) < 1 || Number(newProject.recurringRevenue) > 100)) || (newProject.grossMargin !== '' && (Number(newProject.grossMargin) < 1 || Number(newProject.grossMargin) > 100)) || (newProject.growthRate !== '' && (Number(newProject.growthRate) < 1 || Number(newProject.growthRate) > 100)))) || (createStep === 6 && (newProject.preferredBuyerTypes.length === 0 || !newProject.transitionPeriod))}
                >
                  Continue <FaArrowRight className="text-xs" />
                </button>
              ) : (
                <button
                  onClick={handleCreateProject}
                  className={`text-sm font-bold text-white px-8 py-2.5 rounded-lg transition-colors shadow-sm flex items-center gap-2 bg-[#008f70] hover:bg-[#007058]`}
                >
                  <FaCheck /> Create Project
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
