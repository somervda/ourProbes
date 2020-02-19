import * as functions from "firebase-functions";
import { db } from "./init";
import * as admin from "firebase-admin";

export const measurementsOnPublish = functions.pubsub
  .topic("measurements")
  .onPublish(message => {
    // ...
    console.log("measurement 02:", message);
    const measurement = {
      value: null,
      probeId: null,
      UMT: new admin.firestore.Timestamp(0, 0),
      deviceId: "",
      type: ""
    };

    try {
      if (message.json.hasOwnProperty("value")) {
        measurement.value = message.json.value;
      }

      if (message.json.probeId) {
        measurement.probeId = message.json.probeId;
      }

      if (message.json.UMT) {
        const UMT = message.json.UMT;
        measurement.UMT = new admin.firestore.Timestamp(UMT, 0);
      }

      if (message.attributes.deviceId) {
        measurement.deviceId = message.attributes.deviceId;
      }

      if (message.json.type) {
        measurement.type = message.json.type;
      }

      console.log("measurement:", measurement);

      db.collection("measurements")
        .add(measurement)
        .then(function() {
          console.log("measurement written");
        });
    } catch (e) {
      console.error("measurement error", e);
      return false;
    }

    return true;
  });

export enum measurementSummaryPeriod {
  hour = 1,
  day = 2
}

export interface measurementItem {
  deviceId: string;
  probeId: string;
  type: string;
  UMT: Date;
  value: number;
}

export async function summarize(to: Date, period: measurementSummaryPeriod) {
  let measurementSummaries: measurementSummary[] = [];
  const periodSec = period === measurementSummaryPeriod.hour ? 3600 : 3600 * 24;
  const from = new Date(to.getTime() - 1000 * periodSec);
  console.log(
    "summerize times from:",
    from,
    " to: ",
    to,
    " periodSec: ",
    periodSec
  );
  const measurements = <FirebaseFirestore.CollectionReference>db
    .collection("measurements")
    .where("UMT", ">=", from)
    .where("UMT", "<=", to);

  let measurementArray: measurementItem[] = [];

  await measurements
    .get()
    .then(snaps => {
      console.log("measurement get snaps.docs.length:", snaps.docs.length);
      snaps.docs.map(snap => {
        const measurement: measurementItem = {
          deviceId: snap.data().deviceId,
          probeId: snap.data().probeId,
          type: snap.data().type,
          UMT: snap.data().UMT,
          value: snap.data().value
        };
        measurementArray.push(measurement);
      });
    })
    .catch(function(error: any) {
      console.error("Error getting measurement:", error);
    });
  // console.log("measurementArray:", measurementArray);
  measurementArray.sort(measurementCompare);
  console.log("measurementArray after sort:", measurementArray);
  // Create measurementSummaries array, one for each unique set of device/probe , include start and end indexes for the set in the measuermentArray
  let ms: measurementSummary = {
    probeId: "",
    deviceId: "",
    type: "",
    startIndex: 0,
    endIndex: 0,
    umt: from,
    period: period,
    count: 0,
    min: Number.MAX_VALUE,
    max: Number.MIN_VALUE,
    mean: 0
  };
  measurementArray.forEach((mi, i) => {
    if (
      ms.deviceId !== mi.deviceId ||
      ms.probeId !== mi.probeId ||
      ms.type !== mi.type
    ) {
      // Change of summary group
      if (ms.deviceId !== "" && ms.probeId !== "" && ms.type !== "") {
        // push current summary with indexes
        ms.endIndex = i - 1;
        ms.mean /= ms.count;
        // Create a new copy of the object to push
        measurementSummaries.push(JSON.parse(JSON.stringify(ms)));
      }
      ms.startIndex = i;
      ms.deviceId = mi.deviceId;
      ms.probeId = mi.probeId;
      ms.type = mi.type;
      ms.count = 0;
      ms.min = Number.MAX_VALUE;
      ms.max = Number.MIN_VALUE;
      ms.mean = 0;
    }
    ms.count += 1;
    if (mi.value < ms.min) ms.min = mi.value;
    if (mi.value > ms.max) ms.max = mi.value;
    ms.mean += mi.value;
  });
  if (ms.deviceId != "" && ms.probeId != "") {
    // push final summary
    ms.endIndex = measurementArray.length - 1;
    ms.mean /= ms.count;
    measurementSummaries.push(ms);
  }
  return measurementSummaries;
}

function measurementCompare(a: measurementItem, b: measurementItem) {
  const aKey = a.deviceId + a.probeId + a.type;
  const bKey = b.deviceId + b.probeId + b.type;
  if (aKey > bKey) return 1;
  if (bKey > aKey) return -1;
  return 0;
}

export interface measurementSummary {
  deviceId: string;
  probeId: string;
  type: string;
  startIndex?: number;
  endIndex?: number;
  umt: Date;
  period: measurementSummaryPeriod;
  mean: number;
  p25?: number;
  p50?: number;
  p75?: number;
  stdDev?: number;
  count: number;
  max: number;
  min: number;
}
