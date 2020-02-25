import { Component, OnInit, OnDestroy } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { MeasurementService } from "../services/measurement.service";
import { DeviceService } from "../services/device.service";
import { ProbeService } from "../services/probe.service";
import { Observable, Subscription, forkJoin, combineLatest } from "rxjs";
import { Device } from "../models/device.model";
import { Probe } from "../models/probe.model";
import { Measurement } from "../models/measurement.model";

@Component({
  selector: "app-daover",
  templateUrl: "./daover.component.html",
  styleUrls: ["./daover.component.scss"]
})
export class DaoverComponent implements OnInit, OnDestroy {
  to = new Date();
  devices$: Observable<Device[]>;
  probes$: Observable<Probe[]>;
  measurements$: Observable<Measurement[]>;
  allData$$: Subscription;
  overviewData: [];

  constructor(
    private afs: AngularFirestore,
    private measurementService: MeasurementService,
    private deviceService: DeviceService,
    private probeService: ProbeService
  ) {}

  ngOnInit(): void {
    this.devices$ = this.deviceService.findDevices(100);
    this.probes$ = this.probeService.findProbes(100);
    this.measurements$ = this.measurementService.findLastHoursMeasurments(
      this.to,
      "bps",
      1000
    );

    // Get all the data in one big subscription using forkJoin function
    console.log("ngOnInit");
    this.allData$$ = combineLatest(
      this.devices$,
      this.probes$,
      this.measurements$
    ).subscribe(([devices, probes, measurements]) =>
      console.log("subscription:", devices, probes, measurements)
    );
  }

  ngOnDestroy() {
    if (this.allData$$) this.allData$$.unsubscribe();
  }
}
