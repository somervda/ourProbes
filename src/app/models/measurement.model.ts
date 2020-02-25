import { firestore } from "firebase";
export interface Measurement {
  deviceId: string;
  probeId: string;
  name: string;
  type: string;
  UMT: firestore.Timestamp;
  value: number;
}
