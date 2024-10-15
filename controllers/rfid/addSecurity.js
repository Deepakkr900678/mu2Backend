import Login from "../../models/login.js";
import security from "../../models/security.js";
import validateStudent from "../../models/validate_student.js";
import Outpass from "../../models/OutPass.js";
import moment from "moment";

const addSecurity = (sec) => {
  security.create(sec, (err, done) => {
    if (err) {
      console.log(err);
    } else {
      console.log(done);
    }
  });
};

// const getSecurity = (req, res) => {
//   const keyword = req.query.keyword;
//   const query = keyword
//     ? {
//       $or: [
//         { HTNO: { $regex: keyword, $options: "i" } },
//         { STUDENT_NAME: { $regex: keyword, $options: "i" } },
//       ],
//     }
//     : {};

//   security.find(query, (err, done) => {
//     if (err) {
//       console.log(err);
//     } else {
//       // Format the DATE field in each document
//       const formattedData = done.map((item) => ({
//         ...item.toObject(),
//         DATE: item.DATE,
//       }));

//       res.json({
//         data: formattedData,
//       });
//     }
//   });
// };

const getSecurity = (req, res) => {
  console.log(req.query);
  const keyword = req.query.keyword;
  const page = parseInt(req.query.page) || 1; // Default page is 1
  const limit = parseInt(req.query.limit) || 10; // Default limit is 10

  const query = keyword
    ? {
        $or: [
          { HTNO: { $regex: keyword, $options: "i" } },
          { STUDENT_NAME: { $regex: keyword, $options: "i" } },
        ],
      }
    : {};

  security.countDocuments(query, (err, count) => {
    if (err) {
      console.log(err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      security
        .find(query)
        .sort({ DATE: -1 }) // Sort by DATE field in descending order (-1)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec((err, done) => {
          if (err) {
            console.log(err);
            res.status(500).json({ error: "Internal Server Error" });
          } else {
            // Format the DATE field in each document
            const formattedData = done.map((item) => ({
              ...item.toObject(),
              DATE: item.DATE,
            }));

            const totalPages = Math.ceil(count / limit);

            res.json({
              data: formattedData,
              totalPages: totalPages,
            });
          }
        });
    }
  });
};

function getSecurityDateBased(req, res) {
  const { startDate, endDate } = req.body; // Assuming you receive startDate and endDate in the request body

  // Query the `security` collection with a date range filter
  security.find(
    {
      DATE: { $gte: new Date(startDate), $lte: new Date(endDate) },
    },
    (err, done) => {
      if (err) {
        console.log(err);
        res.status(500).json({ error: "Internal server error" });
      } else {
        // Format the DATE field in each document
        const formattedData = done.map((item) => ({
          ...item.toObject(),
          DATE: item.DATE,
        }));

        res.json({
          data_date: formattedData,
        });
      }
    }
  );
}

async function getSecurityDayWiseData(req, res) {
  try {
    const distinctATypes = await security.distinct("A_TYPE");
    const dataByAType = {};

    async function calculateCounts(A_TYPE) {
      const data = await security.find({ A_TYPE });
      const dayCounts = {
        Monday: { IN: 0, OUT: 0 },
        Tuesday: { IN: 0, OUT: 0 },
        Wednesday: { IN: 0, OUT: 0 },
        Thursday: { IN: 0, OUT: 0 },
        Friday: { IN: 0, OUT: 0 },
        Saturday: { IN: 0, OUT: 0 },
        Sunday: { IN: 0, OUT: 0 },
      };

      data.forEach((entry) => {
        const date = new Date(entry.DATE);
        const day = date.toLocaleDateString("en-US", { weekday: "long" });
        const movement = entry.MOVING;

        if (dayCounts[day]) {
          dayCounts[day][movement] += 1;
        }
      });
      dataByAType[A_TYPE] = dayCounts;
    }

    const promises = distinctATypes.map(calculateCounts);
    await Promise.all(promises);

    const suspensionData = await validateStudent.find({ SUSPEND: "Yes" });
    const suspensionCount = suspensionData.length;

    const leavesData = await Outpass.find({ APPROVED: "" });
    const leavesCount = leavesData.length;

    const distinctBlocks = await Outpass.distinct("BLOCK");
    const blockCounts = {};

    async function calculateBlockCounts(block) {
      const count = await Outpass.countDocuments({
        BLOCK: block,
        APPROVED: "True",
      });
      blockCounts[block] = count;
    }

    const blockPromises = distinctBlocks.map(calculateBlockCounts);
    await Promise.all(blockPromises);

    const approvedOutpasses = await Outpass.find({ APPROVED: "True" });
    let totalDuration = 0;
    let totalDocuments = 0;

    approvedOutpasses.forEach((outpass) => {
      const fromDate = new Date(outpass.FROM);
      const toDate = new Date(outpass.TO);
      const duration = toDate - fromDate;
      totalDuration += duration;
      totalDocuments += 1;
    });
    const avgLeaveDuration =
      totalDocuments > 0
        ? totalDuration / (1000 * 60 * 60 * 24 * totalDocuments)
        : 0;

    res.status(200).json({
      daywise_data: dataByAType,
      Student_Under_Suspension: { count: suspensionCount },
      Current_Applied_Leaves: { count: leavesCount },
      Leaves_Granted: blockCounts,
      avg_leave_duration: avgLeaveDuration,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
}

//Student Under Suspension
async function undersuspension(req, res) {
  try {
    const suspensionCount = await validateStudent.countDocuments({
      SUSPEND: "Yes",
    });
    const HostlerCount = await Login.countDocuments({ A_TYPE: "Hostler" });
    const DayScholarCount = await Login.countDocuments({
      A_TYPE: "DayScholar",
    });
    res.status(200).json({
      Student_Under_Suspension: suspensionCount,
      Student_HostlerCount: HostlerCount,
      Student_DayScholarCount: DayScholarCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
}

// Avg Leave Duration
async function AvgLeaveDuration(req, res) {
  try {
    const approvedOutpasses = await Outpass.find({ APPROVED: "True" });
    let totalDuration = 0;
    let totalDocuments = 0;

    approvedOutpasses.forEach((outpass) => {
      const fromDate = new Date(outpass.FROM);
      const toDate = new Date(outpass.TO);
      const duration = toDate - fromDate;
      totalDuration += duration;
      totalDocuments += 1;
    });
    const avgLeaveDuration =
      totalDocuments > 0
        ? totalDuration / (1000 * 60 * 60 * 24 * totalDocuments)
        : 0;

    res.status(200).json({
      avg_leave_duration: avgLeaveDuration,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
}

//Current Applieed Leaves
// async function CurrentApplieedLeaves(req, res) {
//   console.log(req.body);
//   try {
//     let startDate, endDate;

//     if (req.body.startDate && req.body.endDate) {
//       startDate = moment(req.body.startDate).startOf("day").toISOString();
//       endDate = moment(req.body.endDate).endOf("day").toISOString();
//     } else {
//       const today = moment().format("YYYY-MM-DD");
//       startDate = moment(today).startOf("day").toISOString();
//       endDate = moment(today).endOf("day").toISOString();
//     }
//     const leavesData = await Outpass.find({
//       APPROVED: "",
//       ASN_DATE: { $gte: startDate, $lt: endDate },
//     });

//     const leavesCount = leavesData.length;
//     sse.send(leavesCount, "Leaves_Count");

//     res.status(200).json({
//       Leaves_Count: leavesCount,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "An error occurred" });
//   }
// }

async function CurrentApplieedLeaves(req, res) {
  try {
    let dateFilter = {}; // Initialize an empty date filter

    // Check if start and end dates are provided
    if (req.body.startDate && req.body.endDate) {
      const startDate = moment(req.body.startDate).startOf("day").toISOString();
      const endDate = moment(req.body.endDate).endOf("day").toISOString();
      dateFilter = { ASN_DATE: { $gte: startDate, $lt: endDate } };
    }

    const leavesData = await Outpass.find({
      APPROVED: "",
      ...dateFilter, // Apply the date filter if provided
    });

    const leavesCount = leavesData.length;
    // sse.send(leavesCount, "Leaves_Count");

    res.status(200).json({
      Leaves_Count: leavesCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
}

// Block Wise Leaves Granted
async function BlockWiseLeave(req, res) {
  try {
    let startDate, endDate;

    // Check if start and end dates are provided in the request body
    if (req.body.startDate && req.body.endDate) {
      startDate = moment(req.body.startDate).startOf("day").toISOString();
      endDate = moment(req.body.endDate).endOf("day").toISOString();
    } else {
      // If no dates are provided, use today's date
      const today = moment().format("YYYY-MM-DD");
      startDate = moment(today).startOf("day").toISOString();
      endDate = moment(today).endOf("day").toISOString();
    }

    const distinctBlocks = await Outpass.distinct("BLOCK");
    const blockCounts = [];

    async function calculateBlockCounts(block) {
      const approvedCount = await Outpass.countDocuments({
        BLOCK: block,
        APPROVED: "True",
        ASN_DATE: { $gte: startDate, $lt: endDate },
      });

      const rejectedCount = await Outpass.countDocuments({
        BLOCK: block,
        APPROVED: "False",
        ASN_DATE: { $gte: startDate, $lt: endDate },
      });

      blockCounts.push({
        name: block,
        leavesGranted: approvedCount,
        leavesRejected: rejectedCount,
      });
    }

    const blockPromises = distinctBlocks.map(calculateBlockCounts);
    await Promise.all(blockPromises);

    res.status(200).json({
      Leaves_Granted: blockCounts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
}

// School Wise Data
// async function SchoolWiseData(req, res) {
//   try {
//     let startDate, endDate;

//     // Check if start and end dates are provided in the request body
//     if (req.body.startDate && req.body.endDate) {
//       startDate = moment(req.body.startDate).startOf("day").toISOString();
//       endDate = moment(req.body.endDate).endOf("day").toISOString();
//     } else {
//       // If no dates are provided, use today's date
//       const today = moment().format("YYYY-MM-DD");
//       startDate = moment(today).startOf("day").toISOString();
//       endDate = moment(today).endOf("day").toISOString();
//     }

//     const distinctATypes = await security.distinct("A_TYPE");
//     const schoolCountsByAtype = {};

//     async function calculateSchoolCounts(aType) {
//       const distinctSchools = await security.distinct("SCHOOL", {
//         A_TYPE: aType,
//       });

//       const schoolCountsBySchool = {};

//       async function calculateSchoolCountsBySchool(school) {
//         const schoolData = await security.find({
//           SCHOOL: school,
//           DATE: { $gte: startDate, $lt: endDate },
//           A_TYPE: aType,
//         });
//         const schoolCounts = { IN: 0, OUT: 0 };

//         schoolData.forEach((entry) => {
//           const movement = entry.MOVING;
//           schoolCounts[movement] += 1;
//         });

//         schoolCountsBySchool[school] = schoolCounts;
//       }

//       const schoolPromises = distinctSchools.map(calculateSchoolCountsBySchool);
//       await Promise.all(schoolPromises);

//       schoolCountsByAtype[aType] = schoolCountsBySchool;
//     }

//     const aTypePromises = distinctATypes.map(calculateSchoolCounts);
//     await Promise.all(aTypePromises);

//     res.status(200).json({
//       School_Counts: schoolCountsByAtype,
//       // return Data format
//       // {
//       //   DayScholar: {
//       //     SOM: {
//       //       IN: 10,
//       //       OUT: 20,
//       //     },
//       //   },
//       //   Hostler: {
//       //     SOM: {
//       //       IN: 10,
//       //       OUT: 20,
//       //     },
//       //   },
//       // },
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "An error occurred" });
//   }
// }

// async function SchoolWiseData(req, res) {
//   try {
//     let startDate, endDate;

//     // Check if start and end dates are provided in the request body
//     if (req.body.startDate && req.body.endDate) {
//       startDate = moment(req.body.startDate).startOf("day").toISOString();
//       endDate = moment(req.body.endDate).endOf("day").toISOString();
//     } else {
//       // If no dates are provided, use today's date
//       const today = moment().format("YYYY-MM-DD");
//       startDate = moment(today).startOf("day").toISOString();
//       endDate = moment(today).endOf("day").toISOString();
//     }

//     const distinctATypes = await security.distinct("A_TYPE");
//     const schoolCountsByAtype = {};

//     async function calculateSchoolCounts(aType) {
//       const distinctSchools = await security.distinct("SCHOOL", {
//         A_TYPE: aType,
//       });

//       const schoolCountsBySchool = {};

//       async function calculateSchoolCountsBySchool(school) {
//         // Count the number of hostlers and day scholars based on some criteria
//         const hostlerCount = await Login.countDocuments({
//           SCHOOL: school,
//           A_TYPE: "Hostler",
//         });
//         const dayScholarCount = await Login.countDocuments({
//           SCHOOL: school,
//           A_TYPE: "DayScholar",
//         });
//         const latestEntries = {};

//         const schoolData = await security
//           .find({
//             SCHOOL: school,
//             DATE: { $gte: startDate, $lt: endDate },
//             A_TYPE: aType,
//           })
//           .sort({ DATE: -1 }); // Sort by date in descending order to get the latest entry first

//         schoolData.forEach((entry) => {
//           // Group entries by student ID and keep only the latest entry for each student
//           latestEntries[entry.HTNO] = entry;
//         });

//         const schoolCounts = { IN: 0, OUT: 0 };

//         // Count the total number of students inside and outside the school based on their latest entry
//         Object.values(latestEntries).forEach((entry) => {
//           const movement = entry.MOVING;
//           schoolCounts[movement] += 1;
//         });

//         // Calculate Hostler count OUT and Day Scholar count IN
//         if (aType === "Hostler") {
//           schoolCounts.IN = hostlerCount - schoolCounts.OUT;
//         } else if (aType === "DayScholar") {
//           schoolCounts.OUT = dayScholarCount - schoolCounts.IN;
//         }

//         schoolCountsBySchool[school] = schoolCounts;
//       }

//       const schoolPromises = distinctSchools.map(calculateSchoolCountsBySchool);
//       await Promise.all(schoolPromises);

//       schoolCountsByAtype[aType] = schoolCountsBySchool;
//     }

//     const aTypePromises = distinctATypes.map(calculateSchoolCounts);
//     await Promise.all(aTypePromises);

//     res.status(200).json({
//       School_Counts: schoolCountsByAtype,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "An error occurred" });
//   }
// }

async function SchoolWiseData(req, res) {
  try {
    const distinctATypes = await security.distinct("A_TYPE");
    const distinctschool = await security.distinct("SCHOOL");
    console.log(distinctschool,"loki")
    const schoolCountsByAtype = {};

    async function calculateSchoolCounts(aType) {
      const distinctSchools = await security.distinct("SCHOOL", {
        A_TYPE: aType,
      });

      const schoolCountsBySchool = {};

      async function calculateSchoolCountsBySchool(school) {
        const hostlerCount = await Login.countDocuments({
          SCHOOL: school,
          A_TYPE: "Hostler",
        });
        const dayScholarCount = await Login.countDocuments({
          SCHOOL: school,
          A_TYPE: "DayScholar",
        });
        const latestEntries = {};

        const schoolData = await security.find({
          SCHOOL: school,
          A_TYPE: aType,
        });

        schoolData.forEach((entry) => {
          if (!latestEntries[entry.HTNO] || latestEntries[entry.HTNO].DATE < entry.DATE) {
            latestEntries[entry.HTNO] = entry;
          }
        });

        const schoolCounts = { IN: 0, OUT: 0 };

        Object.values(latestEntries).forEach((entry) => {
          const movement = entry.MOVING;
          if (movement === "IN") {
            schoolCounts.IN += 1;
          } else if (movement === "OUT") {
            schoolCounts.OUT += 1;
          }
        });

        if (aType === "Hostler") {
          schoolCounts.OUT = hostlerCount - schoolCounts.IN;
        } else if (aType === "DayScholar") {
          schoolCounts.OUT = dayScholarCount - schoolCounts.IN;
        }

        schoolCountsBySchool[school] = schoolCounts;
      }

      const schoolPromises = distinctSchools.map(calculateSchoolCountsBySchool);
      await Promise.all(schoolPromises);

      schoolCountsByAtype[aType] = schoolCountsBySchool;
    }

    const aTypePromises = distinctATypes.map(calculateSchoolCounts);
    await Promise.all(aTypePromises);

    res.status(200).json({
      School_Counts: schoolCountsByAtype,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
}


// Total count of a IN and OUT Moment
// async function ATypeWiseData(req, res) {
//   try {
//     let startDate, endDate;

//     // Check if start and end dates are provided in the request body
//     if (req.body.startDate && req.body.endDate) {
//       startDate = moment(req.body.startDate).startOf("day").toISOString();
//       endDate = moment(req.body.endDate).endOf("day").toISOString();
//     } else {
//       // If no dates are provided, use today's date
//       const today = moment().format("YYYY-MM-DD");
//       startDate = moment(today).startOf("day").toISOString();
//       endDate = moment(today).endOf("day").toISOString();
//     }

//     const distinctATypes = await security.distinct("A_TYPE");
//     const aTypeCounts = {};

//     async function calculateATypeCounts(aType) {
//       // Count the number of hostlers and day scholars based on some criteria across all documents
//       const hostlerCount = await Login.countDocuments({ A_TYPE: "Hostler" });
//       const dayScholarCount = await Login.countDocuments({
//         A_TYPE: "DayScholar",
//       });

//       const latestEntries = {};

//       const aTypeData = await security
//         .find({
//           A_TYPE: aType,
//           DATE: { $gte: startDate, $lt: endDate },
//         })
//         .sort({ DATE: -1 }); // Sort by date in descending order to get the latest entry first

//       aTypeData.forEach((entry) => {
//         // Group entries by student ID and keep only the latest entry for each student
//         if (
//           !latestEntries[entry.HTNO] ||
//           latestEntries[entry.HTNO].DATE < entry.DATE
//         ) {
//           latestEntries[entry.HTNO] = entry;
//         }
//       });

//       const aTypeCount = { IN: 0, OUT: 0 };

//       // Count the total number of students inside and outside the school based on their latest entry
//       Object.values(latestEntries).forEach((entry) => {
//         const movement = entry.MOVING;
//         aTypeCount[movement] += 1;
//       });

//       // Adjust counts based on total counts of hostlers and day scholars
//       if (aType === "Hostler") {
//         aTypeCount.IN = hostlerCount - aTypeCount.OUT;
//       } else if (aType === "DayScholar") {
//         aTypeCount.OUT = dayScholarCount - aTypeCount.IN;
//       }

//       aTypeCounts[aType] = aTypeCount;
//     }

//     const aTypePromises = distinctATypes.map(calculateATypeCounts);
//     await Promise.all(aTypePromises);

//     res.status(200).json({
//       AType_Counts: aTypeCounts,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "An error occurred" });
//   }
// }
async function ATypeWiseData(req, res) {
  try {
    const distinctATypes = await security.distinct("A_TYPE");
    const distinctHTNO = await security.distinct("HTNO");
    console.log(distinctHTNO,"loki")
    const aTypeCounts = {};

    async function calculateATypeCounts(aType) {
      const hostlerCount = await Login.countDocuments({ A_TYPE: "Hostler" });
      const dayScholarCount = await Login.countDocuments({ A_TYPE: "DayScholar" });

      const latestEntries = {};

      const aTypeData = await security.find({ A_TYPE: aType });

      aTypeData.forEach((entry) => {
        if (!latestEntries[entry.HTNO] || latestEntries[entry.HTNO].DATE < entry.DATE) {
          latestEntries[entry.HTNO] = entry;
        }
      });

      const aTypeCount = { IN: 0, OUT: 0 };

      Object.values(latestEntries).forEach((entry) => {
        const movement = entry.MOVING;
        if (movement === "IN") {
          aTypeCount.IN += 1;
        } else if (movement === "OUT") {
          aTypeCount.OUT += 1;
        }
      });

      // Adjust the OUT count based on the total count of each type
      if (aType === "Hostler") {
        aTypeCount.OUT = hostlerCount - aTypeCount.IN;
      } else if (aType === "DayScholar") {
        aTypeCount.OUT = dayScholarCount - aTypeCount.IN;
      }

      aTypeCounts[aType] = aTypeCount;
    }

    const aTypePromises = distinctATypes.map(calculateATypeCounts);
    await Promise.all(aTypePromises);

    res.status(200).json({
      AType_Counts: aTypeCounts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
}


export {
  addSecurity,
  getSecurity,
  getSecurityDateBased,
  getSecurityDayWiseData,
  undersuspension,
  AvgLeaveDuration,
  CurrentApplieedLeaves,
  BlockWiseLeave,
  SchoolWiseData,
  ATypeWiseData,
};
