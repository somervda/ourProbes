import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as middlewareEvent from "./middlewareEvent";

//  See https://googleapis.dev/nodejs/iot/latest/v1.DeviceManagerClient

const iotEnv = {
  cloudRegion: "us-central1",
  projectId: "ourprobes-258320",
  registryId: "microcontroller"
};

// ****** device.onCreate ********

export const deviceCreate = functions.firestore
  .document("devices/{id}")
  .onCreate(async (snap, context) => {
    const publicKey = snap.get("publicKey");
    const communication = snap.get("communication");
    console.log("publicKey:", publicKey);
    try {
      addDevice(context.params.id, publicKey, !communication);
    } catch (err) {
      console.log("addDevice err:", err);
      middlewareEvent.writeMiddlewareEvent(
        "addDevice error",
        context.params.id,
        JSON.stringify(err)
      );
    }

    return snap.ref.set(
      {
        dateCreated: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  });

function addDevice(
  id: string,
  publicKey: string,
  blockedCommunication: boolean
) {
  const iot = require("@google-cloud/iot");
  const iotClient = new iot.v1.DeviceManagerClient({});
  const regPath = iotClient.registryPath(
    iotEnv.projectId,
    iotEnv.cloudRegion,
    iotEnv.registryId
  );
  // see device json https://cloud.google.com/iot/docs/reference/cloudiot/rest/v1/projects.locations.registries.devices
  const device = {
    id: id,
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

  const request = {
    parent: regPath,
    device
  };

  return iotClient.createDevice(request);
}

// ****** device.onUpdate ********

export const deviceUpdate = functions.firestore
  .document("devices/{id}")
  .onUpdate(async (change, context) => {
    // 1. Update any non config changes as IOT device update API i.e. communication,publicKey
    // 2  For config data changes update the config for the device (different API call) i.e. governorSeconds,probeList,runProbes
    const before = change.before.data();
    const after = change.after.data();
    if (before && after) {
      if (
        before.communication !== after.communication ||
        ~before.publicKey !== after.publicKey
      ) {
        // see https://cloud.google.com/iot/docs/samples/device-manager-samples#patch_a_device_with_rsa_credentials
        try {
          await updateDevice(
            context.params.id,
            after.publicKey,
            !after.communication
          );
        } catch (err) {
          console.log("updateDevice err:", err);
          middlewareEvent.writeMiddlewareEvent(
            "updateDevice error",
            context.params.id,
            JSON.stringify(err)
          );
        }
      }

      if (
        before.governorSeconds !== after.governorSeconds ||
        JSON.stringify(before.probeList) !== JSON.stringify(after.probeList) ||
        before.runProbes !== after.runProbes
      ) {
        const config = {
          governorSeconds: after.governorSeconds,
          runProbes: after.runProbes,
          probeList: after.probeList
        };
        try {
          await newConfig(context.params.id, JSON.stringify(config));
        } catch (err) {
          console.log("newConfig err:", err);
          middlewareEvent.writeMiddlewareEvent(
            "newConfig error",
            context.params.id,
            JSON.stringify(err)
          );
        }
      }
    }
  });

function updateDevice(
  id: string,
  publicKey: string,
  blockedCommunication: boolean
) {
  const iot = require("@google-cloud/iot");
  const iotClient = new iot.v1.DeviceManagerClient({});
  const devPath = iotClient.devicePath(
    iotEnv.projectId,
    iotEnv.cloudRegion,
    iotEnv.registryId,
    id
  );
  const device = {
    name: devPath,
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
  // https://cloud.google.com/nodejs/docs/reference/iot/0.2.x/v1.DeviceManagerClient#updateDevice
  return iotClient.updateDevice({
    device: device,
    updateMask: { paths: ["credentials", "blocked"] }
  });
}

function newConfig(id: string, config: string) {
  // see https://cloud.google.com/iot/docs/how-tos/config/configuring-devices#updating_and_reverting_device_configuration
  const iot = require("@google-cloud/iot");
  const iotClient = new iot.v1.DeviceManagerClient({});

  const devPath = iotClient.devicePath(
    iotEnv.projectId,
    iotEnv.cloudRegion,
    iotEnv.registryId,
    id
  );

  const base64Config = Buffer.from(config).toString("base64");
  const request = {
    name: devPath,
    versionToUpdate: 0,
    binaryData: base64Config
  };
  return iotClient.modifyCloudToDeviceConfig(request);
}
