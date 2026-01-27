import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import dotenv from "dotenv";
dotenv.config();

import "./Models/Associations.js";
import passport from "./Configs/PassportConfig.js";

import ErrorHandler from "./Middlewares/ErrorHandlerMW.js";
import { generateCSRF } from "./Middlewares/CSRFMW.js";
import { logFormat, stream } from "./Middlewares/MorganLogsMW.js";

import AuthRoutes from "./Routes/AuthRoutes.js";
import BookingRoutes from "./Routes/BookingRoutes.js";
import AvailabilityRoutes from "./Routes/AvailabilityRoutes.js";
import NotificationRoutes from "./Routes/NotificationRoutes.js";

const app = express();

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
  ],
  optionsSuccessStatus: 200,
  credentials: true,
};

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later.",
});

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
app.use(limiter);
app.use(cookieParser());

app.use(morgan(logFormat, { stream: stream }));

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

app.use("/auth", AuthRoutes);
app.use("/bookings", BookingRoutes);
app.use("/availability", AvailabilityRoutes);
app.use("/notifications", NotificationRoutes);

app.get("/init", generateCSRF, (req, res) => {
  res.json({ message: "CSRF token set" });
});

app.get("/", (req, res) => {
  res.json({ message: "Hello from Express!" });
});

app.use(ErrorHandler);

export default app;
