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
  selectedType: string = "success";
  minDate = new Date(2000, 1, 1);
  availableFilters: { name: string; type: string; value: string }[] = [
    { name: "No Filter", type: "", value: "" }
  ];
  selectedFilterIndex = 0;
  selectedMeasurement = "count";
  selectedScheme = "2Color";

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

  colorScheme5 = {
    domain: ["#FFFFFF", "#E44D25", "#CFC0BB", "#7aa3e5", "#5AA454", "#D4AF37"]
  };

  colorScheme2 = {
    domain: ["#FFFFFF", "#31639c"]
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
    this.showChart = false;
    this.overviewData = [];
    this.chartData = [];
    this.devices$ = this.deviceService.findDevices(100);
    this.probes$ = this.probeService.findProbes(100);
    this.measurements$ = this.measurementService.findLastHoursMeasurments(
      this.to,
      this.selectedType,
      1200
    );

    // Get all the data in one big subscription using forkJoin function
    console.log("ngOnInit");
    if (this.allData$$) this.allData$$.unsubscribe();
    this.allData$$ = combineLatest(
      this.devices$,
      this.probes$,
      this.measurements$
    ).subscribe(([devices, probes, measurements]) => {
      console.log("subscription:", devices, probes, measurements);
      this.updateChart(devices, probes, measurements);
      if (this.availableFilters.length == 1) {
        this.availableFilters.push({
          name: "---- Devices ----",
          type: "separator",
          value: "-1"
        });
        devices.forEach(d =>
          this.availableFilters.push({
            name: d.id,
            type: "Device",
            value: d.id
          })
        );
        this.availableFilters.push({
          name: "---- Probes ----",
          type: "separator",
          value: "-1"
        });

        probes.forEach(p =>
          this.availableFilters.push({
            name: p.name,
            type: "Probe",
            value: p.id
          })
        );
      }
    });
  }

  updateChart(devices: Device[], probes: Probe[], measurements: Measurement[]) {
    // Initialize array of devices and probes with the intersection being the latest state (initialized)
    devices.forEach(d => {
      if (
        this.selectedFilterIndex == 0 ||
        this.availableFilters[this.selectedFilterIndex].type == "Probe" ||
        (this.availableFilters[this.selectedFilterIndex].type == "Device" &&
          this.availableFilters[this.selectedFilterIndex].value == d.id)
      ) {
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
          // apply filter if needed
          if (
            this.selectedFilterIndex == 0 ||
            this.availableFilters[this.selectedFilterIndex].type == "Device" ||
            (this.availableFilters[this.selectedFilterIndex].type == "Probe" &&
              this.availableFilters[this.selectedFilterIndex].value == p.id)
          ) {
            this.overviewData.push(DeviceProbeStateItem);
          }
        });
      }
    });
    console.log("Initial this.overviewData", this.overviewData);

    // Fill in state information based on the measurements
    measurements.forEach(m => {
      const overviewDataItemIndex = this.overviewData.findIndex(
        od => od.deviceId === m.deviceId && od.probeId === m.probeId
      );
      if (overviewDataItemIndex != -1) {
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
    // overviewData is naturally sorted by device/probe because of how it was created

    // couldn't think of a way to do this with a reduce :(
    let lastDeviceId = "";
    let chartSeries = [];
    this.overviewData.forEach(od => {
      if (lastDeviceId != "" && od.deviceId != lastDeviceId) {
        // push out the last deviceSeries
        this.chartData.push({ name: lastDeviceId, series: chartSeries });
        chartSeries = [];
      }
      if (this.selectedMeasurement == "value") {
        chartSeries.push({ name: od.probeName, value: od.state.value });
      } else {
        chartSeries.push({ name: od.probeName, value: od.state.count });
      }
      lastDeviceId = od.deviceId;
    });
    if (lastDeviceId != "") {
      this.chartData.push({ name: lastDeviceId, series: chartSeries });
    }
    console.log("chartData:", JSON.stringify(this.chartData));
    this.showChart = true;
  }

  onSelect(data): void {
    console.log("Item clicked", JSON.parse(JSON.stringify(data)));
  }

  onFilterChange(event) {
    console.log("onFilterChange", event, event.srcElement.value);
    this.selectedFilterIndex = event.srcElement.value;
    this.showOverviewChart();
  }

  onTypeChange(event) {
    console.log("onTypeChange:", event, event.srcElement.value);
    this.selectedType = event.srcElement.value;
    this.showOverviewChart();
  }

  onMeasurementChange(event) {
    console.log("onMeasurementChange:", event, event.value);
    this.selectedMeasurement = event.value;
    this.showOverviewChart();
  }

  onSchemeChange(event) {
    console.log("onSchemeChange:", event, event.checked);
    if (event.checked) {
      this.selectedScheme = "5Color";
    } else {
      this.selectedScheme = "2Color";
    }
  }

  getTypeName(typeValue: string) {
    return this.availableTypes.find(t => typeValue == t.value).name;
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
