"use client";

import { useId, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu } from "lucide-react";

export default function MobileNavigation({ label, variant = "section", children }) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState(null);
  const expanded = openPath === pathname && openPath !== null;
  const id = useId();

  return (
    <div className="mobile-navigation md:contents" data-variant={variant}
      onKeyDown={(event) => {
        if (expanded && event.key === "Escape") {
          setOpenPath(null);
          event.currentTarget.querySelector("button").focus();
        }
      }}>
      <button type="button" className="mobile-navigation-toggle md:hidden" aria-expanded={expanded}
        aria-controls={id} onClick={() => setOpenPath(expanded ? null : pathname)}>
        <Menu size={18} aria-hidden="true" /> {label}
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      <div id={id} className="mobile-navigation-panel md:contents" data-expanded={expanded}
        onClick={(event) => {
          if (event.target.closest("a[href]")) setOpenPath(null);
        }}>
        {children}
      </div>
    </div>
  );
}
