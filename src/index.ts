import * as dotenv from "dotenv";
dotenv.config({ override: true });
import express from "express";
import cors from "cors";
import apiRouter from "./routes/index.routes";
import { globalErrorHandler } from "./middlewares/error.middleware";

const app = express();

app.use(express.json());

// CORS configuration
app.use(cors({
    origin: "http://localhost:3000", // Allow requests from this origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"] // Allowed headers
}));

// Modular API routes
app.use("/api", apiRouter);

// Global error handler (MUST BE LAST)
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});