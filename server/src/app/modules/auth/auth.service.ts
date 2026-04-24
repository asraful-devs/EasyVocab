import bcrypt from 'bcrypt';
import { type Request } from 'express';
import httpStatus from 'http-status';
import type { Secret } from 'jsonwebtoken';
import { prisma } from '../../../../lib/prisma';
import config from '../../config/config';
import ApiError from '../../error/ApiError';
import { JwtHelper } from '../../helpers/jwtHelper';

const login = async (req: Request) => {
    const payload = req.body;

    const result = await prisma.user.findUniqueOrThrow({
        where: {
            email: payload.email,
        },
    });

    const isCorrectPassword = await bcrypt.compare(
        payload.password,
        result.password
    );

    if (!isCorrectPassword) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Password is incorrect!');
    }

    const accessToken = JwtHelper.generateTokens(
        {
            id: result.id,
            fullName: result.fullName,
            email: result.email,
            profilePicture: result.profilePicture,
            role: result.role,
        },
        config.jwt.access_secret as Secret,
        config.jwt.access_expires_in as string
    );

    const refreshToken = JwtHelper.generateTokens(
        {
            id: result.id,
            fullName: result.fullName,
            email: result.email,
            profilePicture: result.profilePicture,
            role: result.role,
        },
        config.jwt.refresh_secret as Secret,
        config.jwt.refresh_expires_in as string
    );

    return {
        accessToken,
        refreshToken,
    };
};

const refreshToken = async (token: string) => {
    let decodedData;
    try {
        decodedData = JwtHelper.verifyToken(
            token,
            config.jwt.refresh_secret as Secret
        );
    } catch (err) {
        throw new Error('You are not authorized!');
    }

    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            email: decodedData.email,
            isDeleted: false,
        },
    });

    const accessToken = JwtHelper.generateTokens(
        {
            id: userData.id,
            email: userData.email,
            role: userData.role,
        },
        config.jwt.access_secret as Secret,
        config.jwt.access_expires_in as string
    );

    return {
        accessToken,
    };
};

const changePassword = async (
    user: any,
    payload: { oldPassword: string; newPassword: string }
) => {
    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            email: user.email,
            isDeleted: false,
        },
    });

    const isCorrectPassword: boolean = await bcrypt.compare(
        payload.oldPassword,
        userData.password
    );

    if (!isCorrectPassword) {
        throw new Error('Password Incorrect!');
    }

    const hashedPassword: string = await bcrypt.hash(
        payload.newPassword,
        config.saltRounds
    );

    await prisma.user.update({
        where: {
            email: userData.email,
        },
        data: {
            password: hashedPassword,
        },
    });

    return {
        message: 'Password changed successfully!',
    };
};

const forgotPassword = async (payload: { email: string }) => {
    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            email: payload.email,
            isDeleted: false,
        },
    });

    const resetPassToken = JwtHelper.generateTokens(
        { email: userData.email, role: userData.role },
        config.jwt.reset_token as Secret,
        config.jwt.reset_token_expires_in as string
    );

    // const resetPassLink =
    //     config.jwt.reset_pass_link +
    //     `?userId=${userData.id}&token=${resetPassToken}`;

    // const emailTemplate = resetPasswordTemplate(userData, resetPassLink);

    // await emailSender(
    //     userData.email,
    //     'Reset Your Password - Easy Vocab',
    //     emailTemplate
    // );
};

const resetPassword = async (
    token: string,
    payload: { id: string; password: string }
) => {
    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            id: payload.id,
            isDeleted: false,
        },
    });

    const isValidToken = JwtHelper.verifyToken(
        token,
        config.jwt.reset_token as Secret
    );

    if (!isValidToken) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden!');
    }

    // hash password
    const password = await bcrypt.hash(payload.password, config.saltRounds);

    // update into database
    await prisma.user.update({
        where: {
            id: payload.id,
        },
        data: {
            password,
        },
    });
};

const getMe = async (session: any) => {
    const accessToken = session.accessToken;
    const decodedData = JwtHelper.verifyToken(
        accessToken,
        config.jwt.access_secret as Secret
    );

    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            email: decodedData.email,
            isDeleted: false,
        },
    });

    const { id, fullName, email, role, phone, isDeleted } = userData;

    return {
        id,
        fullName,
        email,
        role,
        phone,
        isDeleted,
    };
};

export const AuthService = {
    login,
    refreshToken,
    changePassword,
    forgotPassword,
    resetPassword,
    getMe,
};
