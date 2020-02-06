import { Component, OnInit } from "@angular/core";
import { Observable } from "rxjs";
import { Device } from "../models/device.model";
import { DeviceService } from "../services/device.service";
import { AuthService } from "../services/auth.service";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"]
})
export class HomeComponent implements OnInit {
  latitude: number = 0;
  longitude: number = 0;
  zoom: number = 10;
  devices$: Observable<Device[]>;

  constructor(
    private deviceservice: DeviceService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.devices$ = this.deviceservice.findDevices(100);
    this.latitude = this.auth.currentUser.latitude;
    this.longitude = this.auth.currentUser.longitude;
    console.log("lat/long", this.latitude, this.longitude);
  }
}
