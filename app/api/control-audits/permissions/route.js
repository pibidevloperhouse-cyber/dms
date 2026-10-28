import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedDealId = searchParams.get('dealId');
    const requestedCompanyId = searchParams.get('companyId');
    const sideFilter = (searchParams.get('side') || 'all').toLowerCase(); // 'all' | 'buyer' | 'seller'
    const searchQuery = (searchParams.get('search') || '').toLowerCase().trim();

    // 1. Fetch all active deals joined with projects and buyers
    const { data: dealsData, error: dealsErr } = await supabase
      .from('dms_deals')
      .select('id, deal_name, buyer_id, current_stage, status, project_id, created_at')
      .neq('status', 'trashed')
      .order('created_at', { ascending: false });

    if (dealsErr) throw dealsErr;

    const availableDeals = (dealsData || []).map(d => ({
      id: d.id,
      name: d.deal_name || 'Deal Room',
      buyerId: d.buyer_id,
      stage: d.current_stage || 'Preparation',
      status: d.status || 'Active',
      projectId: d.project_id,
      createdAt: d.created_at
    }));

    // Select target deal
    let activeDeal = null;
    if (requestedDealId && requestedDealId !== 'all') {
      activeDeal = availableDeals.find(d => d.id === requestedDealId);
    }
    if (!activeDeal && availableDeals.length > 0) {
      activeDeal = availableDeals[0];
    }

    if (!activeDeal) {
      return NextResponse.json({
        success: true,
        availableDeals: [],
        activeDeal: null,
        documents: [],
        users: [],
        groups: [],
        documentPermissions: [],
        userDocumentMatrix: [],
        roleGroupMatrix: []
      });
    }

    const dealId = activeDeal.id;

    // 2. Fetch documents, folders, groups, users, and permissions for this deal
    const [
      { data: docsData, error: docsErr },
      { data: foldersData, error: folErr },
      { data: groupsData, error: grpErr },
      { data: allUsersData, error: usrErr },
      { data: userGroupsData, error: ugErr },
      { data: permsData, error: permErr }
    ] = await Promise.all([
      supabase.from('documents')
        .select('id, name, folder_id, file_size_bytes, uploaded_by, created_at, mime_type, is_deleted')
        .eq('workspace_id', dealId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true }),
      supabase.from('folders')
        .select('id, name, parent_folder_id, is_deleted')
        .eq('workspace_id', dealId)
        .eq('is_deleted', false),
      supabase.from('groups')
        .select('id, name, description, role, workspace_id, created_at')
        .eq('workspace_id', dealId),
      supabase.from('users')
        .select('id, name, email, role, dms_role, company_id, status'),
      supabase.from('user_groups')
        .select('user_id, group_id'),
      supabase.from('permissions')
        .select('*')
    ]);

    if (docsErr) console.warn('Docs err:', docsErr.message);
    if (folErr) console.warn('Folders err:', folErr.message);
    if (grpErr) console.warn('Groups err:', grpErr.message);

    const rawDocs = docsData || [];
    const rawFolders = foldersData || [];
    const rawGroups = groupsData || [];
    const rawUsers = allUsersData || [];
    const rawUserGroups = userGroupsData || [];
    const rawPerms = permsData || [];

    // Helper: Map folders by ID
    const folderMap = new Map();
    rawFolders.forEach(f => folderMap.set(f.id, f));

    // Helper: Map user dict
    const userDict = new Map();
    rawUsers.forEach(u => userDict.set(u.id, u));

    // Helper: Determine side of user or group
    const classifySide = (role, dmsRole, groupRole) => {
      const combined = `${role || ''} ${dmsRole || ''} ${groupRole || ''}`.toLowerCase();
      if (
        combined.includes('buyer') ||
        combined.includes('guest') ||
        combined.includes('external') ||
        combined.includes('advisor')
      ) {
        return 'buyer';
      }
      return 'seller';
    };

    // Helper: Format bytes
    const formatBytes = (bytes) => {
      const b = Number(bytes);
      if (!b || isNaN(b)) return '--';
      if (b < 1024) return `${b} B`;
      if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
      return `${(b / (1024 * 1024)).toFixed(1)} MB`;
    };

    // 3. Collect groups associated with this deal
    const dealGroupIds = new Set(rawGroups.map(g => g.id));

    // 4. Find all users participating in this deal
    // (members of deal groups, deal buyer, or uploaders of deal documents)
    const dealUserMap = new Map();

    // Add members of deal groups
    rawUserGroups.forEach(ug => {
      if (dealGroupIds.has(ug.group_id)) {
        const u = userDict.get(ug.user_id);
        if (u) {
          if (!dealUserMap.has(u.id)) {
            const side = classifySide(u.role, u.dms_role);
            dealUserMap.set(u.id, {
              id: u.id,
              name: u.name || 'Unnamed Member',
              email: u.email || '',
              role: u.role || 'Member',
              dmsRole: u.dms_role || '',
              side,
              groups: [],
              isBuyer: u.id === activeDeal.buyerId,
              avatar: (u.name || 'U').slice(0, 2).toUpperCase()
            });
          }
          const grp = rawGroups.find(g => g.id === ug.group_id);
          if (grp && !dealUserMap.get(u.id).groups.some(g => g.id === grp.id)) {
            dealUserMap.get(u.id).groups.push({
              id: grp.id,
              name: grp.name,
              role: grp.role
            });
          }
        }
      }
    });

    // Also include deal buyer if not already in dealUserMap
    if (activeDeal.buyerId && userDict.has(activeDeal.buyerId)) {
      const buyer = userDict.get(activeDeal.buyerId);
      if (!dealUserMap.has(buyer.id)) {
        dealUserMap.set(buyer.id, {
          id: buyer.id,
          name: buyer.name || 'Deal Buyer',
          email: buyer.email || '',
          role: buyer.role || 'guest_admin',
          dmsRole: buyer.dms_role || 'buyer',
          side: 'buyer',
          groups: [{ id: 'buyer-primary', name: 'Buyer Lead' }],
          isBuyer: true,
          avatar: (buyer.name || 'B').slice(0, 2).toUpperCase()
        });
      }
    }

    // Also include document uploaders
    rawDocs.forEach(d => {
      if (d.uploaded_by && userDict.has(d.uploaded_by) && !dealUserMap.has(d.uploaded_by)) {
        const u = userDict.get(d.uploaded_by);
        const side = classifySide(u.role, u.dms_role);
        dealUserMap.set(u.id, {
          id: u.id,
          name: u.name || 'Uploader',
          email: u.email || '',
          role: u.role || 'Admin',
          dmsRole: u.dms_role || 'seller',
          side,
          groups: [{ id: 'uploader-group', name: 'Document Contributor' }],
          isBuyer: false,
          avatar: (u.name || 'U').slice(0, 2).toUpperCase()
        });
      }
    });

    let dealUsers = Array.from(dealUserMap.values());

    // Filter by side if requested
    if (sideFilter === 'buyer') {
      dealUsers = dealUsers.filter(u => u.side === 'buyer');
    } else if (sideFilter === 'seller') {
      dealUsers = dealUsers.filter(u => u.side === 'seller');
    }

    // Filter by search query if provided
    if (searchQuery) {
      dealUsers = dealUsers.filter(u =>
        u.name.toLowerCase().includes(searchQuery) ||
        u.email.toLowerCase().includes(searchQuery) ||
        u.groups.some(g => g.name.toLowerCase().includes(searchQuery))
      );
    }

    // 5. Index permissions by group and target
    // key: `${groupId}_doc_${documentId}` or `${groupId}_fol_${folderId}` or `${groupId}_ws`
    const groupPermsMap = new Map();
    rawPerms.forEach(p => {
      if (p.group_id) {
        if (p.scope === 'document' && p.document_id) {
          groupPermsMap.set(`${p.group_id}_doc_${p.document_id}`, p);
        } else if (p.scope === 'folder' && p.folder_id) {
          groupPermsMap.set(`${p.group_id}_fol_${p.folder_id}`, p);
        } else if (p.scope === 'workspace') {
          groupPermsMap.set(`${p.group_id}_ws`, p);
        }
      }
    });

    // 6. Build Document-based permissions detail
    const documentsList = rawDocs.map((doc, idx) => {
      const folder = doc.folder_id ? folderMap.get(doc.folder_id) : null;
      const uploader = doc.uploaded_by ? userDict.get(doc.uploaded_by) : null;

      // Find all users who have each permission on this document
      const viewUsers = [];
      const deleteUsers = [];
      const uploadUsers = [];
      const downloadOriginalUsers = [];
      const downloadSecureUsers = [];
      const editUsers = [];

      dealUsers.forEach(user => {
        // Super admin has full permissions
        const isSuperAdmin = user.role === 'super_admin';
        const isUploader = doc.uploaded_by === user.id;

        let canView = isSuperAdmin || isUploader;
        let canEdit = isSuperAdmin || isUploader;
        let canDelete = isSuperAdmin || isUploader;
        let canUpload = isSuperAdmin;
        let canDownloadSecure = isSuperAdmin || isUploader;
        let canDownloadOriginal = isSuperAdmin || isUploader;
        let permissionSource = isSuperAdmin ? 'Super Admin' : isUploader ? 'Document Creator' : 'None';
        let grantReason = '';

        // Check permissions through each group user belongs to
        for (const grp of user.groups) {
          // Direct document permission
          const docPerm = groupPermsMap.get(`${grp.id}_doc_${doc.id}`);
          if (docPerm) {
            if (docPerm.can_view) canView = true;
            if (docPerm.can_edit) canEdit = true;
            if (docPerm.can_delete) canDelete = true;
            if (docPerm.can_upload) canUpload = true;
            if (docPerm.can_download_secure) canDownloadSecure = true;
            if (docPerm.can_download_original) canDownloadOriginal = true;
            permissionSource = `Group Policy: ${grp.name}`;
            grantReason = `Granted via ${grp.name} explicit document rule.`;
          }

          // Folder permission if document is in a folder
          if (doc.folder_id) {
            const folPerm = groupPermsMap.get(`${grp.id}_fol_${doc.folder_id}`);
            if (folPerm) {
              if (folPerm.can_view) canView = true;
              if (folPerm.can_edit) canEdit = true;
              if (folPerm.can_delete) canDelete = true;
              if (folPerm.can_upload) canUpload = true;
              if (folPerm.can_download_secure) canDownloadSecure = true;
              if (folPerm.can_download_original) canDownloadOriginal = true;
              if (!permissionSource || permissionSource === 'None') {
                permissionSource = `Folder Inheritance: ${grp.name}`;
                grantReason = `Inherited from folder policy for ${grp.name}.`;
              }
            }
          }

          // Workspace scope permission
          const wsPerm = groupPermsMap.get(`${grp.id}_ws`);
          if (wsPerm) {
            if (wsPerm.can_view && !canView) canView = true;
            if (wsPerm.can_upload) canUpload = true;
            if (!permissionSource || permissionSource === 'None') {
              permissionSource = `Workspace Baseline: ${grp.name}`;
            }
          }
        }

        const userSummary = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          side: user.side,
          avatar: user.avatar,
          groups: user.groups.map(g => g.name),
          source: permissionSource,
          reason: grantReason
        };

        if (canView) viewUsers.push(userSummary);
        if (canDelete) deleteUsers.push(userSummary);
        if (canUpload) uploadUsers.push(userSummary);
        if (canDownloadOriginal) downloadOriginalUsers.push(userSummary);
        if (canDownloadSecure) downloadSecureUsers.push(userSummary);
        if (canEdit) editUsers.push(userSummary);
      });

      return {
        id: doc.id,
        index: idx + 1,
        name: doc.name,
        type: doc.file_type || 'document',
        folderId: doc.folder_id,
        folderName: folder ? folder.name : 'Root',
        fileSizeFormatted: formatBytes(doc.file_size_bytes),
        fileSizeBytes: doc.file_size_bytes,
        uploadedByName: uploader ? uploader.name : 'System',
        createdAt: doc.created_at,
        permissions: {
          view: { count: viewUsers.length, users: viewUsers },
          delete: { count: deleteUsers.length, users: deleteUsers },
          upload: { count: uploadUsers.length, users: uploadUsers },
          downloadOriginal: { count: downloadOriginalUsers.length, users: downloadOriginalUsers },
          downloadSecure: { count: downloadSecureUsers.length, users: downloadSecureUsers },
          edit: { count: editUsers.length, users: editUsers }
        }
      };
    });

    // 7. Build User Document Matrix (User-centric view)
    const userDocumentMatrix = dealUsers.map(user => {
      const isSuperAdmin = user.role === 'super_admin';

      const userDocs = rawDocs.map(doc => {
        const isUploader = doc.uploaded_by === user.id;

        let canView = isSuperAdmin || isUploader;
        let canEdit = isSuperAdmin || isUploader;
        let canDelete = isSuperAdmin || isUploader;
        let canUpload = isSuperAdmin;
        let canDownloadSecure = isSuperAdmin || isUploader;
        let canDownloadOriginal = isSuperAdmin || isUploader;
        let source = isSuperAdmin ? 'Super Admin' : isUploader ? 'Document Creator' : 'Denied';
        let reason = isSuperAdmin ? 'Full platform privileges.' : isUploader ? 'Uploaded by this user.' : 'No authorization granted.';

        for (const grp of user.groups) {
          const docPerm = groupPermsMap.get(`${grp.id}_doc_${doc.id}`);
          if (docPerm) {
            canView = canView || !!docPerm.can_view;
            canEdit = canEdit || !!docPerm.can_edit;
            canDelete = canDelete || !!docPerm.can_delete;
            canUpload = canUpload || !!docPerm.can_upload;
            canDownloadSecure = canDownloadSecure || !!docPerm.can_download_secure;
            canDownloadOriginal = canDownloadOriginal || !!docPerm.can_download_original;
            source = `Group: ${grp.name}`;
            reason = `Explicit permission policy applied to ${grp.name}.`;
          }

          if (doc.folder_id) {
            const folPerm = groupPermsMap.get(`${grp.id}_fol_${doc.folder_id}`);
            if (folPerm) {
              canView = canView || !!folPerm.can_view;
              canEdit = canEdit || !!folPerm.can_edit;
              canDelete = canDelete || !!folPerm.can_delete;
              canUpload = canUpload || !!folPerm.can_upload;
              canDownloadSecure = canDownloadSecure || !!folPerm.can_download_secure;
              canDownloadOriginal = canDownloadOriginal || !!folPerm.can_download_original;
              if (source === 'Denied') {
                source = `Folder: ${grp.name}`;
                reason = `Inherited from folder policy for ${grp.name}.`;
              }
            }
          }
        }

        return {
          documentId: doc.id,
          documentName: doc.name,
          canView,
          canEdit,
          canDelete,
          canUpload,
          canDownloadSecure,
          canDownloadOriginal,
          source,
          reason
        };
      });

      // Summary counts
      const viewCount = userDocs.filter(d => d.canView).length;
      const editCount = userDocs.filter(d => d.canEdit).length;
      const deleteCount = userDocs.filter(d => d.canDelete).length;
      const uploadCount = userDocs.filter(d => d.canUpload).length;
      const dlSecureCount = userDocs.filter(d => d.canDownloadSecure).length;
      const dlOriginalCount = userDocs.filter(d => d.canDownloadOriginal).length;

      return {
        user,
        summary: {
          totalDocuments: rawDocs.length,
          viewCount,
          editCount,
          deleteCount,
          uploadCount,
          downloadSecureCount: dlSecureCount,
          downloadOriginalCount: dlOriginalCount,
        },
        documentPermissions: userDocs
      };
    });

    // 8. Build Role / Group Matrix
    const roleGroupMatrix = rawGroups.map(grp => {
      const members = rawUserGroups
        .filter(ug => ug.group_id === grp.id)
        .map(ug => userDict.get(ug.user_id))
        .filter(Boolean);

      const side = classifySide(grp.role);

      // Aggregate permissions for this group across docs
      const permsSummary = {
        viewCount: 0,
        editCount: 0,
        deleteCount: 0,
        uploadCount: 0,
        downloadSecureCount: 0,
        downloadOriginalCount: 0
      };

      const docAccess = rawDocs.map(doc => {
        const docPerm = groupPermsMap.get(`${grp.id}_doc_${doc.id}`);
        const folPerm = doc.folder_id ? groupPermsMap.get(`${grp.id}_fol_${doc.folder_id}`) : null;

        const canView = !!(docPerm?.can_view || folPerm?.can_view);
        const canEdit = !!(docPerm?.can_edit || folPerm?.can_edit);
        const canDelete = !!(docPerm?.can_delete || folPerm?.can_delete);
        const canUpload = !!(docPerm?.can_upload || folPerm?.can_upload);
        const canDownloadSecure = !!(docPerm?.can_download_secure || folPerm?.can_download_secure);
        const canDownloadOriginal = !!(docPerm?.can_download_original || folPerm?.can_download_original);

        if (canView) permsSummary.viewCount++;
        if (canEdit) permsSummary.editCount++;
        if (canDelete) permsSummary.deleteCount++;
        if (canUpload) permsSummary.uploadCount++;
        if (canDownloadSecure) permsSummary.downloadSecureCount++;
        if (canDownloadOriginal) permsSummary.downloadOriginalCount++;

        return {
          documentId: doc.id,
          documentName: doc.name,
          canView,
          canEdit,
          canDelete,
          canUpload,
          canDownloadSecure,
          canDownloadOriginal
        };
      });

      return {
        group: {
          id: grp.id,
          name: grp.name,
          description: grp.description,
          role: grp.role,
          side,
          membersCount: members.length,
          members: members.map(m => ({
            id: m.id,
            name: m.name,
            email: m.email,
            role: m.role
          }))
        },
        summary: permsSummary,
        docAccess
      };
    });

    return NextResponse.json({
      success: true,
      availableDeals,
      activeDeal,
      stats: {
        totalDeals: availableDeals.length,
        totalDocuments: rawDocs.length,
        totalFolders: rawFolders.length,
        totalUsers: dealUsers.length,
        totalGroups: rawGroups.length,
        buyerUsersCount: dealUsers.filter(u => u.side === 'buyer').length,
        sellerUsersCount: dealUsers.filter(u => u.side === 'seller').length,
      },
      documents: documentsList,
      users: dealUsers,
      userDocumentMatrix,
      roleGroupMatrix
    });

  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
