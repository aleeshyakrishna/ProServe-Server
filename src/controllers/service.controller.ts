import { Request, Response } from "express";
import { 
    getServiceById, 
    createService, 
    getAllServices, 
    updateService, 
    deleteService 
} from "../services/service.service";
import { successResponse } from "../utils/response";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { ServiceCategory } from "../types";

export const getServiceController = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const service = await getServiceById(id);
    if (!service) {
        throw new AppError("Service not found", 404);
    }
    return res.status(200).json(
        successResponse(service, "Service fetched successfully")
    );
});

export const createServiceController = asyncHandler(async (req: Request, res: Response) => {
    const service = await createService(req.body);
    return res.status(201).json(
        successResponse(service, "Service created successfully")
    );
});

export const getAllServicesController = asyncHandler(async (req: Request, res: Response) => {
    const { category, providerId, isAvailable } = req.query;

    const filters: {
        category?: ServiceCategory;
        providerId?: string;
        isAvailable?: boolean;
    } = {};

    if (category) {
        const cat = String(category).toUpperCase();
        const validCategories = ["PLUMBING", "ELECTRICAL", "CLEANING", "SALON", "CONSULTATION"];
        if (!validCategories.includes(cat)) {
            throw new AppError("Invalid category query parameter", 400);
        }
        filters.category = cat as ServiceCategory;
    }

    if (providerId) {
        filters.providerId = String(providerId);
    }

    if (isAvailable !== undefined) {
        filters.isAvailable = String(isAvailable) === "true";
    }

    const services = await getAllServices(filters);
    return res.status(200).json(
        successResponse(services, "Services fetched successfully")
    );
});

export const updateServiceController = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const service = await getServiceById(id);
    if (!service) {
        throw new AppError("Service not found", 404);
    }

    const updatedService = await updateService(id, req.body);
    return res.status(200).json(
        successResponse(updatedService, "Service updated successfully")
    );
});

export const deleteServiceController = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const service = await getServiceById(id);
    if (!service) {
        throw new AppError("Service not found", 404);
    }

    await deleteService(id);
    return res.status(200).json(
        successResponse(null, "Service deleted successfully")
    );
});
