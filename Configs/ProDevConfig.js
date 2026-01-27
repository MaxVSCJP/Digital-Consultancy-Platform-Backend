import dotenv from "dotenv";
dotenv.config();

// This config file is used to set environment variables for the application dynamically based on the environment
// It allows for different configurations to be loaded based on whether the application is running in production or development mode

let callbackURL;
let secure;
let frontendOrigin;
let origin;
let emailOrigin;
let domain;
let adminRedirect;
let DB_NAME;
let DB_USER;
let DB_PASSWORD;
let LOG_DB_NAME;
let LOG_DB_USER;
let LOG_DB_PASSWORD;
let CONTENT_DB_NAME;
let CONTENT_DB_USER;
let CONTENT_DB_PASSWORD;
let REDIS_URL;
let REDIS_PASSWORD;
let GOOGLE_CLIENT_EMAIL;
let GOOGLE_PRIVATE_KEY;
let GOOGLE_CALENDAR_ID;

if (process.env.NODE_ENV === "production") {
  callbackURL = process.env.CALLBACK_URL_PRODUCTION;
  secure = true;
  frontendOrigin = process.env.PRODUCTION_FRONTEND_URL;
  adminRedirect = process.env.PRODUCTION_ADMIN_REDIRECT;
  origin = process.env.PRODUCTION_ORIGIN;
  emailOrigin = process.env.PRODUCTION_EMAIL_ORIGIN;
  DB_NAME = process.env.PRODUCTION_DB_NAME;
  DB_USER = process.env.PRODUCTION_DB_USER;
  DB_PASSWORD = process.env.PRODUCTION_DB_PASSWORD;
  domain = process.env.PRODUCTION_COOKIE_DOMAIN;
  LOG_DB_NAME = process.env.PRODUCTION_LOG_DB_NAME;
  LOG_DB_USER = process.env.PRODUCTION_LOG_DB_USER;
  LOG_DB_PASSWORD = process.env.PRODUCTION_LOG_DB_PASSWORD;
  CONTENT_DB_NAME = process.env.PRODUCTION_CONTENT_DB_NAME;
  CONTENT_DB_USER = process.env.PRODUCTION_CONTENT_DB_USER;
  CONTENT_DB_PASSWORD = process.env.PRODUCTION_CONTENT_DB_PASSWORD;
  REDIS_URL = process.env.PRODUCTION_REDIS_URL;
  REDIS_PASSWORD = process.env.PRODUCTION_REDIS_PASSWORD;
  GOOGLE_CLIENT_EMAIL = process.env.PRODUCTION_GOOGLE_CLIENT_EMAIL;
  GOOGLE_PRIVATE_KEY = process.env.PRODUCTION_GOOGLE_PRIVATE_KEY;
  GOOGLE_CALENDAR_ID = process.env.PRODUCTION_GOOGLE_CALENDAR_ID;
} else {
  callbackURL = process.env.CALLBACK_URL_DEVELOPMENT;
  secure = false;
  frontendOrigin = process.env.DEVELOPMENT_FRONTEND_URL;
  adminRedirect = process.env.DEVELOPMENT_ADMIN_REDIRECT;
  origin = process.env.DEVELOPMENT_ORIGIN;
  emailOrigin = process.env.DEVELOPMENT_EMAIL_ORIGIN;
  DB_NAME = process.env.DB_NAME;
  DB_USER = process.env.DB_USER;
  DB_PASSWORD = process.env.DB_PASSWORD;
  domain = process.env.DEVELOPMENT_COOKIE_DOMAIN;
  LOG_DB_NAME = process.env.LOG_DB_NAME;
  LOG_DB_USER = process.env.LOG_DB_USER;
  LOG_DB_PASSWORD = process.env.LOG_DB_PASSWORD;
  CONTENT_DB_NAME = process.env.CONTENT_DB_NAME;
  CONTENT_DB_USER = process.env.CONTENT_DB_USER;
  CONTENT_DB_PASSWORD = process.env.CONTENT_DB_PASSWORD;
  REDIS_URL = process.env.REDIS_URL;
  REDIS_PASSWORD = process.env.REDIS_PASSWORD;
  GOOGLE_CLIENT_EMAIL = process.env.DEVELOPMENT_GOOGLE_CLIENT_EMAIL ?? process.env.GOOGLE_CLIENT_EMAIL;
  GOOGLE_PRIVATE_KEY = process.env.DEVELOPMENT_GOOGLE_PRIVATE_KEY ?? process.env.GOOGLE_PRIVATE_KEY;
  GOOGLE_CALENDAR_ID = process.env.DEVELOPMENT_GOOGLE_CALENDAR_ID ?? process.env.GOOGLE_CALENDAR_ID;
}

export {
  callbackURL,
  secure,
  frontendOrigin,
  origin,
  emailOrigin,
  domain,
  adminRedirect,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  LOG_DB_NAME,
  LOG_DB_USER,
  LOG_DB_PASSWORD,
  CONTENT_DB_NAME,
  CONTENT_DB_USER,
  CONTENT_DB_PASSWORD,
  REDIS_URL,
  REDIS_PASSWORD,
  GOOGLE_CLIENT_EMAIL,
  GOOGLE_PRIVATE_KEY,
  GOOGLE_CALENDAR_ID,
};
