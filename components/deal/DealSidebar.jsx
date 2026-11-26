"use client";

import MobileNavigation from "@/components/MobileNavigation";
import Link from "next/link";
import { FaPowerOff, FaDatabase, FaShieldAlt, FaBell, FaFolder, FaFileInvoiceDollar } from "react-icons/fa";

export default function DealSidebar({ activeTab, onTabClick, requests = [], projectName = "Project" }) {
  return (
    <MobileNavigation label="Deal menu">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between py-6 z-40 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div>
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#303030] text-white flex items-center justify-center shadow-lg font-serif italic text-sm">
            N
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Deal Setup</h2>
        </div>

        <nav className="flex flex-col gap-2 px-4">
          <Link href="/dms/workspace" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium transition-colors">
            <FaFolder className="text-lg" />
            <span>Project</span>
          </Link>
          <button
            onClick={() => onTabClick('teaser')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${activeTab === 'teaser' ? 'bg-[#00c875]/10 text-[#00c875]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <FaShieldAlt className="text-lg" />
            <span>Teaser</span>
          </button>
          <button
            onClick={() => onTabClick('deals')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'deals' ? 'bg-[#00c875]/10 text-[#00c875]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <FaDatabase className="text-lg" />
            <span>Deals</span>
          </button>
          <button
            onClick={() => onTabClick('proposals')}
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
          <Link
            href="/dms/deal/bidding"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'bidding' ? 'bg-[#00c875]/10 text-[#00c875]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <FaFileInvoiceDollar className="text-lg" />
            <span>Bidding Details</span>
          </Link>
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="px-4 flex flex-col gap-2 relative">
        <Link href="/dms/login" className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-medium transition-colors">
          <FaPowerOff className="text-lg" />
          <span>Logout</span>
        </Link>
      </div>
      </aside>
    </MobileNavigation>
  );
}
