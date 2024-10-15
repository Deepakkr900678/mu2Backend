import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import path from "path";
import MainRoutes from "./routes/index.js";
import SSERoutes from "./routes/SSE/sseRoutes.js";
import config from "./config/index.js";
import morgan from "morgan";
import compression from "compression"; // to eliminate a SSE error
import Login from "./models/login.js";
import cron from "node-cron";
// import { AdminWarden } from "./models/adminOrWarden.js";
import rfidMapping from "./models/rfid_mapping.js";
import validateStudent from "./models/validate_student.js";
import moment from "moment-timezone";
// const Vaccination = require('./models/vacStatus')
// const StudentLogin = require('./models/studentLogin')
// const Outpass = require('./models/OutPass')
// const { Users } = require('./models/User')
// const Login = require('./models/login')
// const security = require('./models/security')
// const rfidMapping = require('./models/rfid_mapping')
// const validateStudent = require('./models/validate_student')

const { MONGO_URI } = config;

const app = express();
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(bodyParser.json());
app.use(compression());
app.use(cors());
app.use(morgan("dev"));
app.use("/outpass", MainRoutes);
// app.use(express.static(path.join(__dirname, "client/build")))
app.use("/outpass", SSERoutes);
const PORT = process.env.PORT || 5001;

// Publish a message to the test channel
// channel.publish('greeting', 'hello');

app.get("/hello", (req, res) => {
  res.send("dfd");
});

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useFindAndModify: false,
  }) // Adding new mongo url parser
  .then(() => {
    console.log("Connected to database in cluster");
    cronJob();
  })
  .catch((err) => console.log(err));

// Cron - Job
const cronJob = async () => {
  try {
    // const currentDate = new Date();
    const timezone = 'Asia/Kolkata';
    const currentDate = moment().tz(timezone);
    const suspendedStudents = await validateStudent.find({
      SUSPENDEDDATE: { $lte: currentDate },
    });

    // Update the SUSPEND field to "No" for suspended students
    const updatePromises = suspendedStudents.map(async (student) => {
      await validateStudent.findByIdAndUpdate(student._id, { SUSPEND: "No" });
    });

    await Promise.all(updatePromises);

    console.log("Cron job completed.");
  } catch (error) {
    console.error("Error in cron job:", error);
  }
};

// Schedule cron job to run every day at 12:00 AM
const cronJobExpression = "0 0 * * *"; // 'minute hour day month dayOfWeek'
cron.schedule(cronJobExpression, cronJob);

// Schema
// HTNO ,STUDENT_NAME DOSE , VAC_NAME , DATE
// Vaccination.create({
//      HTNO : "1",
//      STUDENT_NAME : "2",
//      DOSE : "2",
//      VAC_NAME : "233",
//      DATE: "23"
// })

//HTNO,STUDENT_NAME, STUDENT_EMAIL,PASSWORD,

// StudentLogin.create({
//     HTNO : "gfg",
//     STUDENT_NAME : "dfd",
//     STUDENT_EMAIL : "dfv",
//     PASSWORD : "fdvf"
// })

// TOKEN ,ASN_DATE , HTNO , STUDENT_NAME ,BLOCK , ROOM , FROM , TO , REASON , APPROVED , USED , BATCH

// Outpass.create({
//       TOKEN : "VD",
//     ASN_DATE : "dvcv",
//     HTNO : "qwq",
//     STUDENT_NAME : "12",
//     BLOCK : "fdf",
//     ROOM : "ddvd",
//     FROM : "fd",
//     TO :"jh",
//     REASON : "ioi",
//     APPROVED : "gfg",
//     USED : "dv",
//     BATCH : "v"

// })

// EID, NAME, EMAIL, PASSWORD, TYPE;

// Users.create({
//     EID : "Cd",
//     NAME : "Vd",
//     EMAIL :"vf",
//     PASSWORD : "vvc",
//     TYPE : "vvf"
//     })

// Login.create({
//   HTNO: "2e435",
//   STUDENT_NAME: "sfd",
//   STUDENT_EMAIL: "rvg",
//   STUDENT_MOBILE: "4rf4re",
//   FATHER_NAME: "452",
//   PARENTS_MOBILE: "fsdcc",
//   PARENTS_EMAIL: "fcd",
//   PASSWORD: "r4ewr",
//   BATCH: "scxc",
//   RESET_TOKEN: "cc",
//   A_TYPE: "dvd",
//   SCHOOL: "SOE",
// });

// const newAdminWarden = new AdminWarden({
//   NAME: "Visvesh Naraharisetty",
//   EMAIL: "visveshnaraharisetty@gmail.com",
//   TYPE: "Admin",
// });

// newAdminWarden
//   .save()
//   .then((result) => {
//     console.log("Document saved:", result);
//   })
//   .catch((error) => {
//     console.error("Error saving document:", error);
//   });

// security.create({
//   HTNO: "hello",
//   STUDENT_NAME: "erg",
//   BRANCH: "dg",
//   MOVING: "gdd",
//   REMARKS: "dth",
//   DATE: new Date(),
//   BATCH: "sghb",
// });

// rfidMapping.create({
//   HTNO: "SE21UARI002",
//   RFTAG_ID: "123"
// })

// validateStudent.create({
//   HTNO: "SE21UCSE012",
//   SUSPEND: "Yes"
// })

app.listen(PORT, () => {
  console.log("Connected to server");
});
