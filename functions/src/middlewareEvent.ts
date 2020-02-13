import * as admin from "firebase-admin";
import { db } from "./init";

export function writeMiddlewareEvent(title: string, id: string, err: any) {
  const middlewareEventItem = {
    title: title,
    logTime: admin.firestore.FieldValue.serverTimestamp(),
    err: err,
    id: id
  };
  db.collection("middlewareEvents")
    .add(middlewareEventItem)
    .then(function() {
      console.log("middleware event written", middlewareEventItem);
    });
}
