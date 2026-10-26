import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invitations, groups, users, companies, dmsDeals } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: "Missing token parameter" }, { status: 400 });
        }

        // Fetch invitation using Drizzle ORM
        const invRows = await db.select({
            id: invitations.id,
            group_id: invitations.groupId,
            email: invitations.email,
            token: invitations.token,
            description: invitations.description,
            invited_by: invitations.invitedBy,
            status: invitations.status,
            requires_nda: invitations.requiresNda,
            workspace_id: invitations.workspaceId,
            group_name: groups.name,
            company_id: groups.companyId,
            group_role: groups.role,
            group_workspace_id: groups.workspaceId,
            inviter_company_id: users.companyId,
            inviter_role: users.role,
            inviter_dms_role: users.dmsRole,
            company_dms_role: companies.dmsRole
        })
            .from(invitations)
            .leftJoin(groups, eq(invitations.groupId, groups.id))
            .leftJoin(users, eq(invitations.invitedBy, users.id))
            .leftJoin(companies, eq(users.companyId, companies.id))
            .where(eq(invitations.token, token));

        if (!invRows || invRows.length === 0) {
            return NextResponse.json({ error: "Invalid Invitation" }, { status: 404 });
        }

        const row = invRows[0];

        const targetWorkspaceId = row.workspace_id || row.group_workspace_id;
        let isDealBuyer = false;
        if (targetWorkspaceId && row.invited_by) {
            const dealRows = await db.select({ buyerId: dmsDeals.buyerId })
                .from(dmsDeals)
                .where(eq(dmsDeals.id, targetWorkspaceId))
                .limit(1);
            if (dealRows?.length > 0 && dealRows[0].buyerId === row.invited_by) {
                isDealBuyer = true;
            }
        }

        const isBuyerInvite =
            isDealBuyer ||
            ['guest_admin', 'guest_lead', 'buyer', 'external_user'].includes(row.inviter_role) ||
            row.inviter_dms_role === 'buyer' ||
            row.company_dms_role === 'buyer' ||
            ['guest_admin', 'guest_lead', 'buyer'].includes(row.group_role);

        const inviteType = isBuyerInvite ? 'Buyer' : 'Seller';
        const dmsRole = isBuyerInvite ? 'buyer' : 'seller';

        // Format to match what the frontend expects
        const formattedInvitation = {
            id: row.id,
            group_id: row.group_id,
            email: row.email,
            token: row.token,
            description: row.description,
            invited_by: row.invited_by,
            status: row.status,
            requires_nda: row.requires_nda,
            workspace_id: row.workspace_id,
            invite_type: inviteType,
            dms_role: dmsRole,
            groups: {
                name: row.group_name,
                company_id: row.company_id,
                role: row.group_role,
                workspace_id: row.group_workspace_id
            },
            inviter: {
                company_id: row.inviter_company_id,
                role: row.inviter_role,
                dms_role: row.inviter_dms_role
            }
        };

        return NextResponse.json({ success: true, invitation: formattedInvitation });

    } catch (error) {
        console.error("Verify Invitation Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
