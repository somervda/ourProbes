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
  echo = 2,
  webPage = 3,
  tracert = 4
}

export enum ProbeStatus {
  active = 1,
  deleted = 9
}
