import * as functions from "firebase-functions";
import { db } from "./init";
import * as admin from "firebase-admin";

export const probeEventsOnPublish = functions.pubsub
  .topic("probe-events")
  .onPublish(message => {
    // ...
    console.log("probe-events message 02:", message);
    let probeEvent = {
      bps: null,
      rtl: null,
      probeId: null,
      probeUMT: new admin.firestore.Timestamp(0, 0),
      target: null,
      deviceId: "",
      deviceNumId: "",
      type: "",
      available: false,
      responseMs: 0
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
