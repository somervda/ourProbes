import { DeviceType } from "./../models/device.model";
import { Component, OnInit, NgZone, OnDestroy } from "@angular/core";
import { Device } from "../models/device.model";
import { Crud } from "../models/global.model";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { Subscription } from "rxjs";
import { DeviceService } from "../services/device.service";
import { ActivatedRoute, Router } from "@angular/router";
import { MatSnackBar } from "@angular/material";
import { firestore } from "firebase";

@Component({
  selector: "app-device",
  templateUrl: "./device.component.html",
  styleUrls: ["./device.component.scss"]
})
export class DeviceComponent implements OnInit, OnDestroy {
  device: Device;
  crudAction: Crud;
  // Declare an instance of crud enum to use for checking crudAction value
  Crud = Crud;

  deviceForm: FormGroup;
  deviceSubscription$$: Subscription;

  constructor(
    private deviceService: DeviceService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private ngZone: NgZone,
    private router: Router
  ) {}

  ngOnInit() {
    this.crudAction = Crud.Update;
    if (this.route.routeConfig.path == "device/delete/:id")
      this.crudAction = Crud.Delete;
    if (this.route.routeConfig.path == "device/create")
      this.crudAction = Crud.Create;

    // console.log("team onInit", this.crudAction);
    if (this.crudAction == Crud.Create) {
      this.device = {
        communication: true,
        description: "",
        type: DeviceType.esp32GatewayOlimex,
        id: ""
      };
    } else {
      this.device = this.route.snapshot.data["device"];
      console.log("Device from resolver:", this.device);
      // Subscribe to team to keep getting live updates
      this.deviceSubscription$$ = this.deviceService
        .findById(this.device.id)
        .subscribe(device => {
          this.device = device;
          console.log("subscribed device", this.device);
          this.deviceForm.patchValue(this.device);
        });
    }

    // Create form group and initialize with device values
    this.deviceForm = this.fb.group({
      id: [
        this.device.id,
        [Validators.required, Validators.minLength(3), Validators.maxLength(12)]
      ],
      description: [
        this.device.description,
        [
          Validators.required,
          Validators.minLength(20),
          Validators.maxLength(200)
        ]
      ],
      communication: [this.device.communication],
      type: [this.device.type]
    });

    // Mark all fields as touched to trigger validation on initial entry to the fields
    if (this.crudAction != Crud.Create) {
      for (const field in this.deviceForm.controls) {
        this.deviceForm.get(field).markAsTouched();
      }
    }
  }

  onCreate() {
    for (const field in this.deviceForm.controls) {
      this.device[field] = this.deviceForm.get(field).value;
    }
    console.log("create device", this.device);
    this.deviceService
      .create(this.device)
      .then(() => {
        this.crudAction = Crud.Update;
        this.snackBar.open("Device '" + this.device.id + "' created.", "", {
          duration: 2000
        });
      })
      .catch(function(error) {
        console.error("Error adding document: ", error);
      });
  }

  onDelete() {
    console.log("delete", this.device.id);
    const deviceId = this.device.id;

    this.deviceService
      .delete(this.device.id)
      .then(() => {
        this.snackBar.open("Device '" + deviceId + "' deleted!", "", {
          duration: 2000
        });
        this.ngZone.run(() => this.router.navigateByUrl("/devices"));
      })
      .catch(function(error) {
        console.error("Error deleting device: ", error);
      });
  }

  onFieldUpdate(fieldName: string, toType?: string) {
    if (
      this.deviceForm.get(fieldName).valid &&
      this.device.id != "" &&
      this.crudAction != Crud.Delete
    ) {
      let newValue = this.deviceForm.get(fieldName).value;
      // Do any type conversions before storing value
      if (toType && toType == "Timestamp")
        newValue = firestore.Timestamp.fromDate(
          this.deviceForm.get(fieldName).value
        );
      this.deviceService.fieldUpdate(this.device.id, fieldName, newValue);
    }
  }

  ngOnDestroy() {
    if (this.deviceSubscription$$) this.deviceSubscription$$.unsubscribe();
  }
}
