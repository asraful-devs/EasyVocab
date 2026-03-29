import { Router } from 'express';
import { UserRoutes } from '../moduels/user/user.routes.js';

export const router = Router();

const moduleRoutes = [
    {
        path: '/user',
        route: UserRoutes,
    },
];

moduleRoutes.forEach((route) => {
    router.use(route.path, route.route);
});
