import { Router } from "express";
import authRouter from "./auth.routes";
import userRouter from "./user.routes";
import serviceRouter from "./service.routes";
import bookingRouter from "./booking.routes";

const router = Router();

// Auth module (register, login, me, etc.)
router.use("/auth", authRouter);

// Resource routers
router.use("/users", userRouter);
router.use("/services", serviceRouter);
router.use("/bookings", bookingRouter);

// Health check endpoint
router.get("/health", (req, res) => {
    res.status(200).json({ 
        status: "OK", 
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

export default router;
