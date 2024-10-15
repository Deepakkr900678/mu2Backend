
import mongoose from "mongoose";
mongoose.Promise = global.Promise;
//HTNO,RFTAG_ID
const rfidMappingSchema = new mongoose.Schema({
    HTNO: {
        type: "String",
        required: true,
    },
    RFTAG_ID: {
        type: "String",
        required: true,
    }

});

const rfidMapping = mongoose.model("RfIDMapping", rfidMappingSchema);

export default rfidMapping
