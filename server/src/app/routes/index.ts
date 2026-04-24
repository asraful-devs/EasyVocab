import express from 'express';
import { authRoutes } from '../modules/auth/auth.route';
import { userRoutes } from '../modules/user/user.route';
import { wordRoutes } from '../modules/word/word.route';

const router = express.Router();

const moduleRoutes = [
    {
        path: '/auth',
        route: authRoutes,
    },
    {
        path: '/users',
        route: userRoutes,
    },
    {
        path: '/words',
        route: wordRoutes,
    },
];

moduleRoutes.forEach((route) =>
    router.use(route.path, route.route as express.Router)
);

export default router;
