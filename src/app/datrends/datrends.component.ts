import { Component, OnInit, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { NgxChartsModule } from "@swimlane/ngx-charts";
import { Observable, Subscription } from "rxjs";
import { AngularFirestore } from "@angular/fire/firestore";
import { MeasurementSummaryService } from "../services/measurement-summary.service";
import {
  measurementSummaryAvailableSeries,
  measurementSummaryAvailableTypes
} from "../models/measurementSummary.model";
import { DeviceService } from "../services/device.service";
import { ProbeService } from "../services/probe.service";
import { Device } from "../models/device.model";
import { Probe } from "../models/probe.model";

@Component({
  selector: "app-datrends",
  templateUrl: "./datrends.component.html",
  styleUrls: ["./datrends.component.scss"]
})
export class DatrendsComponent implements OnInit {
  // view: any[] = [900, 400];
  chartData$: Observable<any>;
  chartData$$: Subscription;
  chartData: [];
  showChart: boolean = false;

  // Measurement selectors
  from: Date;
  to: Date;
  series: string[] = ["p50"];
  availableSeries = measurementSummaryAvailableSeries;
  devices: string[];
  selectedDeviceId: string = "D0001";
  devices$: Observable<Device[]>;
  devices$$: Subscription;
  probes: Probe[];
  selectedProbe: Probe;
  probes$: Observable<Probe[]>;
  probes$$: Subscription;
  availableTypes = measurementSummaryAvailableTypes;
  selectedType: string = this.availableTypes[0].value;
  availableRanges = [
    { name: "6 hours", period: 1, hours: 6 },
    { name: "24 hours", period: 1, hours: 24 },
    { name: "7 Days", period: 1, hours: 168 },
    { name: "30 Days", period: 2, hours: 720 },
    { name: "90 Days", period: 2, hours: 2160 }
  ];
  selectedRangeHours = this.availableRanges[0].hours;

  // chart options
  legend: boolean = true;
  showLabels: boolean = true;
  animations: boolean = true;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = "Local Time";
  yAxisLabel: string = this.selectedType;
  timeline: boolean = false;
  autoScale: boolean = false;

  colorScheme = {
    domain: ["#5AA454", "#E44D25", "#CFC0BB", "#7aa3e5", "#a8385d", "#aae3f5"]
  };

  constructor(
    private afs: AngularFirestore,
    private mss: MeasurementSummaryService,
    private deviceService: DeviceService,
    private probeService: ProbeService
  ) {}

  ngOnInit(): void {
    this.to = new Date();
    this.devices$ = this.deviceService.findDevices(100);
    this.probes$ = this.probeService.findProbes(100);
    // Set initial probe to query
    this.probes$$ = this.probes$.subscribe(p => {
      console.log("p:", p);
      this.probes = p;
      this.selectedProbe = p[0];
      this.getChartData();
    });
    this.devices$$ = this.devices$.subscribe(d => {
      console.log("d:", d);
      this.selectedDeviceId = d[0].id;
      this.getChartData();
    });
  }

  getChartData() {
    // selected range is in hours - multiply by 3600 and 1000 to convert to milliseconds
    const msRange = 3600 * 1000 * this.selectedRangeHours;
    this.from = new Date(this.to.getTime() - msRange);
    // get the period associated with this selectedRange
    const period = this.availableRanges.find(
      element => element.hours == this.selectedRangeHours
    ).period;
    console.log(
      "getChartData from:",
      this.from,
      " to:",
      this.to,
      this.selectedRangeHours,
      "period:",
      period
    );
    this.chartData$ = this.mss.getChartSeries(
      this.from,
      this.to,
      period,
      this.selectedDeviceId,
      this.selectedProbe.id,
      this.selectedType,
      this.series
    );
    if (this.chartData$$) this.chartData$$.unsubscribe();
    this.chartData$$ = this.chartData$.subscribe(s => {
      console.log("chartData$:", s);
      this.chartData = s;
      this.showChart = true;
    });
  }

  onSelect(event) {
    console.log(event);
  }

  onCbSeriesChange(event) {
    console.log("onCbSeriesChange:", event, event.source.value, event.checked);
    if (event.checked) {
      this.series.push(event.source.value);
    } else {
      this.series.splice(this.series.indexOf(event.source.value), 1);
    }
    this.getChartData();
  }

  onCbAutoScaleChange(event) {
    if (event.checked) {
      this.autoScale = true;
    } else {
      this.autoScale = false;
    }
  }

  onDeviceChange(event) {
    console.log("onDeviceChange:", event, event.srcElement.value);
    this.selectedDeviceId = event.srcElement.value;
    this.getChartData();
  }
  onProbeChange(event) {
    this.selectedProbe = this.probes.find(p => event.srcElement.value == p.id);
    console.log(
      "onProbeChange:",
      event.srcElement.value,
      this.selectedProbe,
      "event:",
      event
    );
    this.getChartData();
  }
  onTypeChange(event) {
    console.log("onTypeChange:", event, event.srcElement.value);
    this.selectedType = event.srcElement.value;
    this.yAxisLabel = this.availableTypes.find(
      t => event.srcElement.value == t.value
    ).name;
    this.getChartData();
  }

  onRangeChange(event) {
    console.log("onRangeChange:", event, event.srcElement.value);
    this.selectedRangeHours = event.srcElement.value;
    this.getChartData();
  }

  getRangeName(hours: number) {
    return this.availableRanges.find(r => r.hours == hours).name;
  }

  ngOnDestroy() {
    if (this.chartData$$) this.chartData$$.unsubscribe();
    if (this.probes$$) this.probes$$.unsubscribe();
    if (this.devices$$) this.devices$$.unsubscribe();
  }
}
