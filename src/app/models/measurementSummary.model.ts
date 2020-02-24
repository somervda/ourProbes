export interface MeasurementSummary {
  deviceId: string;
  probeId: string;
  name: string;
  type: string;
  umt: Date;
  period: measurementSummaryPeriod;
  mean: number;
  p00: number;
  p25: number;
  p50: number;
  p75: number;
  p100: number;
  stdDev: number;
  count: number;
}

export enum measurementSummaryPeriod {
  hour = 1,
  day = 2
}

export const measurementSummaryAvailableSeries = [
  "mean",
  "p00",
  "p25",
  "p50",
  "p75",
  "p100",
  "stdDev",
  "count"
];
