import { Request, Response, NextFunction } from "express"
import { AppError } from "../utils/AppError"
import { ZodError, ZodIssue } from "zod"

export const globalErrorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message
        })
    }

    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            message: "Validation Error",
            errors: err.issues.map((e: ZodIssue) => ({
                field: e.path.join("."),
                message: e.message
            }))
        })
    }

    // Log unexpected errors for developers
    console.error("Unhandled error details:", err)

    return res.status(500).json({
        success: false,
        message: "Internal Server Error"
    })
}