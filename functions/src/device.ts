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

export const deviceUpdate = functions.firestore
  .document("devices/{id}")
  .onUpdate((change, context) => {
    // 1. Update any non config changes as IOT device update API i.e. communication,publicKey
    // 2  For config data changes update the config for the device (different API call) i.e. governorSeconds,probeList,runProbes
    const before = change.before.data();
    const after = change.after.data();
    if (before && after) {
      if (
        before.communication != after.communication ||
        before.publicKey != after.publicKey
      ) {
        console.log("Update device:", before, after);
        // see https://cloud.google.com/iot/docs/samples/device-manager-samples#patch_a_device_with_rsa_credentials
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
        addConfig(context.params.id, JSON.stringify(config))
          .then()
          .catch();

        // see https://cloud.google.com/iot/docs/how-tos/config/configuring-devices#updating_and_reverting_device_configuration
      }
    }
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

async function addConfig(id: string, config: string) {
  console.log("addConfig:", id, config);

  const cloudRegion = "us-central1";
  const projectId = "ourprobes-258320";
  const registryId = "microcontroller";
  const iot = require("@google-cloud/iot");

  const iotClient = new iot.v1.DeviceManagerClient({
    // optional auth parameters.
  });

  const formattedName = iotClient.devicePath(
    projectId,
    cloudRegion,
    registryId,
    id
  );

  // const binaryData = Buffer.from(data).toString("base64");
  const base64Config = Buffer.from(config).toString("base64");
  const request = {
    name: formattedName,
    versionToUpdate: 0,
    binaryData: base64Config
  };

  try {
    const responses = await iotClient.modifyCloudToDeviceConfig(request);

    console.log("Success:", responses[0]);
  } catch (err) {
    console.error("Could not update config:", id);
    console.error("Message:", err);
  }
}
