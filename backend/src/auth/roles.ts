import { User, UserRole } from '../users/entities/user.entity';

export const STAFF_ROLES = [UserRole.ADMIN, UserRole.MUNICIPAL_OFFICIAL, UserRole.MUNICIPAL_SUPERVISOR];

export const isStaff = (user?: Pick<User, 'role'> | null) => !!user && STAFF_ROLES.includes(user.role);
