import { DataTypes } from "sequelize";
import { sequelizeContent } from "../Configs/DatabaseConfig.js";

const Content = sequelizeContent.define(
  "Content",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    category: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "e.g. Finance, Marketing, Legal, Startup Guides",
    },

    fileUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    contentType: {
      type: DataTypes.ENUM("file", "article"),
      allowNull: false,
      defaultValue: "article",
    },

    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ["category"] },
      { fields: ["contentType"] },
    ],
  }
);

export default Content;
