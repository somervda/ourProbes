import { Component, OnInit, OnDestroy, NgZone } from "@angular/core";
import { Crud, Kvp } from "../models/global.model";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { Subscription, Observable } from "rxjs";
import { ProbeService } from "../services/probe.service";
import { ActivatedRoute, Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Probe, ProbeType, ProbeStatus } from "../models/probe.model";
import { enumToMap } from "../shared/utilities";
import { firestore } from "firebase";
import { Device } from "../models/device.model";
import { DeviceService } from "../services/device.service";
import { Measurement } from "../models/measurement.model";
import { MeasurementService } from "../services/measurement.service";

@Component({
  selector: "app-probe",
  templateUrl: "./probe.component.html",
  styleUrls: ["./probe.component.scss"]
})
export class ProbeComponent implements OnInit, OnDestroy {
  probe: Probe;
  ProbeType = ProbeType;
  crudAction: Crud;
  // Declare an instance of crud enum to use for checking crudAction value
  Crud = Crud;

  probeForm: FormGroup;
  probeSubscription$$: Subscription;
  types: Kvp[];
  status: Kvp[];

  devices$: Observable<Device[]>;
  devices$$: Subscription;

  measurements$: Observable<Measurement[]>;
  measurements$$: Subscription;

  constructor(
    private probeService: ProbeService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private ngZone: NgZone,
    private router: Router,
    private deviceService: DeviceService,
    private measurementService: MeasurementService
  ) {}

  ngOnInit() {
    this.types = enumToMap(ProbeType);
    this.status = enumToMap(ProbeStatus);
    this.crudAction = Crud.Update;
    if (this.route.routeConfig.path == "probe/delete/:id")
      this.crudAction = Crud.Delete;
    if (this.route.routeConfig.path == "probe/create")
      this.crudAction = Crud.Create;

    this.devices$ = this.deviceService.findDevices(100);

    // console.log("team onInit", this.crudAction);
    if (this.crudAction == Crud.Create) {
      this.probe = {
        name: "",
        description: "",
        type: ProbeType.bing,
        target: "",
        status: ProbeStatus.active
      };
    } else {
      this.probe = this.route.snapshot.data["probe"];
      // console.log("Probe from resolver:", this.probe);
      // Subscribe to team to keep getting live updates
      this.probeSubscription$$ = this.probeService
        .findById(this.probe.id)
        .subscribe(probe => {
          this.probe = probe;
          // console.log("subscribed probe", this.probe);
          this.probeForm.patchValue(this.probe);
        });
    }

    // Create form group and initialize with probe values
    this.probeForm = this.fb.group({
      name: [
        this.probe.name,
        [Validators.required, Validators.minLength(3), Validators.maxLength(25)]
      ],
      description: [
        this.probe.description,
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(500)
        ]
      ],
      type: [this.probe.type, [Validators.required]],
      target: [
        this.probe.target,
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(120)
        ]
      ],
      match: [this.probe.match, [Validators.maxLength(30)]]
    });

    // Mark all fields as touched to trigger validation on initial entry to the fields
    if (this.crudAction != Crud.Create) {
      for (const field in this.probeForm.controls) {
        this.probeForm.get(field).markAsTouched();
      }
      this.measurements$ = this.measurementService.getMeasurementProbeData(
        this.probe.id,
        1
      );
      // Disable updates to the target/type when not in create mode
      this.disableSelectedUpdatesIfProbeIsInUse(this.probe.id);
    }
  }

  onCreate() {
    // console.log("create probe", this.probe);
    for (const field in this.probeForm.controls) {
      this.probe[field] = this.probeForm.get(field).value;
    }

    this.probeService
      .create(this.probe)
      .then(docRef => {
        this.crudAction = Crud.Update;
        this.snackBar.open("Probe '" + this.probe.name + "' created.", "", {
          duration: 2000
        });
        this.probe.id = docRef.id;
        this.ngZone.run(() =>
          this.router.navigateByUrl("/probe/" + this.probe.id)
        );
      })
      .catch(function(error) {
        console.error("Error adding document: ", this.probe.name, error);
      });
  }

  onDelete() {
    // console.log("delete", this.probe.id);
    const deviceId = this.probe.id;

    this.probeService.delete(this.probe.id);
    this.removeProbeFromAllDevices(this.probe.id);
  }

  removeProbeFromAllDevices(probeId: string) {
    // Scan through all the devices, if one contains the probe in the probeList then remove it from the
    // collection
    // BTW: Only one snackbar will ever be shown
    console.log("removeProbeFromAllDevices", probeId);

    if (this.probeSubscription$$) this.probeSubscription$$.unsubscribe();
    this.devices$$ = this.devices$.subscribe(devices => {
      devices.map(device => {
        const probeItemIndex = device.probeList.findIndex(p => p.id == probeId);

        if (probeItemIndex != -1) {
          device.probeList.splice(probeItemIndex, 1);
          // update the device
          this.deviceService.fieldUpdate(
            device.id,
            "probeList",
            device.probeList
          );
        }
        // Jump back to probe list once devices have been updated
        this.snackBar.open("Probe '" + probeId + "' logically deleted!", "", {
          duration: 2000
        });
        this.ngZone.run(() => this.router.navigateByUrl("/probes"));
      });
    });
  }

  disableSelectedUpdatesIfProbeIsInUse(probeId: string) {
    // See if any measurements have been taken with the probe
    // or if the probe has been assigned to a device

    console.log("IsProbeUsed", probeId);
    let usedOnDevice = "";

    if (this.probeSubscription$$) this.probeSubscription$$.unsubscribe();

    this.devices$$ = this.devices$.subscribe(devices => {
      devices.map(device => {
        const probeItemIndex = device.probeList.findIndex(p => p.id == probeId);

        if (probeItemIndex != -1) {
          this.probeForm.get("target").disable();
          this.probeForm.get("type").disable();
          usedOnDevice += device.id + " ";
        }
      });

      if (usedOnDevice) {
        this.snackBar.open(
          "Probe's target and type properties can not be updated because the probe is in use on device(s): " +
            usedOnDevice +
            "  Recommendation: Delete and create another probe rather than change it.",
          "",
          {
            duration: 7000
          }
        );
      }
    });

    if (this.measurements$$) this.measurements$$.unsubscribe();
    this.measurements$$ = this.measurements$.subscribe(p => {
      if (p.length > 0) {
        console.log("disableSelectedUpdatesIfProbeIsInUse p:", p);
        this.probeForm.get("target").disable();
        this.probeForm.get("type").disable();
        this.snackBar.open(
          "Probe's target and type properties can not be updated because measurements have already be created for this probe." +
            "  Options: Delete and create another probe.",
          "",
          {
            duration: 7000
          }
        );
      }
    });
  }

  onFieldUpdate(fieldName: string, toType?: string) {
    if (
      this.probeForm.get(fieldName).valid &&
      this.probe.id != "" &&
      this.crudAction != Crud.Delete
    ) {
      let newValue = this.probeForm.get(fieldName).value;
      // Do any type conversions before storing value
      if (toType && toType == "Timestamp")
        newValue = firestore.Timestamp.fromDate(
          this.probeForm.get(fieldName).value
        );
      if (toType && toType == "Number")
        newValue = Number(this.probeForm.get(fieldName).value);
      this.probeService.fieldUpdate(this.probe.id, fieldName, newValue);
    }
  }

  ngOnDestroy() {
    if (this.probeSubscription$$) this.probeSubscription$$.unsubscribe();
    if (this.devices$$) this.devices$$.unsubscribe();
    if (this.measurements$$) this.measurements$$.unsubscribe();
  }
}
