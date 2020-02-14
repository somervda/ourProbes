import * as admin from "firebase-admin";
import { db } from "./init";

export function writeMiddlewareEvent(title: string, id: string, error?: any) {
  var middlewareEventItem = {
    title: title,
    logTime: admin.firestore.FieldValue.serverTimestamp(),
    id: id,
    error: error || ""
  };

  db.collection("middlewareEvents")
    .add(middlewareEventItem)
    .then(function() {
      console.log("middleware event written", middlewareEventItem);
    });
}
