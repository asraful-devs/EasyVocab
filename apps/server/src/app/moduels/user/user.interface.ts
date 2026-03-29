

export enum Role {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    USER = 'USER',
    GUIDE = 'GUIDE',
}

export enum IsActive {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    BLOCKED = 'BLOCKED',
}

export interface IUser {
    id: string;
    name: string;
    email: string;
    password?: string;
    phone?: string;
    picture?: string;
    isDeleted?: boolean;
    isActive?: IsActive;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
}
