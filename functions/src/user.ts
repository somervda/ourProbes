import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const userCreate = functions.firestore
  .document("users/{uid}")
  .onCreate((snap, context) => {
    return snap.ref.set(
      {
        dateCreated: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  });
