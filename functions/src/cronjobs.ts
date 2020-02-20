import * as functions from "firebase-functions";
import * as measurements from "./measurements";

export const hourlyFunction = functions.pubsub
  .schedule("0 * * * *")
  .onRun(context => {
    // .schedule("0 * * * *")
    // Runs at the start  of every hour
    // run 2 jobs
    // 1 - each hour summarize probeEvent data collected over the last hour and delete data more than 7 days old
    // 2 - Summarize hourly data from previous day , delete hourly data more than 60 days old.
    // Summarize to device/probe granularity
    // Normally would use a timeseries database for this but this is easier to do for now
    // Wrapping the 2 cron activities in one schedule function because I am cheep (first 3 scheduler function are free)

    const currentTime = new Date();
    const hour = currentTime.getHours();
    hourlyProcess();
    console.log("This will be run every hour!", currentTime, hour);

    if (hour === 0) {
      console.log("This will be run every day!", currentTime, hour);
      dailyProcess();
    }
    return null;
  });

function hourlyProcess() {
  console.log("hourlyProcess", Date.now());
  measurements
    .summarize(new Date(), measurements.measurementSummaryPeriod.hour)
    .then(x => measurements.writeMeasurementSummaries(x))
    .catch(err => console.log("cron hourly summarize err", err));
}

function dailyProcess() {
  console.log("dailyProcess", Date.now());
  measurements
    .summarize(new Date(), measurements.measurementSummaryPeriod.day)
    .then(x => measurements.writeMeasurementSummaries(x))
    .catch(err => console.log("cron daily summarize err", err));
}
