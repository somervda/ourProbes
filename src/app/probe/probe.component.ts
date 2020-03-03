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

@Component({
  selector: "app-probe",
  templateUrl: "./probe.component.html",
  styleUrls: ["./probe.component.scss"]
})
export class ProbeComponent implements OnInit, OnDestroy {
  probe: Probe;
  crudAction: Crud;
  // Declare an instance of crud enum to use for checking crudAction value
  Crud = Crud;

  probeForm: FormGroup;
  probeSubscription$$: Subscription;
  types: Kvp[];
  status: Kvp[];

  devices$: Observable<Device[]>;
  devices$$: Subscription;

  constructor(
    private probeService: ProbeService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private ngZone: NgZone,
    private router: Router,
    private deviceService: DeviceService
  ) {}

  ngOnInit() {
    this.types = enumToMap(ProbeType);
    this.status = enumToMap(ProbeStatus);
    this.crudAction = Crud.Update;
    if (this.route.routeConfig.path == "probe/delete/:id")
      this.crudAction = Crud.Delete;
    if (this.route.routeConfig.path == "probe/create")
      this.crudAction = Crud.Create;

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
      ]
    });

    // Mark all fields as touched to trigger validation on initial entry to the fields
    if (this.crudAction != Crud.Create) {
      for (const field in this.probeForm.controls) {
        this.probeForm.get(field).markAsTouched();
      }
      // Disable updates to the target when not in create mode
      this.probeForm.get("target").disable();
      this.probeForm.get("type").disable();
    }
  }

  onCreate() {
    for (const field in this.probeForm.controls) {
      this.probe[field] = this.probeForm.get(field).value;
      // if (
      //   field == "latitude" ||
      //   field == "longitude" ||
      //   field == "governorSeconds"
      // ) {
      //   this.probe[field] = Number(this.probeForm.get(field).value);
      // }
    }
    // console.log("create probe", this.probe);

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

  async onDelete() {
    // console.log("delete", this.probe.id);
    const deviceId = this.probe.id;

    this.probeService.delete(this.probe.id);
    await this.removeProbeFromAllDevices(this.probe.id);
    // wait for device update to complete before returning to probe listing
    this.snackBar.open("Probe '" + deviceId + "' logically deleted!", "", {
      duration: 2000
    });
    this.ngZone.run(() => this.router.navigateByUrl("/probes"));
  }

  async removeProbeFromAllDevices(probeId: string) {
    // Scan through all the devices, if one contains the probe in the probeList then remove it from the
    // collection
    console.log("removeProbeFromAllDevices", probeId);
    this.devices$ = this.deviceService.findDevices(100);
    this.devices$$ = await this.devices$.subscribe(devices => {
      console.log("removeProbeFromAllDevices devices:", devices);
      devices.map(device => {
        console.log("removeProbeFromAllDevices device:", device);
        const probeItemIndex = device.probeList.findIndex(p => p.id == probeId);

        if (probeItemIndex != -1) {
          console.log("probeItemIndex", device, probeItemIndex);
          device.probeList.splice(probeItemIndex, 1);
          // update the device
          this.deviceService.fieldUpdate(
            device.id,
            "probeList",
            device.probeList
          );
        }
      });
    });
    console.log("removeProbeFromAllDevices end ");
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
  }
}
