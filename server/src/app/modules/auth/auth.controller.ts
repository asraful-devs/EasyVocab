import type { Request, Response } from 'express';
import httpStatus, { status } from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AuthService } from './auth.service';

const Login = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.login(req);
    const { accessToken, refreshToken, needPasswordChange } = result;

    res.cookie('accessToken', accessToken, {
        secure: true,
        httpOnly: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 60,
    });
    res.cookie('refreshToken', refreshToken, {
        secure: true,
        httpOnly: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 60 * 24 * 90,
    });

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'loggedin successfully!',
        data: {
            needPasswordChange,
        },
    });
});

const RefreshToken = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    const result = await AuthService.refreshToken(refreshToken);
    res.cookie('accessToken', result.accessToken, {
        secure: true,
        httpOnly: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 60,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Access token genereated successfully!',
        data: {
            message: 'Access token genereated successfully!',
        },
    });
});

//Change Password
const ChangePassword = catchAsync(
    async (req: Request & { user?: any }, res: Response) => {
        const user = req.user;
        const result = await AuthService.changePassword(user, req.body);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Password Changed successfully',
            data: result,
        });
    }
);

const ForgotPassword = catchAsync(async (req: Request, res: Response) => {
    await AuthService.forgotPassword(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Check your email!',
        data: null,
    });
});

const ResetPassword = catchAsync(async (req: Request, res: Response) => {
    const token = req.headers.authorization || '';
    const result = await AuthService.resetPassword(token, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Password Reset!',
        data: result,
    });
});

const GetMe = catchAsync(async (req: Request, res: Response) => {
    const userSession = req.cookies;
    const result = await AuthService.getMe(userSession);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User retrive successfully!',
        data: result,
    });
});

export const AuthController = {
    Login,
    RefreshToken,
    ChangePassword,
    ForgotPassword,
    ResetPassword,
    GetMe,
};
