export interface Probe {
  id?: string;
  name: string;
  description: string;
  type: ProbeType;
  target: string;
  dateCreated?: Date;
  status: ProbeStatus;
  match?: string;
}

export enum ProbeType {
  bing = 1,
  ping = 2,
  webPage = 3
}

export enum ProbeStatus {
  active = 1,
  deleted = 9
}

// Information about what measurementTypes are created with which probetypes
export const ProbeMeasurementTypes = [
  {
    probeType: ProbeType.bing,
    measurementTypes: ["bps", "rtl", "success", "fail"]
  },
  { probeType: ProbeType.ping, measurementTypes: ["rtl", "success", "fail"] },
  {
    probeType: ProbeType.webPage,
    measurementTypes: ["ttfb", "success", "fail"]
  }
];
