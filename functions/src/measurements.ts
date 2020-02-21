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
  console.log("summarize timing start", Date.now());
  let measurementSummaries: measurementSummary[] = [];
  const periodSec = period === measurementSummaryPeriod.hour ? 3600 : 3600 * 24;
  const from = new Date(to.getTime() - 1000 * periodSec);
  // console.log(
  //   "summarize times from:",
  //   from,
  //   " to: ",
  //   to,
  //   " periodSec: ",
  //   periodSec
  // );
  const measurements = <FirebaseFirestore.CollectionReference>db
    .collection("measurements")
    .where("UMT", ">=", from)
    .where("UMT", "<=", to);

  let measurementArray: measurementItem[] = [];
  console.log("summarize timing before getting measurements", Date.now());
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
  console.log("summarize timing before sort", Date.now());
  measurementArray.sort(measurementCompare);
  console.log("summarize timing after sort", Date.now());
  // console.log("measurementArray after sort:", measurementArray);
  // Create measurementSummaries array, one for each unique set of device/probe , include start and end indexes for the set in the measurmentArray
  let ms: measurementSummary = {
    probeId: "",
    deviceId: "",
    type: "",
    umt: from,
    period: period,
    count: 0,
    mean: 0
  };
  // Value array is list of values for the group that is bused to
  // calculate the stddev and percentiles
  let valueArray: number[] = [];
  measurementArray.forEach((mi, i) => {
    if (
      ms.deviceId !== mi.deviceId ||
      ms.probeId !== mi.probeId ||
      ms.type !== mi.type
    ) {
      // Change of summary group
      if (ms.deviceId !== "" && ms.probeId !== "" && ms.type !== "") {
        // push current summary
        ms.mean /= ms.count;
        valueArray.sort((a, b) => a - b);
        ms.stdDev = Math.sqrt(
          valueArray.reduce((a, v) => a + Math.pow(v - ms.mean, 2), 0) /
            ms.count
        );
        // console.log(
        //   "device:",
        //   ms.deviceId,
        //   "probe:",
        //   ms.probeId,
        //   "type:",
        //   ms.type,
        //   "calc stddev:",
        //   ms.stdDev,
        //   valueArray,
        //   " valueArray.reduce((a, v) => a + Math.pow(v - ms.mean, 2),0) :",
        //   valueArray.reduce((a, v) => a + Math.pow(v - ms.mean, 2), 0)
        // );
        // These results checked against https://www.calculator.net/standard-deviation-calculator.html
        // Calc percentiles
        ms.p00 = valueArray[0];
        ms.p25 = valueArray[Math.floor((valueArray.length - 1) * 0.25)];
        ms.p50 = valueArray[Math.floor((valueArray.length - 1) * 0.5)];
        ms.p75 = valueArray[Math.floor((valueArray.length - 1) * 0.75)];
        ms.p100 = valueArray[valueArray.length - 1];
        // Create a new copy of the object to push
        let copyOfms = <measurementSummary>{};
        Object.assign(copyOfms, ms);
        measurementSummaries.push(copyOfms);
      }
      valueArray = [];
      ms.deviceId = mi.deviceId;
      ms.probeId = mi.probeId;
      ms.type = mi.type;
      ms.count = 0;
      ms.mean = 0;
    }
    ms.count += 1;
    valueArray.push(mi.value);
    ms.mean += mi.value;
  });
  if (ms.deviceId != "" && ms.probeId != "") {
    // push final summary
    ms.mean /= ms.count;
    valueArray.sort((a, b) => a - b);
    ms.stdDev = Math.sqrt(
      valueArray.reduce((a, v) => a + Math.pow(v - ms.mean, 2), 0) / ms.count
    );
    // console.log(
    //   "device:",
    //   ms.deviceId,
    //   "probe:",
    //   ms.probeId,
    //   "type:",
    //   ms.type,
    //   "calc stddev:",
    //   ms.stdDev,
    //   valueArray,
    //   " valueArray.reduce((a, v) => a + Math.pow(v - ms.mean, 2),0) :",
    //   valueArray.reduce((a, v) => a + Math.pow(v - ms.mean, 2), 0)
    // );
    // These results checked against https://www.calculator.net/standard-deviation-calculator.html
    // Calc percentiles
    ms.p00 = valueArray[0];
    ms.p25 = valueArray[Math.floor((valueArray.length - 1) * 0.25)];
    ms.p50 = valueArray[Math.floor((valueArray.length - 1) * 0.5)];
    ms.p75 = valueArray[Math.floor((valueArray.length - 1) * 0.75)];
    ms.p100 = valueArray[valueArray.length - 1];
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
  umt: Date;
  period: measurementSummaryPeriod;
  mean: number;
  p00?: number;
  p25?: number;
  p50?: number;
  p75?: number;
  p100?: number;
  stdDev?: number;
  count: number;
}

export function writeMeasurementSummaries(
  measurementSummaries: measurementSummary[]
) {
  measurementSummaries.forEach(ms =>
    db.collection("measurementSummaries").add(ms)
  );
}
