// src/lib/access/roles.js

export const ROLE_PERMISSIONS = {
    super_admin: [
        'view_admin_panel', 'manage_access', 'upload_files', 'upload_folders',
        'create_folders', 'delete_items', 'move_items', 'export_csv',
        'download_secure', 'download_original', 'recover_trash', 'permanent_delete'
    ],
    admin: [
        'view_admin_panel', 'manage_access', 'upload_files', 'upload_folders',
        'create_folders', 'delete_items', 'move_items', 'export_csv',
        'download_secure', 'download_original'
    ],
    subadmin: [
        'view_admin_panel', 'upload_files',
        'move_items', 'download_secure', 'export_csv'
    ],
    user: [
        'view_user_panel', 'download_secure'
    ],
    external_user: [
        'view_user_panel'
    ]
};