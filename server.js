import dotenv from "dotenv";
dotenv.config();

import { sequelize, sequelizeLogs, sequelizeContent } from "./Configs/DatabaseConfig.js";
import app from "./app.js";

const PORT = process.env.PORT || 10000;

async function server() {
  try {
    await Promise.all([
      sequelize.authenticate(),
      sequelizeLogs.authenticate(),
      sequelizeContent.authenticate(),
    ]);

    await Promise.all([
      sequelize.sync({ alter: true }),
      sequelizeLogs.sync({ alter: true }),
      sequelizeContent.sync({ alter: true }),
    ]);

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

server();
