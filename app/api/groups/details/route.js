import { NextResponse } from 'next/server';
import { db } from '@/db';
import { groups, userGroups, users, permissions, dmsDeals } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function POST(req) {
    try {
        const { session, groupSlug } = await req.json();
        if (!session || !session.company_id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const companyId = session.company_id;

        // 1. Fetch Group
        let fetchedGroups = [];
        if (groupSlug === 'buyer-member') {
            fetchedGroups = [{ id: 'buyer-member', companyId, name: 'Buyer Member', description: '', createdBy: '', createdAt: new Date(), updatedAt: new Date(), role: 'buyer', workspaceId: session.active_workspace_id }];
        } else {
            fetchedGroups = await db.select()
                .from(groups)
                .where(and(eq(groups.companyId, companyId), eq(groups.id, groupSlug)));
            
            // If it's not a group, check if it's an internal user (Seller Member)
            if (!fetchedGroups || fetchedGroups.length === 0) {
                const fetchedUsers = await db.select()
                    .from(users)
                    .where(and(eq(users.companyId, companyId), eq(users.id, groupSlug)));
                    
                if (fetchedUsers && fetchedUsers.length > 0) {
                    const u = fetchedUsers[0];
                    fetchedGroups = [{
                        id: u.id,
                        companyId: u.companyId,
                        name: u.name,
                        description: u.role,
                        createdBy: u.id,
                        createdAt: u.createdAt,
                        updatedAt: u.updatedAt,
                        role: u.role,
                        workspaceId: null
                    }];
                }
            }
        }

        if (!fetchedGroups || fetchedGroups.length === 0) return NextResponse.json({ error: "Group not found" }, { status: 404 });
        
        // Map to snake_case for frontend
        const group = {
            id: fetchedGroups[0].id,
            company_id: fetchedGroups[0].companyId,
            name: fetchedGroups[0].name,
            description: fetchedGroups[0].description,
            created_by: fetchedGroups[0].createdBy,
            created_at: fetchedGroups[0].createdAt,
            updated_at: fetchedGroups[0].updatedAt,
            role: fetchedGroups[0].role,
            workspace_id: fetchedGroups[0].workspaceId,
            type: fetchedGroups[0].type || 'individual',
        };

        // 2. Fetch Members
        const ugRows = await db.select({ userId: userGroups.userId })
            .from(userGroups)
            .where(eq(userGroups.groupId, group.id));
            
        const userIds = ugRows.map(r => r.userId);
        
        let members = [];
        
        // If the "group" is actually just a single internal user, return that user directly
        if (groupSlug !== 'buyer-member' && fetchedGroups[0].id === groupSlug && !groupSlug.includes('-')) {
            // Note: UUIDs have hyphens. Wait, groupSlug is a UUID!
            // Let's just check if it was a user instead of a group.
            // If it was a user, we set the description to their role above.
            // A better way is to just fetch the user if userIds is empty but groupSlug matches a user.
        }

        if (userIds.length > 0) {
            const fetchedUsers = await db.select({
                id: users.id,
                name: users.name,
                email: users.email,
                phone_number: users.phoneNumber,
                status: users.status
            })
            .from(users)
            .where(
                and(
                    inArray(users.id, userIds),
                    eq(users.companyId, companyId)
                )
            );
            
            members = fetchedUsers;
        } else if (groupSlug !== 'buyer-member') {
            // Check if this groupSlug is actually the user we just faked
            const fetchedUser = await db.select({
                id: users.id,
                name: users.name,
                email: users.email,
                phone_number: users.phoneNumber,
                status: users.status
            })
            .from(users)
            .where(and(eq(users.id, groupSlug), eq(users.companyId, companyId)));
            
            if (fetchedUser && fetchedUser.length > 0) {
                members = fetchedUser;
            }
        }

        // 2b. Fetch Guest Lead for the workspace (if this group belongs to a workspace)
        let guestLead = null;
        if (group.workspace_id) {
            const dealRows = await db.select({ buyerId: dmsDeals.buyerId })
                .from(dmsDeals)
                .where(eq(dmsDeals.id, group.workspace_id))
                .limit(1);

            if (dealRows && dealRows.length > 0 && dealRows[0].buyerId) {
                const guestLeadRows = await db.select({
                    id: users.id,
                    name: users.name,
                    email: users.email,
                    phone_number: users.phoneNumber,
                    status: users.status,
                    role: users.role
                })
                .from(users)
                .where(eq(users.id, dealRows[0].buyerId))
                .limit(1);
                
                if (guestLeadRows && guestLeadRows.length > 0) {
                    guestLead = guestLeadRows[0];
                }
            }
        }

        // 3. Check Logged-in User's Permissions
        let canAddMembers = false;
        let canRemoveMembers = false;
        let canEditPermissions = false;

        if (session.role === 'super_admin') {
            canAddMembers = true;
            canRemoveMembers = true;
            canEditPermissions = true;
        } else if (session.active_workspace_id && ['guest_admin', 'buyer', 'external_user'].includes(session.role)) {
            // Check Deal Restrictions for Buyers/Guests
            const dealRows = await db.select({ guestCanInviteMembers: dmsDeals.guestCanInviteMembers })
                .from(dmsDeals)
                .where(eq(dmsDeals.id, session.active_workspace_id));
            if (dealRows && dealRows.length > 0) {
                canAddMembers = dealRows[0].guestCanInviteMembers;
                canRemoveMembers = dealRows[0].guestCanInviteMembers; // allow removing if they can invite
            }
        } else {
            const myGroups = await db.select({ groupId: userGroups.groupId })
                .from(userGroups)
                .where(eq(userGroups.userId, session.id));
                
            const myGroupIds = myGroups.map(r => r.groupId);
            
            if (myGroupIds.length > 0) {
                const perms = await db.select({
                    can_add_members: permissions.canAddMembers,
                    can_remove_members: permissions.canRemoveMembers,
                    can_access_edit_permissions: permissions.canAccessEditPermissions
                })
                .from(permissions)
                .where(
                    and(
                        eq(permissions.companyId, companyId),
                        eq(permissions.scope, 'workspace'),
                        inArray(permissions.groupId, myGroupIds)
                    )
                );

                if (perms && perms.length > 0) {
                    canAddMembers = perms.some(p => p.can_add_members);
                    canRemoveMembers = perms.some(p => p.can_remove_members);
                    canEditPermissions = perms.some(p => p.can_access_edit_permissions);
                }
            }
        }

        return NextResponse.json({ success: true, group, members, guestLead, canAddMembers, canRemoveMembers, canEditPermissions });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}