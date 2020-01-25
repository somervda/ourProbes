import { DeviceType } from "./../models/device.model";
import { Component, OnInit, NgZone } from "@angular/core";
import { Device } from "../models/device.model";
import { Crud } from "../models/global.model";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { Subscription } from "rxjs";
import { DeviceService } from "../services/device.service";
import { ActivatedRoute, Router } from "@angular/router";
import { MatSnackBar } from "@angular/material";

@Component({
  selector: "app-device",
  templateUrl: "./device.component.html",
  styleUrls: ["./device.component.scss"]
})
export class DeviceComponent implements OnInit {
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
      // Subscribe to team to keep getting live updates
      this.deviceSubscription$$ = this.deviceService
        .findById(this.device.id)
        .subscribe(device => {
          this.device = device;
          console.log("subscribed device", this.device);
          this.deviceForm.patchValue(this.device);
        });
    }

    // Create form group and initalize with device values
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
      ]
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
      .createDevice(this.device)
      .then(docRef => {
        //console.log("Document written with ID: ", docRef.id);
        this.device.id = docRef.id;
        this.crudAction = Crud.Update;
        this.snackBar.open("DEvice '" + this.device.id + "' created.", "", {
          duration: 2000
        });
      })
      .catch(function(error) {
        console.error("Error adding document: ", error);
      });
    // console.log("create team", this.team);
  }

  onDelete() {
    console.log("delete", this.device.id);
    const deviceId = this.device.id;

    this.deviceService
      .deleteDevice(this.device.id)
      .then(() => {
        this.snackBar.open("Device '" + device.id + "' deleted!", "", {
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
      this.teamForm.get(fieldName).valid &&
      this.team.id != "" &&
      this.crudAction != Crud.Delete
    ) {
      let newValue = this.teamForm.get(fieldName).value;
      // Do any type conversions before storing value
      if (toType && toType == "Timestamp")
        newValue = firestore.Timestamp.fromDate(
          this.teamForm.get(fieldName).value
        );
      this.teamService.fieldUpdate(this.team.id, fieldName, newValue);
    }
  }

  ngOnDestroy() {
    if (this.teamSubscription$$) this.teamSubscription$$.unsubscribe();
  }
}
