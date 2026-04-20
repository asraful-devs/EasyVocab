import express from 'express';
import { Role } from '../../../../generated/prisma/enums';
import auth from '../../middlewares/auth';
import { AuthController } from './auth.controller';

const router = express.Router();

router.post('/login', AuthController.Login);

router.get('/me', AuthController.GetMe);

router.post('/refresh-token', AuthController.RefreshToken);

router.post(
    '/change-password',
    auth(Role.ADMIN, Role.USER),
    AuthController.ChangePassword
);

router.post('/forgot-password', AuthController.ForgotPassword);

router.post('/reset-password', AuthController.ResetPassword);

export const authRoutes = router;
