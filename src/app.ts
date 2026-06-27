import express from "express";
import cors from "cors";
import apiRouter from "./routes/index.routes";
import { globalErrorHandler } from "./middlewares/error.middleware";

const app = express();

// Standard parsers
app.use(express.json());

// CORS configuration
app.use(
  cors({
    origin: "http://localhost:3000", // Allow requests from Next.js frontend
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);

// Modular API routes
app.use("/api", apiRouter);

// Global error handler (MUST BE LAST)
app.use(globalErrorHandler);

export default app;