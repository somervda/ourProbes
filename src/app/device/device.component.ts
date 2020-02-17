import { DeviceType, ProbeListItem } from "./../models/device.model";
import { Component, OnInit, NgZone, OnDestroy } from "@angular/core";
import { Device } from "../models/device.model";
import { Crud, Kvp } from "../models/global.model";
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormControl
} from "@angular/forms";
import { Subscription, Observable } from "rxjs";
import { DeviceService } from "../services/device.service";
import { ActivatedRoute, Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { firestore } from "firebase";
import { enumToMap } from "../shared/utilities";

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
  types: Kvp[];

  constructor(
    private deviceService: DeviceService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private ngZone: NgZone,
    private router: Router
  ) {}

  ngOnInit() {
    this.types = enumToMap(DeviceType);

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
        id: "D0000",
        longitude: 0,
        latitude: 0,
        governorSeconds: 300,
        runProbes: false,
        publicKey: "",
        privateKey: "",
        privateKeyTuple: "",
        probeList: []
      };
    } else {
      this.device = this.route.snapshot.data["device"];
      // console.log("Device from resolver:", this.device);
      // Subscribe to team to keep getting live updates
      this.deviceSubscription$$ = this.deviceService
        .findById(this.device.id)
        .subscribe(device => {
          this.device = device;
          if (!device.probeList) {
            device.probeList = [];
          }
          // console.log("subscribed device", this.device);
          this.deviceForm.patchValue(this.device);
        });
    }

    // Create form group and initialize with device values
    this.deviceForm = this.fb.group({
      id: [
        this.device.id,
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(12),
          Validators.pattern(/^[A-Z]{1}[0-9]{4}?$/)
        ]
      ],
      description: [
        this.device.description,
        [
          Validators.required,
          Validators.minLength(20),
          Validators.maxLength(500)
        ]
      ],
      location: [this.device.location, [Validators.maxLength(500)]],
      communication: [this.device.communication],
      type: [this.device.type, [Validators.required]],
      longitude: [
        this.device.longitude,
        [
          Validators.min(-180),
          Validators.max(180),
          Validators.required,
          Validators.pattern(/^[-+]?[0-9]+(\.[0-9]*)?$/)
        ]
      ],
      latitude: [
        this.device.latitude,
        [
          Validators.min(-90),
          Validators.max(90),
          Validators.required,
          Validators.pattern(/^[-+]?[0-9]+(\.[0-9]*)?$/)
        ]
      ],
      governorSeconds: [
        this.device.governorSeconds,
        [
          Validators.min(300),
          Validators.max(86400),
          Validators.required,
          Validators.pattern(/^[0-9]+$/)
        ]
      ],
      runProbes: [this.device.runProbes],
      publicKey: [
        this.device.publicKey,
        [
          Validators.required,
          Validators.minLength(20),
          Validators.maxLength(1000),
          Validators.pattern(
            /^-----BEGIN PUBLIC KEY-----[A-Za-z0-9+\/=\n\r]*-----END PUBLIC KEY-----$/
          )
        ]
      ],
      privateKey: [
        this.device.privateKey,
        [
          Validators.required,
          Validators.minLength(20),
          Validators.maxLength(2000),
          Validators.pattern(
            /^-----BEGIN RSA PRIVATE KEY-----[A-Za-z0-9+\/=\n\r]*-----END RSA PRIVATE KEY-----$/
          )
        ]
      ],
      privateKeyTuple: [
        this.device.privateKeyTuple,
        [
          Validators.required,
          Validators.minLength(20),
          Validators.maxLength(2000)
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
      if (
        field == "latitude" ||
        field == "longitude" ||
        field == "governorSeconds"
      ) {
        this.device[field] = Number(this.deviceForm.get(field).value);
      }
    }
    // console.log("create device", this.device);
    const id = this.device.id;

    this.deviceService
      .create(this.device)
      .then(() => {
        this.crudAction = Crud.Update;
        this.snackBar.open("Device '" + id + "' created.", "", {
          duration: 2000
        });
        this.ngZone.run(() => this.router.navigateByUrl("/device/" + id));
      })
      .catch(function(error) {
        console.error("Error adding document: ", id, error);
      });
  }

  onDelete() {
    // console.log("delete", this.device.id);
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
      if (toType && toType == "Number")
        newValue = Number(this.deviceForm.get(fieldName).value);
      this.deviceService.fieldUpdate(this.device.id, fieldName, newValue);
    }
  }

  latLngChange(latLng) {
    console.log("latLngChange", latLng);
    this.deviceService.fieldUpdate(this.device.id, "latitude", latLng.latitude);
    this.deviceService.fieldUpdate(
      this.device.id,
      "longitude",
      latLng.longitude
    );
  }

  onProbeListChange($event) {
    console.log("onProbeListChange", $event);
    this.deviceService.fieldUpdate(this.device.id, "probeList", $event);
  }

  ngOnDestroy() {
    if (this.deviceSubscription$$) this.deviceSubscription$$.unsubscribe();
  }
}
