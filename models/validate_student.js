import mongoose from "mongoose";
mongoose.Promise = global.Promise;

const validateStudentSchema = new mongoose.Schema({
  HTNO: {
    type: "String",
    required: true,
  },
  SUSPEND: {
    type: "String",
  },
  SUSPENDEDDATE: {
    type: Date,
  },
  SUSPENSIONTYPE: {
    type: "String",
    required: true,
  },
  IMAGE: {
    type: "String",
    default: "",
  },
  // Reference to the Login model using HTNO
  login: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Login",
  },
});

const validateStudent = mongoose.model(
  "validateStudent",
  validateStudentSchema
);

export default validateStudent;
