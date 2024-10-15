import Outpass from "../models/OutPass.js";
import security from "../models/security.js";

function seeApprovedLeaves(req, res) {
  const keyword = req.query.keyword;

  const searchQuery = keyword
    ? {
        $or: [
          { HTNO: { $regex: keyword, $options: "i" } },
          { STUDENT_NAME: { $regex: keyword, $options: "i" } },
        ],
      }
    : {};
  Outpass.find({ ...searchQuery, APPROVED: "True", USED: "False" })
    .then((results) => {
      const formattedResults = results.map((result) => ({
        ...result.toObject(),
        FROM: result.FROM,
        TO: result.TO,
        ASN_DATE: result.ASN_DATE,
      }));

      res
        .json({
          applied_leaves: formattedResults,
        })
        .status(200);
    })
    .catch((err) => {
      console.log(err);

      return res
        .json({
          msg: err,
        })
        .status(400);
    });
}

function seeApprovedLeavesDateBased(req, res) {
  const { startDate, endDate } = req.body;

  const fromDate = new Date(startDate);
  const toDate = new Date(endDate);
  toDate.setDate(toDate.getDate() + 1);

  Outpass.find({
    ...searchQuery,
    APPROVED: "True",
    USED: "False",
    ASN_DATE: { $gte: fromDate.toISOString(), $lte: toDate.toISOString() },
  })
    .then((results) => {
      const formattedResults = results.map((result) => ({
        ...result.toObject(),
        FROM: result.FROM,
        TO: result.TO,
        ASN_DATE: result.ASN_DATE,
      }));

      res
        .json({
          applied_leaves_date: formattedResults,
        })
        .status(200);
    })
    .catch((err) => {
      console.log(err);

      return res
        .json({
          msg: err,
        })
        .status(400);
    });
}

function updateApprovedLeave(req, res) {
  const token = req.body.token;
  const status = req.body.status;
  const htno = req.body.htno;
  const asn = req.body.asn;
  if (status === "exited") {
    Outpass.findOneAndUpdate(
      { HTNO: htno, TOKEN: token, ASN_DATE: asn },
      { $set: { USED: "True" } }
    ).then((val) => {
      res.json({
        msg: "Student Left",
        token,
        val: val,
      });
    });
  }
}

const addChecking = (req, res) => {
  const test = Date.now();
  //   if (req.data.length == 0) {
  //     return res.json({
  //       msg: "Not found",
  //     });

  var branch;
  //   console.log(req.data);
  if (req.data.length == 0) {
    return res.json({
      msg: "Couldn't find",
    });
  }
  //   console.log(id[7]);
  const digit = req.body.username[7];
  if (digit == "1") {
    branch = "CIVIL";
  } else if (digit == "2") {
    branch = "EEE";
  } else if (digit == "3") {
    branch = "MECH";
  } else {
    branch = "CSE";
  }

  security.create(
    {
      HTNO: req.body.username,
      STUDENT_NAME: req.data[0].STUDENT_NAME,
      BRANCH: branch,
      MOVING: req.body.MOVING,
      REMARKS: req.body.REMARKS,
      DATE: test,
      BATCH: req.data[0].BATCH,
    },
    (err, done) => {
      if (err) {
        res.json({
          msg: err.message,
        });
      } else {
        res.json({
          msg: "Added Succesfully",
        });
      }
    }
  );
};

const seeLatestPastLeave = async (req, res) => {
  const searchQuery = req.query.keyword;
  try {
    const query = searchQuery
      ? {
          $or: [
            { HTNO: { $regex: searchQuery, $options: "i" } },
            { STUDENT_NAME: { $regex: searchQuery, $options: "i" } },
          ],
          APPROVED: "True",
          USED: "False",
        }
      : { APPROVED: "True", USED: "False" };

    const latestRecord = await Outpass.findOne(query).sort({ _id: -1 });

    if (latestRecord) {
      res.status(200).json({ latestRecord });
    } else {
      res.status(200).json({ latestRecord: [] });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export {
  seeApprovedLeaves,
  updateApprovedLeave,
  addChecking,
  seeApprovedLeavesDateBased,
  seeLatestPastLeave,
};
