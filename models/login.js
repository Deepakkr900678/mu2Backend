import mongoose from "mongoose";
// const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
//HTNO,STUDENT_NAME, STUDENT_EMAIL,STUDENT_MOBILE,FATHER_NAME,PARENTS_MOBILE,PARENTS_EMAIL,PASSWORD,BATCH,RESET_TOKEN ,RESET_EXPIRE, A_TYPE
const loginSchema = new mongoose.Schema({
  HTNO: {
    type: "String",
    required: true,
  },
  STUDENT_NAME: {
    type: "String",
    required: true,
  },
  STUDENT_EMAIL: {
    CODE: "String",
  },
  STUDENT_MOBILE: {
    type: "String",
    required: true,
  },
  FATHER_NAME: {
    type: "String",
    required: true,
  },
  PARENTS_MOBILE: {
    type: "String",
    required: true,
  },
  PARENTS_EMAIL: {
    type: "String",
    required: true,
  },
  PASSWORD: {
    type: "String",
    required: true,
  },
  BRANCH: {
    type: "String",

  },

  BATCH: {
    type: "String",
  },
  RESET_TOKEN: {
    type: "String",
  },
  RESET_EXPIRE: {
    type: "Date",
  },
  A_TYPE: {
    type: "String"
  },
  SCHOOL: {
    type: "String"
  },
  IMAGE: {
    type: "String",
  },

});

const Login = mongoose.model("Login", loginSchema);

export default Login
