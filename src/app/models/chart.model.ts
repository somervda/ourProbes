// Used to manage ngx-chart structures

export interface ChartSeries {
  name: string;
  series: ChartSeriesItem[];
}
export interface ChartSeriesItem {
  name: string;
  value: number;
  min?: number;
  max?: number;
}
