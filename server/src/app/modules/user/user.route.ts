import express from 'express';
import { Role } from '../../../../generated/prisma/enums';
import auth from '../../middlewares/auth';
import { UserController } from './user.controller';

const router = express.Router();

// Create User Route
router.post('/create-user', UserController.CreateUser);

// Get All Users
router.get('/all-users', auth(Role.ADMIN), UserController.GetAllUsers);

//Get Single User
router.get(
    '/get-single-user/:id',
    auth(Role.ADMIN, Role.USER),
    UserController.GetSingleUser
);

router.get(
    '/get-single-user-email/:email',
    auth(Role.ADMIN, Role.USER),
    UserController.GetSingleUserEmail
);

// Update User
router.patch(
    '/update-user/:id',
    auth(Role.ADMIN, Role.USER),
    UserController.UpdateUser
);

// Update User
router.patch(
    '/update-user/:email',
    auth(Role.ADMIN, Role.USER),
    UserController.UpdateUserByEmail
);

// Delete User
router.delete(
    '/soft-delete-user/:id',
    auth(Role.ADMIN, Role.USER),
    UserController.DeleteUser
);

export const userRoutes = router;
