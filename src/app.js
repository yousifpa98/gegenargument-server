import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { connectDb } from "./libs/connectDb.js";
import userRoutes from "./routes/userRoutes.js";
import tagRoutes from "./routes/tagRoutes.js";
import argumentRoutes from "./routes/argumentRoutes.js";
import cookieParser from "cookie-parser";

const app = express();

connectDb();

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/arguments", argumentRoutes);

// 404 Error Handler
app.use((req, res, next) => {
  res.status(404).json({ message: "Resource not found" });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

export default app;
