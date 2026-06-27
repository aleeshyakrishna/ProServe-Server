import { Request, Response } from "express";
import { 
    getUserService, 
    createUserService, 
    getAllUserService, 
    updateUserService, 
    deleteUserService 
} from "../services/user.service";
import { successResponse } from "../utils/response";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { Role } from "../types";

export const getUserController = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const user = await getUserService(id);
    if (!user) {
        throw new AppError("User not found", 404);
    }
    return res.status(200).json(
        successResponse(user, "User fetched successfully")
    );
});

export const createUserController = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, role, servicesOffered, rating } = req.body;
    const user = await createUserService({
        name,
        email,
        role,
        servicesOffered,
        rating
    });
    return res.status(201).json(
        successResponse(user, "User created successfully")
    );
});

export const getAllUserController = asyncHandler(async (req: Request, res: Response) => {
    const roleParam = req.query.role as string | undefined;
    
    let role: Role | undefined = undefined;
    if (roleParam === "USER" || roleParam === "PROVIDER" || roleParam === "ADMIN") {
        role = roleParam;
    } else if (roleParam) {
        throw new AppError("Invalid role query parameter", 400);
    }

    const users = await getAllUserService(role);
    return res.status(200).json(
        successResponse(users, "Users fetched successfully")
    );
});

export const updateUserController = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    
    const user = await getUserService(id);
    if (!user) {
        throw new AppError("User not found", 404);
    }

    const updatedUser = await updateUserService(id, req.body);
    return res.status(200).json(
        successResponse(updatedUser, "User updated successfully")
    );
});

export const deleteUserController = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    
    const user = await getUserService(id);
    if (!user) {
        throw new AppError("User not found", 404);
    }

    await deleteUserService(id);
    return res.status(200).json(
        successResponse(null, "User deleted successfully")
    );
});
