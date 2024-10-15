import express from "express";

import {
  loginUser,
  seeUser,
  seeUserByHTNO,
  seeUsers,
  updateUser,
  seeUserById,
  suspendList,
  UserSuspend,
  maslLoginUser,
} from "../controllers/Login.js";
import { createOutpass, myLeaves } from "../controllers/student.js";
import {
  seeAppliedLeaves,
  seePastLeaves,
  updateLeave,
  vaccinationStatus,
  statusMail,
  seeAppliedLeavesDateBased,
  seePastLeavesDateBased,
  getDistinctBlocks,
} from "../controllers/warden.js";
import {
  seeApprovedLeaves,
  updateApprovedLeave,
  seeApprovedLeavesDateBased,
  seeLatestPastLeave,
} from "../controllers/security.js";
import { adminloginUser } from "../controllers/adminLogin.js";
import verifyToken from "../middlewares/verifyToken.js";
import { postVisitors } from "../controllers/Visitors.js";
import rfidDecoder from "../middlewares/rfid_decoder.js";
import { InOut, Image, secInOut } from "../controllers/rfid/inout.js";
import {
  getSecurity,
  getSecurityDateBased,
  getSecurityDayWiseData,
  undersuspension,
  AvgLeaveDuration,
  CurrentApplieedLeaves,
  BlockWiseLeave,
  SchoolWiseData,
  ATypeWiseData,
} from "../controllers/rfid/addSecurity.js";
import getId from "../controllers/rfid/rfid.js";
import getDeviceId from "../controllers/rfid/DeviceId.js";
import { adminOrWardenLogin } from "../controllers/adminOrWarden.js";
import {
  AdminRoute,
  Student,
  AdminOrWarden,
  AdminOrSecurity,
  WardenOrSecurity,
  AdminOrWardenOrSecurity,
  AdminOrWardenOrSecurityorStudent,
} from "../middlewares/PrivateRoutes.js";

const router = express.Router();

// Student
// router.post("/login", loginUser);
router.post("/login", maslLoginUser);
router.post("/createpass", verifyToken, Student, createOutpass);
router.get("/profile", verifyToken, Student, seeUser);
router.get("/student/myLeaves", myLeaves);
router.get(
  "/profile/:id",
  verifyToken,
  AdminOrWardenOrSecurityorStudent,
  seeUserByHTNO
);
router.post("/allProfiles", verifyToken, AdminOrWarden, seeUsers);
router.put("/updateProfile", verifyToken, AdminRoute, updateUser);
router.get("/profilebyID/:id", verifyToken, Student, AdminRoute, seeUserById);
router.get("/suspendedlist", verifyToken, AdminRoute, suspendList);
router.post("/updatesuspension", verifyToken, AdminRoute, UserSuspend);

// Warden
// router.post("/admin-login", adminloginUser);
router.get("/hostelBlocksList", getDistinctBlocks);
router.get("/appliedleaves", verifyToken, AdminOrWarden, seeAppliedLeaves);
router.get("/pastleaves", verifyToken, AdminOrWarden, seePastLeaves);
router.get(
  "/pastleavesLatest",
  verifyToken,
  AdminOrWardenOrSecurity,
  seeLatestPastLeave
);
router.put("/updateleave", verifyToken, AdminOrWarden, updateLeave);
router.get("/vaccination/:id", verifyToken, AdminOrWarden, vaccinationStatus);
router.post("/mail", verifyToken, AdminOrWarden, statusMail);
router.post(
  "/appliedleavesdate",
  verifyToken,
  AdminOrWarden,
  seeAppliedLeavesDateBased
); // based on date
router.post(
  "/pastleavesdate",
  verifyToken,
  AdminOrWarden,
  seePastLeavesDateBased
); // based on date

// Admin or Warden Login
router.post("/admin-login", adminOrWardenLogin);

// Visitors
router.post("/visitor", verifyToken, AdminOrSecurity, postVisitors);

// Security
router.get(
  "/approvedleaves",
  verifyToken,
  AdminOrWardenOrSecurity,
  seeApprovedLeaves
);
router.put(
  "/updateapprovedleave",
  verifyToken,
  AdminOrWardenOrSecurity,
  updateApprovedLeave
);
router.post(
  "/approvedleavesdate",
  verifyToken,
  AdminOrWardenOrSecurity,
  seeApprovedLeavesDateBased
); // based on date

// RFiD tag
router.get("/gateinout/:device/:tagid", rfidDecoder, InOut);
router.post("/gateinout/:device/:htno", secInOut);
router.get("/image/:tagid", rfidDecoder, Image);
router.get("/gateinout/all", verifyToken, AdminOrWardenOrSecurity, getSecurity);
router.post(
  "/gateinout/allbydate",
  verifyToken,
  AdminOrWardenOrSecurity,
  getSecurityDateBased
); //based one date

router.get(
  "/gateinout/Atype",
  verifyToken,
  AdminOrWarden,
  getSecurityDayWiseData
); //USED to get all statistics data in one JSON (Used at starting)

//statistics page
router.get("/undersuspension", verifyToken, AdminOrWarden, undersuspension);
router.get("/avgleaveduration", verifyToken, AdminOrWarden, AvgLeaveDuration);
router.post(
  "/currentapplieedleaves",
  verifyToken,
  AdminOrWarden,
  CurrentApplieedLeaves
);
router.post("/blockwiseleave", verifyToken, AdminOrWarden, BlockWiseLeave);
router.post(
  "/schoolwisedata",
  verifyToken,
  AdminOrWardenOrSecurity,
  SchoolWiseData
);
router.post(
  "/Atypewisedata",
  verifyToken,
  AdminOrWardenOrSecurity,
  ATypeWiseData
); //entire campus

// RFID TAG ID
router.get("/gateinout/getrftagid", getId);
router.get("/deviceNumber", getDeviceId);

export default router;
