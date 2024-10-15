import mongoose from "mongoose";

mongoose.Promise = global.Promise;
//HTNO,STUDENT_NAME, STUDENT_EMAIL,PASSWORD,
const studentloginSchema = new mongoose.Schema({
  HTNO: {
    type: "String",
    required: true,
  },
  STUDENT_NAME: {
    type: "String",
    required: true,
  },
  STUDENT_EMAIL: {
    type: "String",
    required: true
  },

  PASSWORD: {
    type: "String",
    required: true,
  }
});

const StudentLogin = mongoose.model("StudentLogin", studentloginSchema);

export default StudentLogin
