// import { createClient } from '@supabase/supabase-js';
// import { NextResponse } from 'next/server';

// const supabaseAdmin = createClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL,
//     process.env.SUPABASE_SERVICE_ROLE_KEY
// );

// export async function GET(req) {
//     try {
//         const { searchParams } = new URL(req.url);
//         const company_id = searchParams.get('company_id');
//         const user_id = searchParams.get('user_id');
//         const role = searchParams.get('role');

//         if (!company_id || !user_id) {
//             return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
//         }

//         if (role === 'super_admin') {
//             // Super admins see all workspaces in their company
//             const { data, error } = await supabaseAdmin
//                 .from('workspaces')
//                 .select('*')
//                 .eq('company_id', company_id)
//                 .order('created_at', { ascending: false });

//             if (error) throw error;

//             for (let ws of data) {
//                 const { count } = await supabaseAdmin
//                     .from('workspace_members')
//                     .select('user_id', { count: 'exact', head: true })
//                     .eq('workspace_id', ws.id);
//                 ws.user_count = count || 0;
//             }

//             return NextResponse.json({ workspaces: data, success: true });
//         } else {
//             // Normal users see only workspaces they are members of
//             const { data: memberData, error: memberError } = await supabaseAdmin
//                 .from('workspace_members')
//                 .select('workspace_id')
//                 .eq('user_id', user_id);

//             if (memberError) throw memberError;

//             const workspaceIds = memberData.map(m => m.workspace_id);

//             if (workspaceIds.length === 0) {
//                 return NextResponse.json({ workspaces: [], success: true });
//             }

//             const { data, error } = await supabaseAdmin
//                 .from('workspaces')
//                 .select('*')
//                 .in('id', workspaceIds)
//                 .eq('status', 'Active')
//                 .order('created_at', { ascending: false });

//             if (error) throw error;

//             for (let ws of data) {
//                 const { count } = await supabaseAdmin
//                     .from('workspace_members')
//                     .select('user_id', { count: 'exact', head: true })
//                     .eq('workspace_id', ws.id);
//                 ws.user_count = count || 0;
//             }

//             return NextResponse.json({ workspaces: data, success: true });
//         }
//     } catch (err) {
//         console.error('Workspaces GET error:', err);
//         return NextResponse.json({ error: err.message }, { status: 500 });
//     }
// }

// export async function POST(req) {
//     try {
//         const body = await req.json();
//         const { name, description, company_id, user_id, role } = body;

//         if (role !== 'super_admin') {
//             return NextResponse.json({ error: "Unauthorized. Only Super Admins can create workspaces." }, { status: 403 });
//         }

//         if (!name || !company_id) {
//             return NextResponse.json({ error: "Name and company_id are required" }, { status: 400 });
//         }

//         // Check if workspace name already exists in this company
//         const { data: existingWorkspaces, error: checkError } = await supabaseAdmin
//             .from('workspaces')
//             .select('id')
//             .eq('company_id', company_id)
//             .ilike('name', name)
//             .limit(1);

//         if (checkError) {
//             console.error('Failed to check existing workspaces:', checkError);
//         }

//         if (existingWorkspaces && existingWorkspaces.length > 0) {
//             return NextResponse.json({ error: "Workspace name is already used", success: false }, { status: 400 });
//         }

//         // Insert new workspace
//         const { data, error } = await supabaseAdmin
//             .from('workspaces')
//             .insert([
//                 { 
//                     name, 
//                     description: description || null, 
//                     company_id, 
//                     created_by: user_id 
//                 }
//             ])
//             .select()
//             .single();

//         if (error) throw error;

//         // Automatically add the creator (super admin) as a member of this workspace
//         const { error: memberError } = await supabaseAdmin
//             .from('workspace_members')
//             .insert([
//                 {
//                     workspace_id: data.id,
//                     user_id: user_id,
//                     workspace_role: 'admin',
//                     added_by: user_id
//                 }
//             ]);

//         if (memberError) {
//              console.error('Failed to add creator as workspace member:', memberError);
//              // We won't fail the whole request here, but log it
//         }

//         return NextResponse.json({ workspace: data, success: true });
//     } catch (err) {
//         console.error('Workspaces POST error:', err);
//         return NextResponse.json({ error: err.message }, { status: 500 });
//     }
// }

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { workspaces, workspaceMembers, dmsDeals, dmsProjects, userGroups, groups } from '@/db/schema';
import { eq, inArray, desc, sql, and, ilike, or } from 'drizzle-orm';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const company_id = searchParams.get('company_id');
        const user_id = searchParams.get('user_id');
        const role = searchParams.get('role');

        if (!company_id || !user_id) {
            return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
        }

        const itemsMap = new Map();

        // 1. Fetch user assigned group workspace IDs (dms_deals.id)
        let assignedDealIds = [];
        try {
            const ugRows = await db.select({ groupId: userGroups.groupId })
                .from(userGroups)
                .where(eq(userGroups.userId, user_id));
            const groupIds = ugRows.map(ug => ug.groupId);
            if (groupIds.length > 0) {
                const gRows = await db.select({ workspaceId: groups.workspaceId })
                    .from(groups)
                    .where(inArray(groups.id, groupIds));
                assignedDealIds = gRows.map(g => g.workspaceId).filter(Boolean);
            }
        } catch (e) {
            console.error('Error fetching user groups in workspaces API:', e);
        }

        // 2. Fetch workspace members IDs
        let memberWorkspaceIds = [];
        try {
            const memberData = await db.select({ workspaceId: workspaceMembers.workspaceId })
                .from(workspaceMembers)
                .where(eq(workspaceMembers.userId, user_id));
            memberWorkspaceIds = memberData.map(m => m.workspaceId).filter(Boolean);
        } catch (e) {
            console.error('Error fetching workspace members in workspaces API:', e);
        }

        const explicitAssignedIds = Array.from(new Set([...assignedDealIds, ...memberWorkspaceIds]));

        // 3. Fetch DMS Deals
        try {
            // Find company projects
            const companyProjects = await db.select()
                .from(dmsProjects)
                .where(eq(dmsProjects.companyId, company_id));
            const projectIds = companyProjects.map(p => p.id);

            let dealsQuery = [];

            if (role === 'super_admin') {
                // Super admin sees all deals in company projects
                if (projectIds.length > 0) {
                    dealsQuery = await db.select()
                        .from(dmsDeals)
                        .where(inArray(dmsDeals.projectId, projectIds))
                        .orderBy(desc(dmsDeals.createdAt));
                }
            } else if (role === 'admin') {
                // Admin: if explicitly assigned to specific deals, show only those!
                // Otherwise show all company deals under company projects
                if (explicitAssignedIds.length > 0) {
                    dealsQuery = await db.select()
                        .from(dmsDeals)
                        .where(inArray(dmsDeals.id, explicitAssignedIds))
                        .orderBy(desc(dmsDeals.createdAt));
                } else if (projectIds.length > 0) {
                    dealsQuery = await db.select()
                        .from(dmsDeals)
                        .where(inArray(dmsDeals.projectId, projectIds))
                        .orderBy(desc(dmsDeals.createdAt));
                }
            } else {
                // Normal user / guest / member:
                // Only deals they are explicitly assigned to, or where they are the buyer
                const dealConditions = [];
                if (explicitAssignedIds.length > 0) {
                    dealConditions.push(inArray(dmsDeals.id, explicitAssignedIds));
                }
                dealConditions.push(eq(dmsDeals.buyerId, user_id));

                dealsQuery = await db.select()
                    .from(dmsDeals)
                    .where(or(...dealConditions))
                    .orderBy(desc(dmsDeals.createdAt));
            }

            // Map dmsDeals to workspace items
            for (const deal of dealsQuery) {
                const status = (deal.status && deal.status.toLowerCase() === 'active') ? 'Active' : (deal.status || 'Active');
                itemsMap.set(deal.id, {
                    id: deal.id,
                    company_id: company_id,
                    name: deal.dealName || 'Deal Room',
                    description: deal.dealName || 'Deal',
                    status: status,
                    created_by: deal.buyerId,
                    created_at: deal.createdAt,
                    updated_at: deal.updatedAt,
                    user_count: 1
                });
            }
        } catch (e) {
            console.error('Error fetching dms deals in workspaces API:', e);
        }

        // 4. Also fetch legacy workspaces if any
        try {
            let fetchedWorkspaces = [];
            if (role === 'super_admin') {
                fetchedWorkspaces = await db.select().from(workspaces)
                    .where(eq(workspaces.companyId, company_id))
                    .orderBy(desc(workspaces.createdAt));
            } else if (explicitAssignedIds.length > 0) {
                fetchedWorkspaces = await db.select().from(workspaces)
                    .where(
                        and(
                            inArray(workspaces.id, explicitAssignedIds),
                            ilike(workspaces.status, 'Active')
                        )
                    )
                    .orderBy(desc(workspaces.createdAt));
            }

            for (const ws of fetchedWorkspaces) {
                if (!itemsMap.has(ws.id)) {
                    let formattedStatus = ws.status || 'Active';
                    if (formattedStatus.toLowerCase() === 'active') formattedStatus = 'Active';
                    if (formattedStatus.toLowerCase() === 'inactive') formattedStatus = 'Inactive';
                    itemsMap.set(ws.id, {
                        id: ws.id,
                        company_id: ws.companyId,
                        name: ws.name,
                        description: ws.description,
                        status: formattedStatus,
                        created_by: ws.createdBy,
                        created_at: ws.createdAt,
                        updated_at: ws.updatedAt,
                        user_count: 1
                    });
                }
            }
        } catch (e) {
            console.error('Error fetching legacy workspaces:', e);
        }

        const formattedWorkspaces = Array.from(itemsMap.values());
        return NextResponse.json({ workspaces: formattedWorkspaces, success: true });

    } catch (err) {
        console.error('Workspaces GET error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { name, description, company_id, user_id, role } = body;

        if (role !== 'super_admin') {
            return NextResponse.json({ error: "Unauthorized. Only Super Admins can create workspaces." }, { status: 403 });
        }

        if (!name || !company_id) {
            return NextResponse.json({ error: "Name and company_id are required" }, { status: 400 });
        }

        // Check if workspace name already exists in this company
        const existingWorkspaces = await db.select({ id: workspaces.id })
            .from(workspaces)
            .where(
                and(
                    eq(workspaces.companyId, company_id),
                    ilike(workspaces.name, name)
                )
            )
            .limit(1);

        if (existingWorkspaces.length > 0) {
            return NextResponse.json({ error: "Workspace name is already used", success: false }, { status: 400 });
        }

        // Insert new workspace
        const insertedData = await db.insert(workspaces).values({
            name,
            description: description || null,
            companyId: company_id,
            createdBy: user_id
        }).returning();

        const newWorkspace = insertedData[0];

        // Automatically add the creator (super admin) as a member
        try {
            await db.insert(workspaceMembers).values({
                workspaceId: newWorkspace.id,
                userId: user_id,
                workspaceRole: 'admin',
                addedBy: user_id
            });
        } catch (memberError) {
            console.error('Failed to add creator as workspace member:', memberError);
        }

        // Frontend-க்கு ஏற்றபடி snake_case ஆக மாற்றவும்
        const formattedWorkspace = {
            id: newWorkspace.id,
            company_id: newWorkspace.companyId,
            name: newWorkspace.name,
            description: newWorkspace.description,
            status: 'Active', // Force 'Active' format for UI
            created_by: newWorkspace.createdBy,
            created_at: newWorkspace.createdAt,
            updated_at: newWorkspace.updatedAt
        };

        return NextResponse.json({ workspace: formattedWorkspace, success: true });
    } catch (err) {
        console.error('Workspaces POST error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
