import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.usersDateCreated = functions.firestore
  .document("users/{uid}")
  .onCreate((snap, context) => {
    return snap.ref.set(
      {
        dateCreated: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  });

exports.scheduledFunction = functions.pubsub
  .schedule("every 5 minutes")
  .onRun(context => {
    // Used to maintain firestore replication of the IOT device information
    // and load the most recent published probe results 12*24*31 invocations per month
    console.log("This will be run every 5 minutes!");
    return null;
  });
