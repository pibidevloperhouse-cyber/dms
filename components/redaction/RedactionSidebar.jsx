"use client";

import MobileNavigation from "@/components/MobileNavigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaFileAlt, FaUpload, FaShieldAlt } from "react-icons/fa";

export default function RedactionSidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Documents",
      href: "/redaction/documents",
      icon: <FaFileAlt className="w-5 h-5" />,
    },
    // {
    //   name: "Upload",
    //   href: "/redaction/upload",
    //   icon: <FaUpload className="w-5 h-5" />,
    // },
    {
      name: "Redacted Files",
      href: "/redaction/redacted",
      icon: <FaShieldAlt className="w-5 h-5" />,
    }
  ];

  return (
    <MobileNavigation label="Redaction menu">
      <div className="w-64 border-r border-slate-200 bg-white h-screen flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Redaction</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                isActive
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className={isActive ? "text-slate-900" : "text-slate-500"}>
                {item.icon}
              </div>
              {item.name}
            </Link>
          );
        })}
      </div>
      </div>
    </MobileNavigation>
  );
}
