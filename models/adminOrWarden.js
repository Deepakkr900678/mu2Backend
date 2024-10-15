import mongoose from "mongoose";

mongoose.Promise = global.Promise;

// EID, NAME, EMAIL, PASSWORD, TYPE;
const adminWardenSchema = new mongoose.Schema({
  NAME: {
    type: "String",
    required: true,
  },
  EMAIL: {
    type: "String",
  },
  TYPE: {
    type: "String",
    required: true,
  },
});

const AdminWarden = mongoose.model("AdminWarden", adminWardenSchema);

export { AdminWarden };
