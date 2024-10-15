import bcrypt from "bcryptjs";
// Removed StudentLogin Schema and used Login Schema
// import StudentLogin from "../models/studentLogin.js";
import Login from "../models/login.js";
import Hostel from "../models/hostel.js";
import generateToken from "../middlewares/token.js";
import validateStudent from "../models/validate_student.js";
import cron from "node-cron";
import { format } from "date-fns";

import Outpass from "../models/OutPass.js";
import rfidMapping from "../models/rfid_mapping.js";
import security from "../models/security.js";
import Vaccination from "../models/vacStatus.js";
import visitors from "../models/visitors.js";
import moment from "moment-timezone";
// function loginUser(req, res) {
//   const { username, password } = req.body;
//   StudentLogin.findOne({ HTNO: username })
//     .then((existingUser) => {
//       //  console.log(existingUser);
//       bcrypt.compare(password, existingUser.PASSWORD, (err, result) => {
//         if (err) {
//           return res.status(402).json({
//             message: "Not authorized",
//           });
//         }
//         if (result) {
//           const token = Token(existingUser.id, existingUser.HTNO);
//           return res.status(200).json({
//             message: "User authorization successful",
//             existingUser: {
//               username: existingUser.HTNO,
//               email: existingUser.STUDENT_EMAIL,
//               _id: existingUser.id,
//             },
//             token,
//           });
//         }
//         return res.status(401).json({
//           message: "Invalid details",
//         });
//       });
//     })
//     .catch(() =>
//       res.status(500).json({
//         message: "Our server is in the locker room, please do try again.",
//       })
//     );
// }

/* Test Function LoginUser */
async function loginUser(req, res) {
  const { username } = req.body;
  /* Test Login */
  try {
    // Removed StudentLogin Schema and used Login Schema
    // const existingUser = await StudentLogin.findOne({ HTNO: username });
    const existingUser = await Login.findOne({ HTNO: username });
    if (existingUser) {
      const token = generateToken(existingUser.id, existingUser.HTNO);
      // console.log(token);
      res.status(200).json({
        message: "User authorization successful",
        existingUser: {
          username: existingUser.HTNO,
          email: existingUser.STUDENT_EMAIL,
          _id: existingUser.id,
        },
        token,
      });
    }
  } catch (error) {
    res.status(404).json({ err: error });
  }
}

/* Previous Function LoginUser */
// async function loginUser(req,res){
// StudentLogin.findOne({ HTNO: username })
//   .then((existingUser) => {
//     bcrypt.compare(password, existingUser.PASSWORD, (err, result) => {
//       if (err) {
//         return res.status(402).json({
//           message: "Not authorized",
//         });
//       }
//       if (result) {
//         const token = Token(existingUser.id, existingUser.HTNO);
//         return res.status(200).json({
//           message: "User authorization successful",
//           existingUser: {
//             username: existingUser.HTNO,
//             email: existingUser.STUDENT_EMAIL,
//             _id: existingUser.id,
//           },
//           token,
//         });
//       }
//       return res.status(401).json({
//         message: "Invalid details",
//       });
//     });
//   })
//   .catch(() =>
//     res.status(500).json({
//       message: "Our server is in the locker room, please do try again.",
//     })
//   );

// }

/* MSAL Login Route */
const maslLoginUser = async (req, res) => {
  const { emailId } = req.body;
  // console.log(emailId);
  // Removed StudentLogin Schema and used Login Schema
  // const studentInfo = await StudentLogin.findOne({ STUDENT_EMAIL: emailId });
  const studentInfo = await Login.findOne({ STUDENT_EMAIL: emailId });
  try {
    const MuToken = generateToken(
      studentInfo.STUDENT_EMAIL,
      studentInfo._id,
      "Student"
    );
    const response = {
      HTNO: studentInfo.HTNO,
      MuAuthToken: MuToken,
      role: "Student",
      isAuthenticated: true,
    };

    if (studentInfo) {
      return res.status(200).json({ response });
    }
  } catch (error) {
    return res.status(500).json({ error });
  }
  return res.status(404).json({ error: "User Not Found" });
};

async function seeUser(req, res) {
  try {
    const user = await Login.find({ HTNO: req.decoded.username });

    if (!user) throw Error("User Does not exist");
    res.json({ user: user[0] });
  } catch (e) {
    res.status(400).json({ msg: e.message });
  }
}

async function seeUserByHTNO(req, res) {
  try {
    const user = await Login.find({ HTNO: req.params.id });
    const user1 = await Hostel.find({ HTNO: req.params.id });
    // console.log(user1);
    // if (!user || !user1) {
    //   throw Error("User Does not exist");
    // }

    //Throwing Error only if user doesnt exixts only in Login
    if (!user) {
      throw Error("User Does not exist");
    }
    const userObject = user.length > 0 ? user[0].toObject() : {};
    const user1Object = user1?.length > 0 ? user1[0]?.toObject() : {};

    const mergedUser = {
      ...userObject,
      BLOCK: user1Object?.BLOCK,
      ROOM: user1Object?.ROOM,
    };

    res.json({ user: mergedUser });
  } catch (e) {
    res.status(400).json({ msg: e.message });
  }
}

// async function seeUsers(req, res) {
//   console.log({ param: req.query });
//   const keyword = req.query.keyword;
//   const searchQuery = keyword
//     ? {
//         $or: [
//           { HTNO: { $regex: keyword, $options: "i" } },
//           { STUDENT_NAME: { $regex: keyword, $options: "i" } },
//         ],
//       }
//     : {};

//   try {
//     const usersWithHostelData = await Login.aggregate([
//       { $match: searchQuery },
//       {
//         $lookup: {
//           from: Hostel.collection.name,
//           localField: "HTNO",
//           foreignField: "HTNO",
//           as: "hostelData",
//         },
//       },
//       {
//         $addFields: {
//           BLOCK: { $ifNull: [{ $arrayElemAt: ["$hostelData.BLOCK", 0] }, ""] },
//           ROOM: { $ifNull: [{ $arrayElemAt: ["$hostelData.ROOM", 0] }, ""] },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           hostelData: 0,
//         },
//       },
//     ]);

//     // Fetching latest moving data for each student
//     for (const user of usersWithHostelData) {
//       const latestMoving = await security
//         .findOne({ HTNO: user.HTNO })
//         .sort({ DATE: -1 });

//       // If there is no moving data, assign default values based on A_TYPE
//       if (!latestMoving) {
//         user.MOVING = user.A_TYPE === "Hostler" ? "IN" : "OUT";
//         user.DATE = ""; // Assign empty string for DATE
//       } else {
//         user.MOVING = latestMoving.MOVING;
//         user.DATE = latestMoving.DATE;
//       }
//     }

//     res.json(usersWithHostelData);
//   } catch (error) {
//     console.error("Error fetching login data:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// }

// async function seeUsers(req, res){
//   const keyword = req.query.keyword;
//   const page = parseInt(req.query.currentPage) || 1;
//   const pageSize = parseInt(req.query.pageSize) || 10;
//   const skip = (page - 1) * pageSize;

//   const searchQuery = keyword
//     ? {
//         $or: [
//           { HTNO: { $regex: keyword, $options: "i" } },
//           { STUDENT_NAME: { $regex: keyword, $options: "i" } },
//         ],
//       }
//     : {};

//   try {
//     const totalCount = await Login.countDocuments(searchQuery);
//     const usersWithHostelData = await Login.aggregate([
//       { $match: searchQuery },
//       {
//         $lookup: {
//           from: Hostel.collection.name,
//           localField: "HTNO",
//           foreignField: "HTNO",
//           as: "hostelData",
//         },
//       },
//       {
//         $addFields: {
//           BLOCK: { $ifNull: [{ $arrayElemAt: ["$hostelData.BLOCK", 0] }, ""] },
//           ROOM: { $ifNull: [{ $arrayElemAt: ["$hostelData.ROOM", 0] }, ""] },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           hostelData: 0,
//         },
//       },
//     ]).skip(skip).limit(pageSize);

//     // Fetching latest moving data for each student
//     for (const user of usersWithHostelData) {
//       const latestMoving = await security
//         .findOne({ HTNO: user.HTNO })
//         .sort({ DATE: -1 });

//       // If there is no moving data, assign default values based on A_TYPE
//       if (!latestMoving) {
//         user.MOVING = user.A_TYPE === "Hostler" ? "IN" : "OUT";
//         user.DATE = ""; // Assign empty string for DATE
//       } else {
//         user.MOVING = latestMoving.MOVING;
//         user.DATE = latestMoving.DATE;
//       }
//     }

//     // res.json({
//     //   totalCount,
//     //   totalPages: Math.ceil(totalCount / pageSize),
//     //   currentPage: page,
//     //   usersWithHostelData,
//     // });
//     res.json({
//       totalPages: Math.ceil(totalCount / pageSize),
//       usersWithHostelData});
//   } catch (error) {
//     console.error("Error fetching login data:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// }

async function seeUsers(req, res) {
  const keyword = req.query.keyword;
  const page = parseInt(req.query.currentPage) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const skip = (page - 1) * pageSize;

  const filters = req.body.filters || {};

  // console.log({ filters });

  const { A_TYPE, BATCH, BLOCK, SUSPEND } = filters;

  const searchQuery = keyword
    ? {
        $or: [
          { HTNO: { $regex: keyword, $options: "i" } },
          { STUDENT_NAME: { $regex: keyword, $options: "i" } },
        ],
      }
    : {};

  if (BLOCK && BLOCK.length > 0) {
    const hostelHTNOs = await Hostel.find({ BLOCK: { $in: BLOCK } }).distinct(
      "HTNO"
    );
    // console.log(hostelHTNOs);
    // Add HTNO filter to searchQuery
    searchQuery.HTNO = { $in: hostelHTNOs };
  }

  if (SUSPEND && SUSPEND === "Yes") {
    const suspendHTNOs = await validateStudent
      .find({ SUSPEND: "Yes" })
      .distinct("HTNO");

    // Add HTNO filter to searchQuery
    searchQuery.HTNO = { $in: suspendHTNOs };
  }

  // Add A_TYPE filter if provided
  if (A_TYPE && A_TYPE.length > 0) {
    searchQuery.A_TYPE = { $in: A_TYPE };
  }

  // Add BATCH filter if provided
  if (BATCH && BATCH.length > 0) {
    searchQuery.BATCH = { $in: BATCH };
  }

  try {
    const totalCount = await Login.countDocuments(searchQuery);
    const usersWithHostelData = await Login.aggregate([
      { $match: searchQuery },
      {
        $lookup: {
          from: Hostel.collection.name,
          localField: "HTNO",
          foreignField: "HTNO",
          as: "hostelData",
        },
      },
      {
        $addFields: {
          BLOCK: { $ifNull: [{ $arrayElemAt: ["$hostelData.BLOCK", 0] }, ""] },
          ROOM: { $ifNull: [{ $arrayElemAt: ["$hostelData.ROOM", 0] }, ""] },
        },
      },
      {
        $project: {
          _id: 0,
          hostelData: 0,
        },
      },
    ])
      .skip(skip)
      .limit(pageSize);

    // Fetching latest moving data for each student
    for (const user of usersWithHostelData) {
      const latestMoving = await security
        .findOne({ HTNO: user.HTNO })
        .sort({ DATE: -1 });

      // If there is no moving data, assign default values based on A_TYPE
      if (!latestMoving) {
        user.MOVING = user.A_TYPE === "Hostler" ? "IN" : "OUT";
        user.DATE = ""; // Assign empty string for DATE
      } else {
        user.MOVING = latestMoving.MOVING;
        user.DATE = latestMoving.DATE;
      }
    }

    res.json({
      totalPages: Math.ceil(totalCount / pageSize),
      usersWithHostelData,
    });
  } catch (error) {
    console.error("Error fetching login data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function seeUserById(req, res) {
  const userId = req.params.id;
  try {
    const user = await Login.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// async function updateUser(req, res) {
//   // const userId = req.params.id;

//   const userId = req.body._id;
//   const updatedDetails = req.body;

//   try {
//     const updatedUser = await Login.findByIdAndUpdate(userId, updatedDetails, {
//       new: true,
//     });

//     if (!updatedUser) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     res.json(updatedUser);
//   } catch (error) {
//     console.error("Error updating user details:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// }

// async function updateUser(req, res) {
//   console.log("loki",req.body)
//   const userId = req.body._id;
//   const updatedDetails = req.body;
//   if (!updatedDetails.newHTNO) {
//     updatedDetails.newHTNO = updatedDetails.HTNO;
//   }
//   const { oldHTNO, newHTNO, BLOCK, ROOM } = updatedDetails;

//   try {
//     let loginUpdateQuery = {};
//     let hostelUpdateQuery = {};

//     // Check if oldHTNO and newHTNO are the same
//     if (oldHTNO === newHTNO) {
//       // Update both Login and Hostel using HTNO directly
//       loginUpdateQuery = { HTNO: newHTNO };
//       hostelUpdateQuery = { HTNO: newHTNO };

//     } else {
//       // First update HTNO from oldHTNO to newHTNO
//       const loginUpdateResult = await Login.findOneAndUpdate(
//         { HTNO: oldHTNO },
//         { HTNO: newHTNO },
//         { new: true }
//       );

//       const hostelUpdateResult = await Hostel.findOneAndUpdate(
//         { HTNO: oldHTNO },
//         { HTNO: newHTNO },
//         { new: true }
//       );

//       await Outpass.updateMany({ HTNO: oldHTNO }, { $set: { HTNO: newHTNO } });
//       await rfidMapping.updateMany(
//         { HTNO: oldHTNO },
//         { $set: { HTNO: newHTNO } }
//       );
//       await security.updateMany({ HTNO: oldHTNO }, { $set: { HTNO: newHTNO } });
//       await Vaccination.updateMany(
//         { HTNO: oldHTNO },
//         { $set: { HTNO: newHTNO } }
//       );
//       await validateStudent.updateMany(
//         { HTNO: oldHTNO },
//         { $set: { HTNO: newHTNO } }
//       );
//       await visitors.updateMany({ HTNO: oldHTNO }, { $set: { HTNO: newHTNO } });
//       await StudentLogin.updateMany(
//         { HTNO: oldHTNO },
//         { $set: { HTNO: newHTNO } }
//       );

//       // Check if the records were not found for oldHTNO
//       if (!loginUpdateResult || !hostelUpdateResult) {
//         return res.status(404).json({ error: "User not found" });
//       }

//       // Update Login and Hostel with newHTNO
//       loginUpdateQuery = { HTNO: newHTNO };
//       hostelUpdateQuery = { HTNO: newHTNO };
//     }

//     // Update Login collection
//     const updatedLogin = await Login.findOneAndUpdate(
//       loginUpdateQuery,
//       updatedDetails,
//       { new: true }
//     );

//     // Update Hostel collection
//     const updatedHostel = await Hostel.findOneAndUpdate(
//       hostelUpdateQuery,
//       { BLOCK, ROOM },
//       { new: true }
//     );

//     // Check if the records were not found for newHTNO
//     if (!updatedLogin || !updatedHostel) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     res.json({ updatedLogin, updatedHostel });
//   } catch (error) {
//     console.error("Error updating user details:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// }

async function updateUser(req, res) {
  const userId = req.body._id;
  const updatedDetails = req.body;
  if (!updatedDetails.newHTNO) {
    updatedDetails.newHTNO = updatedDetails.HTNO;
  }
  const { oldHTNO, newHTNO, BLOCK, ROOM, A_TYPE } = updatedDetails;

  let updatedHostel;

  try {
    let loginUpdateQuery = {};
    let hostelUpdateQuery = {};

    // Check if oldHTNO and newHTNO are the same
    if (oldHTNO === newHTNO) {
      loginUpdateQuery = { HTNO: newHTNO };
      hostelUpdateQuery = { HTNO: newHTNO };
    } else {
      const loginUpdateResult = await Login.findOneAndUpdate(
        { HTNO: oldHTNO },
        { HTNO: newHTNO },
        { new: true }
      );

      const hostelUpdateResult = await Hostel.findOneAndUpdate(
        { HTNO: oldHTNO },
        { HTNO: newHTNO },
        { new: true }
      );

      await Outpass.updateMany({ HTNO: oldHTNO }, { $set: { HTNO: newHTNO } });
      await rfidMapping.updateMany(
        { HTNO: oldHTNO },
        { $set: { HTNO: newHTNO } }
      );
      await security.updateMany({ HTNO: oldHTNO }, { $set: { HTNO: newHTNO } });
      await Vaccination.updateMany(
        { HTNO: oldHTNO },
        { $set: { HTNO: newHTNO } }
      );
      await validateStudent.updateMany(
        { HTNO: oldHTNO },
        { $set: { HTNO: newHTNO } }
      );
      await visitors.updateMany({ HTNO: oldHTNO }, { $set: { HTNO: newHTNO } });
      // Removed StudentLogin Schema and used Login Schema
      // await StudentLogin.updateMany(
      //   { HTNO: oldHTNO },
      //   { $set: { HTNO: newHTNO } }
      // );
      await Login.updateMany(
        { HTNO: oldHTNO },
        { $set: { HTNO: newHTNO } }
      );

      if (!loginUpdateResult || !hostelUpdateResult) {
        return res.status(404).json({ error: "User not found" });
      }

      loginUpdateQuery = { HTNO: newHTNO };
      hostelUpdateQuery = { HTNO: newHTNO };
    }

    // Check if there is a change in A_TYPE
    const loginRecord = await Login.findOne({ HTNO: newHTNO });
    if (loginRecord) {
      if (A_TYPE === "DayScholar" && loginRecord.A_TYPE === "Hostler") {
        // Changing from 'Hostler' to 'DayScholar'
        // Update Login details
        await Hostel.deleteOne({ HTNO: newHTNO }); // Delete user from Hostel
        updatedHostel = null;
      } else if (A_TYPE === "Hostler" && loginRecord.A_TYPE === "DayScholar") {
        // Changing from 'DayScholar' to 'Hostler'
        // Update Login details
        const existingHostelRecord = await Hostel.findOne({ HTNO: newHTNO });
        if (existingHostelRecord) {
          // Update the existing record
          updatedHostel = await Hostel.findOneAndUpdate(
            { HTNO: newHTNO },
            { BLOCK, ROOM },
            { new: true }
          );
        } else {
          // Add a new record to the Hostel collection
          updatedHostel = await Hostel.create({ HTNO: newHTNO, BLOCK, ROOM });
        }
      } else if (A_TYPE === "Hostler" && loginRecord.A_TYPE === "Hostler") {
        // No change in A_TYPE, update Login and Hostel as usual
        updatedHostel = await Hostel.findOneAndUpdate(
          hostelUpdateQuery,
          { BLOCK, ROOM },
          { new: true }
        );

        // Check if the records were not found for newHTNO
        if (!updatedHostel) {
          return res.status(404).json({ error: "Hostel record not found" });
        }
      }
    }

    const updatedLogin = await Login.findOneAndUpdate(
      loginUpdateQuery,
      updatedDetails,
      { new: true }
    );

    if (!updatedLogin) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ updatedLogin, updatedHostel });
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function suspendList(req, res) {
  try {
    const suspendedStudents = await validateStudent
      .find({ SUSPEND: "Yes" })
      .populate("login");
    const response = suspendedStudents.map((studentInfo) => ({
      STUDENT_NAME: studentInfo?.login?.STUDENT_NAME,
      HTNO: studentInfo.HTNO,
      SUSPENDED_TILL:
        studentInfo.SUSPENDEDDATE &&
        format(studentInfo.SUSPENDEDDATE, "yyyy-MM-dd"),
      SUSPENSION_TYPE: studentInfo.SUSPENSIONTYPE,
    }));
    res.json(response);
  } catch (error) {
    console.error("Error fetching suspended students:", error);
    // res.status(500).json({ error: 'Internal Error' });
  }
}

// const UserSuspend = async (req, res) => {
//   try {
//     const HTNO = req.body.selectedRow.HTNO;
//     const loginInfo = await Login.findOne({ HTNO });
//     const refId = loginInfo._id;
//     const suspensionDate = new Date(req.body.suspendedDate);
//     const updatedUser = await validateStudent
//       .findOneAndUpdate(
//         { HTNO },
//         { SUSPEND: "Yes", SUSPENDEDDATE: suspensionDate, login: refId },
//         { new: true, upsert: true, runValidators: true }
//       )
//       .populate("login");
//     res.json(updatedUser);
//   } catch (error) {
//     console.error("Error adding/updating user details:", error);
//     if (error.name === "ValidationError") {
//       return res
//         .status(400)
//         .json({ error: "Validation Error", details: error.errors });
//     }
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

const UserSuspend = async (req, res) => {
  try {
    const HTNO = req.body.selectedRow.HTNO;
    const suspensionDate = req.body.suspendedDate;
    const suspensionType = req.body.suspensionType;

    console.log(suspensionType);
    const timezone = "Asia/Kolkata";
    const toDate = moment(
      suspensionDate,
      "ddd MMM DD YYYY HH:mm:ss [GMT]ZZ (z)"
    );

    // Convert TO date to the specified timezone
    const todate = toDate.tz(timezone).endOf("day");
    // console.log(suspensionDate,"loki");
    // console.log(new Date(suspensionDate) ,"loki1");
    // console.log(todate ,"loki2");
    // Check if the student is already suspended
    const existingStudent = await validateStudent.findOne({ HTNO });
    // console.log({ existingStudent });
    if (existingStudent) {
      // If the student is already in validateStudent, update the existing entry
      if (existingStudent.SUSPEND === "Yes") {
        if (!suspensionDate) {
          // If suspensionDate is not provided, set SUSPEND to "No" and clear SUSPENDEDDATE
          const updatedStudent = await validateStudent
            .findOneAndUpdate(
              { HTNO },
              {
                $set: {
                  SUSPEND: "No",
                  SUSPENDEDDATE: null,
                  SUSPENSIONTYPE: "",
                },
              },
              { new: true }
            )
            .populate("login");

          return res.status(200).json(updatedStudent);
        } else {
          // If suspensionDate is provided, update SUSPENDEDDATE
          const updatedStudent = await validateStudent
            .findOneAndUpdate(
              { HTNO },
              {
                $set: { SUSPENDEDDATE: todate, SUSPENSIONTYPE: suspensionType },
              },
              { new: true }
            )
            .populate("login");

          return res.json(updatedStudent);
        }
      } else {
        // If the student is not suspended, update the existing entry
        const loginInfo = await Login.findOne({ HTNO });
        const refId = loginInfo._id;

        const newSuspendedStudent = await validateStudent.findOneAndUpdate({
          HTNO,
          SUSPEND: "Yes",
          SUSPENDEDDATE: todate,
          SUSPENSIONTYPE: suspensionType,
          login: refId,
        });

        return res.json(newSuspendedStudent);
      }
    } else {
      // If the student is not in validateStudent, add a new entry
      const loginInfo = await Login.findOne({ HTNO });
      const refId = loginInfo._id;

      const newSuspendedStudent = await validateStudent.create({
        HTNO,
        SUSPEND: "Yes",
        SUSPENDEDDATE: todate,
        SUSPENSIONTYPE: suspensionType,
        login: refId,
      });

      return res.json(newSuspendedStudent);
    }
  } catch (error) {
    console.error("Error adding/updating user details:", error);
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ error: "Validation Error", details: error.errors });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// This Function Gets automatically triggered based on setInterval
// const cronJob = async () => {
//   try {
//     const expiredUsers = await validateStudent.find({
//       SUSPENDEDDATE: { $lt: new Date() },
//       SUSPEND: "Yes",
//     });

//     console.log(`Found ${expiredUsers.length} expired users.`);

//     await Promise.all(
//       expiredUsers.map(async (user) => {
//         const result = await validateStudent.findOneAndDelete({
//           _id: user._id,
//         });
//         console.log(`Deleted user: ${result}`);
//       })
//     );

//     console.log("Cron job completed.");
//   } catch (error) {
//     console.error("Error in cron job:", error);
//   }
// };

// const cronJobInterval = 24 * 60 * 60 * 1000; // runs once every day and deletes user with expired suspensionDate
// setInterval(cronJob, cronJobInterval);

// async function UserSuspend(req, res) {
//   const { HTNO, SUSPEND } = req.body;
//   try {
//     const updatedStudent = await validateStudent.findOneAndUpdate(
//       { HTNO },
//       { SUSPEND },
//       { new: true, upsert: true, runValidators: true }
//     );

//     res.json(updatedStudent);
//   } catch (error) {
//     console.error("Error adding/updating student details:", error);

//     if (error.name === "ValidationError") {
//       return res
//         .status(400)
//         .json({ error: "Validation Error", details: error.errors });
//     }

//     res.status(500).json({ error: "Internal Server Error" });
//   }
// }

export {
  loginUser,
  seeUser,
  seeUserByHTNO,
  seeUsers,
  updateUser,
  seeUserById,
  suspendList,
  UserSuspend,
  maslLoginUser,
};
