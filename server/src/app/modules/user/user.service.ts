import bcrypt from 'bcrypt';
import type { Request } from 'express';
import status from 'http-status';
import { prisma } from '../../../../lib/prisma';
import config from '../../config/config';
import ApiError from '../../error/ApiError';
import {
    paginationHelper,
    type IOptions,
} from '../../helpers/paginationHelper';

const createUser = async (req: Request) => {
    const payload = req.body as {
        fullName?: string;
        email?: string;
        password?: string;
        profilePicture?: string;
        phone?: string;
    };

    if (
        !payload?.fullName ||
        !payload?.email ||
        !payload?.password ||
        !payload?.profilePicture ||
        !payload?.phone
    ) {
        throw new ApiError(status.BAD_REQUEST, 'Invalid user data');
    }

    const isUserExist = await prisma.user.findUnique({
        where: {
            email: payload.email,
        },
    });

    if (isUserExist) {
        throw new ApiError(
            status.BAD_REQUEST,
            'User with this email already exists'
        );
    }

    const hashedPassword = await bcrypt.hash(
        payload.password,
        config.saltRounds
    );

    const result = await prisma.user.create({
        data: {
            fullName: payload.fullName,
            email: payload.email,
            password: hashedPassword,
            profilePicture: payload.profilePicture,
            phone: payload.phone,
        },
    });
    return result;
};

const getAllUsers = async (
    filters: { name?: string; email?: string },
    options: IOptions
) => {
    const { limit, page, skip } = paginationHelper.calculatePagination(options);

    const result = await prisma.user.findMany({
        where: {
            isDeleted: false,
            ...(filters.name && { fullName: { contains: filters.name } }),
            ...(filters.email && { email: { contains: filters.email } }),
        },
        skip: skip,
        take: limit,
        orderBy:
            options.sortBy && options.sortOrder
                ? { [options.sortBy]: options.sortOrder }
                : {
                      createdAt: 'desc',
                  },
    });

    const total = await result.length;
    return {
        meta: {
            total,
            page,
            limit,
        },
        data: result,
    };
};

const getSingleUser = async (req: Request) => {
    const { id } = req.params as { id?: string };

    if (!id) {
        throw new ApiError(status.BAD_REQUEST, 'User id is required');
    }

    const result = await prisma.user.findUnique({
        where: {
            id,
        },
    });
    return result;
};

const getSingleUserEmail = async (req: Request) => {
    const { email } = req.params as { email?: string };

    if (!email) {
        throw new ApiError(status.BAD_REQUEST, 'User email is required');
    }

    const result = await prisma.user.findUnique({
        where: {
            email,
        },
    });
    return result;
};

const updateUser = async (req: Request) => {
    const { id } = req.params as { id?: string };

    if (!id) {
        throw new ApiError(status.BAD_REQUEST, 'User id is required');
    }

    const payload = req.body as {
        fullName?: string;
        profilePicture?: string;
        phone?: string;
    };

    const result = await prisma.user.update({
        where: {
            id,
        },
        data: {
            fullName: payload.fullName,
            profilePicture: payload.profilePicture,
            phone: payload.phone,
        },
    });
    return result;
};

const updateUserByEmail = async (req: Request) => {
    const { email } = req.params as { email?: string };

    if (!email) {
        throw new ApiError(status.BAD_REQUEST, 'User email is required');
    }

    const payload = req.body as {
        fullName?: string;
        profilePicture?: string;
        phone?: string;
    };

    const result = await prisma.user.update({
        where: {
            email,
        },
        data: {
            fullName: payload.fullName,
            profilePicture: payload.profilePicture,
            phone: payload.phone,
        },
    });
    return result;
};

const deleteUser = async (req: Request) => {
    const { id } = req.params as { id?: string };

    if (!id) {
        throw new ApiError(status.BAD_REQUEST, 'User id is required');
    }

    const result = await prisma.user.update({
        where: {
            id,
        },
        data: {
            isDeleted: true,
        },
    });
    return result;
};

export const UserService = {
    createUser,
    getAllUsers,
    getSingleUser,
    getSingleUserEmail,
    updateUser,
    updateUserByEmail,
    deleteUser,
};
