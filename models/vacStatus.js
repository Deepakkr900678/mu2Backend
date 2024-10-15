
import mongoose from "mongoose";
mongoose.Promise = global.Promise;


// HTNO ,STUDENT_NAME DOSE , VAC_NAME , DATE  
const vaccinationStatusSchema = new mongoose.Schema({
  HTNO: {
    type: "String",
    required: true,
  },
  STUDENT_NAME: {
    type: "String",
    required: true,
  },
  DOSE: {
    type: "String",
  },
  VAC_NAME: {
    type: "String"
  },
  DATE: {
    type: "String"
  }
})

const Vaccination = mongoose.model("Vaccination", vaccinationStatusSchema);

export default Vaccination








