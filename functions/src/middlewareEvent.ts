import * as admin from "firebase-admin";
import { db } from "./init";

export function writeMiddlewareEvent(
  title: string,
  id: string,
  details?: string
) {
  const middlewareEventItem = {
    title: title,
    logTime: admin.firestore.FieldValue.serverTimestamp(),
    id: id,
    details: details || ""
  };

  db.collection("middlewareEvents").add(middlewareEventItem);
}
