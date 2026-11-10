export enum CollectionPermission {
    VIEW = 'collection:view',
    AUTO_TRACKING = 'collection:auto-tracking',
    TRACK_PERIOD = 'collection:track-period',
    TERMINATE_VERSION = 'version:terminate',
    EDIT = 'collection:edit',
    VIEW_EVOLUTIVE = 'collection:view-evolutive',
    DELETE = 'collection:delete',
}

export type CollectionAccess = { isAdmin: boolean; rolesId: string[] };
