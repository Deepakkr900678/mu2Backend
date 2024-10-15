import mongoose from "mongoose";
mongoose.Promise = global.Promise;
// TOKEN , ASN_DATE , HTNO , STUDENT_NAME ,BLOCK , ROOM , FROM , TO , REASON , APPROVED , USED , BATCH
const outPassSchema = new mongoose.Schema({
  TOKEN: {
    type: "String",
  },
  ASN_DATE: {
    type: "String",
  },
  HTNO: {
    type: "String",
  },
  STUDENT_NAME: {
    type: "String",
  },
  BLOCK: {
    type: "String",
  },
  ROOM: {
    type: "String",
  },
  FROM: {
    type: "String",
  },
  TO: {
    type: "String",
  },
  REASON: {
    type: "String",
  },
  APPROVED: {
    type: "string",
  },
  USED: {
    type: "String",
  },
  BATCH: {
    type: "String",
  },
  REVIEWER: {
    type: "String",
  },
});

const Outpass = mongoose.model("Outpass", outPassSchema);

export default Outpass;
