"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { FaUsers } from "react-icons/fa";

export default function GroupsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        const rawSession = localStorage.getItem("vdr_session");
        if (!rawSession) {
          router.push("/login");
          return;
        }

        const session = JSON.parse(rawSession);
        const userRole = session?.role;
        const userId = session?.id;
        const companyId = session?.company_id;

        let localCanViewSellerGroups = false;

        if (userRole === "super_admin") {
          localCanViewSellerGroups = true;
        } else {
          const { data: ugRows } = await supabase
            .from("user_groups")
            .select("group_id")
            .eq("user_id", userId);

          const groupIds = ugRows?.map((r) => r.group_id) || [];
          if (groupIds.length > 0) {
            const { data: perms } = await supabase
              .from("permissions")
              .select("can_view_seller_groups")
              .eq("company_id", companyId)
              .eq("scope", "workspace")
              .in("group_id", groupIds);

            if (perms && perms.length > 0) {
              localCanViewSellerGroups = perms.some((p) => p.can_view_seller_groups);
            }
          }
        }

        let query = supabase
          .from("groups")
          .select("id, role, created_at, type, created_by")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false });

        if (session?.active_workspace_id) query = query.eq('workspace_id', session.active_workspace_id);
        else query = query.is('workspace_id', null);

        const { data } = await query;
        let allGroups = data || [];
        let groups = allGroups.filter((g) => g.type !== 'individual');

        const isBuyer = session?.dms_role === 'buyer' || ['guest_admin', 'guest_lead', 'buyer'].includes(userRole);

        if (userRole !== 'super_admin' && !localCanViewSellerGroups) {
          const { data: ugRows } = await supabase
            .from("user_groups")
            .select("group_id")
            .eq("user_id", userId);

          const myGroupIds = new Set((ugRows || []).map((r) => r.group_id));

          if (isBuyer) {
            groups = groups.filter((g) => myGroupIds.has(g.id) || g.created_by === userId || ['guest_admin', 'guest_lead', 'external_user'].includes(g.role));
          } else if (userRole === "admin") {
            groups = groups.filter((g) => myGroupIds.has(g.id) || g.role === "admin");
          } else {
            groups = groups.filter((g) => myGroupIds.has(g.id));
          }
        }

        const roleOrder = {
          'admin': 1,
          'sub_admin': 2,
          'internal_user': 3,
          'guest_admin': 4,
          'guest_lead': 5,
          'external_user': 6
        };
        groups.sort((a, b) => {
            const orderA = roleOrder[a.role] || 99;
            const orderB = roleOrder[b.role] || 99;
            if (orderA !== orderB) return orderA - orderB;
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });

        if (groups && groups.length > 0) {
          router.replace(`/groups/${groups[0].id}`);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Redirect error:", err);
        setLoading(false);
      }
    };

    checkAndRedirect();
  }, [router]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center min-h-[70vh] font-sans">
        <div className="w-9 h-9 border-4 border-slate-200 border-t-[var(--brand)] rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Loading workspace groups...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center min-h-[70vh] p-8 font-sans text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--brand-50)] text-[var(--brand)] flex items-center justify-center mb-5 shadow-xs">
        <FaUsers size={30} />
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">No Groups Found</h2>
      <p className="text-slate-500 text-sm max-w-md">
        There are currently no active groups available. You can add a new group using the "+ Add Groups" button on the left sidebar.
      </p>
    </div>
  );
}