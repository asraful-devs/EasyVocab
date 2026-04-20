import { status } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Request } from 'express';
import httpStatus from 'http-status';
import { Secret } from 'jsonwebtoken';
import { resetPasswordTemplate } from '../../../templates/email';
import config from '../../config/config';
import prisma from '../../config/db';
import ApiError from '../../error/ApiError';
import { JwtHelper } from '../../helpers/jwtHelper';
import emailSender from '../../utils/emailSender';

const login = async (req: Request) => {
    const payload = req.body;

    const result = await prisma.person.findUniqueOrThrow({
        where: {
            email: payload.email,
            status: status.ACTIVE,
        },
    });

    const role = result.role.toLocaleLowerCase();

    const detailsResult = await prisma[role].findUniqueOrThrow({
        where: {
            email: result.email,
        },
    });

    // console.log(detailsResult, 'mamama details result all ok');

    const isCorrectPassword = await bcrypt.compare(
        payload.password,
        result.password
    );

    if (!isCorrectPassword) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Password is incorrect!');
    }

    const accessToken = JwtHelper.generateTokens(
        {
            parsonId: result.id,
            name: result.name,
            email: result.email,
            profilePhoto: detailsResult?.profilePhoto,
            role: result.role,
        },
        config.jwt.access_secret as Secret,
        config.jwt.access_expires_in as string
    );

    const refreshToken = JwtHelper.generateTokens(
        {
            parsonId: result.id,
            name: result.name,
            email: result.email,
            profilePhoto: detailsResult?.profilePhoto,
            role: result.role,
        },
        config.jwt.refresh_secret as Secret,
        config.jwt.refresh_expires_in as string
    );

    return {
        accessToken,
        refreshToken,
        needPasswordChange: result.needsPasswordChange,
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

    const userData = await prisma.person.findUniqueOrThrow({
        where: {
            email: decodedData.email,
            status: status.ACTIVE,
        },
    });

    const accessToken = JwtHelper.generateTokens(
        {
            userId: userData.id,
            email: userData.email,
            role: userData.role,
        },
        config.jwt.access_secret as Secret,
        config.jwt.access_expires_in as string
    );

    return {
        accessToken,
        needPasswordChange: userData.needsPasswordChange,
    };
};

const changePassword = async (user: any, payload: any) => {
    const userData = await prisma.person.findUniqueOrThrow({
        where: {
            email: user.email,
            status: status.ACTIVE,
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

    await prisma.person.update({
        where: {
            email: userData.email,
        },
        data: {
            password: hashedPassword,
            needsPasswordChange: false,
        },
    });

    return {
        message: 'Password changed successfully!',
    };
};

const forgotPassword = async (payload: { email: string }) => {
    const userData = await prisma.person.findUniqueOrThrow({
        where: {
            email: payload.email,
            status: status.ACTIVE,
        },
    });

    const resetPassToken = JwtHelper.generateTokens(
        { email: userData.email, role: userData.role },
        config.jwt.reset_token as Secret,
        config.jwt.reset_token_expires_in as string
    );

    const resetPassLink =
        config.jwt.reset_pass_link +
        `?userId=${userData.id}&token=${resetPassToken}`;

    const emailTemplate = resetPasswordTemplate(userData, resetPassLink);

    await emailSender(
        userData.email,
        'Reset Your Password - Never Alone',
        emailTemplate
    );
};

const resetPassword = async (
    token: string,
    payload: { id: string; password: string }
) => {
    const userData = await prisma.person.findUniqueOrThrow({
        where: {
            id: payload.id,
            status: status.ACTIVE,
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
    await prisma.person.update({
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

    const userData = await prisma.person.findUniqueOrThrow({
        where: {
            email: decodedData.email,
            status: status.ACTIVE,
        },
    });

    const {
        id,
        email,
        role,
        needsPasswordChange,
        status: userStatus,
    } = userData;

    return {
        id,
        email,
        role,
        needsPasswordChange,
        status: userStatus,
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
