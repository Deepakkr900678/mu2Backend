import Outpass from "../models/OutPass.js";
//TOKEN , ASN_DATE , HTNO , STUDENT_NAME ,BLOCK , ROOM , FROM , TO , REASON , APPROVED , USED , BATCH
import { sse } from "../controllers/SSE/sseController.js";
import moment from "moment-timezone";
import Login from "../models/login.js";

async function createOutpass(req, res) {
  try {
    const { HTNO, STUDENT_NAME, BLOCK, ROOM, FROM, TO, REASON, BATCH } =
      req.body;
    // console.log(req.body,"loki")

    // const currentDate = new Date();
    // const formattedDate = currentDate.toISOString();

    // const fromdate = new Date(FROM);
    // const todate = new Date(TO);

    // // Set the time to the end of the day
    // fromdate.setHours(0, 0, 0, 0);
    // todate.setHours(23, 59, 59, 999);

    // // Get the UTC representation of the modified date
    // const fromUTC = fromdate.toISOString();
    // const toUTC = todate.toISOString();
    const timezone = 'Asia/Kolkata';

    // Get the current date in the specified timezone
    const currentDate = moment().tz(timezone);
    const formattedDate = currentDate.toISOString();

    // Assuming FROM and TO are already defined
    const fromdate = moment.tz(FROM, timezone).startOf('day');
    const todate = moment.tz(TO, timezone).endOf('day');

    // Get the UTC representation of the modified date
    const fromUTC = fromdate.toISOString();
    const toUTC = todate.toISOString();

    const latestOutpass = await Outpass.findOne(
      { HTNO },
      {},
      { sort: { ASN_DATE: -1 } } // Sort by ASN_DATE in descending order to get the latest
    );

    let newToken;
    if (
      !latestOutpass ||
      latestOutpass.USED === "True" ||
      latestOutpass.APPROVED === "False"
    ) {
      // Create a new outpass if there is no latest outpass or if the latest outpass is used or not approve
      const maxTokenOutpass = await Outpass.findOne(
        {},
        { TOKEN: 1 },
        { sort: { $natural: -1} }
      );
      newToken = maxTokenOutpass ? Number(maxTokenOutpass.TOKEN) + 1 : 1;

      const studentData = {
        TOKEN: newToken,
        ASN_DATE: formattedDate,
        HTNO,
        STUDENT_NAME,
        BLOCK,
        ROOM,
        FROM:fromUTC,
        TO:toUTC,
        REASON,
        APPROVED: "",
        USED: "False",
        BATCH,
      };

      const newOutpass = new Outpass(studentData);
      await newOutpass.save();

      sse.send(newOutpass, "newOutpass");

      return res.status(200).json({
        msg: "Created pass successfully",
        newOutpass,
      });
    } else if (latestOutpass.USED !== "True") {
      // Update the latest outpass if it is not used
      const updateData = {
        ASN_DATE: formattedDate,
        STUDENT_NAME,
        BLOCK,
        ROOM,
        FROM:fromUTC,
        TO:toUTC,
        REASON,
        BATCH,
        APPROVED: "",
        USED: "False",
      };

      await Outpass.updateOne(
        { TOKEN: latestOutpass.TOKEN },
        { $set: updateData }
      );
      sse.send(latestOutpass, "updatedOutpass");
      return res.status(200).json({
        msg: "Updated latest outpass successfully",
        updatedOutpass: latestOutpass,
      });
    } else {
      // No action taken if the latest outpass does not meet the conditions for creation or update
      return res.status(200).json({
        msg: "No action taken",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred" });
  }
}

export const myLeaves = async (req, res) => {
  const { htno } = req.query;
  // console.log(req.query);
  try {
    const isHostler = await Login.findOne({ HTNO: htno });
    if (!isHostler) {
      return res.status(404).json({ message: "User not found" });
    }
    // console.log(isHostler.A_TYPE);
    if (isHostler.A_TYPE !== "Hostler") {
      return res.status(401).json({ message: "Only for hostlers" });
    }
    const leaves = await Outpass.find({ HTNO: htno });
    res.status(200).json({ leaves });
  } catch (error) {
    res.status(500).json({ message: "Internal Error" });
  }
};

export { createOutpass };
