import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const deviceCreate = functions.firestore
  .document("devices/{id}")
  .onCreate((snap, context) => {
    const publicKey = snap.get("publicKey");
    const communication = snap.get("communication");
    console.log("publicKey:", publicKey);
    addDevice(context.params.id, publicKey, !communication)
      .then()
      .catch();

    return snap.ref.set(
      {
        dateCreated: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  });

async function addDevice(
  id: string,
  publicKey: string,
  blockedCommunication: boolean
) {
  const cloudRegion = "us-central1";
  const deviceId = id;
  const projectId = "ourprobes-258320";
  const registryId = "microcontroller";
  const iot = require("@google-cloud/iot");

  const iotClient = new iot.v1.DeviceManagerClient({
    // optional auth parameters.
  });

  const regPath = iotClient.registryPath(projectId, cloudRegion, registryId);
  // see device json https://cloud.google.com/iot/docs/reference/cloudiot/rest/v1/projects.locations.registries.devices
  const device = {
    id: deviceId,
    credentials: [
      {
        publicKey: {
          format: "RSA_PEM",
          key: publicKey
        }
      }
    ],
    blocked: blockedCommunication
  };

  console.log("device.publickey:", publicKey);

  const request = {
    parent: regPath,
    device
  };

  try {
    const responses = await iotClient.createDevice(request);
    const response = responses[0];
    console.log("Created device", response);
  } catch (err) {
    console.error("Could not create device", err);
  }
}
