// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";

import rfidMapping from "../models/rfid_mapping.js";

const rfidDecoder = (req, res, next) => {
  rfidMapping
    .findOne({ RFTAG_ID: req.params.tagid })
    .then((results) => {
      req.htno = results.HTNO;

      next();
    })
    .catch((err) => {
      // console.log(err)
      return res.json({
        msg: "No user mapping found ",
      });
    });
};

export default rfidDecoder;
