import rfidMapping from "../../models/rfid_mapping.js";
import Login from "../../models/login.js";

const getId = async (req, res) => {
  const { HTNO } = req.body;
  const studentDetails = await Login.findOne({ HTNO: HTNO });
  if (studentDetails) {
    const result = await rfidMapping.findOne({ HTNO: HTNO });
    return res.status(200).json(result.RFTAG_ID);
  }
  return res.status(404).json("User Not Found");
};

export default getId;
