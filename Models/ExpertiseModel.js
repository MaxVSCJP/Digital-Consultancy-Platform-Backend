import { DataTypes } from "sequelize";
import { sequelize } from "../Configs/DatabaseConfig.js";

const Expertise = sequelize.define(
  "Expertise",
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
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    tag: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    timestamps: true,
    indexes: [
      { fields: ["category"] },
      { fields: ["tag"] },
    ],
  }
);

export default Expertise;
