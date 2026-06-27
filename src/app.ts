import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import apiRouter from "./routes/index.routes";
import { globalErrorHandler } from "./middlewares/error.middleware";

const app = express();

// Standard parsers
app.use(express.json());
app.use(cookieParser());

// CORS configuration
app.use(
  cors({
    origin: "http://localhost:3000", // Allow requests from Next.js frontend
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
    credentials: true, // Allow cookies to be sent with requests
  })
);

// Modular API routes
app.use("/api", apiRouter);

// Global error handler (MUST BE LAST)
app.use(globalErrorHandler);

export default app;