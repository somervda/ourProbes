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

  try {
    const responses = await iotClient.createDevice(request);
    const response = responses[0];
    console.log("Created device", response);
  } catch (err) {
    middlewareEvent.writeMiddlewareEvent("Device creation error", id, err);
    console.error("Could not create device", err);
  }
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
      // middlewareEvent.writeMiddlewareEvent(
      //   "Device update start with after",
      //   context.params.id,
      //   { test: "1", item: 2 }
      // );
      // middlewareEvent.writeMiddlewareEvent(
      //   "Device update start",
      //   context.params.id
      // );
      if (
        before.communication != after.communication ||
        ~before.publicKey != after.publicKey
      ) {
        // see https://cloud.google.com/iot/docs/samples/device-manager-samples#patch_a_device_with_rsa_credentials
        try {
          await updateDevice(
            context.params.id,
            after.publicKey,
            !after.communication
          );
          // console.log("result1", result1);
          middlewareEvent.writeMiddlewareEvent(
            "updateDevice OK",
            context.params.id
          );
        } catch (err) {
          console.log("err:", err);
          middlewareEvent.writeMiddlewareEvent(
            "updateDevice error",
            context.params.id,
            JSON.stringify(err)
          );
        }
      }
      if (
        before.governorSeconds != after.governorSeconds ||
        JSON.stringify(before.probeList) != JSON.stringify(after.probeList) ||
        before.runProbes != after.runProbes
      ) {
        console.log("Add config:", before, after);
        const config = {
          governorSeconds: after.governorSeconds,
          runProbes: after.runProbes,
          probeList: after.probeList
        };
        newConfig(context.params.id, JSON.stringify(config))
          .then(x => console.log("ok", x))
          .catch(y => console.log("err: ", y));

        // see https://cloud.google.com/iot/docs/how-tos/config/configuring-devices#updating_and_reverting_device_configuration
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

async function newConfig(id: string, config: string) {
  console.log("newConfig:", id, config);
  const iot = require("@google-cloud/iot");
  const iotClient = new iot.v1.DeviceManagerClient({});

  const devPath = iotClient.devicePath(
    iotEnv.projectId,
    iotEnv.cloudRegion,
    iotEnv.registryId,
    id
  );

  // const binaryData = Buffer.from(data).toString("base64");
  const base64Config = Buffer.from(config).toString("base64");
  const request = {
    name: devPath,
    versionToUpdate: 0,
    binaryData: base64Config
  };

  try {
    const responses = await iotClient.modifyCloudToDeviceConfig(request);

    console.log("Success:", responses[0]);
  } catch (err) {
    middlewareEvent.writeMiddlewareEvent("Device config update error", id, err);
    console.error("Could not update config:", id);
    console.error("Message:", err);
  }
}
