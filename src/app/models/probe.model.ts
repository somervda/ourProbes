export interface Probe {
  pid: string;
  description: string;
  type: ProbeType;
  target: string;
  dateCreated?: Date;
  status: ProbeStatus;
}

export enum ProbeType {
  bing = 1,
  echo = 2,
  webPage = 3
}

export enum ProbeStatus {
  active = 1,
  inactive = 2,
  deleted = 9
}
