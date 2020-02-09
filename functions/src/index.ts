export { userCreate } from "./user";

export { probeEventsOnPublish } from "./probeEvents";

export { deviceCreate, deviceUpdate } from "./device";

// exports.scheduledFunction = functions.pubsub
//   .schedule("every 5 minutes")
//   .onRun(context => {
//     // Used to maintain firestore replication of the IOT device information
//     // and load the most recent published probe results 12*24*31 invocations per month
//     console.log("This will be run every 5 minutes!");
//     return null;
//   });
