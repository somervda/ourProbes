import { Component, OnInit, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { NgxChartsModule } from "@swimlane/ngx-charts";
import { Observable, Subscription } from "rxjs";
import { AngularFirestore } from "@angular/fire/firestore";
import { MeasurementSummaryService } from "../services/measurement-summary.service";
import {
  measurementSummaryAvailableSeries,
  measurementSummaryAvailableTypes,
  measurementSummaryPeriod,
} from "../models/measurementSummary.model";
import { DeviceService } from "../services/device.service";
import { ProbeService } from "../services/probe.service";
import { Device } from "../models/device.model";
import { Probe } from "../models/probe.model";
import { MatSnackBar } from "@angular/material/snack-bar";
import { CookieService } from "ngx-cookie-service";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: "app-datrends",
  templateUrl: "./datrends.component.html",
  styleUrls: ["./datrends.component.scss"],
})
export class DatrendsComponent implements OnInit {
  chartData$: Observable<any>;
  chartData$$: Subscription;
  chartData: [];
  showChart: boolean = false;

  // Measurement selectors
  from: Date;
  to: Date;
  series: string[] = [];
  availableSeries = measurementSummaryAvailableSeries;
  devices: string[];
  selectedDeviceId: string = "";
  devices$: Observable<Device[]>;
  devices$$: Subscription;
  probes: Probe[];
  selectedProbe: Probe;
  probes$: Observable<Probe[]>;
  probes$$: Subscription;
  availableTypes = measurementSummaryAvailableTypes;
  selectedType: string;
  availableRanges = [
    { name: "6 hours", period: 1, hours: 6 },
    { name: "24 hours", period: 1, hours: 24 },
    { name: "7 Days", period: 1, hours: 168 },
    { name: "30 Days", period: 2, hours: 720 },
    { name: "90 Days", period: 2, hours: 2160 },
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
  xAxisLabel: string = "";
  yAxisLabel: string = this.selectedType;
  timeline: boolean = false;
  autoScale: boolean = false;

  colorScheme = {
    domain: ["#5AA454", "#E44D25", "#CFC0BB", "#7aa3e5", "#a8385d", "#aae3f5"],
  };

  constructor(
    private afs: AngularFirestore,
    private mss: MeasurementSummaryService,
    private deviceService: DeviceService,
    private snackBar: MatSnackBar,
    private probeService: ProbeService,
    private cookieService: CookieService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    let deviceId: string;
    if (this.route.snapshot.queryParamMap.get("deviceId") != null) {
      deviceId = this.route.snapshot.queryParamMap.get("deviceId");
    }
    let probeId: string;
    if (this.route.snapshot.queryParamMap.get("probeId") != null) {
      probeId = this.route.snapshot.queryParamMap.get("probeId");
    }
    let type: string;
    if (this.route.snapshot.queryParamMap.get("type") != null) {
      type = this.route.snapshot.queryParamMap.get("type");
    }

    console.log("datrends ngOnInit", deviceId, probeId, type);

    this.to = new Date();
    this.devices$ = this.deviceService.findDevices(100);
    this.probes$ = this.probeService.findProbes(100);
    if (this.cookieService.get("trends-rangeHours") != "") {
      const rangeHours = this.cookieService.get("trends-rangeHours");
      this.selectedRangeHours = parseInt(rangeHours);
    } else {
      this.selectedRangeHours = 6;
    }
    this.xAxisLabel =
      "Local Time : (Last " + this.getRangeName(this.selectedRangeHours) + ")";
    // Set initial probe to query
    this.probes$$ = this.probes$.subscribe((p) => {
      this.probes = p;
      // if (probeId && probeId != "") {
      //   this.selectedProbe = p.find((pf) => pf.id == probeId);
      // } else {
      //   this.selectedProbe = p[0];
      // }
      if (probeId && probeId != "") {
        this.selectedProbe = p.find((pf) => pf.id == probeId);
      } else {
        if (this.cookieService.get("trends-probeId") != "") {
          this.selectedProbe = p.find(
            (pf) => pf.id == this.cookieService.get("trends-probeId")
          );
        } else {
          this.selectedProbe = p[0];
        }
      }
      this.getChartData();
    });
    this.devices$$ = this.devices$.subscribe((d) => {
      if (deviceId && deviceId != "") {
        this.selectedDeviceId = deviceId;
      } else {
        if (this.cookieService.get("trends-deviceId") != "") {
          this.selectedDeviceId = this.cookieService.get("trends-deviceId");
        } else {
          this.selectedDeviceId = d[0].id;
        }
      }

      if (type && type != "") {
        this.selectedType = type;
      } else {
        if (this.cookieService.get("trends-type") != "") {
          this.selectedType = this.cookieService.get("trends-type");
        } else {
          this.selectedType = "success";
        }
      }

      if (this.selectedType == "success" || this.selectedType == "fail") {
        this.series.push("count");
      } else {
        this.series.push("p25");
        this.series.push("p50");
        this.series.push("p75");
      }

      this.getChartData();
    });
  }

  getChartData() {
    // selected range is in hours - multiply by 3600 and 1000 to convert to milliseconds
    this.yAxisLabel = this.availableTypes.find(
      (t) => this.selectedType == t.value
    ).name;
    const msRange = 3600 * 1000 * this.selectedRangeHours;
    this.from = new Date(this.to.getTime() - msRange);
    // get the period associated with this selectedRange
    let period = this.availableRanges.find(
      (element) => element.hours == this.selectedRangeHours
    ).period;
    if (!period) {
      period = measurementSummaryPeriod.hour;
    }
    console.log(
      "getChartData from:",
      this.from,
      " to:",
      this.to,
      this.selectedRangeHours,
      "period:",
      period,
      "type:",
      this.selectedType,
      "device:",
      this.selectedDeviceId,
      "probe:",
      this.selectedProbe
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
    this.chartData$$ = this.chartData$.subscribe((s) => {
      console.log("chartData$:", s);
      this.chartData = s;
      this.showChart = true;
    });
  }

  onSelect(event) {
    console.log(event);
    this.snackBar.open(
      `Time: ${event.name} Series: ${event.series} Value: ${event.value}`,
      "",
      {
        duration: 4000,
      }
    );
  }

  onCbSeriesChange(event) {
    console.log("onCbSeriesChange:", event, event.source.value, event.checked);
    if (event.checked) {
      this.series.push(event.source.value);
    } else {
      this.series.splice(this.series.indexOf(event.source.value), 1);
    }
    console.log("series 3:", this.series);
    this.getChartData();
  }

  onCbAutoScaleChange(event) {
    if (event.checked) {
      this.autoScale = true;
    } else {
      this.autoScale = false;
    }
  }

  saveDefault() {
    console.log("saveDefault");
    this.cookieService.set("trends-deviceId", this.selectedDeviceId, 365);
    this.cookieService.set("trends-probeId", this.selectedProbe.id, 365);
    this.cookieService.set("trends-type", this.selectedType, 365);
    this.cookieService.set(
      "trends-rangeHours",
      this.selectedRangeHours.toString(),
      365
    );
  }

  onDeviceChange(event) {
    console.log("onDeviceChange:", event, event.srcElement.value);
    this.selectedDeviceId = event.srcElement.value;
    this.getChartData();
  }
  onProbeChange(event) {
    this.selectedProbe = this.probes.find(
      (p) => event.srcElement.value == p.id
    );
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
    console.log("onTypeChange series:", this.series);
    this.getChartData();
  }

  onRangeChange(event) {
    console.log("onRangeChange:", event, event.srcElement.value);
    this.selectedRangeHours = event.srcElement.value;
    this.xAxisLabel =
      "Local Time : (Last " + this.getRangeName(this.selectedRangeHours) + ")";
    this.getChartData();
  }

  getRangeName(hours: number) {
    return this.availableRanges.find((r) => r.hours == hours).name;
  }

  ngOnDestroy() {
    if (this.chartData$$) this.chartData$$.unsubscribe();
    if (this.probes$$) this.probes$$.unsubscribe();
    if (this.devices$$) this.devices$$.unsubscribe();
  }
}
