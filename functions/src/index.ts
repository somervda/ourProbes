import * as functions from "firebase-functions";
import * as measurements from "./measurements";

export { userCreate } from "./user";

export { measurementsOnPublish } from "./measurements";

export { deviceCreate, deviceUpdate } from "./device";

export { hourlyFunction } from "./cronjobs";

export const testSummarize = functions.https.onRequest(
  async (request, response) => {
    const now = new Date();
    console.log("summarize Date:", now);
    let out = "";
    await measurements
      .summarize(now, measurements.measurementSummaryPeriod.hour)
      .then(x => {
        console.log("summarize x:", x);
        out = JSON.stringify(x);
        measurements.writeMeasurementSummaries(x);
      })
      .catch(err => console.log("summarize error:", err));
    response.send("Hello from summarize! " + out);
  }
);
