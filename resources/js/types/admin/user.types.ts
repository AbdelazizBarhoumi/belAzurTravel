import type { AdminEntity, UserRole } from './common';

/**
 * Admin user - displayed in admin panel
 */
export interface AdminUser extends AdminEntity {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    active: boolean;
    joined: string;
}
