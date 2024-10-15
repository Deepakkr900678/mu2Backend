
import visitors from "../models/visitors.js";

function postVisitors(req, res) {
  const details = req.body;

  visitors.create(details, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
}


export { postVisitors }