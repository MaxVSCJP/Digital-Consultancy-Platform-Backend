import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import dotenv from "dotenv";
dotenv.config();

import "./Models/Associations.js";
import passport from "./Configs/PassportConfig.js";

import ErrorHandler from "./Middlewares/ErrorHandlerMW.js";
import { generateCSRF, verifyCSRF } from "./Middlewares/CSRFMW.js";
import { logFormat, stream } from "./Middlewares/MorganLogsMW.js";

import AuthRoutes from "./Routes/AuthRoutes.js";
import AdminRoutes from "./Routes/AdminRoutes.js";
import ProfileRoutes from "./Routes/ProfileRoutes.js";
import ConsultantRoutes from "./Routes/ConsultantRoutes.js";

import { globalLimiter } from "./Middlewares/RateLimitMW.js";

const app = express();

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "null", // Allow file:// protocol for local testing
  ],
  optionsSuccessStatus: 200,
  credentials: true,
};

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "http://localhost:10000",
          "http://localhost:5173",
        ],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        objectSrc: ["'none'"],
        connectSrc: ["'self'"],
        mediaSrc: ["'self'"],
        fontSrc: ["'self'"],
      },
    },
  })
);

app.use(passport.initialize());
app.use(cors(corsOptions));
app.use(express.json());
app.use(globalLimiter);
app.use(cookieParser());

app.use(morgan(logFormat, { stream: stream }));

// Enable CSRF verification for all state-changing routes
app.use(verifyCSRF);

app.use(
  "/Uploads/ProfileImages",
  cors(corsOptions),
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cache-Control", `public, max-age=${7 * 24 * 60 * 60}`);
    next();
  },
  express.static("./Uploads/ProfileImages")
);

app.use(
  "/Uploads/CVImages",
  cors(corsOptions),
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    // Cache for 1 day as CVs might change
    res.setHeader("Cache-Control", `public, max-age=${1 * 24 * 60 * 60}`);
    next();
  },
  express.static("./Uploads/CVImages")
);

app.use("/auth", AuthRoutes);
app.use("/admin", AdminRoutes);
app.use("/profile", ProfileRoutes);
app.use("/consultant", ConsultantRoutes);

app.get("/init", generateCSRF);

app.get("/", (req, res) => {
  res.json({ message: "Hello from Express!" });
});

app.use(ErrorHandler);

export default app;
