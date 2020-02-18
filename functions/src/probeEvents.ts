import * as functions from "firebase-functions";
import { db } from "./init";
import * as admin from "firebase-admin";

export const probeEventsOnPublish = functions.pubsub
  .topic("probe-events")
  .onPublish(message => {
    // ...
    console.log("probe-events message 02:", message);
    const probeEvent = {
      bps: null,
      rtl: null,
      probeId: null,
      probeUMT: new admin.firestore.Timestamp(0, 0),
      target: null,
      deviceId: "",
      deviceNumId: "",
      type: "",
      available: false,
      responseMs: 0,
      deviceip: ""
    };

    try {
      if (message.json.hasOwnProperty("bps")) {
        probeEvent.bps = message.json.bps;
      }

      if (message.json.hasOwnProperty("rtl")) {
        probeEvent.rtl = message.json.rtl;
      }

      if (message.json.probeId) {
        probeEvent.probeId = message.json.probeId;
      }

      if (message.json.deviceip) {
        probeEvent.deviceip = message.json.deviceip;
      }

      if (message.json.probeUMT) {
        const probeUMT = message.json.probeUMT;
        probeEvent.probeUMT = new admin.firestore.Timestamp(probeUMT, 0);
      }

      if (message.json.target) {
        probeEvent.target = message.json.target;
      }

      if (message.attributes.deviceId) {
        probeEvent.deviceId = message.attributes.deviceId;
      }

      if (message.attributes.deviceNumId) {
        probeEvent.deviceNumId = message.attributes.deviceNumId;
      }

      if (message.json.type) {
        probeEvent.type = message.json.type;
      }

      if (message.json.available) {
        probeEvent.available = message.json.available;
      }

      if (message.json.hasOwnProperty("responseMs")) {
        probeEvent.responseMs = message.json.responseMs;
      }

      console.log("probeEvent:", probeEvent);

      db.collection("probeEvents")
        .add(probeEvent)
        .then(function() {
          console.log("probeEvent written");
        });
    } catch (e) {
      console.error("probeEvent error", e);
      return false;
    }

    return true;
  });

export enum probeEventSummaryPeriod {
  hour = 1,
  day = 2
}

export async function summarize(from: Date, period: probeEventSummaryPeriod) {
  let probeEventSummaries: probeEventSummary[] = [];
  const periodSec = period === probeEventSummaryPeriod.hour ? 3600 : 3600 * 24;
  const to = new Date(from.getSeconds() + periodSec);
  console.log("summerize times", from, to, periodSec);
  const probeEvents = <FirebaseFirestore.CollectionReference>db
    .collection("probeEvents")
    .where("probeUMT", ">=", from)
    .where("probeUMT", "<=", to);

  await probeEvents
    .get()
    .then(snaps => {
      console.log("probeEvents get snaps.docs.length:", snaps.docs.length);
    })
    .catch(function(error: any) {
      console.error("Error getting probeEvents:", error);
    });

  return probeEventSummaries;
}

export interface probeEventSummary {
  deviceId: string;
  probeId: string;
  umt: Date;
  period: probeEventSummaryPeriod;
  mean: number;
  p25: number;
  p50: number;
  p75: number;
  stdDev: number;
  count: number;
  availabilityCount: number;
  max: number;
  min: CountQueuingStrategy;
}
