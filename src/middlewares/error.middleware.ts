import { Request, Response, NextFunction } from "express"
import { AppError } from "../utils/AppError"
import { ZodError, ZodIssue } from "zod"

export const globalErrorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "http://localhost:3000");
    res.setHeader("Access-Control-Allow-Credentials", "true");

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

    // Handle database connection refused (ECONNREFUSED) gracefully
    const isConnRefused = (err as any)?.cause?.code === "ECONNREFUSED" || 
                          (err as any)?.cause?.errors?.some((e: any) => e.code === "ECONNREFUSED");

    if (isConnRefused) {
        const dbErrorMsg = (err as any)?.cause?.message || err.message;
        console.error("❌ Database Connection Failure:", dbErrorMsg);
        return res.status(503).json({
            success: false,
            message: "Database connection failed. Please verify your DATABASE_URL in .env and network connection."
        });
    }

    // Log unexpected errors for developers
    console.error("Unhandled error details:", err);

    return res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
}