export default interface IUser {
    id: string;
    fullName: string;
    email: string;
    profilePicture: string | null;
    phone: string | null;
    password: string;
    role: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
