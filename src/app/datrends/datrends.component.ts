import { Component, OnInit, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { NgxChartsModule } from "@swimlane/ngx-charts";
import { Observable, Subscription } from "rxjs";
import { AngularFirestore } from "@angular/fire/firestore";
import { MeasurementSummaryService } from "../services/measurement-summary.service";
import { measurementSummaryAvailableSeries } from "../models/measurementSummary.model";
import { DeviceService } from "../services/device.service";
import { ProbeService } from "../services/probe.service";
import { Device } from "../models/device.model";

@Component({
  selector: "app-datrends",
  templateUrl: "./datrends.component.html",
  styleUrls: ["./datrends.component.scss"]
})
export class DatrendsComponent implements OnInit {
  view: any[] = [900, 400];
  chartData$: Observable<any>;
  chartData$$: Subscription;
  chartData: [];
  showChart: boolean = false;

  // options
  legend: boolean = true;
  showLabels: boolean = true;
  animations: boolean = true;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = "Time";
  yAxisLabel: string = "bps";
  timeline: boolean = true;
  autoScale: boolean = true;

  // Measurement selectors
  from: Date;
  to: Date;
  series: string[] = ["p50"];
  availableSeries = measurementSummaryAvailableSeries;
  devices: string[];
  deviceId: string = "D0001";
  devices$: Observable<Device[]>;
  probes: string[];
  probeId: string = "";
  probes$$: Subscription;

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
    this.from = new Date(this.to.getTime() - 1000 * 40000);
    this.devices$ = this.deviceService.findDevices(100);
    this.getChartData();
  }

  getChartData() {
    console.log("getChartData");
    this.chartData$ = this.mss.getChartSeries(
      this.from,
      this.to,
      1,
      this.deviceId,
      "mF4wmQV6oX58nV5WhYAM",
      "bps",
      this.series
    );
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
    this.deviceId = event.srcElement.value;
    this.getChartData();
  }

  ngOnDestroy() {
    if (this.chartData$$) this.chartData$$.unsubscribe();
  }
}
