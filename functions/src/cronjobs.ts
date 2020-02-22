import * as functions from "firebase-functions";
import * as measurements from "./measurements";

export const hourlyFunction = functions.pubsub
  .schedule("0 * * * *")
  .onRun(async context => {
    // .schedule("0 * * * *")
    // .schedule("every 5 minutes")
    // Runs at the start  of every hour
    // run 2 jobs
    // 1 - each hour summarize probeEvent data collected over the last hour and delete data more than 7 days old
    // 2 - Summarize hourly data from previous day , delete hourly data more than 60 days old.
    // Summarize to device/probe granularity
    // Normally would use a timeseries database for this but this is easier to do for now
    // Wrapping the 2 cron activities in one schedule function because I am cheep (first 3 scheduler function are free)

    const currentTime = new Date();
    const hour = currentTime.getHours();
    await hourlyProcess()
      .then(x => console.log("98. cron hourly", Date.now()))
      .catch(err => console.log("cron hourly  err", err));
    console.log("99. This will be run every hour!", currentTime, hour);

    if (hour === 0) {
      await dailyProcess()
        .then(x => console.log("98 cron daily", Date.now()))
        .catch(err => console.log("1 cron daily  err", err));
      console.log("99. This will be run every day!", currentTime, hour);
    }
    return null;
  });

async function hourlyProcess() {
  console.log("1 hourlyProcess Start", Date.now());
  await measurements
    .summarize(new Date(), measurements.measurementSummaryPeriod.hour)
    .then(x => measurements.writeMeasurementSummaries(x))
    .catch(err => console.log("cron hourly summarize err", err));
  console.log("99 hourlyProcess End", Date.now());
}

async function dailyProcess() {
  console.log("1 dailyProcess Start", Date.now());
  await measurements
    .summarize(new Date(), measurements.measurementSummaryPeriod.day)
    .then(x => measurements.writeMeasurementSummaries(x))
    .catch(err => console.log("cron daily summarize err", err));
  console.log("99 dailyProcess End", Date.now());
}
