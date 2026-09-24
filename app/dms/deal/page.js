"use client";

import { useState, useEffect } from "react";
import { FaPowerOff, FaCog, FaDatabase, FaPlus, FaEllipsisV, FaShieldAlt, FaTimes, FaSave, FaArrowLeft, FaBell, FaCheck, FaFolder, FaFileInvoiceDollar, FaTrash } from "react-icons/fa";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import NDAModal from "../../../components/NDAModal";

export default function DealDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('projectId');
  const projectName = searchParams.get('projectName') || searchParams.get('project') || "Project";

  const [deals, setDeals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [openProposalDropdownId, setOpenProposalDropdownId] = useState(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [newDealName, setNewDealName] = useState("");
  const [newDealDesc, setNewDealDesc] = useState("");
  const [buyersList, setBuyersList] = useState([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState("");
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [activeTab, setActiveTab] = useState('teaser');
  const [userRole, setUserRole] = useState('seller');
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (projectId) {
      sessionStorage.setItem(`deal_activeTab_${projectId}`, tab);
    }
  };

  // NDA Modal State
  const [showNDAModal, setShowNDAModal] = useState(false);
  const [ndaTarget, setNdaTarget] = useState(null);

  // Features Modal State
  const [isManageFeaturesModalOpen, setIsManageFeaturesModalOpen] = useState(false);
  const [featureDeal, setFeatureDeal] = useState(null);
  const [featuresForm, setFeaturesForm] = useState({
    featureQa: false,
    featureBidding: false,
    featureTasks: false,
  });

  const [selectedDealForPermissions, setSelectedDealForPermissions] = useState(null);

  // Deal form state
  const [formData, setFormData] = useState({
    name: "",
    dealType: "Majority Acquisition",
    geography: "North America",
    sector: "B2B SaaS",
    revenue: "TBD",
    ebitda: "TBD",
    growth: "--",
    employees: "--",
    overview: "A profitable mid-market company...",
    overview: "A profitable mid-market company...",
    askingPrice: "Available upon qualified access",
  });
  const [isTeaserPublished, setIsTeaserPublished] = useState(false);

  useEffect(() => {
    const roleItem = localStorage.getItem('userRole');
    if (!roleItem) {
      router.push('/dms/login');
      return;
    }
    const role = roleItem.toLowerCase();
    setUserRole(role);
    
    if (!projectId) return;

    const savedTab = sessionStorage.getItem(`deal_activeTab_${projectId}`);
    if (savedTab) {
      setActiveTab(savedTab);
    } else if (role === 'buyer' || role.includes('guest')) {
      setActiveTab('deals');
    }

    const userId = localStorage.getItem('userId');
    let url = `/api/dms/deals?projectId=${projectId}`;
    if ((role === 'buyer' || role.includes('guest')) && userId) {
      url += `&buyerId=${userId}`;
    }

    // Fetch Deals
    fetch(url)
      .then(res => res.json())
      .then(data => setDeals(data.deals || []))
      .catch(console.error);

    // Fetch Buyers for Deal Creation dropdown
    fetch('/api/dms/buyers')
      .then(res => res.json())
      .then(data => setBuyersList(data.buyers || []))
      .catch(console.error);

    // Fetch Proposals
    fetch(`/api/dms/proposals?projectId=${projectId}`)
      .then(res => res.json())
      .then(data => setRequests(data.proposals || []))
      .catch(console.error);

    // Fetch Teaser
    fetch(`/api/dms/teasers?projectId=${projectId}`)
      .then(res => res.json())
      .then(data => {
        if (data.teaser) {
          setFormData({
            name: data.teaser.dealName || "",
            sector: data.teaser.sector || "",
            geography: data.teaser.geography || "",
            overview: data.teaser.companyOverview || "",
            revenue: data.teaser.revenue || "",
            ebitda: data.teaser.ebitda || "",
            growth: data.teaser.yoyGrowth || "",
            employees: data.teaser.employees || "",
            dealType: "Majority Acquisition",
            askingPrice: "Available upon qualified access"
          });
          setIsTeaserPublished(true);
        } else {
          setIsTeaserPublished(false);
        }
      })
      .catch(console.error);
  }, [projectId]);

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    if (!newDealName.trim() || !selectedBuyerId) {
      alert("Please enter a deal name and select a buyer");
      return;
    }

    try {
      const res = await fetch('/api/dms/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          buyerId: selectedBuyerId,
          dealName: newDealName
        })
      });

      if (res.ok) {
        // Refresh Deals
        const dealsRes = await fetch(`/api/dms/deals?projectId=${projectId}`);
        const dealsData = await dealsRes.json();
        setDeals(dealsData.deals || []);

        setIsAddDealModalOpen(false);
        setNewDealName("");
        setNewDealDesc("");
        setSelectedBuyerId("");
      } else {
        alert("Failed to create deal");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating deal");
    }
  };

  const handleDeleteDeal = async (id) => {
    try {
      const res = await fetch(`/api/dms/deals?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        const updatedDeals = deals.map(deal => deal.id === id ? { ...deal, status: 'trashed' } : deal);
        setDeals(updatedDeals);
        localStorage.setItem(`dms_deals_${projectName}`, JSON.stringify(updatedDeals));
        setOpenDropdownId(null);
      } else {
        alert("Failed to delete deal from server");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting deal");
    }
  };

  const handleSaveDeal = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/dms/teasers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          dealName: formData.name,
          sector: formData.sector,
          geography: formData.geography,
          companyOverview: formData.overview,
          revenue: formData.revenue,
          ebitda: formData.ebitda,
          yoyGrowth: formData.growth,
          employees: formData.employees,
          status: 'Active'
        })
      });
      if (res.ok) {
        alert("Teaser saved successfully and published to marketplace!");
        setIsTeaserPublished(true);
      } else {
        alert("Failed to save teaser");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save teaser");
    }
  };

  const handleInviteBuyer = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsInviting(true);
    try {
      const res = await fetch('/api/dms/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, projectId })
      });
      const data = await res.json();
      if (res.ok) {
        setInviteLink(data.inviteLink);
      } else {
        alert(data.error || "Failed to invite buyer");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending invite");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveTeaser = async () => {
    if (confirm("Are you sure you want to remove this teaser from the marketplace?")) {
      try {
        const res = await fetch(`/api/dms/teasers?projectId=${projectId}`, { method: 'DELETE' });
        if (res.ok) {
          alert("Teaser removed from marketplace");
          setIsTeaserPublished(false);
          // Don't wipe the form data so they can edit and republish if they want
          setFormData({
            ...formData,
            status: 'draft'
          });
        } else {
          alert("Failed to remove teaser from marketplace");
        }
      } catch (err) {
        console.error(err);
        alert("Error removing teaser");
      }
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('companyId');
    localStorage.removeItem('userName');
    router.push('/dms/login');
  };

  const handleSavePermissions = async () => {
    setIsSavingPermissions(true);
    try {
      await Promise.all(
        deals.filter(d => d.status !== 'trashed').map(deal => 
          fetch('/api/dms/deals/features', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dealId: deal.id,
              featureQa: deal.featureQa,
              featureBidding: deal.featureBidding,
              featureTasks: deal.featureTasks,
              featureGroups: deal.featureGroups,
              featureCommunication: deal.featureCommunication
            })
          })
        )
      );
      alert("Permissions saved successfully! Changes will reflect when the Buyer logs in.");
    } catch (e) {
      console.error(e);
      alert("Failed to save permissions.");
    } finally {
      setIsSavingPermissions(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] font-sans overflow-hidden">

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between py-6 z-40 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div>
          <div className="px-6 mb-8 flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">{userRole === 'buyer' || userRole.includes('guest') ? 'Deal View' : 'Deal Setup'}</h2>
          </div>

          <nav className="flex flex-col gap-2 px-4">
            {userRole !== 'buyer' && !userRole.includes('guest') && (
              <button
                onClick={() => handleTabChange('teaser')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${activeTab === 'teaser' ? 'bg-[#00c875]/10 text-[#00c875]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <FaShieldAlt className="text-lg" />
                <span>Teaser</span>
              </button>
            )}
            <button
              onClick={() => handleTabChange('deals')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'deals' ? 'bg-[#00c875]/10 text-[#00c875]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <FaDatabase className="text-lg" />
              <span>Deals</span>
            </button>

            {userRole !== 'buyer' && !userRole.includes('guest') && (
              <button
                onClick={() => handleTabChange('permissions')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'permissions' ? 'bg-[#00c875]/10 text-[#00c875]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <FaCog className="text-lg" />
                <span>Deal Permissions</span>
              </button>
            )}
            
            {userRole !== 'buyer' && !userRole.includes('guest') && (
              <>
                <button
                  onClick={() => handleTabChange('proposals')}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-colors w-full ${activeTab === 'proposals' ? 'bg-[#00c875]/10 text-[#00c875]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <div className="flex items-center gap-3">
                    <FaBell className="text-lg" />
                    <span>Deal Proposal</span>
                  </div>
                  {requests.filter(r => r.status === 'PENDING').length > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {requests.filter(r => r.status === 'PENDING').length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleTabChange('bidding')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'bidding' ? 'bg-[#00c875]/10 text-[#00c875]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <FaFileInvoiceDollar className="text-lg" />
                  <span>Bidding Details</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="px-4 flex flex-col gap-2 relative">
          {userRole !== 'buyer' && !userRole.includes('guest') && (
            <button
              onClick={() => handleTabChange('trash')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'trash' ? 'bg-[#00c875]/10 text-[#00c875]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <FaTrash className="text-lg" />
              <span>Trash</span>
            </button>
          )}
          
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-medium transition-colors">
            <FaPowerOff className="text-lg" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 relative flex flex-col items-center justify-start">

        {/* Top Header outside card */}
        <div className="w-full max-w-5xl flex items-center justify-between mb-4 mt-2">
          <Link href="/dms/workspace" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium group">
            <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm group-hover:-translate-x-1 transition-transform">
              <FaArrowLeft className="text-sm" />
            </div>
            Back to Workspace
          </Link>

          {activeTab === 'deals' && userRole !== 'buyer' && (
            <button
              onClick={() => setIsAddDealModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0b1120] hover:bg-gray-800 text-white text-sm font-bold rounded-lg shadow-md transition-all hover:-translate-y-0.5"
            >
              <FaPlus className="text-xs" />
              Create Deal
            </button>
          )}
        </div>

        {/* Main Container */}
        <div className="w-full max-w-5xl min-h-[60vh] bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">

          {/* Header Row */}
          {activeTab === 'deals' && (
            <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-gray-900">{projectName}</h1>
                <span className="px-3 py-1 bg-[#e6fbf2] text-[#00c875] text-xs font-bold rounded-full tracking-wide">{userRole === 'buyer' ? 'Deal View' : 'Deal Setup'}</span>
              </div>

              <div className="flex items-center gap-8">
                <div className="relative">
                  <select className="appearance-none bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded pl-3 pr-8 py-1.5 outline-none hover:border-gray-300 transition-colors cursor-pointer shadow-sm">
                    <option>Active</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#f0f7f8] text-[#337a85] flex items-center justify-center">
                    <FaDatabase className="text-sm" />
                  </div>
                  <div className="flex flex-col w-32">
                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold mb-1">
                      <span>0 KB / 50 GB</span>
                      <span>[0%]</span>
                    </div>
                    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#337a85] w-0"></div>
                    </div>
                  </div>
                </div>

                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                  <FaCog className="text-lg" />
                </button>
              </div>
            </div>
          )}

          {/* Content Grid */}
          <div className="p-8 pb-12 flex-1">
            {activeTab === 'teaser' && (
              <div className="w-full max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Teaser Setup</h2>
                    <p className="text-sm text-gray-500 mt-1">Configure the teaser details for the marketplace.</p>
                  </div>
                  {isTeaserPublished && (
                    <button
                      type="button"
                      onClick={handleRemoveTeaser}
                      className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-sm rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <FaTimes /> Remove from Marketplace
                    </button>
                  )}
                </div>

                <form id="deal-form" onSubmit={handleSaveDeal} className="space-y-6">
                  {/* Deal Name */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Deal Information</h3>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Deal Name / Internal Code Name</label>
                      <input type="text" name="name" required placeholder="e.g. Project Apollo" value={formData.name} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00c875]" />
                    </div>
                  </div>

                  {/* Basic Info Section */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Teaser Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Sector</label>
                        <input type="text" name="sector" value={formData.sector} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00c875]" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Geography</label>
                        <input type="text" name="geography" value={formData.geography} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00c875]" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Company Overview</label>
                        <textarea name="overview" value={formData.overview} onChange={handleFormChange} rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00c875] resize-none"></textarea>
                      </div>
                    </div>
                  </div>

                  {/* Financials Section */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Financial Snapshot</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Revenue</label>
                        <input type="text" name="revenue" value={formData.revenue} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00c875]" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">EBITDA</label>
                        <input type="text" name="ebitda" value={formData.ebitda} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00c875]" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">YoY Growth</label>
                        <input type="text" name="growth" value={formData.growth} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00c875]" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Employees</label>
                        <input type="text" name="employees" value={formData.employees} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00c875]" />
                      </div>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Transaction Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Deal Type</label>
                        <select name="dealType" value={formData.dealType} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00c875] bg-white">
                          <option>Majority Acquisition</option>
                          <option>Minority Investment</option>
                          <option>Asset Sale</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Asking Price</label>
                        <input type="text" name="askingPrice" value={formData.askingPrice} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00c875]" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-8 py-3 bg-[#0b1120] hover:bg-gray-800 text-white font-bold rounded-lg shadow-md transition-colors"
                    >
                      <FaSave />
                      Save & Publish Teaser
                    </button>
                  </div>
                </form>
              </div>
            )}

            {(activeTab === 'deals' || activeTab === 'trash') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {/* Existing Deals */}
                {deals.filter(d => activeTab === 'trash' ? d.status === 'trashed' : d.status !== 'trashed').map((deal) => (
                  <div
                    key={deal.id}
                    onClick={() => {
                      const dmsRole = localStorage.getItem('userRole');
                      const vdrRole = dmsRole === 'seller' ? 'super_admin' : 'guest_admin';
                      
                      const vdrSession = {
                        id: localStorage.getItem('userId'),
                        role: vdrRole,
                        dms_role: dmsRole,
                        name: localStorage.getItem('userName') || 'User',
                        company_id: localStorage.getItem('companyId') || '',
                        active_workspace_id: deal.id
                      };
                      localStorage.setItem('vdr_session', JSON.stringify(vdrSession));
                      router.push('/documents');
                    }}
                    className="h-44 bg-white rounded-xl border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] p-4 relative flex flex-col hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-auto">
                      <span className="px-2 py-0.5 bg-[#fff8e6] text-[#b48629] text-[9px] font-bold rounded">
                        {deal.status}
                      </span>

                      <div className="relative">
                        {userRole !== 'buyer' && activeTab !== 'trash' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === deal.id ? null : deal.id);
                            }}
                            className="text-gray-400 hover:text-gray-600 p-1 opacity-60 hover:opacity-100"
                          >
                            <FaEllipsisV className="text-[11px]" />
                          </button>
                        )}

                        {openDropdownId === deal.id && activeTab !== 'trash' && (
                          <div className="absolute right-0 mt-1 w-24 bg-white rounded-md shadow-lg border border-gray-100 z-10 overflow-hidden">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDeal(deal.id);
                              }}
                              className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center flex-1 gap-2 pb-2">
                      <div className="w-12 h-12 rounded-full bg-[#f4f7f9] flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                        <FaShieldAlt className="text-2xl text-[#b48629]" />
                      </div>
                      <span className="font-bold text-gray-800 text-sm">{deal.name || 'Unnamed Deal'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'permissions' && (
              <div className="w-full">
                <div className="mb-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Deal Permissions</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage module access and granular guest permissions for each deal workspace.</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Deal Name</th>
                          <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Permissions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {deals.filter(d => d.status !== 'trashed').length === 0 ? (
                          <tr>
                            <td colSpan="2" className="py-8 text-center text-sm text-gray-500">No active deals found.</td>
                          </tr>
                        ) : (
                          deals.filter(d => d.status !== 'trashed').map((deal) => (
                            <tr key={deal.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded bg-[#f4f7f9] flex items-center justify-center">
                                    <FaShieldAlt className="text-[#b48629]" />
                                  </div>
                                  <span className="font-bold text-gray-900 text-sm">{deal.name || 'Unnamed Deal'}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <button
                                  onClick={() => setSelectedDealForPermissions(deal)}
                                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
                                >
                                  <FaCog /> Edit Permissions
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'proposals' && (
              <div className="w-full">
                <div className="mb-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Deal Proposals</h2>
                    <p className="text-sm text-gray-500 mt-1">Review and manage access requests for this deal.</p>
                  </div>
                  <button 
                    onClick={() => {
                      setInviteEmail("");
                      setInviteLink("");
                      setIsInviteModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-[#0b1120] hover:bg-gray-800 text-white text-sm font-bold rounded-lg shadow-sm transition-colors"
                  >
                    + Invite Known Buyer
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-gray-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100 text-sm text-gray-500 font-bold uppercase tracking-wider">
                        <th className="py-5 px-6">Applicant Name</th>
                        <th className="py-5 px-6">Company</th>
                        <th className="py-5 px-6">Role</th>
                        <th className="py-5 px-6">Investor Type</th>
                        <th className="py-5 px-6">Status</th>
                        <th className="py-5 px-6 text-center w-16">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {requests.map((req) => (
                        <tr
                          key={req.id}
                          onClick={() => setSelectedRequest(req)}
                          className="hover:bg-[#f4f7f9] cursor-pointer transition-colors group"
                        >
                          <td className="py-5 px-6 text-base font-bold text-gray-800 group-hover:text-[#00c875] transition-colors">{req.fullName}</td>
                          <td className="py-5 px-6 text-base text-gray-600 font-medium">{req.company}</td>
                          <td className="py-5 px-6 text-base text-gray-500">{req.jobTitle}</td>
                          <td className="py-5 px-6 text-base text-gray-500">{req.investorType}</td>
                          <td className="py-5 px-6">
                            <span className={`px-3 py-1.5 text-xs font-bold rounded-md tracking-wide capitalize ${
                                req.status?.toLowerCase() === 'approved' || req.status?.toLowerCase() === 'accepted' ? 'bg-[#e6fbf2] text-[#00c875]' :
                                req.status?.toLowerCase() === 'rejected' ? 'bg-red-50 text-red-600' :
                                req.status?.toLowerCase() === 'revoked' ? 'bg-orange-50 text-orange-600' :
                                'bg-blue-50 text-blue-600' // default for pending, etc
                              }`}>
                              {req.status?.toLowerCase() === 'accepted' ? 'Approved' : req.status}
                            </span>
                          </td>
                          <td className="py-5 px-6 text-center">
                            <div className="relative inline-block text-left">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenProposalDropdownId(openProposalDropdownId === req.id ? null : req.id);
                                }}
                                className="text-gray-400 hover:text-gray-600 p-2 opacity-60 hover:opacity-100 transition-opacity"
                              >
                                <FaEllipsisV />
                              </button>

                              {openProposalDropdownId === req.id && (
                                  <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-md shadow-lg border border-gray-100 z-50 overflow-hidden">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedRequest(req);
                                        setOpenProposalDropdownId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-[var(--brand)] hover:bg-[var(--brand)]/10 transition-colors font-medium"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedRequest(req);
                                        setOpenProposalDropdownId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium border-t border-gray-100"
                                    >
                                      Reject
                                    </button>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          const res = await fetch('/api/dms/proposals', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ proposalId: req.id, action: 'revoke', projectId })
                                          });
                                          if (res.ok) {
                                            const updatedReqs = requests.map(r => r.id === req.id ? { ...r, status: 'revoked' } : r);
                                            setRequests(updatedReqs);
                                          }
                                        } catch (err) {
                                          console.error("Failed to revoke proposal", err);
                                        }
                                        setOpenProposalDropdownId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium border-t border-gray-100"
                                    >
                                      Revoke Access
                                    </button>
                                  </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {requests.length === 0 && (
                        <tr>
                          <td colSpan="6" className="p-12 text-center text-gray-400 text-sm font-medium">No deal proposals found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'bidding' && (
              <div className="w-full">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Bidding Details</h2>
                  <p className="text-sm text-gray-500 mt-1">Review and manage the bidding information.</p>
                </div>

                <div className="bg-white p-12 rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <FaFileInvoiceDollar className="text-3xl text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700">No Bidding Details Yet</h3>
                  <p className="text-sm text-gray-500 mt-2 max-w-sm">The bidding details section is currently empty. More information will appear here once the bidding phase begins.</p>
                </div>
              </div>
            )}

          </div>
        </div>

      </main>

      {/* Access Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Access Request Details</h2>
              <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <FaTimes className="text-lg" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Full Name</p>
                  <p className="text-sm font-medium text-gray-900">{selectedRequest.fullName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Work Email</p>
                  <p className="text-sm font-medium text-gray-900">{selectedRequest.email}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Company</p>
                  <p className="text-sm font-medium text-gray-900">{selectedRequest.company}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Job Title</p>
                  <p className="text-sm font-medium text-gray-900">{selectedRequest.jobTitle}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Investor Type</p>
                  <p className="text-sm font-medium text-gray-900">{selectedRequest.investorType}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Investment Range</p>
                  <p className="text-sm font-medium text-gray-900">{selectedRequest.investmentRange}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 mt-2">Message</p>
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 min-h-[80px] border border-gray-100">
                  {selectedRequest.message || "No message provided."}
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              {(selectedRequest.status?.toLowerCase() === 'approved' || selectedRequest.status?.toLowerCase() === 'accepted') ? (
                <button
                  onClick={() => {
                    setNdaTarget({
                      projectName: projectName,
                      dealName: selectedRequest.company || "New Deal"
                    });
                    setSelectedRequest(null);
                    setShowNDAModal(true);
                  }}
                  className="px-6 py-2.5 bg-[var(--brand)] hover:bg-[var(--brand-secondary)] text-white rounded-lg font-bold transition-colors text-sm shadow-sm flex items-center gap-2"
                >
                  <FaFolder /> Open Deal
                </button>
              ) : (
                <>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/dms/proposals', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ proposalId: selectedRequest.id, action: 'reject', projectId })
                        });
                        if (res.ok) {
                          setRequests(requests.map(r => r.id === selectedRequest.id ? { ...r, status: 'rejected' } : r));
                          setSelectedRequest(null);
                        }
                      } catch (err) {
                        console.error(err);
                        alert("Failed to reject proposal");
                      }
                    }}
                    className="px-5 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-bold transition-colors text-sm"
                  >
                    Reject Request
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/dms/proposals', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ proposalId: selectedRequest.id, action: 'accept', projectId })
                        });
                        if (res.ok) {
                          setRequests(requests.map(r => r.id === selectedRequest.id ? { ...r, status: 'approved' } : r));
                          // Refresh deals
                          const dealsRes = await fetch(`/api/dms/deals?projectId=${projectId}`);
                          const dealsData = await dealsRes.json();
                          setDeals(dealsData.deals || []);
                          
                          setSelectedRequest(null);
                          alert(`Deal created automatically for ${selectedRequest.company}.`);
                        }
                      } catch (err) {
                        console.error(err);
                        alert("Failed to accept proposal");
                      }
                    }}
                    className="px-5 py-2.5 bg-[#00c875] hover:bg-[#00a863] text-white rounded-lg font-bold transition-colors text-sm shadow-sm flex items-center gap-2"
                  >
                    <FaCheck /> Accept & Create Deal
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create New Deal Modal */}
      {isAddDealModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Deal</h2>
            <form onSubmit={handleCreateDeal}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Select Buyer</label>
                <select
                  required
                  value={selectedBuyerId}
                  onChange={(e) => {
                    setSelectedBuyerId(e.target.value);
                    const buyer = buyersList.find(b => b.id.toString() === e.target.value);
                    if (buyer && buyer.companyName && !newDealName) {
                      setNewDealName(buyer.companyName);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00c875] bg-white"
                >
                  <option value="">-- Select a Buyer --</option>
                  {buyersList.map(b => (
                    <option key={b.id} value={b.id}>{b.companyName || b.name} ({b.email})</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Deal Name</label>
                <input
                  type="text"
                  required
                  value={newDealName}
                  onChange={(e) => setNewDealName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00c875]"
                  placeholder="Enter deal name..."
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Deal Description</label>
                <textarea
                  value={newDealDesc}
                  onChange={(e) => setNewDealDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00c875]"
                  rows="3"
                  placeholder="Enter deal description..."
                ></textarea>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddDealModalOpen(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00c875] hover:bg-[#00a863] text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                  Create Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Known Buyer Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Invite Known Buyer</h2>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <FaTimes />
              </button>
            </div>
            
            <div className="p-6">
              {!inviteLink ? (
                <form onSubmit={handleInviteBuyer}>
                  <p className="text-sm text-gray-600 mb-5">
                    Send a direct registration link to a buyer. When they sign up, they will bypass the marketplace and automatically be granted access to this deal.
                  </p>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Buyer's Email Address</label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                      placeholder="buyer@example.com"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsInviteModalOpen(false)}
                      className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isInviting}
                      className="px-5 py-2 bg-[#0b1120] hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-lg font-bold transition-colors shadow-sm"
                    >
                      {isInviting ? "Generating..." : "Generate Invite"}
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="w-12 h-12 rounded-full bg-[#e6fbf2] text-[#00c875] flex items-center justify-center mx-auto mb-4">
                    <FaCheck className="text-xl" />
                  </div>
                  <h3 className="text-center font-bold text-gray-900 mb-2">Invitation Ready!</h3>
                  <p className="text-center text-sm text-gray-600 mb-6">
                    An email has been sent to <strong>{inviteEmail}</strong> (if email is configured). You can also copy the direct link below:
                  </p>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-6 relative">
                    <input 
                      type="text" 
                      readOnly 
                      value={inviteLink} 
                      className="w-full bg-transparent text-sm text-gray-600 outline-none pr-16"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(inviteLink);
                        alert("Link copied to clipboard!");
                      }}
                      className="absolute right-2 top-2 px-3 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-gray-700 hover:bg-gray-50"
                    >
                      Copy
                    </button>
                  </div>
                  <button
                    onClick={() => setIsInviteModalOpen(false)}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NDA Modal */}
      <NDAModal 
        isOpen={showNDAModal}
        onClose={() => setShowNDAModal(false)}
        projectName={ndaTarget?.projectName}
        companyName={ndaTarget?.dealName}
        onAccept={() => {
          setShowNDAModal(false);
          if (ndaTarget) {
            router.push(`/dms/workspace?filterProject=${encodeURIComponent(ndaTarget.projectName)}&filterDeal=${encodeURIComponent(ndaTarget.dealName)}`);
          }
        }}
      />

      {/* Granular Permissions Modal */}
      {selectedDealForPermissions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Deal Permissions: {selectedDealForPermissions.name || 'Unnamed Deal'}</h2>
                <p className="text-xs text-gray-500 mt-1">Configure module access and Guest Admin capabilities.</p>
              </div>
              <button onClick={() => setSelectedDealForPermissions(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <FaTimes className="text-lg" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              {/* Modules Section */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Enabled Modules</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'featureQa', label: 'Q&A Module' },
                    { key: 'featureBidding', label: 'Bidding Module' },
                    { key: 'featureTasks', label: 'Tasks & Workflow' },
                    { key: 'featureGroups', label: 'Groups Management' },
                    { key: 'featureCommunication', label: 'Communication' }
                  ].map(module => (
                    <label key={module.key} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <span className="text-sm font-medium text-gray-700">{module.label}</span>
                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={selectedDealForPermissions[module.key] || false}
                          onChange={(e) => {
                            setSelectedDealForPermissions({
                              ...selectedDealForPermissions,
                              [module.key]: e.target.checked
                            });
                          }}
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00c875]"></div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setSelectedDealForPermissions(null)}
                className="px-5 py-2 text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg font-bold transition-colors text-sm shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/dms/deals/features', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        dealId: selectedDealForPermissions.id,
                        featureQa: selectedDealForPermissions.featureQa,
                        featureBidding: selectedDealForPermissions.featureBidding,
                        featureTasks: selectedDealForPermissions.featureTasks,
                        featureGroups: selectedDealForPermissions.featureGroups,
                        featureCommunication: selectedDealForPermissions.featureCommunication
                      })
                    });
                    
                    if (res.ok) {
                      setDeals(deals.map(d => d.id === selectedDealForPermissions.id ? selectedDealForPermissions : d));
                      setSelectedDealForPermissions(null);
                    } else {
                      alert('Failed to update deal permissions.');
                    }
                  } catch (err) {
                    console.error('Failed to update deal permissions', err);
                    alert('An error occurred while saving.');
                  }
                }}
                className="px-5 py-2 bg-[#0b1120] hover:bg-gray-800 text-white rounded-lg font-bold transition-colors text-sm shadow-sm flex items-center gap-2"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
