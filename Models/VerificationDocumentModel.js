import { DataTypes } from "sequelize";
import { sequelize } from "../Configs/DatabaseConfig.js";

const VerificationDocument = sequelize.define(
  "VerificationDocument",
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
    documentType: {
      type: DataTypes.ENUM("pdf", "docx", "doc", "image"),
      allowNull: false,
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    fileUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    virusScanStatus: {
      type: DataTypes.ENUM("pending", "clean", "infected"),
      defaultValue: "pending",
    },
    virusScanDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    updatedAt: false,
  }
);

export default VerificationDocument;
