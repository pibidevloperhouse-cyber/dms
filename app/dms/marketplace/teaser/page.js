"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaBriefcase, FaBuilding, FaDollarSign, FaArrowRight, FaRegBookmark, FaCheckSquare, FaCalendarAlt, FaUsers, FaRegFileAlt, FaChartPie } from "react-icons/fa";

// Helper to get a consistent color for the project initials
const getColorForProject = (name) => {
  const colors = ['#0f4c75', '#1b5e20', '#a0522d', '#512b58', '#2d4059'];
  const firstChar = name ? name.charCodeAt(0) : 0;
  return colors[firstChar % colors.length];
};

export default function TeasersList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeaser, setSelectedTeaser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const companyId = localStorage.getItem('companyId') || 'test-company-123';
        const userId = localStorage.getItem('userId') || 'seller-123';
        const vdrRoleItem = localStorage.getItem('vdrRole') || 'external_user';
        
        const res = await fetch(`/api/dms/projects?companyId=${companyId}&userId=${userId}&role=${vdrRoleItem}`);
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
        }
      } catch(e) {
        console.error("Failed to fetch projects", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleTeaserClick = (project) => {
    setSelectedTeaser(project);
  };

  const closeTeaserSidebar = () => {
    setSelectedTeaser(null);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00c875]"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Teasers</h1>
          <p className="text-gray-500 text-sm mt-1">View and manage the public teasers for all your projects.</p>
        </div>
      </div>
      
      {projects.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <FaBriefcase className="text-2xl text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">No Teasers Found</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            You haven't created any projects yet. Create a project in the Workspace to automatically generate its teaser.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div 
              key={project.id} 
              onClick={() => handleTeaserClick(project)}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col group overflow-hidden"
            >
              <div className="p-5 flex-1">
                {/* Header: Initial Box + Text + Bookmark */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-11 h-11 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm"
                      style={{ backgroundColor: getColorForProject(project.name) }}
                    >
                      {(project.name || "UN").substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-gray-400 tracking-wider uppercase mb-0.5">
                        Confidential Opportunity
                      </span>
                      <h3 className="text-[17px] font-bold text-gray-800 leading-tight">
                        {project.name}
                      </h3>
                    </div>
                  </div>
                  <button className="text-gray-300 hover:text-gray-500 transition-colors mt-1">
                    <FaRegBookmark className="w-[18px] h-[18px]" />
                  </button>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  <span className="px-3 py-1 bg-white border border-gray-200 text-gray-500 text-[11px] font-medium rounded-full">
                    {project.projectType || 'B2B SaaS'}
                  </span>
                  <span className="px-3 py-1 bg-white border border-gray-200 text-gray-500 text-[11px] font-medium rounded-full">
                    North America
                  </span>
                </div>

                {/* Description */}
                <p className="text-[13px] text-gray-500 mb-8 line-clamp-2">
                  {project.description || `${project.name} pvt ltd`}
                </p>

                {/* Grid Details */}
                <div className="grid grid-cols-2 gap-y-5 gap-x-4 mb-2">
                  {/* Stage */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-1">
                      <FaBriefcase className="w-3 h-3" />
                      <span>Stage</span>
                    </div>
                    <span className="text-[13px] font-bold text-gray-800">Due diligence</span>
                  </div>
                  {/* Indicative Value */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-1">
                      <FaDollarSign className="w-3 h-3" />
                      <span>Indicative value</span>
                    </div>
                    <span className="text-[13px] font-bold text-gray-800">TBD</span>
                  </div>
                  {/* Deadline */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-1">
                      <FaCalendarAlt className="w-3 h-3" />
                      <span>Deadline</span>
                    </div>
                    <span className="text-[13px] font-bold text-gray-800">Oct 08, 2026</span>
                  </div>
                  {/* Participants */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-1">
                      <FaUsers className="w-3 h-3" />
                      <span>Participants</span>
                    </div>
                    <span className="text-[13px] font-bold text-gray-800">18 Invited</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2 text-gray-400">
                  <FaRegFileAlt className="w-3.5 h-3.5" />
                  <span className="text-[11px]">12 new documents</span>
                </div>
                <span className="text-[13px] font-bold text-[#008f70] group-hover:text-[#007058] transition-colors">
                  View deal
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Side Drawer for Teaser Details */}
      {selectedTeaser && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/30 z-40 transition-opacity"
            onClick={closeTeaserSidebar}
          ></div>
          
          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[500px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Teaser Details</h2>
              <button 
                onClick={closeTeaserSidebar}
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
              {/* Similar header as card but larger */}
              <div className="flex items-center gap-4 mb-8">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-sm"
                  style={{ backgroundColor: getColorForProject(selectedTeaser.name) }}
                >
                  {(selectedTeaser.name || "UN").substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                    Confidential Opportunity
                  </span>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">
                    {selectedTeaser.name}
                  </h3>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
                <h4 className="text-sm font-bold text-gray-900 mb-4">Overview</h4>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-gray-50 border border-gray-200 text-gray-600 text-[11px] font-medium rounded-full">
                    {selectedTeaser.projectType || 'B2B SaaS'}
                  </span>
                  <span className="px-3 py-1 bg-gray-50 border border-gray-200 text-gray-600 text-[11px] font-medium rounded-full">
                    North America
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {selectedTeaser.description || `${selectedTeaser.name} is a profitable mid-market company providing workflow automation solutions to enterprise customers.`}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-2">
                    <FaBriefcase className="w-3 h-3" />
                    <span className="uppercase font-semibold">Stage</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">Due diligence</span>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-2">
                    <FaDollarSign className="w-3 h-3" />
                    <span className="uppercase font-semibold">Indicative Value</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">TBD</span>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-2">
                    <FaCalendarAlt className="w-3 h-3" />
                    <span className="uppercase font-semibold">Deadline</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">Oct 08, 2026</span>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-2">
                    <FaUsers className="w-3 h-3" />
                    <span className="uppercase font-semibold">Participants</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">18 Invited</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
