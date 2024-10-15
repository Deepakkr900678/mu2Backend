import nodemailer from "nodemailer";
import Vaccination from "../models/vacStatus.js";
import Outpass from "../models/OutPass.js";
import Hostel from "../models/hostel.js";
import validateStudent from "../models/validate_student.js";

async function getDistinctBlocks(req, res) {
  try {
    const distinctBlocks = await Hostel.distinct("BLOCK");
    res.status(200).json({ distinctBlocks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// async function seeAppliedLeaves(req, res) {
//   const keyword = req.query.keyword;
//   const page = parseInt(req.query.page) || 1; // Default page is 1
//   const limit = parseInt(req.query.limit) || 10; // Default limit is 10
//   const searchQuery = keyword
//     ? {
//         $or: [
//           { HTNO: { $regex: keyword, $options: "i" } },
//           { STUDENT_NAME: { $regex: keyword, $options: "i" } },
//         ],
//       }
//     : {};
//   Outpass.countDocuments({ ...searchQuery }, (err, count) => {
//     if (err) {
//       console.log(err);
//       res.status(500).json({ error: "Internal Server Error" });
//     } else {
//       Outpass.find({ ...searchQuery, APPROVED: "" })
//         .skip((page - 1) * limit)
//         .limit(limit)
//         .then((results) => {
//           const formattedResults = results.map((result) => ({
//             ...result.toObject(),
//             FROM: result.FROM,
//             TO: result.TO,
//             ASN_DATE: result.ASN_DATE,
//           }));
//           const totalPages = Math.ceil(count / limit);
//           res.json({
//             applied_leaves: formattedResults,
//             totalPages,
//           });
//         })
//         .catch((err) => {
//           return res
//             .json({
//               msg: err,
//             })
//             .status(400);
//         });
//     }
//   });
// }

async function seeAppliedLeaves(req, res) {
  const keyword = req.query.keyword;
  const page = parseInt(req.query.page) || 1; // Default page is 1
  const limit = parseInt(req.query.limit) || 10; // Default limit is 10
  const blockFilters = req.query.selectedBlocks
    ? req.query.selectedBlocks.split(",")
    : []; // Filter by blocks
  const searchQuery = keyword
    ? {
        $or: [
          { HTNO: { $regex: keyword, $options: "i" } },
          { STUDENT_NAME: { $regex: keyword, $options: "i" } },
        ],
      }
    : {};

  // Add block filter to the search query
  if (blockFilters.length > 0) {
    searchQuery.BLOCK = { $in: blockFilters };
  }

  try {
    const totalCount = await Outpass.countDocuments({
      ...searchQuery,
      APPROVED: "",
    });
    const totalPages = Math.ceil(totalCount / limit);

    const results = await Outpass.find({ ...searchQuery, APPROVED: "" })
      .sort({ ASN_DATE: -1 }) // Sort by ASN_DATE field in descending order
      .skip((page - 1) * limit)
      .limit(limit);

    const formattedResults = results.map((result) => ({
      ...result.toObject(),
      FROM: result.FROM,
      TO: result.TO,
      ASN_DATE: result.ASN_DATE,
    }));

    res.json({
      applied_leaves: formattedResults,
      totalPages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

function seeAppliedLeavesDateBased(req, res) {
  const { startDate, endDate } = req.body;

  const fromDate = new Date(startDate);
  const toDate = new Date(endDate);
  toDate.setDate(toDate.getDate() + 1);

  Outpass.find({
    APPROVED: "",
    ASN_DATE: { $gte: fromDate.toISOString(), $lte: toDate.toISOString() },
  })
    .then((results) => {
      // Map the results to format the date and time fields
      const formattedResults = results.map((result) => ({
        ...result.toObject(),
        FROM: result.FROM,
        TO: result.TO,
        ASN_DATE: result.ASN_DATE,
      }));

      res.json({
        applied_leaves_date: formattedResults,
      });
    })
    .catch((err) => {
      return res
        .json({
          msg: err,
        })
        .status(400);
    });
}

// function seePastLeaves(req, res) {
//   const keyword = req.query.keyword;

//   const searchQuery = keyword
//     ? {
//         $or: [
//           { HTNO: { $regex: keyword, $options: "i" } },
//           { STUDENT_NAME: { $regex: keyword, $options: "i" } },
//         ],
//       }
//     : {};
//   const search = {
//     APPROVED: { $in: ["True", "False"] },
//   };
//   Outpass.find({ ...searchQuery, ...search })
//     .then((results) => {
//       const formattedResults = results.map((result) => ({
//         ...result.toObject(),
//         FROM: result.FROM,
//         TO: result.TO,
//         ASN_DATE: result.ASN_DATE,
//       }));

//       res.json({
//         past_approved_leaves: formattedResults,
//       });
//     })
//     .catch((err) => {
//       return res
//         .json({
//           msg: err,
//         })
//         .status(400);
//     });
// }

function seePastLeaves(req, res) {
  const keyword = req.query.keyword;
  const page = parseInt(req.query.page) || 1; // Default page is 1
  const limit = parseInt(req.query.limit) || 10; // Default limit is 10

  const searchQuery = keyword
    ? {
        $or: [
          { HTNO: { $regex: keyword, $options: "i" } },
          { STUDENT_NAME: { $regex: keyword, $options: "i" } },
        ],
      }
    : {};
  const search = {
    APPROVED: { $in: ["True", "False"] },
  };

  Outpass.countDocuments({ ...searchQuery, ...search }, (err, count) => {
    if (err) {
      console.log(err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      Outpass.find({ ...searchQuery, ...search })
        .sort({ ASN_DATE: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .then((results) => {
          const formattedResults = results.map((result) => ({
            ...result.toObject(),
            FROM: result.FROM,
            TO: result.TO,
            ASN_DATE: result.ASN_DATE,
          }));

          const totalPages = Math.ceil(count / limit);

          res.json({
            past_approved_leaves: formattedResults,
            totalPages: totalPages,
          });
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({ error: "Internal Server Error" });
        });
    }
  });
}

function seePastLeavesDateBased(req, res) {
  const { startDate, endDate } = req.body;

  const fromDate = new Date(startDate);
  const toDate = new Date(endDate);
  toDate.setDate(toDate.getDate() + 1);

  const search = {
    $or: [{ APPROVED: "True" }, { APPROVED: "False" }],
  };

  Outpass.find({
    ...search,
    ASN_DATE: { $gte: fromDate.toISOString(), $lte: toDate.toISOString() },
  })
    .then((results) => {
      // Map the results to format the date and time fields
      const formattedResults = results.map((result) => ({
        ...result.toObject(),
        FROM: result.FROM,
        TO: result.TO,
        ASN_DATE: result.ASN_DATE,
      }));

      res.json({
        past_approved_leaves_date: formattedResults,
      });
    })
    .catch((err) => {
      return res
        .json({
          msg: err,
        })
        .status(400);
    });
}

async function updateLeave(req, res) {
  const token = req.body.token;
  const status = req.body.status;
  const htno = req.body.htno;
  const asnRaw = req.body.asn;
  const reviewed_by = req.body.reviewed_by;
  const dateObject = new Date(asnRaw);
  const asn = dateObject.toISOString();
  if (status === "approved") {
    try {
      const result = await Outpass.findOneAndUpdate(
        { TOKEN: token, HTNO: htno, ASN_DATE: asn },
        { $set: { APPROVED: "True" } },
        { new: true }
      );
      if (!result) {
        console.log("none");
      }
      res.json({
        msg: "Approved Succesfully",
        token,
        htno,
        val: result,
      });
    } catch (error) {
      res.status(400).json({ error });
    }
  } else if (status === "rejected") {
    const result = await Outpass.findOneAndUpdate(
      { TOKEN: token, HTNO: htno, ASN_DATE: asn },
      { $set: { APPROVED: "False" } },
      { new: true }
    );
    res.json({
      msg: "Rejected Succesfully",
      token,
      htno,
      val: result,
    });
  }
}

function vaccinationStatus(req, res) {
  const username = req.params.id;
  Vaccination.find({ HTNO: username })
    .then((items) => {
      // Map the items to format the date field using formatToDateTime
      const formattedItems = items.map((item) => ({
        ...item.toObject(),
        DATE: item.DATE, // Format DATE
      }));
      res.json(formattedItems);
    })
    .catch((err) => res.json({ err: err }).status(401));
}

function statusMail(req, res) {
  console.log(req.body);
  // define all the input variables
  const type = req.body.type;
  const desc = req.body.desc;
  const mail = req.body.mail;
  const from = req.body.from;
  const to = req.body.to;
  const token = req.body.token;
  const warden = req.body.warden;

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "visveshnaraharisetty@gmail.com", // generated ethereal user
      pass: "qscgy@Q10", // generated ethereal password
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // setup email data with unicode symbols
  let mailOptions = {
    from: "mecparentsportal@gmail.com", // sender address
    to: mail, // list of receivers
    subject: ` Your outing has been:  ${type}`, // Subject line
    text: `Token: ${token}
           Status: ${type}
           From: ${from}
           To: ${to}
           Reason: ${desc}
           Given By: ${warden}

           ***DO NOT REPLY***
           Contact: Sukesh Rakshit, Venu Gopal Dandu, Duty Warden
    `, // plain text body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    res.json({
      msg: "Mail sent",
    });
  });
}

export {
  seeAppliedLeaves,
  seePastLeaves,
  updateLeave,
  vaccinationStatus,
  statusMail,
  seeAppliedLeavesDateBased,
  seePastLeavesDateBased,
  getDistinctBlocks,
};
