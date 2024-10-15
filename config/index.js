import dotenv from "dotenv";

dotenv.config();

export default {
  PORT: process.env.PORT || 5001,
  MONGO_URI: process.env.MONGO_URI,
  MONGO_DB_NAME: "portal",
  JWT_SECRET: process.env.JWT_SECRET,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  BUCKET: process.env.BUCKET,
};
