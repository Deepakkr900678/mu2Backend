import mongoose from "mongoose";

mongoose.Promise = global.Promise;
//HTNO,STUDENT_NAME, STUDENT_EMAIL,PASSWORD,
const hostelSchema = new mongoose.Schema({
  HTNO: {
    type: "String",
    required: true,
  },
  BLOCK: {
    type: "String",
    required: true,
  },
  ROOM: {
    type: "String",
    required: true
  }
});

const Hostel = mongoose.model("Hostel", hostelSchema);

export default Hostel