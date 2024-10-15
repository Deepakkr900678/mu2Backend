// const mongoose = require("mongoose");

import bcrypt from "bcryptjs";
import { Users } from "../models/User.js";
import Token from "../middlewares/token.js";

function adminloginUser(req, res) {
  const { username, password } = req.body;
  Users.findOne({ EID: username, TYPE: "OUTPASS" })
    .then((existingUser) => {
      // console.log(existingUser);
      bcrypt.compare(password, existingUser.PASSWORD, (err, result) => {
        if (err) {
          return res.status(402).json({
            message: "Not authorized",
          });
        }
        if (result) {
          const token = Token(existingUser.id, existingUser.HTNO);
          return res.status(200).json({
            message: "User authorization successful",
            existingUser: {
              username: existingUser.EID,
              email: existingUser.EMAIL,
              _id: existingUser.id,
            },
            token,
          });
        }
        return res.status(401).json({
          message: "Invalid details",
        });
      });
    })
    .catch(() =>
      res.status(500).json({
        message: "Our server is in the locker room, please do try again.",
      })
    );
}

export { adminloginUser };
