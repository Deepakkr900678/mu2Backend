// const mongoose = require("mongoose");
// const security = require("../../models/security");

import Login from "../../models/login.js";
import validateStudent from "../../models/validate_student.js";
import security from "../../models/security.js";
import Outpass from "../../models/OutPass.js";
import axios from "axios";
import sharp from "sharp";
// import Jimp from "jimp";
import * as Jimp from "jimp";
import { addSecurity } from "./addSecurity.js";
import moment from "moment-timezone";

// const addSecurity = (sec) => {
//   security.create(sec, (err, done) => {
//     if (err) {
//       console.error('Error adding security entry:', err);
//     } else {
//       console.log('Security entry added:', done);
//     }
//   });
// };

// function InOut(req, res) {

//   Login.findOne({ HTNO: htno })
//     .then((result) => {
//       console.log("result is", result);

//       var st = result.HTNO;
//       console.log("st", st);
//       validateStudent
//         .findOne({ HTNO: st })
//         .then((r) => {
//           const sec = {
//             HTNO: st,
//             STUDENT_NAME: result.STUDENT_NAME,
//             BRANCH: result.BRANCH,
//             MOVING: "IN",
//             REMARKS: "hello",
//             DATE: Date.now(),
//             BATCH: result.BATCH,
//             SCHOOL: "SOM",
//             SUSPEND: r.SUSPEND,
//             A_TYPE: result.A_TYPE,
//             PHOTO: r.IMAGE,
//           };
//           addSecurity(sec);
//           if (r != null) {
//             if (r.SUSPEND === "Yes") {
//               console.log("suspend yes");
//               return res.json({
//                 id: st,
//                 name: result.STUDENT_NAME,
//                 suspend: "Yes",
//               });
//             } else {
//               // Green
//               return res.json({
//                 id: st,
//                 name: result.STUDENT_NAME,
//                 suspend: "No",
//               });
//             }
//           } else {
//             return res.json({
//               msg: "Not found in validateStudent collection ",
//             });
//           }
//         })
//         .catch((err) => console.log(err));
//     })
//     .catch((err) => {
//       return res.json({
//         err: err,
//       });
//     });
// }

// function InOut(req, res) {
//   const htno = req.htno;
//   const device = req.params.device;

//   Login.findOne({ HTNO: htno })
//     .then((result) => {
//       if (!result) {
//         return res.json({
//           msg: "Student not found in Login collection",
//         });
//       }

//       validateStudent.findOne({ HTNO: htno })
//         .then((r) => {
//           const suspendStatus = r ? r.SUSPEND : "No";

//           const sec = {
//             HTNO: htno,
//             STUDENT_NAME: result.STUDENT_NAME,
//             BRANCH: result.BRANCH,
//             MOVING: device === '1' ? 'IN' : 'OUT',
//             REMARKS: "hello",
//             DATE: Date.now(),
//             BATCH: result.BATCH,
//             SCHOOL: result.SCHOOL,
//             SUSPEND: suspendStatus,
//             A_TYPE: result.A_TYPE,
//             PHOTO: r ? r.IMAGE : "",
//           };

//           // Check the recent movement from security collection
//           security.findOne({ HTNO: htno })
//             .sort({ DATE: -1 })
//             .then((recentMovement) => {
//               if (recentMovement) {
//                 // If the recent movement is the same as the current action, make a new OUT entry first
//                 if (recentMovement.MOVING === sec.MOVING) {
//                   const oppositeSec = {
//                     ...sec,
//                     MOVING: recentMovement.MOVING === 'IN' ? 'OUT' : 'IN',
//                   };
//                   addSecurity(oppositeSec);
//                 }
//               }

//               // Make a new entry (IN or OUT)
//               addSecurity(sec);

//               // Send the response at the end
//               return res.json({
//                 id: htno,
//                 name: result.STUDENT_NAME,
//                 suspend: suspendStatus,
//                 A_TYPE: result.A_TYPE,
//                 SCHOOL: result.SCHOOL,
//                 LEAVE_APPROVED: "", // Add logic to get leave approval status for day scholars
//               });
//             })
//             .catch((err) => {
//               console.log(err);
//               return res.json({
//                 msg: "Error in finding recent movement in security collection",
//               });
//             });
//         })
//         .catch((err) => {
//           console.log(err);
//           return res.json({
//             msg: "Error in finding student in validateStudent collection",
//           });
//         });
//     })
//     .catch((err) => {
//       console.log(err);
//       return res.json({
//         msg: "Error in finding student in Login collection",
//       });
//     });
// }

const InOut = async (req, res) => {
  try {
    const { device } = req.params;

    // Check if the device is for IN or OUT
    const isIn = device === "1" || device === "3"; // for student to come in
    const isOut = device === "2" || device === "4"; // for student to go out

    const timezone = 'Asia/Kolkata';
    const currentDate = moment().tz(timezone);
    const formattedDate = moment().tz(timezone).add(1, 'second');
    // const formattedDate = currentDate_1.toISOString();
    // console.log(currentDate,currentDate_1,formattedDate,"loki")
    if (!isIn && !isOut) {
      // Handle the case when the device is not 1, 2, 3, or 4
      return res.status(400).json({
        error: "Invalid device. Please provide a valid device number.",
      });
    }

    // Fetch student details from Login collection using HTNO
    const student = await Login.findOne({ HTNO: req.htno });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Fetch validateStudent details
    const validateStudentDetails = await validateStudent.findOne({
      HTNO: req.htno,
    });

    // Check if the student is suspended
    const isSuspended = validateStudentDetails
      ? validateStudentDetails.SUSPEND === "Yes"
      : false;

    // Fetch the latest security entry for the student
    const latestSecurityEntry = await security
      .findOne({ HTNO: req.htno })
      .sort({ DATE: -1 });
      
    // Check if the latest entry exists and has the same MOVING operation
    const isLatestSameOperation =
      latestSecurityEntry &&
      latestSecurityEntry.MOVING === (isIn ? "IN" : "OUT");

    // If the latest entry has the same operation, add the opposite operation first
    if (isLatestSameOperation && !(student.A_TYPE === "Hostler" && latestSecurityEntry.MOVING === "OUT")) {
      const oppositeOperation = isIn ? "OUT" : "IN";

      const oppositeSecurityEntry = new security({
        HTNO: req.htno,
        STUDENT_NAME: student.STUDENT_NAME,
        BRANCH: student.BRANCH,
        MOVING: oppositeOperation,
        REMARKS: "Some remarks", // You can customize this
        DATE: currentDate,
        BATCH: student.BATCH,
        SCHOOL: student.SCHOOL,
        SUSPEND: isSuspended ? "Yes" : "No",
        A_TYPE: student.A_TYPE,
      });
      console.log(oppositeSecurityEntry,"loki2")
      await oppositeSecurityEntry.save();
    }

    // For Hostlers going OUT, check Outpass collection for approval and usage status
    if (!isIn && student.A_TYPE === "Hostler") {
      const latestOutpass = await Outpass.findOne({ HTNO: req.htno }).sort({
        ASN_DATE: -1,
      });

      if (latestOutpass) {
        const isApproved = latestOutpass.APPROVED === "True";
        const isUsed = latestOutpass.USED === "False";

        // If approved and not used, and the current date is within the leave period
        if (isApproved && isUsed) {
          const leaveStartDate = new Date(latestOutpass.FROM);
          const leaveEndDate = new Date(latestOutpass.TO);
          // const currentDate = new Date();
          console.log("test")
          if (currentDate >= leaveStartDate && currentDate <= leaveEndDate) {
            if (isLatestSameOperation) {
              const oppositeOperation = isIn ? "OUT" : "IN";
              
              const oppositeSecurityEntry = new security({
                HTNO: req.htno,
                STUDENT_NAME: student.STUDENT_NAME,
                BRANCH: student.BRANCH,
                MOVING: oppositeOperation,
                REMARKS: "Some remarks", // You can customize this
                DATE: currentDate,
                BATCH: student.BATCH,
                SCHOOL: student.SCHOOL,
                SUSPEND: isSuspended ? "Yes" : "No",
                A_TYPE: student.A_TYPE,
              });
        
              await oppositeSecurityEntry.save();
            }
            const securityEntry = new security({
              HTNO: req.htno,
              STUDENT_NAME: student.STUDENT_NAME,
              BRANCH: student.BRANCH,
              MOVING: "OUT",
              REMARKS: "Some remarks", // You can customize this
              DATE: formattedDate,
              BATCH: student.BATCH,
              SCHOOL: student.SCHOOL,
              SUSPEND: isSuspended ? "Yes" : "No",
              A_TYPE: student.A_TYPE,
            });

            await securityEntry.save();

            // Update Outpass collection to mark the leave as used
            await Outpass.updateOne(
              { _id: latestOutpass._id },
              { USED: "True" }
            );

            // Prepare response JSON with LEAVE_APPROVED set to 'Yes'
            const responseJson = {
              HTNO: req.htno,
              NAME: student.STUDENT_NAME,
              // SCHOOL: student.SCHOOL,
              SCHOOL: student.SCHOOL,
              SUSPEND: isSuspended ? "Yes" : "No",
              A_TYPE: student.A_TYPE,
              LEAVE_APPROVED: "Yes",
            };

            // Send the response
            return res.json(responseJson);
          }
        }
      }

      // If leave is not approved or used, or data not in Outpass collection, or date not within the leave period, don't grant leave
      const responseJson = {
        HTNO: req.htno,
        NAME: student.STUDENT_NAME,
        // SCHOOL: student.SCHOOL,
        SCHOOL: student.SCHOOL,
        SUSPEND: isSuspended ? "Yes" : "No",
        A_TYPE: student.A_TYPE,
        LEAVE_APPROVED: "No",
      };

      // Send the response
      return res.json(responseJson);
    }

    // If not a Hosteler going OUT or not approved/used, or data not in Outpass collection
    // Proceed with the original IN/OUT logic

    // Create a security entry for the requested operation
    const securityEntry = new security({
      HTNO: req.htno,
      STUDENT_NAME: student.STUDENT_NAME,
      BRANCH: student.BRANCH,
      MOVING: isIn ? "IN" : "OUT",
      REMARKS: "Some remarks", // You can customize this
      DATE: formattedDate,
      BATCH: student.BATCH,
      SCHOOL: student.SCHOOL,
      SUSPEND: isSuspended ? "Yes" : "No",
      A_TYPE: student.A_TYPE,
    });
    await securityEntry.save();

    // Prepare response JSON
    const responseJson = {
      HTNO: req.htno,
      NAME: student.STUDENT_NAME,
      // SCHOOL: student.SCHOOL,
      SCHOOL: student.SCHOOL,
      SUSPEND: isSuspended ? "Yes" : "No",
      A_TYPE: student.A_TYPE,
      LEAVE_APPROVED: isIn
        ? ""
        : student.A_TYPE === "DayScholar"
        ? ""
        : "Leave not applicable for Hostel",
    };

    // Send the response
    res.json(responseJson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const Image = async (req, res) => {
  try {
    const HTNO = req.htno;
    // console.log("ll", req.htno);
    const loginEntry = await Login.findOne({ HTNO });
    if (!loginEntry) {
      return res.status(404).json({ error: "HTNO not found" });
    }

    const imageUrl = loginEntry.IMAGE;

    const result = await processImageForHTNO(imageUrl);

    if (result.error) {
      return res.status(500).json({ error: result.error });
    } else {
      return res.json({
        IMG: result.hexArray,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

async function processImageForHTNO(imageUrl) {
  try {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });

    if (response.status !== 200) {
      throw new Error(
        `Failed to retrieve the image. Status code: ${response.status}`
      );
    }

    // const inputBuffer = Buffer.from(response.data);
    const image = await Jimp.read(response.data);

    // const resizedBuffer = await sharp(inputBuffer)
    //   .resize({ width: 240, height: 320 })
    //   .toFormat('png')
    //   .toBuffer();

    image.resize(240, 320).quality(30).deflateLevel(9);

    const processedBuffer = await image.getBufferAsync(Jimp.MIME_PNG);

    const hexArray1 = processedBuffer
      .toString("hex")
      .match(/.{1,2}/g)
      .map((byte) => "0x" + byte);

    const newArray = hexArray1.map((str) => str.replace(/"/g, ""));

    const hexArray = `[${newArray.join(", ")}]`;

    return { hexArray };

    // const compressedBuffer = await sharp(resizedBuffer)
    //   .png({
    //     quality: 5,
    //     compressionLevel: 9,
    //     adaptiveFiltering: true,
    //   })
    //   .toBuffer();

    // const hexArray = compressedBuffer.toString('hex').match(/.{1,2}/g).map(byte => '0x' + byte);

    return { hexArray };
  } catch (error) {
    if (error.response && error.response.status === 403) {
      throw new Error(
        "Access to the image is forbidden. Please check your permissions."
      );
    } else {
      console.error("Error processing the image:", error);
      throw new Error("Failed to retrieve or process the image");
    }
  }
}

const secInOut = async (req, res) => {
  console.log(req.params);
  try {
    const { device, htno } = req.params;

    // Check if the device is for IN or OUT
    const isIn = device === "1" || device === "3"; // for student to come in
    const isOut = device === "2" || device === "4"; // for student to go out

    const timezone = 'Asia/Kolkata';
    const currentDate = moment().tz(timezone);
    const currentDate_1 = moment().tz(timezone).add(1, 'second');
    const formattedDate = currentDate_1.toISOString();

    if (!isIn && !isOut) {
      // Handle the case when the device is not 1, 2, 3, or 4
      return res.status(400).json({
        error: "Invalid device. Please provide a valid device number.",
      });
    }

    // Fetch student details from Login collection using HTNO
    const student = await Login.findOne({ HTNO: htno });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Fetch validateStudent details
    const validateStudentDetails = await validateStudent.findOne({
      HTNO: htno,
    });

    // Check if the student is suspended
    const isSuspended = validateStudentDetails
      ? validateStudentDetails.SUSPEND === "Yes"
      : false;

    // Fetch the latest security entry for the student
    const latestSecurityEntry = await security
      .findOne({ HTNO: htno })
      .sort({ DATE: -1 });

    // Check if the latest entry exists and has the same MOVING operation
    const isLatestSameOperation =
      latestSecurityEntry &&
      latestSecurityEntry.MOVING === (isIn ? "IN" : "OUT");

    // If the latest entry has the same operation, add the opposite operation first
    if (isLatestSameOperation && student.A_TYPE === "DayScholar") {
      const oppositeOperation = isIn ? "OUT" : "IN";

      const oppositeSecurityEntry = new security({
        HTNO: htno,
        STUDENT_NAME: student.STUDENT_NAME,
        BRANCH: student.BRANCH,
        MOVING: oppositeOperation,
        REMARKS: "Some remarks", // You can customize this
        DATE: currentDate,
        BATCH: student.BATCH,
        SCHOOL: student.SCHOOL,
        SUSPEND: isSuspended ? "Yes" : "No",
        A_TYPE: student.A_TYPE,
      });

      await oppositeSecurityEntry.save();
    }

    // For Hostlers going OUT, check Outpass collection for approval and usage status
    if (!isIn && student.A_TYPE === "Hostler") {
      const latestOutpass = await Outpass.findOne({ HTNO: htno }).sort({
        ASN_DATE: -1,
      });

      console.log(latestOutpass);

      if (latestOutpass) {
        const isApproved = latestOutpass.APPROVED === "True";
        const isUsed = latestOutpass.USED === "False";

        // If approved and not used, and the current date is within the leave period
        if (isApproved && isUsed) {
          console.log("triggereds");
          const leaveStartDate = new Date(latestOutpass.FROM);
          const leaveEndDate = new Date(latestOutpass.TO);
          // const currentDate = new Date();

          if (currentDate >= leaveStartDate && currentDate <= leaveEndDate) {
            if (isLatestSameOperation) {
              const oppositeOperation = isIn ? "OUT" : "IN";
              
              const oppositeSecurityEntry = new security({
                HTNO: req.htno,
                STUDENT_NAME: student.STUDENT_NAME,
                BRANCH: student.BRANCH,
                MOVING: oppositeOperation,
                REMARKS: "Some remarks", // You can customize this
                DATE: currentDate,
                BATCH: student.BATCH,
                SCHOOL: student.SCHOOL,
                SUSPEND: isSuspended ? "Yes" : "No",
                A_TYPE: student.A_TYPE,
              });
        
              await oppositeSecurityEntry.save();
            }
            const securityEntry = new security({
              HTNO: htno,
              STUDENT_NAME: student.STUDENT_NAME,
              BRANCH: student.BRANCH,
              MOVING: "OUT",
              REMARKS: "Some remarks", // You can customize this
              DATE: formattedDate,
              BATCH: student.BATCH,
              SCHOOL: student.SCHOOL,
              SUSPEND: isSuspended ? "Yes" : "No",
              A_TYPE: student.A_TYPE,
            });

            await securityEntry.save();

            // Update Outpass collection to mark the leave as used
            await Outpass.updateOne(
              { _id: latestOutpass._id },
              { USED: "True" }
            );

            // Prepare response JSON with LEAVE_APPROVED set to 'Yes'
            const responseJson = {
              HTNO: htno,
              NAME: student.STUDENT_NAME,
              // SCHOOL: student.SCHOOL,
              SCHOOL: student.SCHOOL,
              SUSPEND: isSuspended ? "Yes" : "No",
              A_TYPE: student.A_TYPE,
              LEAVE_APPROVED: "Yes",
            };

            // Send the response
            return res.json(responseJson);
          }
        }
      }

      // If leave is not approved or used, or data not in Outpass collection, or date not within the leave period, don't grant leave
      const responseJson = {
        HTNO: htno,
        NAME: student.STUDENT_NAME,
        // SCHOOL: student.SCHOOL,
        SCHOOL: student.SCHOOL,
        SUSPEND: isSuspended ? "Yes" : "No",
        A_TYPE: student.A_TYPE,
        LEAVE_APPROVED: "No",
      };

      // Send the response
      return res.json(responseJson);
    }

    // If not a Hosteler going OUT or not approved/used, or data not in Outpass collection
    // Proceed with the original IN/OUT logic

    // Create a security entry for the requested operation
    const securityEntry = new security({
      HTNO: htno,
      STUDENT_NAME: student.STUDENT_NAME,
      BRANCH: student.BRANCH,
      MOVING: isIn ? "IN" : "OUT",
      REMARKS: "Some remarks", // You can customize this
      DATE: formattedDate,
      BATCH: student.BATCH,
      SCHOOL: student.SCHOOL,
      SUSPEND: isSuspended ? "Yes" : "No",
      A_TYPE: student.A_TYPE,
    });

    // Save the security entry
    await securityEntry.save();

    // Prepare response JSON
    const responseJson = {
      HTNO: htno,
      NAME: student.STUDENT_NAME,
      // SCHOOL: student.SCHOOL,
      SCHOOL: student.SCHOOL,
      SUSPEND: isSuspended ? "Yes" : "No",
      A_TYPE: student.A_TYPE,
      LEAVE_APPROVED: isIn
        ? ""
        : student.A_TYPE === "DayScholar"
        ? ""
        : "Leave not applicable for Hostel",
    };

    // Send the response
    res.json(responseJson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export { InOut, Image, secInOut };
