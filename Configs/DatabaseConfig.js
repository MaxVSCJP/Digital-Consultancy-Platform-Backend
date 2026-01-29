import Sequelize from "sequelize";
import dotenv from "dotenv";
dotenv.config();

import {
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  LOG_DB_NAME,
  LOG_DB_USER,
  LOG_DB_PASSWORD,
  CONTENT_DB_NAME,
  CONTENT_DB_USER,
  CONTENT_DB_PASSWORD,
} from "../Configs/ProDevConfig.js";

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: "mysql",
  dialectOptions: {
    charset: "utf8mb4",
  },
  logging: false,
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000,
  },
});

const sequelizeLogs = new Sequelize(LOG_DB_NAME, LOG_DB_USER, LOG_DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: "mysql",
  dialectOptions: {
    charset: "utf8mb4",
  },
  logging: false,
  pool: {
    max: 10,
    min: 3,
    acquire: 30000,
    idle: 10000,
  },
});

const sequelizeContent = new Sequelize(
  CONTENT_DB_NAME,
  CONTENT_DB_USER,
  CONTENT_DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    dialectOptions: {
      charset: "utf8mb4",
    },
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
    },
  }
);

sequelize
  .authenticate()
  .then(() => console.log("Connected to main MySQL database"))
  .catch((err) => console.error("Unable to connect to MySQL:", err));

sequelizeLogs
  .authenticate()
  .then(() => console.log("Connected to logs database"))
  .catch((err) => console.error("Unable to connect to logs databases:", err));

sequelizeContent
  .authenticate()
  .then(() => console.log("Connected to content database"))
  .catch((err) => console.error("Unable to connect to content database:", err));

export { sequelize, sequelizeLogs, sequelizeContent };
