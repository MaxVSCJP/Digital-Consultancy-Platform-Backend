import { DataTypes } from "sequelize";
import { sequelize } from "../Configs/DatabaseConfig.js";

const Availability = sequelize.define(
  "Availability",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    consultantProfileId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    dayOfWeek: {
      type: DataTypes.ENUM(
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ),
      allowNull: false,
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["consultantProfileId", "dayOfWeek", "startTime"],
      },
    ],
  }
);

export default Availability;
