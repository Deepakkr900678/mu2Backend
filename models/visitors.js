import mongoose from "mongoose";
mongoose.Promise = global.Promise;



const visitorSchema = new mongoose.Schema({
  PASS_NO: {
    type: "String",
    required: true,
  },
  VISITORS_NAME: {
    type: "String",
    required: true,
  },
  STUDENT_NAME: {
    type: "String",

  },
  HTNO: {
    type: "String",

  },
  EMAIL: {
    type: "String",

  },
  PHNO: {
    type: "String",
    required: true,
  },
  DATE: {
    type: "String",
    required: true,
  },

  VEHICLE_NO: {
    type: "String",
  },
  FROM: {
    type: "String",
  },
  MEET: {
    type: "String"
  },
  IN: {
    type: "String"
  },
  OUT: {
    type: "String"
  }

});

const visitors = mongoose.model("visitors", visitorSchema);

export default visitors
