import { AdminWarden } from "../models/adminOrWarden.js";
import generateToken from "../middlewares/token.js";

export const adminOrWardenLogin = async (req, res) => {
  const email = req.body.data.email;

  try {
    const userInfo = await AdminWarden.findOne({ EMAIL: email });
    const type = userInfo.TYPE;
    console.log({ type });

    const Mutoken = generateToken(userInfo._id, userInfo.EMAIL, type);
    const response = {
      UserInfo: userInfo,
      MuToken: Mutoken,
    };
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ Error: error });
  }
};
