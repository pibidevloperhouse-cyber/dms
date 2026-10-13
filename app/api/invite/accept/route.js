import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { user_id, invitation_id, group_id, workspace_id, role, invited_by } = await request.json();

    if (!user_id || !invitation_id || !group_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Insert into user_groups
    const { error: ugError } = await supabase
      .from("user_groups")
      .upsert({ user_id, group_id }, { onConflict: "user_id,group_id" });
      
    if (ugError) throw new Error("Failed to add user to group: " + ugError.message);

    // 2. Insert into workspace_members (if applicable)
    if (workspace_id) {
      const { error: wsError } = await supabase
        .from("workspace_members")
        .upsert(
          {
            workspace_id,
            user_id,
            workspace_role: role || "external_user",
            added_by: invited_by
          },
          { onConflict: "workspace_id,user_id" }
        );
      if (wsError) console.error("Workspace Member Error:", wsError.message);
    }

    // 3. Mark invitation as accepted
    const { error: invError } = await supabase
      .from("invitations")
      .update({ status: "accepted" })
      .eq("id", invitation_id);
      
    if (invError) throw new Error("Failed to update invitation: " + invError.message);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Accept Invite Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
