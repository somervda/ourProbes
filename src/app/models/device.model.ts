import { ProbeType } from "./probe.model";
export interface Device {
  // did = deviceId value in IOT device definition
  id: string;
  description: string;
  // Where to find the device - i.e. address + where is located at the address
  location?: string;
  // maps to the Device Communication property in IOT core
  // set to true to allow board to communicate to IOT core
  communication: boolean;
  type: DeviceType;
  longitude: number;
  latitude: number;
  dateCreated?: Date;
  // minimum number of seconds taken for each main loop on the device
  governorSeconds: number;
  // stops probes from running on the device
  runProbes: boolean;
  // public RSA key in PEM format
  publicKey: string;
  // private RSA key in PEM format
  privateKey: string;
  // private RSA key decoded for use in the config.py key-config object
  // see readme.txt
  privateKeyTuple: string;
  probeList: [];
}

export enum DeviceType {
  esp32HiLetGo = 1,
  esp32GatewayOlimex = 2,
  raspberryPi4 = 3
}

export interface ProbeListItem {
  id: string;
  target: string;
  type: ProbeType;
  active: boolean;
}
