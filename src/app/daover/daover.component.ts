import { ChartSeries } from "./../models/chart.model";
import { Device } from "./../models/device.model";
import { Measurement } from "./../models/measurement.model";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { MeasurementService } from "../services/measurement.service";
import { DeviceService } from "../services/device.service";
import { ProbeService } from "../services/probe.service";
import { Observable, Subscription, forkJoin, combineLatest } from "rxjs";
import { Probe } from "../models/probe.model";
import { measurementSummaryAvailableTypes } from "../models/measurementSummary.model";

@Component({
  selector: "app-daover",
  templateUrl: "./daover.component.html",
  styleUrls: ["./daover.component.scss"]
})
export class DaoverComponent implements OnInit, OnDestroy {
  to = new Date();
  type = "";
  devices$: Observable<Device[]>;
  probes$: Observable<Probe[]>;
  measurements$: Observable<Measurement[]>;
  allData$$: Subscription;
  overviewData: DeviceProbeState[] = [];
  availableTypes = measurementSummaryAvailableTypes;
  selectedType: string = this.availableTypes[0];
  minDate = new Date("1970-01-01Z00:00:00:000");

  chartData = [];
  showChart: boolean = false;

  // chart options
  //view: any[] = [700, 300];
  legend: boolean = true;
  showLabels: boolean = true;
  animations: boolean = true;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = "Probe Name";
  yAxisLabel: string = "Device";
  timeline: boolean = false;
  autoScale: boolean = false;

  // colorScheme = {
  //   domain: ["#5AA454", "#E44D25", "#CFC0BB", "#7aa3e5", "#a8385d", "#aae3f5"]
  // };

  colorScheme = {
    domain: ["#FFF0F0", "#BBBBBB", "#888888", "#444444", "#0000FF"]
  };

  constructor(
    private afs: AngularFirestore,
    private measurementService: MeasurementService,
    private deviceService: DeviceService,
    private probeService: ProbeService
  ) {}

  ngOnInit(): void {
    this.showOverviewChart();
  }

  showOverviewChart() {
    this.devices$ = this.deviceService.findDevices(100);
    this.probes$ = this.probeService.findProbes(100);
    this.measurements$ = this.measurementService.findLastHoursMeasurments(
      this.to,
      this.selectedType,
      1200
    );

    // Get all the data in one big subscription using forkJoin function
    console.log("ngOnInit");
    this.allData$$ = combineLatest(
      this.devices$,
      this.probes$,
      this.measurements$
    ).subscribe(([devices, probes, measurements]) => {
      console.log("subscription:", devices, probes, measurements);
      this.updateChart(devices, probes, measurements);
    });
  }

  updateChart(devices: Device[], probes: Probe[], measurements: Measurement[]) {
    // Initialize array of devices and probes with the intersection being the latest state (initialized)
    devices.forEach(d =>
      probes.forEach(p => {
        // console.log("d-p:", d, p);
        const DeviceProbeStateItem: DeviceProbeState = {
          deviceId: d.id,
          probeId: p.id,
          probeName: p.name,
          state: {
            latestUMT: this.minDate,
            value: 0,
            count: 0
          }
        };
        this.overviewData.push(DeviceProbeStateItem);
      })
    );
    console.log("Initial this.overviewData", this.overviewData);

    // Fill in state information based on the measurements
    measurements.forEach(m => {
      const overviewDataItemIndex = this.overviewData.findIndex(
        od => od.deviceId === m.deviceId && od.probeId === m.probeId
      );
      if (overviewDataItemIndex == -1) {
        console.error("overviewDataItemIndex = -1", m.deviceId, m.probeId);
      } else {
        // Note measurement.UMT is a firestore timestamp , the array uses Javascript Date objects
        // Compare and convert while updating from measurements
        if (
          this.overviewData[overviewDataItemIndex].state.latestUMT <
          m.UMT.toDate()
        ) {
          this.overviewData[
            overviewDataItemIndex
          ].state.latestUMT = m.UMT.toDate();
          this.overviewData[overviewDataItemIndex].state.value = m.value;
        }
        this.overviewData[overviewDataItemIndex].state.count += 1;
      }
    });
    console.log("Updated this.overviewData", this.overviewData);

    // Finally convert the array to the data format used by the heat chart of ngx-charts
    // and update the chart
    // overviewData is natually sorted by device/probe becouse of how it was created

    // couldn't think of a way to do this with a reduce :(
    let lastDeviceId = "";
    let chartSeries = [];
    this.overviewData.forEach(od => {
      if (lastDeviceId != "" && od.deviceId != lastDeviceId) {
        // push out the last deviceSeries
        this.chartData.push({ name: lastDeviceId, series: chartSeries });
        chartSeries = [];
      }
      chartSeries.push({ name: od.probeName, value: od.state.value });
      lastDeviceId = od.deviceId;
    });
    if (lastDeviceId != "") {
      this.chartData.push({ name: lastDeviceId, series: chartSeries });
    }
    console.log("chartData:", JSON.stringify(this.chartData));
    this.showChart = true;
    // this.chartData = this.overviewData.reduce((chartMultiSeries, deviceProbe) => {
    //   const chartSeries = snaps.reduce(
    //     (a, s) =>
    //       a.concat({
    //         name: s.payload.doc.data()["umt"].toDate(),
    //         value: Math.round(s.payload.doc.data()[seriesName])
    //       }),
    //     []
    //   );
    //   chartMultiSeries.push({ name: seriesName, series: chartSeries });
    //   return chartMultiSeries;
    // }, []);
  }

  onSelect(data): void {
    console.log("Item clicked", JSON.parse(JSON.stringify(data)));
  }

  ngOnDestroy() {
    if (this.allData$$) this.allData$$.unsubscribe();
  }
}

interface DeviceProbeState {
  deviceId: string;
  probeId: string;
  probeName: string;
  state: { latestUMT: Date; value: number; count: number };
}
