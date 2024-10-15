import jwt from "jsonwebtoken";
import dotenv from "dotenv";
// const jwt = require("jsonwebtoken");
// const dotenv = require("dotenv");
dotenv.config();
export default (req, res, next) => {
  //const bearerHeader = req.headers["authorization"];
  // console.log(req.headers.authorization);
  // const bearer = bearerHeader.split(" ");
  // const token = bearer[1];
  //const token = req.headers["x-access-token"];

  const tok = req.headers["authorization"];
  const MuToken = tok.split(" ")[1];

  if (MuToken) {
    jwt.verify(MuToken, process.env.KEY, (err, decoded) => {
      if (err) {
        console.log(err);
        return res.status(401).json({
          message: "Authorization failed .. ",
        });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    return res.status(401).json({
      message: "Authorization failed...",
    });
  }
};
