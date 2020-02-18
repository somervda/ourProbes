import * as functions from "firebase-functions";
import * as probeEvents from "./probeEvents";

export const hourlyFunction = functions.pubsub
  .schedule("every 5 minutes")
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
    probeEvents
      .summarize(currentTime, probeEvents.probeEventSummaryPeriod.hour)
      .then(x => console.log("cron summarize", x))
      .catch(err => console.log("cron summarize err", err));

    if (hour === 0) {
      console.log("This will be run every day!", currentTime, hour);
      dailyProcess();
    }
    return null;
  });

function hourlyProcess() {
  console.log("hourlyProcess", Date.now());
  // Read all data in a timerange and get statistics for mean, mode, max, min, counts,stddev
}

function dailyProcess() {
  console.log("dailyProcess", Date.now());
  // Read all data in a timerange and get statistics for mean, mode, max, min, counts,stddev
}
