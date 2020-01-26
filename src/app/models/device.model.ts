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
}

export enum DeviceType {
  esp32HiLetGo = 1,
  esp32GatewayOlimex = 2,
  raspberryPi4 = 3
}
